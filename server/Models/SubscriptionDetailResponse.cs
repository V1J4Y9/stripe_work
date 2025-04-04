
    public class SubscriptionDetailsResponse
    {
        public string SubscriptionId { get; set; }  // Unique ID of the subscription
        public string PriceId { get; set; }         // Price associated with the subscription
        public string PlanName { get; set; }        // Name of the subscription plan
        public string Status { get; set; }          // Active, Canceled, etc.
        public decimal AmountPaid { get; set; }     // Amount paid for the subscription
        public string Currency { get; set; }        // Currency of the payment
        public string InvoiceId { get; set; }       // Invoice ID linked to this subscription
    }

