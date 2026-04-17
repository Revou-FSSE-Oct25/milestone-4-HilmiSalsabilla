import { Controller, Post, Get, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { DepositDto, WithdrawDto, TransferDto } from './dto/transaction.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Transactions')
@ApiBearerAuth('JWT-auth')
@Controller('transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post('deposit')
  @ApiOperation({ summary: 'Deposit funds into an account' })
  @ApiResponse({ status: 201, description: 'Deposit successful' })
  @ApiResponse({ status: 400, description: 'Invalid amount or inactive account' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  deposit(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: DepositDto,
  ) {
    return this.transactionsService.deposit(userId, userRole, dto);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw funds from an account' })
  @ApiResponse({ status: 201, description: 'Withdrawal successful' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or inactive account' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  withdraw(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: WithdrawDto,
  ) {
    return this.transactionsService.withdraw(userId, userRole, dto);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer funds between accounts' })
  @ApiResponse({ status: 201, description: 'Transfer successful' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or same account' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  transfer(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: TransferDto,
  ) {
    return this.transactionsService.transfer(userId, userRole, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all transactions (own for users, all for admin)' })
  @ApiResponse({ status: 200, description: 'Returns list of transactions' })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.transactionsService.findAll(userId, userRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific transaction by ID' })
  @ApiResponse({ status: 200, description: 'Returns the transaction' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.transactionsService.findOne(id, userId, userRole);
  }
}
