// components/Footer/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaWhatsapp, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-section">
            <h3>Seu Zé & Seu Mané</h3>
            <p>
              O melhor da culinária brasileira em um ambiente familiar e acolhedor. 
              Venha nos fazer uma visita e experimentar nossos pratos deliciosos!
            </p>
            <div className="social-links">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <FaFacebook />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <FaInstagram />
              </a>
              <a href="https://wa.me/5561999999999" target="_blank" rel="noopener noreferrer">
                <FaWhatsapp />
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Links Rápidos</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><a href="#menu">Cardápio</a></li>
              <li><a href="#about">Sobre Nós</a></li>
              <li><a href="#gallery">Galeria</a></li>
              <li><Link to="/reservas">Reservas</Link></li>
              <li><a href="#contact">Contato</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Horário de Funcionamento</h4>
            <div className="opening-hours">
              <div className="hours-item">
                <span>Segunda - Quinta</span>
                <span>11:00 - 22:00</span>
              </div>
              <div className="hours-item">
                <span>Sexta - Sábado</span>
                <span>11:00 - 23:00</span>
              </div>
              <div className="hours-item">
                <span>Domingo</span>
                <span>11:00 - 22:00</span>
              </div>
            </div>
          </div>

          <div className="footer-section">
            <h4>Contato</h4>
            <div className="contact-info">
              <p><FaPhone /> (61) 99999-9999</p>
              <p><FaEnvelope /> contato@seuzeeseumane.com.br</p>
              <p><FaMapMarkerAlt /> Recanto das Emas, Brasília - DF</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Seu Zé & Seu Mané. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;