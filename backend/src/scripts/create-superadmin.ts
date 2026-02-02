import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../user/user.service';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createSuperAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);

  try {
    console.log('\n=== Create Super Admin ===\n');

    const fullName = await question('Full Name: ');
    const email = await question('Email: ');
    const password = await question('Password: ');

    const user = await userService.create({
      fullName,
      email,
      password,
    });

    console.log('\n✅ Super Admin created successfully!');
    console.log('User ID:', user._id);
    console.log('Email:', user.email);
    console.log('Full Name:', user.fullName);
    console.log('\n');
  } catch (error) {
    console.error('\n❌ Error creating super admin:', error.message);
  } finally {
    rl.close();
    await app.close();
  }
}

createSuperAdmin();
