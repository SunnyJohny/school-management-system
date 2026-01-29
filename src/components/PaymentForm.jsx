import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentPurpose, setPaymentPurpose] = useState('');
  const [errors, setErrors] = useState({
    amount: '',
    purpose: '',
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);

    // Validate payment amount and purpose
    let valid = true;
    const newErrors = { amount: '', purpose: '' };

    if (!paymentAmount) {
      newErrors.amount = 'Please enter payment amount.';
      valid = false;
    }

    if (!paymentPurpose) {
      newErrors.purpose = 'Please enter payment purpose.';
      valid = false;
    }

    setErrors(newErrors);

    if (!valid) {
      return;
    }

    const { token, error } = await stripe.createToken(cardElement);

    // Handle token or error (send token to your server for processing)
    if (error) {
      // Handle error
    } else {
      console.log('Token:', token);
      console.log('Payment Amount:', paymentAmount);
      console.log('Payment Purpose:', paymentPurpose);

      // Send the token, payment amount, and purpose to your server for payment processing
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="card-element">
          Card Details
        </label>
        <div className="border p-2 rounded">
          <CardElement
            id="card-element"
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="payment-amount">
          Payment Amount
        </label>
        <input
          type="number"
          id="payment-amount"
          className={`border p-2 rounded w-full ${errors.amount && 'border-red-500'}`}
          value={paymentAmount}
          onChange={(e) => {
            setPaymentAmount(e.target.value);
            setErrors({ ...errors, amount: '' });
          }}
          required
        />
        {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="payment-purpose">
          Payment Purpose
        </label>
        <input
          type="text"
          id="payment-purpose"
          className={`border p-2 rounded w-full ${errors.purpose && 'border-red-500'}`}
          value={paymentPurpose}
          onChange={(e) => {
            setPaymentPurpose(e.target.value);
            setErrors({ ...errors, purpose: '' });
          }}
          required
        />
        {errors.purpose && <p className="text-red-500 text-sm">{errors.purpose}</p>}
      </div>

      <button
        type="submit"
        className="bg-blue-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline-blue active:bg-blue-800 w-full"
      >
        Pay Now
      </button>
    </form>
  );
};

export default PaymentForm;
