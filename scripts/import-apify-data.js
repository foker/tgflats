const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5433/tbi_prop'
    }
  }
});

// Функция для парсинга views ("10K" -> 10000)
function parseViews(viewsStr) {
  if (!viewsStr) return null;
  
  const str = viewsStr.toString().trim();
  let multiplier = 1;
  let numStr = str;
  
  if (str.endsWith('K')) {
    multiplier = 1000;
    numStr = str.slice(0, -1);
  } else if (str.endsWith('M')) {
    multiplier = 1000000;
    numStr = str.slice(0, -1);
  }
  
  const num = parseFloat(numStr);
  return isNaN(num) ? null : Math.floor(num * multiplier);
}

// Функция для извлечения channel ID из ссылки
function extractChannelInfo(item) {
  // Попробуем извлечь из link
  if (item.link) {
    const match = item.link.match(/t\.me\/([^\/]+)\/(\d+)/);
    if (match) {
      return {
        channelUsername: match[1],
        messageId: BigInt(match[2])
      };
    }
  }
  
  // Используем id как messageId и author как channel
  const channelUsername = item.author ? 
    item.author.toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 50) : 
    'unknown_channel';
    
  return {
    channelUsername,
    messageId: BigInt(item.id || Date.now())
  };
}

async function importData() {
  try {
    console.log('🚀 Starting data import to PostgreSQL...\n');
    
    // Читаем данные
    const dataFile = path.join(__dirname, '..', 'data', 'apify-datasets', 'combined-dataset.json');
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    
    console.log(`📊 Found ${data.length} items to import\n`);
    
    // Сначала создадим уникальные каналы
    const channels = new Map();
    
    data.forEach(item => {
      const { channelUsername } = extractChannelInfo(item);
      if (!channels.has(channelUsername)) {
        channels.set(channelUsername, {
          channelId: channelUsername,
          username: channelUsername,
          title: item.author || channelUsername,
          isActive: true
        });
      }
    });
    
    console.log(`📺 Creating ${channels.size} channels...`);
    
    // Создаём каналы
    for (const [username, channelData] of channels) {
      try {
        await prisma.telegramChannel.upsert({
          where: { channelId: channelData.channelId },
          update: channelData,
          create: channelData
        });
        console.log(`  ✅ Channel: ${channelData.title}`);
      } catch (error) {
        console.error(`  ❌ Failed to create channel ${username}:`, error.message);
      }
    }
    
    console.log('\n📝 Importing posts...');
    
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const item of data) {
      try {
        const { channelUsername, messageId } = extractChannelInfo(item);
        
        // Проверяем, существует ли уже такой пост
        const existing = await prisma.telegramPost.findUnique({
          where: {
            messageId_channelUsername: {
              messageId,
              channelUsername
            }
          }
        });
        
        if (existing) {
          skipped++;
          continue;
        }
        
        // Создаём пост - используем только существующие поля
        await prisma.telegramPost.create({
          data: {
            channelId: channelUsername,
            channelUsername,
            messageId,
            text: item.message,
            imageUrls: item.images || [],
            postDate: new Date(item.date),
            // views убираем нахрен
            link: item.link,
            rawData: item,
            processed: false
          }
        });
        
        imported++;
        
        if (imported % 10 === 0) {
          console.log(`  ✅ Imported ${imported} posts...`);
        }
        
      } catch (error) {
        failed++;
        console.error(`  ❌ Failed to import post:`, error.message);
      }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`  ✅ Imported: ${imported} posts`);
    console.log(`  ⏭️  Skipped: ${skipped} posts (already exist)`);
    console.log(`  ❌ Failed: ${failed} posts`);
    
    // Проверяем результат
    const totalPosts = await prisma.telegramPost.count();
    const totalChannels = await prisma.telegramChannel.count();
    
    console.log('\n📈 Database Status:');
    console.log(`  Total channels: ${totalChannels}`);
    console.log(`  Total posts: ${totalPosts}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();