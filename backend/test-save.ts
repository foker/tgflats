import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testSave() {
  try {
    // First ensure channel exists
    const channel = await prisma.telegramChannel.upsert({
      where: { username: 'test_channel' },
      create: {
        channelId: 'channel_test_channel',
        username: 'test_channel',
        title: 'Test Channel',
        isActive: true,
      },
      update: {},
    })
    
    console.log('Channel created:', channel)
    
    // Now try to save a post
    const post = await prisma.telegramPost.create({
      data: {
        channelId: channel.channelId,
        channelUsername: 'test_channel',
        messageId: BigInt(12345),
        text: 'Test post text',
        postDate: new Date(),
        processed: false,
      }
    })
    
    console.log('Post saved:', post)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSave()