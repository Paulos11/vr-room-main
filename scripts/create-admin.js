// scripts/create-admin-simple.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createSimpleAdmin() {
  try {
    console.log("🔧 Creating Admin User...");

    // Test database connection
    console.log("Testing database connection...");
    await prisma.$connect();
    console.log("✅ Database connected");

    const adminData = {
      email: "admin@gmail.com",
      password: "Test123@",
      firstName: "Admin",
      lastName: "User",
      role: "SUPER_ADMIN",
    };

    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: adminData.email },
    });

    if (existingAdmin) {
      console.log("❌ Admin user already exists with email:", adminData.email);

      // Show existing admin details
      console.log("Existing admin details:");
      console.log("- ID:", existingAdmin.id);
      console.log("- Email:", existingAdmin.email);
      console.log("- Role:", existingAdmin.role);
      console.log("- Created:", existingAdmin.createdAt);

      return;
    }

    // Hash password
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(adminData.password, 12);
    console.log("✅ Password hashed");

    // Create admin user
    console.log("Creating admin user in database...");
    const adminUser = await prisma.adminUser.create({
      data: {
        email: adminData.email,
        password: hashedPassword,
        role: adminData.role,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        isActive: true,
      },
    });

    console.log("\n✅ Admin user created successfully!");
    console.log("================================");
    console.log("Login Credentials:");
    console.log("Email:", adminUser.email);
    console.log("Password:", adminData.password);
    console.log("Role:", adminUser.role);
    console.log("ID:", adminUser.id);
    console.log("Created:", adminUser.createdAt.toISOString());

    // Double-check by querying the database
    console.log("\nVerifying creation...");
    const verifyUser = await prisma.adminUser.findUnique({
      where: { email: adminUser.email },
    });

    if (verifyUser) {
      console.log("✅ Admin user verified in database");

      // Test password
      const isPasswordValid = await bcrypt.compare(
        adminData.password,
        verifyUser.password
      );
      console.log(
        "✅ Password verification:",
        isPasswordValid ? "VALID" : "INVALID"
      );
    } else {
      console.log("❌ Could not verify admin user in database");
    }

    // Show total admin count
    const totalAdmins = await prisma.adminUser.count();
    console.log(`\nTotal admin users in database: ${totalAdmins}`);
  } catch (error) {
    console.error("❌ Error creating admin:", error);

    // Show more detailed error info
    if (error.code) {
      console.error("Error code:", error.code);
    }
    if (error.meta) {
      console.error("Error meta:", error.meta);
    }
  } finally {
    await prisma.$disconnect();
    console.log("\n👋 Database connection closed");
  }
}

createSimpleAdmin();
