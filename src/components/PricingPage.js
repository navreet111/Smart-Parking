// src/components/PricingPage.js

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PricingPage.css'; // Create this CSS file next

function PricingPage() {
  const [totalCost, setTotalCost] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve data from navigation state
  const { city, slotNumber, hours } = location.state || {};

  const hourlyRate = 20; 

  useEffect(() => {
    if (hours) {
      const cost = hours * hourlyRate;
      setTotalCost(cost);
    }
  }, [hours]);

  const handleConfirmPayment = () => {
    // Implement your payment gateway logic here
    alert(`Payment of ₹${totalCost} confirmed for slot ${slotNumber} in ${city}.`);
    navigate('/'); // Navigate back to the home page or a confirmation page
  };

  return (
    <div className="pricing-page-container">
      <div className="pricing-card">
        <h2>Parking Pricing</h2>
        <p>Our standard rate is **₹{hourlyRate} per hour**.</p>
        
        <div className="pricing-summary">
          <h3>Your Booking Summary</h3>
          {city && slotNumber && hours ? (
            <>
              <p>City: **{city}**</p>
              <p>Slot Number: **{slotNumber}**</p>
              <p>Parking Duration: **{hours} hours**</p>
              <p className="total-cost">Total Cost: **₹{totalCost}**</p>
              <button className="btn-pay" onClick={handleConfirmPayment}>Confirm & Pay</button>
            </>
          ) : (
            <p className="no-data">No booking details found. Please go back to the booking page to select a slot.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PricingPage;