import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const mockActiveAccount = (id: string, userId: string, balance = 1000) => ({
  id,
  accountNumber: `RVB-TEST-${id}`,
  type: 'SAVINGS',
  status: 'ACTIVE',
  balance: new Decimal(balance),
  currency: 'USD',
  userId,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mockTransaction = {
  id: 'txn-id-1',
  type: 'DEPOSIT',
  status: 'COMPLETED',
  amount: new Decimal(500),
  description: 'Test',
  reference: 'ref-1',
  fromAccountId: null,
  toAccountId: 'account-id-1',
  balanceBefore: new Decimal(500),
  balanceAfter: new Decimal(1000),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  account: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    jest.clearAllMocks();
  });

  describe('deposit', () => {
    it('should deposit successfully', async () => {
      const account = mockActiveAccount('account-id-1', 'user-id-1', 500);
      mockPrisma.account.findUnique.mockResolvedValue(account);
      mockPrisma.$transaction.mockResolvedValue([mockTransaction, account]);

      const result = await service.deposit('user-id-1', Role.USER, {
        accountId: 'account-id-1',
        amount: 500,
        description: 'Test deposit',
      });

      expect(result.message).toBe('Deposit successful');
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if account does not exist', async () => {
      mockPrisma.account.findUnique.mockResolvedValue(null);

      await expect(
        service.deposit('user-id-1', Role.USER, { accountId: 'bad-id', amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own account', async () => {
      mockPrisma.account.findUnique.mockResolvedValue(
        mockActiveAccount('account-id-1', 'other-user'),
      );

      await expect(
        service.deposit('user-id-1', Role.USER, { accountId: 'account-id-1', amount: 100 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if account is not active', async () => {
      mockPrisma.account.findUnique.mockResolvedValue({
        ...mockActiveAccount('account-id-1', 'user-id-1'),
        status: 'FROZEN',
      });

      await expect(
        service.deposit('user-id-1', Role.USER, { accountId: 'account-id-1', amount: 100 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('withdraw', () => {
    it('should withdraw successfully', async () => {
      const account = mockActiveAccount('account-id-1', 'user-id-1', 1000);
      mockPrisma.account.findUnique.mockResolvedValue(account);
      mockPrisma.$transaction.mockResolvedValue([mockTransaction, account]);

      const result = await service.withdraw('user-id-1', Role.USER, {
        accountId: 'account-id-1',
        amount: 500,
      });

      expect(result.message).toBe('Withdrawal successful');
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      mockPrisma.account.findUnique.mockResolvedValue(
        mockActiveAccount('account-id-1', 'user-id-1', 100),
      );

      await expect(
        service.withdraw('user-id-1', Role.USER, { accountId: 'account-id-1', amount: 500 }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.withdraw('user-id-1', Role.USER, { accountId: 'account-id-1', amount: 500 }),
      ).rejects.toThrow('Insufficient balance');
    });
  });

  describe('transfer', () => {
    it('should transfer successfully between accounts', async () => {
      const fromAccount = mockActiveAccount('from-id', 'user-id-1', 1000);
      const toAccount = mockActiveAccount('to-id', 'user-id-2', 500);

      mockPrisma.account.findUnique
        .mockResolvedValueOnce(fromAccount)
        .mockResolvedValueOnce(toAccount);
      mockPrisma.$transaction.mockResolvedValue([mockTransaction, fromAccount, toAccount]);

      const result = await service.transfer('user-id-1', Role.USER, {
        fromAccountId: 'from-id',
        toAccountId: 'to-id',
        amount: 200,
      });

      expect(result.message).toBe('Transfer successful');
    });

    it('should throw BadRequestException when transferring to same account', async () => {
      await expect(
        service.transfer('user-id-1', Role.USER, {
          fromAccountId: 'same-id',
          toAccountId: 'same-id',
          amount: 100,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.transfer('user-id-1', Role.USER, {
          fromAccountId: 'same-id',
          toAccountId: 'same-id',
          amount: 100,
        }),
      ).rejects.toThrow('Cannot transfer to the same account');
    });

    it('should throw BadRequestException for insufficient balance during transfer', async () => {
      const fromAccount = mockActiveAccount('from-id', 'user-id-1', 50);
      const toAccount = mockActiveAccount('to-id', 'user-id-2', 500);

      mockPrisma.account.findUnique
        .mockResolvedValueOnce(fromAccount)
        .mockResolvedValueOnce(toAccount);

      await expect(
        service.transfer('user-id-1', Role.USER, {
          fromAccountId: 'from-id',
          toAccountId: 'to-id',
          amount: 200,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if destination account does not exist', async () => {
      const fromAccount = mockActiveAccount('from-id', 'user-id-1', 1000);
      mockPrisma.account.findUnique
        .mockResolvedValueOnce(fromAccount)
        .mockResolvedValueOnce(null);

      await expect(
        service.transfer('user-id-1', Role.USER, {
          fromAccountId: 'from-id',
          toAccountId: 'nonexistent-id',
          amount: 100,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
