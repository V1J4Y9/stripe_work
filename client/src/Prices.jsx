import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Prices.css";

const Prices = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [prices, setPrices] = useState([]);
  const customerName = location.state?.customerName || '';

  useEffect(() => {
    const fetchPrices = async () => {
      const { prices } = await fetch("api/config").then((r) => r.json());
      setPrices(prices);
    };
    fetchPrices();
  }, []);

  const createSubscription = async (priceId) => {
    const { subscriptionId, clientSecret } = await fetch(
      "api/create-subscription",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
        }),
      }
    ).then((r) => r.json());

    navigate("/subscribe", {
      state: {
        clientSecret,
        customerName, // Pass the name through to subscribe
        subscriptionId,
        from: location,
      },
      replace: false,
    });
  };

  console.log(prices);
  

  const getPlanDescription = (price) => {
    if (price.unit_amount === 10000) {
      return "Basic Plan: Some basic features";
    } else{
      return "Premium Plan: Advance features + all the stuff from Basic plan";
    }
  };

  const getPlanName = (price) => {
    if (price.lookup_key === "tier1_basic") {
      return "Basic Plan";
    } else{
      return "Premium Plan";
    }
  };

  return (
    <div className="prices-container">
      <h1>Select a Plan</h1>
      <div className="price-list">
        {prices.map((price) => (
          <div key={price.id} className="price-card">
            {/* <h3>{price.product.name}</h3> */}
            <h3>{getPlanName(price)}</h3>
            <p className="price-amount">₹{price.unit_amount/100}/{price.recurring.interval}</p>
            <p className="plan-description">{getPlanDescription(price)}</p>
            <button 
              className="select-button" 
              onClick={() => createSubscription(price.id)}
            >
              Select
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Prices;