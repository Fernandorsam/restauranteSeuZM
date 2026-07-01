// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import AOS from "aos";
import "aos/dist/aos.css";
import "./styles/globals.css";

// Context
import { AuthProvider } from "./context/AuthContext.jsx";

// Componentes
import Navbar from "./components/Navbar/Navbar.js";
import Footer from "./components/Footer/Footer.js";
// import Loading from "./components/Loading/Loading.js";

// Páginas
import Home from "./pages/Home.js";
// import MenuPage from "./pages/MenuPage.js";
// import ReservationPage from "./pages/ReservationPage.js";
import Login from "./pages/Login.js";
// import Register from "./pages/Register.js";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
    });

    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  if (loading) {
    // return <Loading />;
  }

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              {/* <Route path="/menu" element={<MenuPage />} /> */}
              {/* <Route path="/reservas" element={<ReservationPage />} /> */}
              <Route path="/login" element={<Login />} />
              {/* <Route path="/registro" element={<Register />} /> */}
            </Routes>
          </AnimatePresence>
          <Footer />
        </div>
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;