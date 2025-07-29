import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { hashPassword } from './utils/password-utils';

async function createAdminUser() {
  try {
    // Check if admin user exists
    const existingAdmin = await db.select().from(users).where(eq(users.id, 'admin-user-id'));
    
    if (existingAdmin.length === 0) {
      // Create admin user
      const newUser = await db.insert(users).values({
        id: 'admin-user-id',
        username: 'admin',
        email: 'admin@jacc.com',
        role: 'client-admin',
        passwordHash: await hashPassword('secure_admin_2025!' + crypto.randomBytes(8).toString('hex')),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      console.log('Admin user created:', newUser[0]);
    } else {
      console.log('Admin user already exists');
    }
    
    // Also create the demo user
    const existingDemo = await db.select().from(users).where(eq(users.id, 'demo-user-id'));
    
    if (existingDemo.length === 0) {
      const demoUser = await db.insert(users).values({
        id: 'demo-user-id',
        username: 'demo',
        email: 'demo@jacc.com',
        role: 'sales-agent',
        passwordHash: await hashPassword('secure_demo_2025!' + crypto.randomBytes(8).toString('hex')),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      console.log('Demo user created:', demoUser[0]);
    } else {
      console.log('Demo user already exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();