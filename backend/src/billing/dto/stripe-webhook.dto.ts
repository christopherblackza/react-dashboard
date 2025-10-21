import { IsString, IsObject, IsOptional } from 'class-validator';

export class StripeWebhookDto {
  @IsString()
  id: string;

  @IsString()
  type: string;

  @IsObject()
  data: {
    object: any;
  };

  @IsOptional()
  @IsString()
  livemode?: boolean;

  @IsOptional()
  @IsString()
  pending_webhooks?: number;

  @IsOptional()
  @IsString()
  request?: {
    id: string;
    idempotency_key: string;
  };
}