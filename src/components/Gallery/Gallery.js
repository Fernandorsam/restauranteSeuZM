// components/Gallery/Gallery.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const galleryImages = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    alt: 'Ambiente do restaurante',
    category: 'ambiente'
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
    alt: 'Área externa',
    category: 'ambiente'
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    alt: 'Prato especial',
    category: 'comida'
  },
  // Adicione mais imagens conforme necessário
];

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (image, index) => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    setSelectedImage(galleryImages[(currentIndex + 1) % galleryImages.length]);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    setSelectedImage(galleryImages[(currentIndex - 1 + galleryImages.length) % galleryImages.length]);
  };

  return (
    <section id="gallery" className="gallery section-padding">
      <div className="container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>Galeria de Fotos</h2>
          <p>Conheça nosso espaço e alguns dos nossos pratos</p>
        </motion.div>

        <motion.div 
          className="gallery-grid"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.1 }}
        >
          {galleryImages.map((image, index) => (
            <motion.div
              key={image.id}
              className="gallery-item"
              whileHover={{ scale: 1.05 }}
              onClick={() => openLightbox(image, index)}
              data-aos="zoom-in"
              data-aos-delay={index * 100}
            >
              <img src={image.src} alt={image.alt} />
              <div className="gallery-overlay">
                <span>{image.alt}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            className="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <button className="close-btn" onClick={closeLightbox}>
              <FaTimes />
            </button>
            <button className="nav-btn prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
              <FaChevronLeft />
            </button>
            <motion.img 
              src={selectedImage.src} 
              alt={selectedImage.alt}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            />
            <button className="nav-btn next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
              <FaChevronRight />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Gallery;