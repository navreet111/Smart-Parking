import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaClock,
  FaSearch,
  FaCheckCircle,
  FaCreditCard,
  FaStar,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import '../App.css'; 

function HomePage({ isLoggedIn, setIsLoggedIn }) {
  const [showDialog, setShowDialog] = useState(false);
  const [location, setLocation] = useState("");
  const [bookingTime, setBookingTime] = useState(new Date());
  const navigate = useNavigate();

  const mainCities = [
    "Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad", "Chandigarh",
  ];

  const handleFindClick = () => {
    if (location) {
        if (isLoggedIn) {
            navigate(`/booking?city=${location}`);
        } else {
            localStorage.setItem('redirectAfterLogin', `/booking?city=${location}`);
            navigate('/login');
        }
    } else {
        alert("Please select a location.");
    }
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await res.json();
            const city =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.state_district ||
              "Location not found";
            setLocation(city);
          } catch (error) {
            setLocation("Error detecting location");
          }
          setShowDialog(false);
        },
        () => {
          alert("Could not access location. Please enable GPS.");
        }
      );
    } else {
      alert("Geolocation not supported by your browser.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <div className="app">
      <header className="navbar">
        <h1 className="navbar-logo">QuickPark</h1>
        <nav>
          <a href="#home">Home</a>
          <a href="/About">About</a>
          <a href="#reviews">Reviews</a>
          <a href="/pricing">Pricing</a>
          <a href="/contact">Contact</a>
        </nav>
        {isLoggedIn ? (
          <button className="btn-primary" onClick={handleLogout}>Logout</button>
        ) : (
          <Link to="/Login" className="btn-primary">Login</Link>
        )}
      </header>
      
      <section className="main" style={{ backgroundImage: "url('https://i.pinimg.com/1200x/9b/6a/33/9b6a33edf2c092bac6b018888d5cd7a1.jpg')" }}>
        <div className="main-content">
          <h2>Find & Book Parking in Seconds</h2>
          <p>Check real-time availability and reserve your spot hassle-free.</p>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Enter location"
              value={location}
              readOnly
              onClick={() => setShowDialog(true)}
            />
            <DatePicker
              selected={bookingTime}
              onChange={(date) => setBookingTime(date)}
              showTimeSelect
              dateFormat="Pp"
              placeholderText="Select date and time"
            />
            <button className="btn-success" onClick={handleFindClick}>Find</button>
          </div>
        </div>
      </section>

      {showDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h3>Select Location</h3>
            <button className="btn-primary" onClick={detectLocation}>Detect My Location</button>
            <h4>Or choose a city:</h4>
            <ul className="city-list">
              {mainCities.map((city, idx) => (
                <li key={idx}>
                  <button className="city-btn" onClick={() => { setLocation(city); setShowDialog(false); }}>{city}</button>
                </li>
              ))}
            </ul>
            <button className="btn-secondary" onClick={() => setShowDialog(false)}>Cancel</button>
          </div>
        </div>
      )}

      <section className="section how-it-works">
        <h3>How It Works</h3>
        <div className="grid">
          <div className="card">
            <FaMapMarkerAlt className="icon green" />
            <h4>Find Your Spot</h4>
            <p>Easily locate available parking spaces in your area using our live map.</p>
          </div>
          <div className="card">
            <FaCreditCard className="icon green" />
            <h4>Book Securely</h4>
            <p>Reserve your spot instantly with our secure, in-app payment system.</p>
          </div>
          <div className="card">
            <FaCheckCircle className="icon green" />
            <h4>Park with Ease</h4>
            <p>Navigate to your reserved spot and park with a quick scan or code.</p>
          </div>
        </div>
      </section>

      {/* <section className="section light">
        <h3>Benefits</h3>
        <div className="grid">
          {[
            { icon: <FaClock />, text: "Save Time" },
            { icon: <FaSearch />, text: "Real-Time Updates" },
            { icon: <FaCreditCard />, text: "Secure Payments" },
            { icon: <FaCheckCircle />, text: "24/7 Availability" },
          ].map((b, i) => (
            <div key={i} className="card">
              <div className="icon green">{b.icon}</div>
              <p>{b.text}</p>
            </div>
          ))}
        </div>
      </section> */}

      <section className="section" id="reviews">
        <h3>User Reviews</h3>
        <div className="grid">
          {[
            { name: "Rahul Kumar", rating: 3, review: "Super easy to book!" },
            { name: "Sarah Johnson", rating: 4, review: "Very convenient and affordable." },
            { name: "Vishal Lalotra", rating: 5, review: "Loved the real-time updates!" },
          ].map((r, i) => (
            <div key={i} className="card">
              <h4>{r.name}</h4>
              <div className="stars">
                {[...Array(r.rating)].map((_, idx) => (
                  <FaStar key={idx} />
                ))}
              </div>
              <p>{r.review}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <p>© 2025 SmartPark. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default HomePage;