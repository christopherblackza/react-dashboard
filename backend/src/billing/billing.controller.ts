import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  Request,
  Headers,
  RawBodyRequest,
  Req,
  BadRequestException,
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
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
  })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    console.log('=== WEBHOOK DEBUG START ===');
    console.log('Webhook signature:', signature);
    console.log('Raw body type:', typeof req.rawBody);
    console.log('Raw body length:', req.rawBody?.length);
    console.log('Raw body exists:', !!req.rawBody);
    
    if (!req.rawBody) {
      console.log('ERROR: Missing raw body');
      throw new BadRequestException('Missing raw body');
    }
    
    try {
      const result = await this.billingService.handleWebhook(req.rawBody, signature);
      console.log('Webhook processing result:', result);
      console.log('=== WEBHOOK DEBUG END ===');
      return result;
    } catch (error) {
      console.log('Webhook processing error:', error);
      console.log('=== WEBHOOK DEBUG END ===');
      throw error;
    }
  }

  @Post('checkout-session')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
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
  async createCheckoutSession(
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto,
    @Request() req
  ): Promise<{ url: string }> {
    console.log('=== DEBUG: createCheckoutSession ===');
    console.log('req.user:', req.user);
    const userId = req.user.id; // JWT strategy returns user object with 'id' field
    console.log('User ID:', userId);
    return this.billingService.createCheckoutSession(createCheckoutSessionDto, userId);
  }

  @Post('portal-session')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription plans retrieved successfully',
  })
  async getSubscriptionPlans() {
    return this.billingService.getSubscriptionPlans();
  }

  @Get('subscriptions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get customer subscriptions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer subscriptions retrieved successfully',
  })
  async getCustomerSubscriptions(@Request() req) {
    // Get subscriptions from the database using the authenticated user's ID
    console.log('=== DEBUG: getCustomerSubscriptions ===');
    console.log('req.user:', req.user);
    const userId = req.user.id; // JWT strategy returns user object with 'id' field
    console.log('User ID:', userId);
    return this.billingService.getSubscriptionsFromDatabase(userId);
  }
}