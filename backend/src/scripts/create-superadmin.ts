import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../user/user.service';
import * as readline from 'readline';

/**
 * CLI Script to Create/Promote Super Admin
 * 
 * ⚠️  SECURITY NOTICE:
 * This is the ONLY way to create a super admin user.
 * Super admin CANNOT be created through:
 * - Registration API (/user/register)
 * - Google OAuth signup
 * - User update API (PATCH /user/:id)
 * - Swagger UI
 * 
 * The isSuperAdmin field is explicitly blocked in all public APIs.
 * Only this CLI script can set/modify the isSuperAdmin flag.
 * 
 * Usage:
 *   npm run create-superadmin
 * 
 * This script allows you to:
 * - Create a new super admin user
 * - Promote an existing user to super admin
 * - Remove super admin status from a user
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function bootstrap() {
  console.log('\n🔐 Super Admin Management Tool');
  console.log('⚠️  This is the ONLY way to create/manage super admin users\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);

  try {
    const action = await question(
      'Choose action:\n' +
      '  1. Create new super admin\n' +
      '  2. Promote existing user to super admin\n' +
      '  3. Remove super admin status\n' +
      'Enter choice (1-3): '
    );

    switch (action.trim()) {
      case '1':
        await createSuperAdmin(userService);
        break;
      case '2':
        await promoteSuperAdmin(userService);
        break;
      case '3':
        await demoteSuperAdmin(userService);
        break;
      default:
        console.log('❌ Invalid choice');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
    await app.close();
  }
}

async function createSuperAdmin(userService: UserService) {
  console.log('\n📝 Create New Super Admin\n');

  const fullName = await question('Enter full name: ');
  const email = await question('Enter email: ');
  const password = await question('Enter password: ');

  if (!fullName || !email || !password) {
    console.log('❌ All fields are required');
    return;
  }

  // Check if user already exists
  const existingUser = await userService.findByEmail(email);
  if (existingUser) {
    console.log('❌ User with this email already exists');
    return;
  }

  // Create new user
  const user = await userService.create({
    fullName,
    email,
    password,
  });

  // Make super admin
  await userService.setSuperAdmin(user._id.toString(), true);

  console.log('\n✅ Super admin created successfully!');
  console.log(`   Name: ${fullName}`);
  console.log(`   Email: ${email}`);
}

async function promoteSuperAdmin(userService: UserService) {
  console.log('\n⬆️  Promote User to Super Admin\n');

  const email = await question('Enter user email: ');

  const user = await userService.findByEmail(email);
  if (!user) {
    console.log('❌ User not found');
    return;
  }

  if (user.isSuperAdmin) {
    console.log('ℹ️  User is already a super admin');
    return;
  }

  await userService.setSuperAdmin(user._id.toString(), true);

  console.log('\n✅ User promoted to super admin!');
  console.log(`   Name: ${user.fullName}`);
  console.log(`   Email: ${user.email}`);
}

async function demoteSuperAdmin(userService: UserService) {
  console.log('\n⬇️  Remove Super Admin Status\n');

  const email = await question('Enter user email: ');

  const user = await userService.findByEmail(email);
  if (!user) {
    console.log('❌ User not found');
    return;
  }

  if (!user.isSuperAdmin) {
    console.log('ℹ️  User is not a super admin');
    return;
  }

  const confirm = await question('Are you sure? (yes/no): ');
  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Cancelled');
    return;
  }

  await userService.setSuperAdmin(user._id.toString(), false);

  console.log('\n✅ Super admin status removed!');
  console.log(`   Name: ${user.fullName}`);
  console.log(`   Email: ${user.email}`);
}

bootstrap();

