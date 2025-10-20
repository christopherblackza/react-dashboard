import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreatePortalSessionDto } from './dto/create-portal-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout-session')
  @ApiOperation({ summary: 'Create a Stripe checkout session' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Checkout session created successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Checkout session URL' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createCheckoutSession(@Body() createCheckoutSessionDto: CreateCheckoutSessionDto): Promise<{ url: string }> {
    return this.billingService.createCheckoutSession(createCheckoutSessionDto);
  }

  @Post('portal-session')
  @ApiOperation({ summary: 'Create a Stripe customer portal session' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Portal session created successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Portal session URL' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createPortalSession(@Body() createPortalSessionDto: CreatePortalSessionDto): Promise<{ url: string }> {
    return this.billingService.createPortalSession(createPortalSessionDto);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription plans retrieved successfully',
  })
  async getSubscriptionPlans() {
    return this.billingService.getSubscriptionPlans();
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Get customer subscriptions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer subscriptions retrieved successfully',
  })
  async getCustomerSubscriptions(@Request() req) {
    // Assuming the customer ID is stored in the user profile or can be derived from the user
    // This would need to be implemented based on your user/customer relationship
    const customerId = req.user.stripeCustomerId; // This field would need to exist
    return this.billingService.getCustomerSubscriptions(customerId);
  }
}