import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Account.css';

const AccountSubscription = ({subscription}) => {
  return (
    <section className="account-subscription">
      <hr />
      <h4>
        <a href={`https://dashboard.stripe.com/test/subscriptions/${subscription.id}`}>
          {subscription.id}
        </a>
      </h4>

      <p>
        Status: {subscription.status}
      </p>

      <p>
        Card last4: {subscription.default_payment_method?.card?.last4}
      </p>

      <p>
        Current period end: {(new Date(subscription.current_period_end * 1000).toString())}
      </p>

      <div className="account-actions">
        {/* <Link to={{pathname: '/change-plan', state: {subscription: subscription.id }}}>Change plan</Link> */}
        <Link to={'/cancel'} state={{subscription: subscription.id }}>Cancel</Link>
      </div>
    </section>
  )
}

const Account = () => {
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const {subscriptions} = await fetch('api/subscriptions').then(r => r.json());
      setSubscriptions(subscriptions.data);
    }
    fetchData();
  }, []);

  if (!subscriptions) {
    return '';
  }

  return (
    <div className="account-container">
      <h1>Payment Successful.</h1>
      <h2>Account</h2>

      <div className="account-actions">
        <Link to="/prices">Add a subscription</Link>
        <Link to="/">Restart demo</Link>
      </div>
          
      <h2>Current Subscriptions</h2>

      <div id="subscriptions">
        {subscriptions.map(s => {
          return <AccountSubscription key={s.id} subscription={s} />
        })}
      </div>
    </div>
  );
}

export default Account;