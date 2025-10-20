import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePortalSessionDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsOptional()
  returnUrl?: string;
}