const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5433/tbi_prop'
    }
  }
});

async function analyzeWithAI(text) {
  try {
    // Using OpenRouter API with DeepSeek
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a real estate AI assistant. Analyze the following property listing text and extract:
              1. Whether it's a rental (isRental: true/false)
              2. Price (if mentioned)
              3. Currency (GEL, USD, EUR)
              4. Number of bedrooms
              5. Area in square meters
              6. District/location
              7. Address if mentioned
              8. Amenities (array of features)
              9. Whether pets are allowed
              10. Whether it's furnished
              
              Return ONLY valid JSON with these fields. Use null for missing data.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || 'YOUR_OPENROUTER_KEY'}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://tbi-prop.com',
          'X-Title': 'TBI-Prop'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('AI analysis error:', error.message);
    return null;
  }
}

async function processUnprocessedPosts() {
  try {
    console.log('🚀 Starting AI processing of telegram posts...\n');

    // Get unprocessed posts
    const posts = await prisma.telegramPost.findMany({
      where: {
        processed: false
      },
      take: 10, // Process 10 at a time
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${posts.length} unprocessed posts\n`);

    let processed = 0;
    let created = 0;
    let failed = 0;

    for (const post of posts) {
      if (!post.text) {
        console.log(`⏭️ Skipping post ${post.id} - no text`);
        continue;
      }

      console.log(`🔍 Processing post ${post.id}...`);
      
      // Analyze with AI
      const analysis = await analyzeWithAI(post.text);
      
      if (!analysis || !analysis.isRental) {
        // Mark as processed even if not a rental
        await prisma.telegramPost.update({
          where: { id: post.id },
          data: { processed: true }
        });
        console.log(`  ⏭️ Not a rental listing`);
        processed++;
        continue;
      }

      // Create listing from AI analysis
      try {
        const listing = await prisma.listing.create({
          data: {
            telegramPostId: post.id,
            district: analysis.district || null,
            address: analysis.address || null,
            price: analysis.price || null,
            currency: analysis.currency || 'GEL',
            bedrooms: analysis.bedrooms || null,
            areaSqm: analysis.area || null,
            petsAllowed: analysis.petsAllowed || null,
            furnished: analysis.furnished || null,
            amenities: analysis.amenities || [],
            description: post.text,
            imageUrls: post.imageUrls || [],
            sourceUrl: post.link,
            confidence: 0.8,
            status: 'ACTIVE'
          }
        });

        // Mark post as processed
        await prisma.telegramPost.update({
          where: { id: post.id },
          data: { processed: true }
        });

        console.log(`  ✅ Created listing ${listing.id}`);
        created++;
        processed++;
      } catch (error) {
        console.error(`  ❌ Failed to create listing:`, error.message);
        failed++;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📊 Processing Summary:');
    console.log(`  ✅ Processed: ${processed} posts`);
    console.log(`  🏠 Created: ${created} listings`);
    console.log(`  ❌ Failed: ${failed} posts`);

    // Check total listings
    const totalListings = await prisma.listing.count();
    console.log(`\n📈 Total listings in database: ${totalListings}`);

  } catch (error) {
    console.error('❌ Processing failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

processUnprocessedPosts();