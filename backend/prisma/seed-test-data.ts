import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const districts = ['Vake', 'Saburtalo', 'Isani', 'Gldani', 'Didube', 'Nadzaladevi', 'Krtsanisi', 'Mtatsminda', 'Chughureti', 'Samgori']
const streets = ['Chavchavadze Ave', 'Rustaveli Ave', 'Kazbegi Ave', 'Vazha-Pshavela Ave', 'Pekini Ave', 'Tsereteli Ave', 'Agmashenebeli Ave']
const amenities = ['Parking', 'Balcony', 'Elevator', 'Security', 'Gym', 'Pool', 'Garden', 'Storage', 'Central Heating', 'Air Conditioning']

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

async function main() {
  console.log('🌱 Starting to seed test data...')

  // Clear existing data
  await prisma.listing.deleteMany({})
  console.log('🗑️  Cleared existing listings')

  const listings = []
  
  for (let i = 1; i <= 100; i++) {
    const district = getRandomElement(districts)
    const street = getRandomElement(streets)
    const bedrooms = Math.floor(Math.random() * 4) + 1
    const bathrooms = Math.min(bedrooms, Math.floor(Math.random() * 2) + 1)
    const areaSqm = bedrooms * 25 + Math.floor(Math.random() * 50)
    const floor = Math.floor(Math.random() * 15) + 1
    const totalFloors = floor + Math.floor(Math.random() * 10)
    const price = bedrooms * 400 + Math.floor(Math.random() * 800)
    
    // Generate coordinates around Tbilisi
    const baseLat = 41.7151
    const baseLng = 44.8271
    const latOffset = (Math.random() - 0.5) * 0.1
    const lngOffset = (Math.random() - 0.5) * 0.1
    
    const listing = {
      description: `Beautiful ${bedrooms} bedroom apartment located in the heart of ${district}. Features modern amenities and great location. Close to public transport, shops, and restaurants. ${Math.random() > 0.5 ? 'Newly renovated with designer furniture.' : 'Classic style with spacious rooms.'} Floor: ${floor}/${totalFloors}. Built in ${2000 + Math.floor(Math.random() * 25)}. ${bathrooms} bathroom(s).`,
      price: Math.random() > 0.8 ? null : price,
      priceMin: Math.random() > 0.8 ? price - 100 : null,
      priceMax: Math.random() > 0.8 ? price + 200 : null,
      currency: 'USD',
      district,
      address: `${Math.floor(Math.random() * 200) + 1} ${street}, ${district}`,
      latitude: baseLat + latOffset,
      longitude: baseLng + lngOffset,
      bedrooms,
      areaSqm,
      furnished: Math.random() > 0.5,
      petsAllowed: Math.random() > 0.7,
      amenities: getRandomElements(amenities, Math.floor(Math.random() * 5) + 2),
      imageUrls: [
        `https://images.unsplash.com/photo-${1560518883 + i}-ce09059eeffa?w=800&h=600&fit=crop`,
        `https://images.unsplash.com/photo-${1502672260 + i}-3cdf2f8a0c01?w=800&h=600&fit=crop`,
      ],
      sourceUrl: `https://example.com/listing-${i}`,
      status: Math.random() > 0.1 ? 'ACTIVE' : 'INACTIVE',
      confidence: 0.7 + Math.random() * 0.3,
      contactInfo: `+995 555 ${Math.floor(Math.random() * 900000 + 100000)}`,
    }
    
    listings.push(listing)
  }

  // Insert all listings
  const created = await prisma.listing.createMany({
    data: listings,
  })

  console.log(`✅ Created ${created.count} test listings`)
  
  // Show some statistics
  const stats = await prisma.listing.aggregate({
    _count: true,
    _avg: {
      price: true,
      areaSqm: true,
      bedrooms: true,
    },
    _min: {
      price: true,
    },
    _max: {
      price: true,
    },
  })
  
  console.log('\n📊 Database Statistics:')
  console.log(`  Total Listings: ${stats._count}`)
  console.log(`  Average Price: $${stats._avg.price?.toFixed(2)}`)
  console.log(`  Price Range: $${stats._min.price} - $${stats._max.price}`)
  console.log(`  Average Area: ${stats._avg.areaSqm?.toFixed(2)} m²`)
  console.log(`  Average Bedrooms: ${stats._avg.bedrooms?.toFixed(1)}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })