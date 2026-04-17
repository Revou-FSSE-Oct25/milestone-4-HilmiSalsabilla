import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccountType, Role } from '@prisma/client';

const mockAccount = {
  id: 'account-id-1',
  accountNumber: 'RVB-123456-7890',
  type: AccountType.SAVINGS,
  status: 'ACTIVE',
  balance: 1000.0,
  currency: 'USD',
  userId: 'user-id-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrismaService = {
  account: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('AccountsService', () => {
  let service: AccountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an account successfully', async () => {
      mockPrismaService.account.create.mockResolvedValue(mockAccount);

      const result = await service.create('user-id-1', { type: AccountType.SAVINGS });

      expect(result.message).toBe('Account created successfully');
      expect(result.account).toEqual(mockAccount);
      expect(mockPrismaService.account.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return only user accounts for USER role', async () => {
      mockPrismaService.account.findMany.mockResolvedValue([mockAccount]);

      const result = await service.findAll('user-id-1', Role.USER);

      expect(result.accounts).toHaveLength(1);
      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-id-1' } }),
      );
    });

    it('should return all accounts for ADMIN role', async () => {
      mockPrismaService.account.findMany.mockResolvedValue([mockAccount]);

      await service.findAll('admin-id', Role.ADMIN);

      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an account if owned by user', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);

      const result = await service.findOne('account-id-1', 'user-id-1', Role.USER);

      expect(result).toEqual(mockAccount);
    });

    it('should throw NotFoundException for non-existent account', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);

      await expect(service.findOne('bad-id', 'user-id-1', Role.USER)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own the account', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue({
        ...mockAccount,
        userId: 'other-user-id',
      });

      await expect(service.findOne('account-id-1', 'user-id-1', Role.USER)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow admin to access any account', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue({
        ...mockAccount,
        userId: 'some-other-user',
      });

      const result = await service.findOne('account-id-1', 'admin-id', Role.ADMIN);
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should delete account with zero balance', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue({
        ...mockAccount,
        balance: 0,
      });
      mockPrismaService.account.delete.mockResolvedValue(mockAccount);

      const result = await service.remove('account-id-1', 'user-id-1', Role.USER);

      expect(result.message).toBe('Account deleted successfully');
    });

    it('should throw BadRequestException when deleting account with balance', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount); // balance = 1000

      await expect(service.remove('account-id-1', 'user-id-1', Role.USER)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
