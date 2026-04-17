import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  private generateAccountNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 9000 + 1000).toString();
    return `RVB-${timestamp}-${random}`;
  }

  async create(userId: string, dto: CreateAccountDto) {
    const accountNumber = this.generateAccountNumber();

    const account = await this.prisma.account.create({
      data: {
        accountNumber,
        type: dto.type,
        currency: dto.currency || 'USD',
        userId,
      },
    });

    return { message: 'Account created successfully', account };
  }

  async findAll(userId: string, userRole: Role) {
    const where = userRole === Role.ADMIN ? {} : { userId };
    const accounts = await this.prisma.account.findMany({
      where,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { count: accounts.length, accounts };
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        sentTransactions: { take: 5, orderBy: { createdAt: 'desc' } },
        receivedTransactions: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!account) throw new NotFoundException('Account not found');
    if (userRole !== Role.ADMIN && account.userId !== userId) {
      throw new ForbiddenException('You do not have access to this account');
    }

    return account;
  }

  async update(id: string, userId: string, userRole: Role, dto: UpdateAccountDto) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    if (userRole !== Role.ADMIN && account.userId !== userId) {
      throw new ForbiddenException('You do not have access to this account');
    }

    const updated = await this.prisma.account.update({
      where: { id },
      data: dto,
    });

    return { message: 'Account updated successfully', account: updated };
  }

  async remove(id: string, userId: string, userRole: Role) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    if (userRole !== Role.ADMIN && account.userId !== userId) {
      throw new ForbiddenException('You do not have access to this account');
    }
    if (Number(account.balance) > 0) {
      throw new BadRequestException(
        'Cannot delete account with remaining balance. Please withdraw funds first.',
      );
    }

    await this.prisma.account.delete({ where: { id } });
    return { message: 'Account deleted successfully' };
  }
}
