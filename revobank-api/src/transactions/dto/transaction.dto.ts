import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class DepositDto {
  @ApiProperty({ example: 'uuid-of-account', description: 'Target account ID' })
  @IsUUID()
  accountId: string;

  @ApiProperty({ example: 500.00, description: 'Amount to deposit (must be positive)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'Salary deposit', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export class WithdrawDto {
  @ApiProperty({ example: 'uuid-of-account', description: 'Source account ID' })
  @IsUUID()
  accountId: string;

  @ApiProperty({ example: 200.00, description: 'Amount to withdraw (must be positive)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'ATM withdrawal', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export class TransferDto {
  @ApiProperty({ example: 'uuid-of-from-account', description: 'Source account ID' })
  @IsUUID()
  fromAccountId: string;

  @ApiProperty({ example: 'uuid-of-to-account', description: 'Destination account ID' })
  @IsUUID()
  toAccountId: string;

  @ApiProperty({ example: 150.00, description: 'Amount to transfer (must be positive)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'Rent payment', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
