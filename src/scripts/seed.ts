/**
 * Database Seed Script
 * 
 * Run: npm run seed
 * 
 * Seeds the database with:
 * - 3 Services (Service 1, Service 2, Service 3)
 * - 8 Providers (Provider 1 through Provider 8, each with quota 10)
 * - Rotation state initialized to 0 for all services
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local');
    console.log('   Please add your MongoDB Atlas connection string to .env.local');
    process.exit(1);
  }

  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    const collections = ['services', 'providers', 'leads', 'leadassignments', 'rotationstates', 'webhookevents', 'auditlogs'];
    for (const col of collections) {
      try {
        await db.collection(col).drop();
      } catch {
        // Collection might not exist yet — that's fine
      }
    }

    // Seed Services
    console.log('📦 Seeding services...');
    const services = [
      { name: 'Service 1', slug: 'service-1', description: 'First service category for general enquiries' },
      { name: 'Service 2', slug: 'service-2', description: 'Second service category for specialized work' },
      { name: 'Service 3', slug: 'service-3', description: 'Third service category for premium services' },
    ];
    await db.collection('services').insertMany(services);
    console.log(`   ✅ ${services.length} services created`);

    // Seed Providers
    console.log('👥 Seeding providers...');
    const providers = Array.from({ length: 8 }, (_, i) => ({
      name: `Provider ${i + 1}`,
      slug: `provider-${i + 1}`,
      monthlyQuota: 10,
      currentMonthLeads: 0,
      quotaResetAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await db.collection('providers').insertMany(providers);
    console.log(`   ✅ ${providers.length} providers created (quota: 10 each)`);

    // Seed Rotation State
    console.log('🔄 Initializing rotation state...');
    const rotationStates = services.map((s) => ({
      serviceSlug: s.slug,
      poolIndex: 0,
      updatedAt: new Date(),
      createdAt: new Date(),
    }));
    await db.collection('rotationstates').insertMany(rotationStates);
    console.log(`   ✅ Rotation state initialized for ${rotationStates.length} services`);

    // Create indexes
    console.log('📇 Creating indexes...');
    await db.collection('services').createIndex({ slug: 1 }, { unique: true });
    await db.collection('providers').createIndex({ slug: 1 }, { unique: true });
    await db.collection('leads').createIndex({ phoneNumber: 1, serviceId: 1 }, { unique: true });
    await db.collection('leadassignments').createIndex({ leadId: 1, providerId: 1 }, { unique: true });
    await db.collection('leadassignments').createIndex({ providerId: 1, assignedAt: -1 });
    await db.collection('rotationstates').createIndex({ serviceSlug: 1 }, { unique: true });
    await db.collection('webhookevents').createIndex({ idempotencyKey: 1 }, { unique: true });
    await db.collection('auditlogs').createIndex({ action: 1, timestamp: -1 });
    console.log('   ✅ Indexes created');

    // Summary
    console.log('\n══════════════════════════════════════');
    console.log('   🎉 Database seeded successfully!');
    console.log('══════════════════════════════════════');
    console.log('\n📋 Summary:');
    console.log(`   Services: ${services.length}`);
    console.log(`   Providers: ${providers.length} (quota: 10 each)`);
    console.log(`   Rotation states: ${rotationStates.length}`);
    console.log('\n🏁 Mandatory Rules:');
    console.log('   Service 1 → Provider 1');
    console.log('   Service 2 → Provider 5');
    console.log('   Service 3 → Provider 1 AND Provider 4');
    console.log('\n🔄 Fair Rotation Pools:');
    console.log('   Service 1 → Providers 2, 3, 4');
    console.log('   Service 2 → Providers 6, 7, 8');
    console.log('   Service 3 → Providers 2, 3, 5, 6, 7, 8');
    console.log('\n💡 Run `npm run dev` to start the application');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();
