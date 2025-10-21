import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreatePortalSessionDto } from './dto/create-portal-session.dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (!secretKey) {
      throw new Error('Stripe secret key is not configured');
    }
    
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
    });
  }

  async createCheckoutSession(createCheckoutSessionDto: CreateCheckoutSessionDto, userId?: string): Promise<{ url: string }> {
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

      // Add org_id to metadata if userId is provided
      if (userId) {
        try {
          const supabase = this.databaseService.getClient();
          const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('auth_user_id', userId)
            .single();

          if (profile?.org_id) {
            sessionParams.subscription_data = {
              metadata: {
                org_id: profile.org_id,
                user_id: userId,
              },
            };
          }
        } catch (error) {
          this.logger.warn('Failed to get user org_id for checkout session', error);
        }
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

  async getSubscriptionsFromDatabase(userId: string) {
    try {
      console.log('=== GET SUBSCRIPTIONS FROM DATABASE ===');
      console.log('User ID:', userId);
      
      const supabase = this.databaseService.getClient();
      
      // Get the user's organization ID first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('auth_user_id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to handle 0 rows

      console.log('Profile query result:', { profile, profileError });

      if (profileError) {
        console.log('Profile error:', profileError);
        this.logger.error('Failed to get user profile', profileError);
        throw new BadRequestException('Failed to get user profile');
      }

      if (!profile) {
        console.log('No profile found for user:', userId);
        this.logger.warn(`No profile found for user: ${userId}. User may need to complete profile setup.`);
        return [];
      }

      if (!profile.org_id) {
        console.log('No org_id found in profile:', profile);
        this.logger.warn(`No organization found for user: ${userId}. Profile exists but org_id is null.`);
        return [];
      }

      console.log('Found org_id:', profile.org_id);

      // Get subscriptions for the user's organization
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('org_id', profile.org_id);

      console.log('Subscriptions query result:', { subscriptions, subscriptionsError });

      if (subscriptionsError) {
        console.log('Subscriptions error:', subscriptionsError);
        this.logger.error('Failed to get subscriptions from database', subscriptionsError);
        throw new BadRequestException('Failed to get subscriptions from database');
      }

      console.log('Returning subscriptions:', subscriptions || []);
      console.log('=== GET SUBSCRIPTIONS FROM DATABASE COMPLETE ===');
      return subscriptions || [];
    } catch (error) {
      console.log('=== GET SUBSCRIPTIONS FROM DATABASE ERROR ===');
      console.log('Error details:', error);
      this.logger.error('Failed to get subscriptions from database', error);
      throw new BadRequestException('Failed to get subscriptions from database');
    }
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    try {
      console.log('=== BILLING SERVICE WEBHOOK DEBUG ===');
      const webhookSecret = this.configService.get<string>('stripe.webhookSecret');
      console.log('Webhook secret configured:', !!webhookSecret);
      console.log('Webhook secret value:', webhookSecret?.substring(0, 10) + '...');
      
      if (!webhookSecret) {
        throw new Error('Stripe webhook secret is not configured');
      }

      // Verify webhook signature
      console.log('Constructing event from webhook...');
      const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      
      console.log(`🔔 WEBHOOK EVENT RECEIVED: ${event.type}`);
      console.log('Event ID:', event.id);
      console.log('Event data object type:', event.data.object.object);
      console.log('Event created:', new Date(event.created * 1000).toISOString());
      console.log('Full event data:', JSON.stringify(event.data, null, 2));

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          console.log('Processing subscription event...');
          await this.handleSubscriptionEvent(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          console.log('Processing subscription deleted event...');
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.payment_succeeded':
          console.log('Processing payment succeeded event...');
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          console.log('Processing payment failed event...');
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'checkout.session.completed':
          console.log('Processing checkout completed event...');
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'customer.subscription.trial_will_end':
          console.log('Processing trial will end event...');
          await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.upcoming':
          console.log('Processing upcoming invoice event...');
          await this.handleUpcomingInvoice(event.data.object as Stripe.Invoice);
          break;
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      console.log('=== WEBHOOK PROCESSING COMPLETE ===');
      return { received: true };
    } catch (error) {
      console.log('=== WEBHOOK ERROR ===');
      console.log('Error details:', error);
      this.logger.error('Webhook signature verification failed', error);
      throw new BadRequestException('Webhook signature verification failed');
    }
  }

  private async handleSubscriptionEvent(subscription: Stripe.Subscription) {
    try {
      console.log('=== SUBSCRIPTION EVENT HANDLER ===');
      console.log('Subscription ID:', subscription.id);
      console.log('Subscription metadata:', subscription.metadata);
      console.log('Customer ID:', subscription.customer);
      
      const supabase = this.databaseService.getClient();

      // Get org_id from subscription metadata
      const orgId = subscription.metadata?.org_id;
      console.log('Extracted org_id from metadata:', orgId);
      
      if (!orgId) {
        console.log('ERROR: No org_id found in subscription metadata');
        this.logger.error('No org_id found in subscription metadata', { subscriptionId: subscription.id });
        return;
      }

      const subscriptionData = {
        org_id: orgId,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0]?.price.id,
        status: subscription.status,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      console.log('Subscription data to upsert:', subscriptionData);

      // Upsert subscription
      const { error } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'stripe_subscription_id',
        });

      if (error) {
        console.log('Database upsert error:', error);
        this.logger.error('Failed to upsert subscription', error);
        throw error;
      }

      console.log('Successfully upserted subscription to database');
      this.logger.log(`Successfully processed subscription: ${subscription.id}`);
      console.log('=== SUBSCRIPTION EVENT HANDLER COMPLETE ===');
    } catch (error) {
      console.log('=== SUBSCRIPTION EVENT HANDLER ERROR ===');
      console.log('Error details:', error);
      this.logger.error('Failed to handle subscription event', error);
      throw error;
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    try {
      const supabase = this.databaseService.getClient();

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        this.logger.error('Failed to update deleted subscription', error);
        throw error;
      }

      this.logger.log(`Successfully marked subscription as deleted: ${subscription.id}`);
    } catch (error) {
      this.logger.error('Failed to handle subscription deletion', error);
      throw error;
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    try {
      console.log('=== PAYMENT SUCCEEDED HANDLER ===');
      console.log('Invoice ID:', invoice.id);
      console.log('Invoice subscription:', (invoice as any).subscription);
      console.log('Invoice customer:', invoice.customer);
      console.log('Invoice customer_email:', (invoice as any).customer_email);
      console.log('Full invoice object keys:', Object.keys(invoice));
      
      this.logger.debug('Received payment succeeded event', { invoiceId: invoice.id });
      
      // Update subscription status if needed
      if ((invoice as any).subscription) {
        console.log('Retrieving subscription:', (invoice as any).subscription);
        const subscription = await this.stripe.subscriptions.retrieve((invoice as any).subscription as string);
        console.log('Retrieved subscription ID:', subscription.id);
        console.log('Subscription metadata:', subscription.metadata);
        await this.handleSubscriptionEvent(subscription);
      } else {
        console.log('No subscription found in invoice - attempting fallback');
        
        // Fallback: Try to find subscriptions for this customer
        if (invoice.customer) {
          console.log('Searching for customer subscriptions...');
          const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer.id;
          
          try {
            const subscriptions = await this.stripe.subscriptions.list({
              customer: customerId,
              status: 'active',
              limit: 10,
            });
            
            console.log(`Found ${subscriptions.data.length} active subscriptions for customer`);
            
            // Process each subscription found
            for (const subscription of subscriptions.data) {
              console.log(`Processing fallback subscription: ${subscription.id}`);
              console.log('Subscription metadata:', subscription.metadata);
              await this.handleSubscriptionEvent(subscription);
            }
          } catch (fallbackError) {
            console.log('Fallback subscription retrieval failed:', fallbackError);
          }
        }
      }

      this.logger.log(`Payment succeeded for invoice: ${invoice.id}`);
      console.log('=== PAYMENT SUCCEEDED HANDLER COMPLETE ===');
    } catch (error) {
      console.log('=== PAYMENT SUCCEEDED HANDLER ERROR ===');
      console.log('Error details:', error);
      this.logger.error('Failed to handle payment succeeded event', error);
      throw error;
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    try {
      this.logger.warn('Payment failed', { invoiceId: invoice.id });
      
      // Update subscription status if needed
      if ((invoice as any).subscription) {
        const subscription = await this.stripe.subscriptions.retrieve((invoice as any).subscription as string);
        await this.handleSubscriptionEvent(subscription);
      }

      // TODO: Send notification to user about failed payment
      this.logger.log(`Payment failed for invoice: ${invoice.id}`);
    } catch (error) {
      this.logger.error('Failed to handle payment failed event', error);
      throw error;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    try {
      this.logger.log('Checkout session completed', { sessionId: session.id });
      
      // If this is a subscription checkout, the subscription will be handled by subscription.created event
      // This handler can be used for one-time payments or additional processing
      
      this.logger.log(`Checkout completed for session: ${session.id}`);
    } catch (error) {
      this.logger.error('Failed to handle checkout completed event', error);
      throw error;
    }
  }

  private async handleTrialWillEnd(subscription: Stripe.Subscription) {
    try {
      this.logger.log('Trial will end soon', { subscriptionId: subscription.id });
      
      // TODO: Send notification to user about trial ending
      // TODO: Update subscription status if needed
      
      this.logger.log(`Trial will end for subscription: ${subscription.id}`);
    } catch (error) {
      this.logger.error('Failed to handle trial will end event', error);
      throw error;
    }
  }

  private async handleUpcomingInvoice(invoice: Stripe.Invoice) {
    try {
      this.logger.log('Upcoming invoice', { invoiceId: invoice.id });
      
      // TODO: Send notification to user about upcoming invoice
      // TODO: Update any necessary billing information
      
      this.logger.log(`Upcoming invoice: ${invoice.id}`);
    } catch (error) {
      this.logger.error('Failed to handle upcoming invoice event', error);
      throw error;
    }
  }
}