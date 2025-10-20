import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  @IsNotEmpty()
  priceId: string;

  @IsString()
  @IsOptional()
  successUrl?: string;

  @IsString()
  @IsOptional()
  cancelUrl?: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;
}