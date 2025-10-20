import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreatePortalSessionDto } from './dto/create-portal-session.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (!secretKey) {
      throw new Error('Stripe secret key is not configured');
    }
    
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
    });
  }

  async createCheckoutSession(createCheckoutSessionDto: CreateCheckoutSessionDto): Promise<{ url: string }> {
    try {
      const { priceId, successUrl, cancelUrl, customerEmail } = createCheckoutSessionDto;

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl || `${process.env.FRONTEND_URL}/billing?success=true`,
        cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/billing?canceled=true`,
      };

      if (customerEmail) {
        sessionParams.customer_email = customerEmail;
      }

      const session = await this.stripe.checkout.sessions.create(sessionParams);

      if (!session.url) {
        throw new BadRequestException('Failed to create checkout session');
      }

      this.logger.log(`Created checkout session: ${session.id}`);
      return { url: session.url };
    } catch (error) {
      this.logger.error('Failed to create checkout session', error);
      throw new BadRequestException('Failed to create checkout session');
    }
  }

  async createPortalSession(createPortalSessionDto: CreatePortalSessionDto): Promise<{ url: string }> {
    try {
      const { customerId, returnUrl } = createPortalSessionDto;

      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl || `${process.env.FRONTEND_URL}/billing`,
      });

      this.logger.log(`Created portal session for customer: ${customerId}`);
      return { url: session.url };
    } catch (error) {
      this.logger.error('Failed to create portal session', error);
      throw new BadRequestException('Failed to create portal session');
    }
  }

  async getCustomerSubscriptions(customerId: string) {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        expand: ['data.default_payment_method'],
      });

      return subscriptions.data;
    } catch (error) {
      this.logger.error('Failed to get customer subscriptions', error);
      throw new BadRequestException('Failed to get customer subscriptions');
    }
  }

  async getSubscriptionPlans() {
    try {
      const prices = await this.stripe.prices.list({
        active: true,
        expand: ['data.product'],
      });

      return prices.data.map(price => ({
        id: price.id,
        product: price.product,
        unit_amount: price.unit_amount,
        currency: price.currency,
        recurring: price.recurring,
      }));
    } catch (error) {
      this.logger.error('Failed to get subscription plans', error);
      throw new BadRequestException('Failed to get subscription plans');
    }
  }
}