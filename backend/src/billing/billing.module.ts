import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { DatabaseModule } from '../database/database.module';
import stripeConfig from '../config/stripe.config';

@Module({
  imports: [
    ConfigModule.forFeature(stripeConfig),
    DatabaseModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}