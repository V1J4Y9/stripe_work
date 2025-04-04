using Newtonsoft.Json;

public class AddressRequest
{
    [JsonProperty("line1")]
    public string Line1 { get; set; }
    
    [JsonProperty("city")]
    public string City { get; set; }
    
    [JsonProperty("state")] 
    public string State { get; set; }
    
    [JsonProperty("postal_code")]
    public string PostalCode { get; set; }
    
    [JsonProperty("country")]
    public string Country { get; set; }
}