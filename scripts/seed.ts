// scripts/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@ems-events.com' },
    update: {},
    create: {
      email: 'admin@ems-events.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      firstName: 'Admin',
      lastName: 'User',
      isActive: true
    }
  })

  console.log('✅ Created admin user:', admin.email)

  // Create event settings
  const eventSettings = [
    {
      key: 'EVENT_NAME',
      value: 'EMS Trade Fair VIP Experience',
      description: 'Name of the event'
    },
    {
      key: 'EVENT_START_DATE',
      value: '2025-07-26',
      description: 'Event start date'
    },
    {
      key: 'EVENT_END_DATE',
      value: '2025-08-06',
      description: 'Event end date'
    },
    {
      key: 'VENUE_NAME',
      value: 'Malta Fairs and Conventions Centre',
      description: 'Event venue name'
    },
    {
      key: 'VENUE_ADDRESS',
      value: 'Ta\' Qali, Malta',
      description: 'Event venue address'
    },
    {
      key: 'BOOTH_LOCATION',
      value: 'EMS Booth - MFCC',
      description: 'EMS booth location'
    },
    {
      key: 'REGISTRATION_ENABLED',
      value: 'true',
      description: 'Whether registration is currently enabled'
    }
  ]

  for (const setting of eventSettings) {
    await prisma.eventSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting
    })
  }

  console.log('✅ Created event settings')

  // Create sample clients for testing (optional)
  const sampleClients = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+356 1234 5678',
      idNumber: 'ID123456789',
      status: 'VERIFIED' as const
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+356 9876 5432',
      idNumber: 'ID987654321',
      status: 'PENDING' as const
    },
    {
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@example.com',
      phone: '+356 5555 1234',
      idNumber: 'ID555123456',
      status: 'VERIFIED' as const
    }
  ]

  for (const clientData of sampleClients) {
    const client = await prisma.client.upsert({
      where: { email: clientData.email },
      update: {},
      create: {
        ...clientData,
        verifiedAt: clientData.status === 'VERIFIED' ? new Date() : null,
        verifiedBy: clientData.status === 'VERIFIED' ? admin.id : null
      }
    })

    // Create panel interest for some clients
    if (client.firstName === 'John' || client.firstName === 'Bob') {
      await prisma.panelInterest.upsert({
        where: { 
          clientId_panelType: {
            clientId: client.id,
            panelType: client.firstName === 'John' ? 'commercial' : 'residential'
          }
        },
        update: {},
        create: {
          clientId: client.id,
          panelType: client.firstName === 'John' ? 'commercial' : 'residential',
          interestLevel: 'HIGH',
          status: 'NEW',
          notes: `Interested in ${client.firstName === 'John' ? 'commercial' : 'residential'} panels for upcoming project`
        }
      })
    }

    console.log(`✅ Created sample client: ${client.email}`)
  }

  console.log('🎉 Database seeded successfully!')
  console.log('\n📋 Admin Login Credentials:')
  console.log('Email: admin@ems-events.com')
  console.log('Password: admin123')
  console.log('\n🌐 Access the application:')
  console.log('Public site: http://localhost:3000')
  console.log('Admin panel: http://localhost:3000/admin/login')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

// scripts/create-admin.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { stdin, stdout } from 'process'
import { createInterface } from 'readline'

const prisma = new PrismaClient()
const rl = createInterface({ input: stdin, output: stdout })

async function createAdmin() {
  console.log('🔐 Create Admin User\n')

  const email = await question('Email: ')
  const password = await question('Password: ')
  const firstName = await question('First Name: ')
  const lastName = await question('Last Name: ')
  const role = await question('Role (SUPER_ADMIN/ADMIN/STAFF): ') as 'SUPER_ADMIN' | 'ADMIN' | 'STAFF'

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const admin = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'ADMIN',
        isActive: true
      }
    })

    console.log(`✅ Admin user created successfully: ${admin.email}`)
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

createAdmin()

// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}