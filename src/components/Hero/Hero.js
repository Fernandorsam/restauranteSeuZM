// components/Hero/Hero.js
import React from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaUtensils, FaWineGlassAlt } from 'react-icons/fa';
import './Hero.css';

const Hero = () => {
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const stagger = {
    visible: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <section className="hero">
      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={true}
        className="hero-swiper"
      >
        <SwiperSlide>
          <div className="hero-slide slide-1">
            <div className="overlay"></div>
            <div className="container">
              <motion.div 
                className="hero-content"
                variants={stagger}
                initial="hidden"
                animate="visible"
              >
                <motion.p variants={fadeUp} className="hero-subtitle">
                  Bem-vindo ao
                </motion.p>
                <motion.h1 variants={fadeUp} className="hero-title">
                  Seu Zé & Seu Mané
                </motion.h1>
                <motion.p variants={fadeUp} className="hero-description">
                  O melhor da culinária brasileira com aquele tempero caseiro que só a gente tem. 
                  Ambiente familiar, comida de qualidade e atendimento nota 10!
                </motion.p>
                <motion.div variants={fadeUp} className="hero-buttons">
                  <Link to="/menu" className="btn btn-primary">
                    <FaUtensils /> Ver Cardápio
                  </Link>
                  <Link to="/reservas" className="btn btn-outline">
                    <FaWineGlassAlt /> Fazer Reserva
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </SwiperSlide>
        
        <SwiperSlide>
          <div className="hero-slide slide-2">
            <div className="overlay"></div>
            <div className="container">
              <motion.div 
                className="hero-content"
                variants={stagger}
                initial="hidden"
                animate="visible"
              >
                <motion.p variants={fadeUp} className="hero-subtitle">
                  Happy Hour
                </motion.p>
                <motion.h1 variants={fadeUp} className="hero-title">
                  Petiscos & Cerveja
                </motion.h1>
                <motion.p variants={fadeUp} className="hero-description">
                  De segunda a sexta, das 17h às 19h. Aproveite nossos petiscos especiais 
                  com a cerveja mais gelada da cidade!
                </motion.p>
                <motion.div variants={fadeUp} className="hero-buttons">
                  <Link to="/reservas" className="btn btn-primary">
                    <FaArrowRight /> Reservar Mesa
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
      
      <div className="hero-features">
        <div className="container">
          <div className="features-grid">
            <motion.div 
              className="feature-card"
              whileHover={{ scale: 1.05 }}
              data-aos="fade-up"
            >
              <div className="feature-icon">🕐</div>
              <h3>Horário de Funcionamento</h3>
              <p>Seg a Sex: 11h - 22h</p>
              <p>Sáb e Dom: 11h - 23h</p>
            </motion.div>
            
            <motion.div 
              className="feature-card"
              whileHover={{ scale: 1.05 }}
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <div className="feature-icon">📍</div>
              <h3>Localização</h3>
              <p>Recanto das Emas</p>
              <p>Brasília - DF</p>
            </motion.div>
            
            <motion.div 
              className="feature-card"
              whileHover={{ scale: 1.05 }}
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <div className="feature-icon">⭐</div>
              <h3>Avaliação</h3>
              <p>4.8 Estrelas</p>
              <p>Google Reviews</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;