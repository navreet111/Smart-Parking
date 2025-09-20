import React, { useState, useEffect } from 'react';
import { Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage.js";
import Login from "./components/Login.js";
import Register from "./components/Register.js";
import "./App.css";
// import MapPage from "./components/MapPage.js";
import BookingPage from "./components/BookingPage.js";
import Contact from "./components/Contact.js";
import About from "./components/About.js";
import PricingPage from "./components/PricingPage.js";

export default function App() {
  
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('isLoggedIn') === 'true'
  );

  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn);
  }, [isLoggedIn]);

  return (
    <Routes>
      <Route path="/" element={<HomePage isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
      <Route path="/Login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
           <Route path="/booking" element={<BookingPage isLoggedIn={isLoggedIn} />} />
               <Route path="/contact" element={<Contact />} />
                   <Route path="/about" element={<About />} />
                      <Route path="/register" element={<Register />} />
                        <Route path="/pricing" element={<PricingPage />} />
           
    </Routes>
  );
}