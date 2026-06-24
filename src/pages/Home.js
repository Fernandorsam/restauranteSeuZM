// pages/Home.js
import React from 'react';
import { motion } from 'framer-motion';
import Hero from '../components/Hero/Hero.js';
import Menu from '../components/Menu/Menu.js';
import About from '../components/About/About';
import Gallery from '../components/Gallery/Gallery.js';
// import Testimonials from '../components/Testimonials/Testimonials';
import Contact from '../components/Contact/Contact.js';

const Home = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Hero />
      <Menu />
      <About />
      <Gallery />
      {/* <Testimonials /> */}
      <Contact />
    </motion.div>
  );
};

export default Home;