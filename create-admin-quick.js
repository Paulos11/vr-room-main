const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('Creating admin user...')
    
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const adminUser = await prisma.adminUser.create({
      data: {
        email: 'admin@ems.com.mt',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        firstName: 'EMS',
        lastName: 'Admin'
      }
    })
    
    console.log('✅ Admin created successfully!')
    console.log('📧 Email: admin@ems.com.mt')
    console.log('🔑 Password: admin123')
    console.log('👤 Role: SUPER_ADMIN')
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('ℹ️ Admin user already exists')
    } else {
      console.error('❌ Error:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
