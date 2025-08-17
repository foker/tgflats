import { PrismaClient, ListingStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create telegram channels first
  const channel1 = await prisma.telegramChannel.create({
    data: {
      channelId: '@kvartiry_v_tbilisi',
      username: 'kvartiry_v_tbilisi',
      title: 'Квартиры в Тбилиси',
      isActive: true,
    },
  });

  const channel2 = await prisma.telegramChannel.create({
    data: {
      channelId: '@propertyintbilisi',
      username: 'propertyintbilisi',
      title: 'Property in Tbilisi',
      isActive: true,
    },
  });

  // Create mock telegram posts
  const telegramPost1 = await prisma.telegramPost.create({
    data: {
      channelId: '@kvartiry_v_tbilisi',
      channelUsername: 'kvartiry_v_tbilisi',
      messageId: 1001,
      text: 'Сдается 2-комнатная квартира в Сабуртало, район Дележани. Цена 800-900 лари. Квартира меблированная, с ремонтом. Можно с животными.',
      photos: [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg',
      ],
      processed: true,
      rawData: {
        message_id: 1001,
        date: 1678886400,
        text: 'Сдается 2-комнатная квартира в Сабуртало...',
      },
    },
  });

  const telegramPost2 = await prisma.telegramPost.create({
    data: {
      channelId: '@propertyintbilisi',
      channelUsername: 'propertyintbilisi',
      messageId: 2001,
      text: 'For rent: 1-bedroom apartment in Vake. Price $600-700. Furnished, pets allowed.',
      photos: ['https://example.com/photo3.jpg'],
      processed: true,
      rawData: {
        message_id: 2001,
        date: 1678972800,
        text: 'For rent: 1-bedroom apartment in Vake...',
      },
    },
  });

  // Create mock listings
  await prisma.listing.create({
    data: {
      telegramPostId: telegramPost1.id,
      district: 'Saburtalo',
      address: 'Delezhani Street, Tbilisi',
      latitude: 41.7225,
      longitude: 44.7925,
      priceMin: 800,
      priceMax: 900,
      currency: 'GEL',
      bedrooms: 2,
      areaSqm: 65,
      petsAllowed: true,
      furnished: true,
      amenities: ['WiFi', 'Washing Machine', 'Air Conditioning'],
      description: 'Красивая 2-комнатная квартира в Сабуртало с ремонтом',
      status: ListingStatus.ACTIVE,
      confidence: 0.95,
    },
  });

  await prisma.listing.create({
    data: {
      telegramPostId: telegramPost2.id,
      district: 'Vake',
      address: 'Chavchavadze Avenue, Tbilisi',
      latitude: 41.7086,
      longitude: 44.7764,
      priceMin: 600,
      priceMax: 700,
      currency: 'USD',
      bedrooms: 1,
      areaSqm: 45,
      petsAllowed: true,
      furnished: true,
      amenities: ['WiFi', 'Parking', 'Balcony'],
      description: 'Modern 1-bedroom apartment in prestigious Vake district',
      status: ListingStatus.ACTIVE,
      confidence: 0.88,
    },
  });

  // Create more sample listings for better testing
  const sampleListings = [
    {
      district: 'Old Town',
      address: 'Rustaveli Avenue, Tbilisi',
      latitude: 41.6977,
      longitude: 44.8014,
      priceMin: 1200,
      priceMax: 1500,
      currency: 'GEL',
      bedrooms: 3,
      areaSqm: 85,
      petsAllowed: false,
      furnished: true,
      amenities: ['WiFi', 'Dishwasher', 'Central Heating'],
      description: 'Historic apartment in the heart of Old Tbilisi',
      status: ListingStatus.ACTIVE,
      confidence: 0.92,
    },
    {
      district: 'Isani',
      address: 'Samgori Street, Tbilisi',
      latitude: 41.6892,
      longitude: 44.8337,
      priceMin: 400,
      priceMax: 500,
      currency: 'GEL',
      bedrooms: 1,
      areaSqm: 35,
      petsAllowed: true,
      furnished: false,
      amenities: ['WiFi'],
      description: 'Affordable studio in Isani district',
      status: ListingStatus.ACTIVE,
      confidence: 0.75,
    },
    {
      district: 'Vera',
      address: 'Pekini Avenue, Tbilisi',
      latitude: 41.7044,
      longitude: 44.7736,
      priceMin: 1000,
      priceMax: 1200,
      currency: 'GEL',
      bedrooms: 2,
      areaSqm: 70,
      petsAllowed: false,
      furnished: true,
      amenities: ['WiFi', 'Elevator', 'Security'],
      description: 'Modern apartment in Vera with mountain views',
      status: ListingStatus.ACTIVE,
      confidence: 0.89,
    },
  ];

  for (const listing of sampleListings) {
    await prisma.listing.create({ data: listing });
  }

  // Create geocoding cache entries
  await prisma.geocodingCache.createMany({
    data: [
      {
        address: 'Rustaveli Avenue, Tbilisi',
        latitude: 41.6977,
        longitude: 44.8014,
        formattedAddress: 'Rustaveli Avenue, Tbilisi, Georgia',
      },
      {
        address: 'Chavchavadze Avenue, Tbilisi',
        latitude: 41.7086,
        longitude: 44.7764,
        formattedAddress: 'Chavchavadze Avenue, Tbilisi, Georgia',
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });