using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Stripe;

namespace dotnet.Controllers
{
    public class BillingController : Controller
    {
        // Stores Stripe configuration options (like API keys)
        private readonly IOptions<StripeOptions> options;

        // Constructor that injects Stripe configuration
        public BillingController(IOptions<StripeOptions> options)
        {
            this.options = options;
            // Set the Stripe API key from configuration
            StripeConfiguration.ApiKey = options.Value.SecretKey;
        }

        // Endpoint to get Stripe configuration (publishable key and product prices)
        [HttpGet("config")]
        public ActionResult<ConfigResponse> GetConfig()
        {
            // Create options to look up specific prices by their lookup keys
            var options = new PriceListOptions
            {
              LookupKeys = new List<string>
              {
                "tier1_basic",
                "tier2_premium"
              }
            };
            var service = new PriceService();
            var prices = service.List(options);

            // Return configuration including publishable key and price information
            return new ConfigResponse
            {
                PublishableKey = this.options.Value.PublishableKey,
                Prices = prices.Data
            };
        }

        // Endpoint to create a new Stripe customer
        [HttpPost("create-customer")]
        public ActionResult<CreateCustomerResponse> CreateCustomer([FromBody] CreateCustomerRequest req)
        {
            // Set up customer creation options with name and email
            var options = new CustomerCreateOptions
            {
                Email = req.Email,
                Name = req.Name
            };
            var service = new CustomerService();
            var customer = service.Create(options);

            // Store customer ID in a cookie to simulate authentication
            // In a real app, you'd store this in your database with the user
            HttpContext.Response.Cookies.Append("customer", customer.Id);

            return new CreateCustomerResponse
            {
                Customer = customer,
            };
        }

        // Endpoint to create a new subscription
        [HttpPost("create-subscription")]
        public ActionResult<SubscriptionCreateResponse> CreateSubscription([FromBody] CreateSubscriptionRequest req)
        {
            // Get customer ID from cookie
            var customerId = HttpContext.Request.Cookies["customer"];

            // Set up subscription options
            var subscriptionOptions = new SubscriptionCreateOptions
            {
                Customer = customerId,
                Items = new List<SubscriptionItemOptions>
                {
                    new SubscriptionItemOptions
                    {
                        Price = req.PriceId, // The price ID to subscribe to
                    },
                },
                PaymentBehavior = "default_incomplete", // Requires payment immediately
            };
            // Expand related objects to get payment intent details
            subscriptionOptions.AddExpand("latest_invoice.payment_intent");
            var subscriptionService = new SubscriptionService();
            try
            {
                Subscription subscription = subscriptionService.Create(subscriptionOptions);

                // Return subscription ID and client secret for Stripe Elements/Checkout
                return new SubscriptionCreateResponse
                {
                  SubscriptionId = subscription.Id,
                  ClientSecret = subscription.LatestInvoice.PaymentIntent.ClientSecret,
                };
            }
            catch (StripeException e)
            {
                Console.WriteLine($"Failed to create subscription.{e}");
                return BadRequest();
            }
        }

        // Endpoint to preview an invoice for a subscription change
        [HttpGet("invoice-preview")]
        public ActionResult<InvoiceResponse> InvoicePreview(string subscriptionId, string newPriceLookupKey)
        {
            var customerId = HttpContext.Request.Cookies["customer"];
            var service = new SubscriptionService();
            var subscription = service.Get(subscriptionId);

            // Set up options to preview upcoming invoice with price change
            var invoiceService = new InvoiceService();
            var options = new UpcomingInvoiceOptions
            {
                Customer = customerId,
                Subscription = subscriptionId,
                SubscriptionItems = new List<InvoiceSubscriptionItemOptions>
                {
                    new InvoiceSubscriptionItemOptions
                    {
                        Id = subscription.Items.Data[0].Id,
                        Price = Environment.GetEnvironmentVariable(newPriceLookupKey.ToUpper()),
                    },
                }
            };
            Invoice upcoming = invoiceService.Upcoming(options);
            return new InvoiceResponse{
              Invoice = upcoming,
            };
        }

        // Endpoint to cancel a subscription
        [HttpPost("cancel-subscription")]
        public ActionResult<SubscriptionResponse> CancelSubscription([FromBody] CancelSubscriptionRequest req)
        {
            var service = new SubscriptionService();
            // Immediately cancel the subscription
            var subscription = service.Cancel(req.Subscription, null);
            return new SubscriptionResponse
            {
              Subscription = subscription,
            };
        }

        // Endpoint to update a subscription
        [HttpPost("update-subscription")]
        public ActionResult<SubscriptionResponse> UpdateSubscription([FromBody] UpdateSubscriptionRequest req)
        {
            var service = new SubscriptionService();
            var subscription = service.Get(req.Subscription);

            // Set up subscription update options with new price
            var options = new SubscriptionUpdateOptions
            {
                CancelAtPeriodEnd = false,
                Items = new List<SubscriptionItemOptions>
                {
                    new SubscriptionItemOptions
                    {
                        Id = subscription.Items.Data[0].Id,
                        Price = Environment.GetEnvironmentVariable(req.NewPrice.ToUpper()),
                    }
                }
            };
            var updatedSubscription = service.Update(req.Subscription, options);
            return new SubscriptionResponse
            {
              Subscription = updatedSubscription,
            };
        }

        // Endpoint to list all subscriptions for the current customer
        [HttpGet("subscriptions")]
        public ActionResult<SubscriptionsResponse> ListSubscriptions()
        {
            var customerId = HttpContext.Request.Cookies["customer"];
            var options = new SubscriptionListOptions
            {
                Customer = customerId,
                Status = "all", // Include all statuses (active, past_due, canceled, etc.)
            };
            // Include payment method details in the response
            options.AddExpand("data.default_payment_method");
            var service = new SubscriptionService();
            var subscriptions = service.List(options);

            return new SubscriptionsResponse{
              Subscriptions = subscriptions,
            };
        }

        // Stripe webhook endpoint to handle asynchronous events
        [HttpPost("webhook")]
        public async Task<IActionResult> Webhook()
        {
            // Read the request body
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
            Event stripeEvent;
            try
            {
                // Validate the webhook signature
                stripeEvent = EventUtility.ConstructEvent(
                    json,
                    Request.Headers["Stripe-Signature"],
                    this.options.Value.WebhookSecret
                );
                Console.WriteLine($"Webhook notification with type: {stripeEvent.Type} found for {stripeEvent.Id}");
            }
            catch (Exception e)
            {
                Console.WriteLine($"Something failed {e}");
                return BadRequest();
            }

            // Handle different webhook event types
            if (stripeEvent.Type == "invoice.payment_succeeded") {
              var invoice = stripeEvent.Data.Object as Invoice;

              // Special case for when subscription is first created
              if(invoice.BillingReason == "subscription_create") {
                var service = new PaymentIntentService();
                var paymentIntent = service.Get(invoice.PaymentIntentId);

                // Set the default payment method for the subscription
                var options = new SubscriptionUpdateOptions
                {
                  DefaultPaymentMethod = paymentIntent.PaymentMethodId,
                };
                var subscriptionService = new SubscriptionService();
                subscriptionService.Update(invoice.SubscriptionId, options);

                Console.WriteLine($"Default payment method set for subscription: {paymentIntent.PaymentMethodId}");
              }
              Console.WriteLine($"Payment succeeded for invoice: {stripeEvent.Id}");
            }

            if (stripeEvent.Type == "invoice.paid")
            {
                // Handle successful payment (provision services, update database, etc.)
            }
            if (stripeEvent.Type == "invoice.payment_failed")
            {
                // Handle failed payment (notify user, retry logic, etc.)
            }
            if (stripeEvent.Type == "invoice.finalized")
            {
                // Handle finalized invoices (store locally, send to user, etc.)
            }
            if (stripeEvent.Type == "customer.subscription.deleted")
            {
                // Handle subscription cancellation (clean up resources, etc.)
            }
            if (stripeEvent.Type == "customer.subscription.trial_will_end")
            {
                // Notify user their trial is ending soon
            }

            return Ok();
        }
    }
}