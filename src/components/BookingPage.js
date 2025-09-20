// src/components/BookingPage.js
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { FaClock, FaCheckCircle } from 'react-icons/fa';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import './BookingPage.css';

const containerStyle = {
  width: '100%',
  height: '250px'
};

const defaultCenter = {
  lat: 28.7041, // Default to a central location like Delhi
  lng: 77.1025
};

function BookingPage({ isLoggedIn }) {
  const [parkingSlots, setParkingSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [bookingTimer, setBookingTimer] = useState(0);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const city = searchParams.get('city');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyAEyr4YAdlmpMkhzWrxakXcm9lRKikeISI" // ⚠️ Replace with your actual API key
  });

  // Timer for booking confirmation (e.g., 5 minutes)
  useEffect(() => {
    let timer;
    if (selectedSlotId) {
      setBookingTimer(300); // 5 minutes in seconds
      timer = setInterval(() => {
        setBookingTimer(prevTime => {
          if (prevTime <= 1) {
            setSelectedSlotId(null);
            clearInterval(timer);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [selectedSlotId]);

  // Fetch parking slots from the backend server
  useEffect(() => {
    const fetchSlots = async () => {
      if (city) {
        try {
          const response = await fetch(`http://localhost:5000/slots/${city}`);
          if (!response.ok) {
            throw new Error("Failed to fetch slots");
          }
          const data = await response.json();
          setParkingSlots(data);
          
          // Set the map center to the first slot's location if data exists
          if (data.length > 0) {
            setMapCenter({ lat: data[0].lat, lng: data[0].lng });
          }
        } catch (error) {
          console.error("Error fetching slots:", error);
        }
      }
    };
    fetchSlots();
  }, [city]);

  const handleBookSlot = async (slotId) => {
    if (!isLoggedIn) {
      alert("Please log in to book a parking slot.");
      navigate("/login");
      return;
    }

    // Prompt for parking hours and validate input
    const parkingHours = prompt("How many hours will you be parking?");
    if (!parkingHours || isNaN(parkingHours) || parseInt(parkingHours) <= 0) {
      alert("Please enter a valid number of hours.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/book/${slotId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: 1, parkingHours: parseInt(parkingHours) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      // Find the selected slot to get its details
      const selectedSlot = parkingSlots.find(slot => slot.id === slotId);

      // Navigate to the pricing page with state
      navigate('/pricing', { 
        state: { 
          city: city, 
          slotNumber: selectedSlot.slot_number, 
          hours: parseInt(parkingHours) 
        } 
      });

      setSelectedSlotId(null);

    } catch (error) {
      alert(`Booking failed: ${error.message}`);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const selectedSlot = parkingSlots.find(slot => slot.id === selectedSlotId);

  return (
    <div className="booking-page-container">
      <header className="navbar booking-navbar">
        <h1 className="navbar-logo">QuickPark</h1>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/reviews">Reviews</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </header>

      <section className="booking-content">
        <div className="slot-list-section">
          <h2>Available Slots in {city}</h2>
          <div className="map-container">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={mapCenter}
                zoom={14}
              >
                {parkingSlots.map(slot => (
                  <Marker
                    key={slot.id}
                    position={{ lat: slot.lat, lng: slot.lng }}
                    title={`Slot ${slot.slot_number}`}
                  />
                ))}
              </GoogleMap>
            ) : (
              <div className="map-loading-placeholder">
                <p>Loading map...</p>
              </div>
            )}
          </div>
          <div className="slots-grid">
            {parkingSlots.length > 0 ? (
              parkingSlots.map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                return (
                  <div key={slot.id} className={`slot-card ${slot.is_booked ? 'booked' : 'available'} ${isSelected ? 'selected' : ''}`}>
                    <span className="slot-number">Slot {slot.slot_number}</span>
                    <span className="slot-status">
                      {slot.is_booked ? `Booked by: ${slot.booked_by_username || 'User'}` : 'Available'}
                    </span>
                    {!slot.is_booked && !isSelected && (
                      <button className="select-btn" onClick={() => setSelectedSlotId(slot.id)}>Select</button>
                    )}
                  </div>
                );
              })
            ) : (
              <p>No slots found for this location.</p>
            )}
          </div>
        </div>
        
        <div className="booking-summary-section">
          <h2>Booking Summary</h2>
          {selectedSlot ? (
            <div className="summary-card">
              <div className="summary-info">
                <h3>Selected Slot: {selectedSlot.slot_number}</h3>
                <p>Location: {selectedSlot.area}</p>
                <div className="timer">
                  <FaClock />
                  <p>Time remaining to confirm: {formatTime(bookingTimer)}</p>
                </div>
              </div>
              <button className="confirm-btn" onClick={() => handleBookSlot(selectedSlot.id)}>
                <FaCheckCircle /> Confirm Booking
              </button>
            </div>
          ) : (
            <div className="no-selection-card">
              <p>Please select a slot from the list to book.</p>
            </div>
          )}
        </div>
      </section>
      
      <footer className="footer">
        <p>© 2025 QuickPark. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default BookingPage;