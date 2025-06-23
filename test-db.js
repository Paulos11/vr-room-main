const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully!')
    
    // Test if AdminUser table exists
    const count = await prisma.adminUser.count()
    console.log(`✅ AdminUser table exists. Current count: ${count}`)
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

testConnection()
