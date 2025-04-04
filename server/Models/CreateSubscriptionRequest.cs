using Newtonsoft.Json;

public class CreateSubscriptionRequest
{
    [JsonProperty("priceId")]
    public string PriceId { get; set; }
    
    [JsonProperty("customerId")]
    public string CustomerId { get; set; }
}