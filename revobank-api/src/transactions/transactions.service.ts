import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DepositDto, WithdrawDto, TransferDto } from './dto/transaction.dto';
import { Role, TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  private async getOwnedAccount(accountId: string, userId: string, userRole: Role) {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Account not found');
    if (userRole !== Role.ADMIN && account.userId !== userId) {
      throw new ForbiddenException('You do not own this account');
    }
    if (account.status !== 'ACTIVE') {
      throw new BadRequestException('Account is not active');
    }
    return account;
  }

  async deposit(userId: string, userRole: Role, dto: DepositDto) {
    const account = await this.getOwnedAccount(dto.accountId, userId, userRole);
    const balanceBefore = new Decimal(account.balance);
    const amount = new Decimal(dto.amount);
    const balanceAfter = balanceBefore.add(amount);

    const [transaction] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          type: TransactionType.DEPOSIT,
          amount,
          description: dto.description,
          toAccountId: account.id,
          balanceBefore,
          balanceAfter,
        },
      }),
      this.prisma.account.update({
        where: { id: account.id },
        data: { balance: balanceAfter },
      }),
    ]);

    return {
      message: 'Deposit successful',
      transaction: { ...transaction, balanceBefore, balanceAfter },
      newBalance: balanceAfter,
    };
  }

  async withdraw(userId: string, userRole: Role, dto: WithdrawDto) {
    const account = await this.getOwnedAccount(dto.accountId, userId, userRole);
    const balanceBefore = new Decimal(account.balance);
    const amount = new Decimal(dto.amount);

    if (balanceBefore.lt(amount)) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${balanceBefore.toFixed(2)}, Requested: ${amount.toFixed(2)}`,
      );
    }

    const balanceAfter = balanceBefore.sub(amount);

    const [transaction] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          type: TransactionType.WITHDRAWAL,
          amount,
          description: dto.description,
          fromAccountId: account.id,
          balanceBefore,
          balanceAfter,
        },
      }),
      this.prisma.account.update({
        where: { id: account.id },
        data: { balance: balanceAfter },
      }),
    ]);

    return {
      message: 'Withdrawal successful',
      transaction,
      newBalance: balanceAfter,
    };
  }

  async transfer(userId: string, userRole: Role, dto: TransferDto) {
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException('Cannot transfer to the same account');
    }

    const fromAccount = await this.getOwnedAccount(dto.fromAccountId, userId, userRole);
    const toAccount = await this.prisma.account.findUnique({ where: { id: dto.toAccountId } });
    if (!toAccount) throw new NotFoundException('Destination account not found');
    if (toAccount.status !== 'ACTIVE') {
      throw new BadRequestException('Destination account is not active');
    }

    const amount = new Decimal(dto.amount);
    const fromBefore = new Decimal(fromAccount.balance);
    const toBefore = new Decimal(toAccount.balance);

    if (fromBefore.lt(amount)) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${fromBefore.toFixed(2)}, Requested: ${amount.toFixed(2)}`,
      );
    }

    const fromAfter = fromBefore.sub(amount);
    const toAfter = toBefore.add(amount);

    const [transaction] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          type: TransactionType.TRANSFER,
          amount,
          description: dto.description,
          fromAccountId: fromAccount.id,
          toAccountId: toAccount.id,
          balanceBefore: fromBefore,
          balanceAfter: fromAfter,
        },
      }),
      this.prisma.account.update({ where: { id: fromAccount.id }, data: { balance: fromAfter } }),
      this.prisma.account.update({ where: { id: toAccount.id }, data: { balance: toAfter } }),
    ]);

    return {
      message: 'Transfer successful',
      transaction,
      fromNewBalance: fromAfter,
    };
  }

  async findAll(userId: string, userRole: Role) {
    let where = {};

    if (userRole !== Role.ADMIN) {
      const userAccounts = await this.prisma.account.findMany({
        where: { userId },
        select: { id: true },
      });
      const accountIds = userAccounts.map((a) => a.id);
      where = {
        OR: [
          { fromAccountId: { in: accountIds } },
          { toAccountId: { in: accountIds } },
        ],
      };
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        fromAccount: { select: { id: true, accountNumber: true } },
        toAccount: { select: { id: true, accountNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { count: transactions.length, transactions };
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        fromAccount: {
          select: { id: true, accountNumber: true, userId: true },
        },
        toAccount: {
          select: { id: true, accountNumber: true, userId: true },
        },
      },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');

    if (userRole !== Role.ADMIN) {
      const userAccounts = await this.prisma.account.findMany({
        where: { userId },
        select: { id: true },
      });
      const accountIds = userAccounts.map((a) => a.id);
      const hasAccess =
        (transaction.fromAccountId && accountIds.includes(transaction.fromAccountId)) ||
        (transaction.toAccountId && accountIds.includes(transaction.toAccountId));

      if (!hasAccess) throw new ForbiddenException('You do not have access to this transaction');
    }

    return transaction;
  }
}
