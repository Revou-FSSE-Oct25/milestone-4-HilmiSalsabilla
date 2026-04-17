import { PrismaClient, Role, AccountType, AccountStatus, TransactionType, TransactionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@revobank.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'RevoBank',
      phone: '+1-555-000-0001',
      role: Role.ADMIN,
    },
  });

  // Create regular users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Johnson',
      phone: '+1-555-100-0001',
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      password: hashedPassword,
      firstName: 'Bob',
      lastName: 'Smith',
      phone: '+1-555-100-0002',
    },
  });

  // Create accounts
  const aliceSavings = await prisma.account.create({
    data: {
      accountNumber: 'RVB-1001-0001',
      type: AccountType.SAVINGS,
      status: AccountStatus.ACTIVE,
      balance: 5000.00,
      userId: alice.id,
    },
  });

  const aliceChecking = await prisma.account.create({
    data: {
      accountNumber: 'RVB-1001-0002',
      type: AccountType.CHECKING,
      status: AccountStatus.ACTIVE,
      balance: 2500.00,
      userId: alice.id,
    },
  });

  const bobSavings = await prisma.account.create({
    data: {
      accountNumber: 'RVB-1002-0001',
      type: AccountType.SAVINGS,
      status: AccountStatus.ACTIVE,
      balance: 3000.00,
      userId: bob.id,
    },
  });

  // Create sample transactions
  await prisma.transaction.createMany({
    data: [
      {
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        amount: 5000.00,
        description: 'Initial deposit',
        toAccountId: aliceSavings.id,
        balanceBefore: 0,
        balanceAfter: 5000.00,
      },
      {
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        amount: 2500.00,
        description: 'Initial deposit',
        toAccountId: aliceChecking.id,
        balanceBefore: 0,
        balanceAfter: 2500.00,
      },
      {
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        amount: 3000.00,
        description: 'Initial deposit',
        toAccountId: bobSavings.id,
        balanceBefore: 0,
        balanceAfter: 3000.00,
      },
      {
        type: TransactionType.TRANSFER,
        status: TransactionStatus.COMPLETED,
        amount: 500.00,
        description: 'Transfer to checking',
        fromAccountId: aliceSavings.id,
        toAccountId: aliceChecking.id,
        balanceBefore: 5000.00,
        balanceAfter: 4500.00,
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log(`  👤 Admin: admin@revobank.com / Password123!`);
  console.log(`  👤 Alice: alice@example.com / Password123!`);
  console.log(`  👤 Bob:   bob@example.com / Password123!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
