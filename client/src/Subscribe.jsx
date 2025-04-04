import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useLocation, useNavigate } from 'react-router-dom';
import './Subscribe.css';

const Subscribe = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const clientSecret = state?.clientSecret;
  const customerName = state?.customerName || 'Customer\'s Name';

  const [name, setName] = useState(customerName);
  const [address, setAddress] = useState({
    line1: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'In'
  });
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const stripe = useStripe();
  const elements = useElements();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('address.')) {
      const field = name.split('.')[1];
      setAddress(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      setName(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setError('Stripe is not initialized');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: name,
            address: {
              line1: address.line1,
              city: address.city,
              state: address.state,
              postal_code: address.postal_code,
              country: address.country,
            }
          }
        }
      });

      // After successful payment
      // const response = await fetch("/subscription-details");
      // const data = await response.json();
      // console.log("Subscription Details:", data);


      if (stripeError) throw stripeError;
      navigate('/account');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!stripe || !elements) {
    return <div className="loading-container">Loading payment form...</div>;
  }

  const cardElementOptions = {
    style: {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    }
  };

  return (
    <div className="subscribe-container">
      <div className="subscribe-card">
        <div className="card-header">
          <h1>Subscribe to Premium</h1>
          <p className="subtitle">Complete your payment information below</p>
        </div>

        <div className="test-card-info">
          <h3>Test Card Information</h3>
          <p>India: <span className="test-card-number">4000 0035 6000 0008</span></p>
          <p>Japan: <span className="test-card-number">4000 0039 2000 0003</span></p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Billing Information</h3>
            
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="address-line1">Address Line 1</label>
                <input
                  type="text"
                  id="address-line1"
                  name="address.line1"
                  value={address.line1}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="address-city">City</label>
                <input
                  type="text"
                  id="address-city"
                  name="address.city"
                  value={address.city}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="address-state">State</label>
                <input
                  type="text"
                  id="address-state"
                  name="address.state"
                  value={address.state}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="address-postal-code">Postal Code</label>
                <input
                  type="text"
                  id="address-postal-code"
                  name="address.postal_code"
                  value={address.postal_code}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="address-country">Country</label>
                <input
                  type="text"
                  id="address-country"
                  name="address.country"
                  value={address.country}
                  onChange={handleChange}
                  placeholder="IN"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Payment Details</h3>
            <div className="card-element-container">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {error && (
            <div className="error-messages">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-button" 
            disabled={isProcessing || !stripe}
          >
            {isProcessing ? 'Processing...' : 'Subscribe Now'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Subscribe;