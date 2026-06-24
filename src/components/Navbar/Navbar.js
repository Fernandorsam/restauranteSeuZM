// components/Navbar/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './Navbar.css';
import { useAuth } from '../../context/AuthContext.jsx';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-top">
        <div className="container">
          <div className="contact-info">
            <span>
              <FaPhone /> (61) 99999-9999
            </span>
            <span>
              <FaMapMarkerAlt /> Recanto das Emas - DF
            </span>
          </div>
        </div>
      </div>
      
      <div className="navbar-main">
        <div className="container">
          <Link to="/" className="logo" onClick={closeMenu}>
            <motion.h1
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              Seu Zé <span>&</span> Seu Mané
            </motion.h1>
          </Link>

          <div className={`nav-menu ${isOpen ? 'active' : ''}`}>
            <ul>
              <li>
                <Link 
                  to="/" 
                  className={location.pathname === '/' ? 'active' : ''}
                  onClick={closeMenu}
                >
                  Home
                </Link>
              </li>
              <li>
                <a 
                  href="#menu" 
                  className={location.hash === '#menu' ? 'active' : ''}
                  onClick={closeMenu}
                >
                  Cardápio
                </a>
              </li>
              <li>
                <a 
                  href="#about" 
                  onClick={closeMenu}
                >
                  Sobre Nós
                </a>
              </li>
              <li>
                <a 
                  href="#gallery" 
                  onClick={closeMenu}
                >
                  Galeria
                </a>
              </li>
              <li>
                <Link 
                  to="/reservas" 
                  className={location.pathname === '/reservas' ? 'active' : ''}
                  onClick={closeMenu}
                >
                  Reservas
                </Link>
              </li>
              <li>
                <a 
                  href="#contact" 
                  onClick={closeMenu}
                >
                  Contato
                </a>
              </li>
            </ul>
            <Link to="/reservas" className="btn btn-primary mobile-reserve" onClick={closeMenu}>
              Reserve Agora
            </Link>
          </div>

          <div className="nav-actions">
  {user ? (
    <div className="user-menu">
      <span className="user-name">Olá, {user.name?.split(' ')[0]}</span>
      <button onClick={logout} className="btn btn-outline btn-sm">
        Sair
      </button>
    </div>
  ) : (
    <>
      <Link to="/login" className="btn btn-outline btn-sm">
        Entrar
      </Link>
      <Link to="/reservas" className="btn btn-primary desktop-reserve">
        Reserve Agora
      </Link>
    </>
  )}
</div>

          <div className="hamburger" onClick={toggleMenu}>
            {isOpen ? <FaTimes /> : <FaBars />}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;