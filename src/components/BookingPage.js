import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { FaClock, FaCheckCircle } from "react-icons/fa";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import "./BookingPage.css";

const containerStyle = { width: "100%", height: "250px" };
const defaultCenter = { lat: 28.7041, lng: 77.1025 };

function BookingPage({ isLoggedIn }) {
  const [parkingSlots, setParkingSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [bookingTimer, setBookingTimer] = useState(0);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const city = searchParams.get("city");

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY", // replace
  });

  // Timer
  useEffect(() => {
    let timer;
    if (selectedSlotId) {
      setBookingTimer(300);
      timer = setInterval(() => {
        setBookingTimer((prev) => {
          if (prev <= 1) {
            setSelectedSlotId(null);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [selectedSlotId]);

  // Fetch slots
  useEffect(() => {
    const fetchSlots = async () => {
      if (city) {
        try {
          const response = await fetch(`http://localhost:5000/slots/${city}`);
          if (!response.ok) throw new Error("Failed to fetch slots");
          const data = await response.json();
          setParkingSlots(data);
          if (data.length > 0) {
            setMapCenter({ lat: data[0].lat || 28.7041, lng: data[0].lng || 77.1025 });
          }
        } catch (err) {
          console.error("Error fetching slots:", err);
        }
      }
    };
    fetchSlots();
  }, [city]);

  // ✅ Booking handler
  const handleBookSlot = async (slotId) => {
    if (!isLoggedIn) {
      alert("Please log in to book a parking slot.");
      navigate("/login");
      return;
    }

    const parkingHours = prompt("How many hours will you be parking?");
    if (!parkingHours || isNaN(parkingHours) || parseInt(parkingHours) <= 0) {
      alert("Please enter a valid number of hours.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/book/${slotId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ parkingHours: parseInt(parkingHours) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      const selectedSlot = parkingSlots.find((slot) => slot.id === slotId);
      navigate("/pricing", {
        state: { city, slotNumber: selectedSlot.slot_number, hours: parseInt(parkingHours) },
      });
      setSelectedSlotId(null);
    } catch (err) {
      alert(`Booking failed: ${err.message}`);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? "0" : ""}${s % 60}`;
  const selectedSlot = parkingSlots.find((slot) => slot.id === selectedSlotId);

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
              <GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={14}>
                {parkingSlots.map((slot) => (
                  <Marker key={slot.id} position={{ lat: slot.lat || 28.7041, lng: slot.lng || 77.1025 }} title={`Slot ${slot.slot_number}`} />
                ))}
              </GoogleMap>
            ) : (
              <p>Loading map...</p>
            )}
          </div>

          <div className="slots-grid">
            {parkingSlots.length > 0 ? (
              parkingSlots.map((slot) => {
                const isSelected = selectedSlotId === slot.id;
                return (
                  <div key={slot.id} className={`slot-card ${slot.is_booked ? "booked" : "available"} ${isSelected ? "selected" : ""}`}>
                    <span className="slot-number">Slot {slot.slot_number}</span>
                    <span className="slot-status">
                      {slot.is_booked ? `Booked by: ${slot.booked_by_username || "User"}` : "Available"}
                    </span>
                    {!slot.is_booked && !isSelected && (
                      <button className="select-btn" onClick={() => setSelectedSlotId(slot.id)}>
                        Select
                      </button>
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
              <h3>Selected Slot: {selectedSlot.slot_number}</h3>
              <p>Location: {selectedSlot.area}</p>
              <div className="timer">
                <FaClock /> <p>Time remaining: {formatTime(bookingTimer)}</p>
              </div>
              <button className="confirm-btn" onClick={() => handleBookSlot(selectedSlot.id)}>
                <FaCheckCircle /> Confirm Booking
              </button>
            </div>
          ) : (
            <p>Please select a slot to book.</p>
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
