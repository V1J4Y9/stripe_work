import React, { useState } from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const Register = () => {
  const [email, setEmail] = useState('jojo@example.com');
  const [customerName, setCustomerName] = useState('Joseph Joestar');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('api/create-customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        name: customerName
      }),
    }).then(r => r.json());

    navigate('/prices', { 
      state: { 
        customerName: customerName 
      },
      replace: false 
    });
  };

  return (
    <div>

    {/* <stripe-pricing-table pricing-table-id="prctbl_1R9Ne0SAXnM1xqlcj6dkjoGv"
    publishable-key="pk_test_51OIVawSAXnM1xqlcSlqelgZSH6WsLxuVZukx70kmroXBysespuTqpqrPyrK9jtoQoYv1kQRGqEuYYmgsopkM3j1F00LHNHtzOR">
    </stripe-pricing-table> */}
      <h1>Data previously obtained</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Full Name
          <input
            type="text"
            name="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
        </label>
        <button className='register-button' type="submit">
          Register
        </button>
      </form>
    </div>
  );
}

export default Register;