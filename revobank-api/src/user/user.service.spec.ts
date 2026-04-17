import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';

const mockUser = {
  id: 'user-id-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: '+1-555-123-4567',
  role: 'USER',
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { accounts: 2 },
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-id-1');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-id-1' } }),
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updated = { ...mockUser, firstName: 'Updated' };
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await service.updateProfile('user-id-1', { firstName: 'Updated' });

      expect(result.message).toBe('Profile updated successfully');
      expect(result.user.firstName).toBe('Updated');
    });
  });
});
