const axios = require('axios');
const fs = require('fs');
const path = require('path');

const APIFY_TOKEN = process.env.APIFY_TOKEN || 'YOUR_APIFY_TOKEN_HERE';

const runs = [
  '5CBFJCvCGxPj4b2bQ',
  'UZj68TtgtFq4JLfdn',
  'XiWiQ4LiRkhYUktLC',
  '6GaZ5RbckbGNpTwlo'
];

async function downloadDataset(runId) {
  try {
    console.log(`📥 Downloading dataset for run ${runId}...`);
    
    const url = `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}`;
    const response = await axios.get(url);
    
    const dataDir = path.join(__dirname, '..', 'data', 'apify-datasets');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const filename = path.join(dataDir, `dataset-${runId}.json`);
    fs.writeFileSync(filename, JSON.stringify(response.data, null, 2));
    
    console.log(`✅ Saved ${response.data.length} items to ${filename}`);
    
    // Показать пример первого элемента
    if (response.data.length > 0) {
      console.log('\n📊 Sample data structure:');
      const sample = response.data[0];
      console.log('Keys:', Object.keys(sample));
      console.log('\nFirst item preview:');
      console.log(JSON.stringify(sample, null, 2).substring(0, 500) + '...');
    }
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error downloading dataset ${runId}:`, error.message);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting Apify dataset download...\n');
  
  const allData = [];
  
  for (const runId of runs) {
    const data = await downloadDataset(runId);
    allData.push(...data);
    console.log('-------------------\n');
  }
  
  console.log(`\n📊 Total items downloaded: ${allData.length}`);
  
  // Сохранить объединённый датасет
  const combinedFile = path.join(__dirname, '..', 'data', 'apify-datasets', 'combined-dataset.json');
  fs.writeFileSync(combinedFile, JSON.stringify(allData, null, 2));
  console.log(`💾 Combined dataset saved to ${combinedFile}`);
  
  // Анализ структуры данных
  console.log('\n🔍 Data structure analysis:');
  const uniqueChannels = new Set(allData.map(item => item.channel));
  console.log(`Unique channels: ${[...uniqueChannels].join(', ')}`);
  
  const fieldsCount = {};
  allData.forEach(item => {
    Object.keys(item).forEach(key => {
      fieldsCount[key] = (fieldsCount[key] || 0) + 1;
    });
  });
  
  console.log('\nField presence:');
  Object.entries(fieldsCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([field, count]) => {
      const percentage = (count / allData.length * 100).toFixed(1);
      console.log(`  ${field}: ${count}/${allData.length} (${percentage}%)`);
    });
}

main().catch(console.error);