// components/Menu/Menu.js
import React,{ useState} from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaHeart } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const menuItems = [
  {
    id: 1,
    category: 'petiscos',
    name: 'Bolinho de Bacalhau',
    description: 'Deliciosos bolinhos de bacalhau com catupiry',
    price: 'R$ 35,90',
    image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=500',
    popular: true,
    rating: 5
  },
  {
    id: 2,
    category: 'petiscos',
    name: 'Batata Frita Especial',
    description: 'Batata frita crocante com cheddar e bacon',
    price: 'R$ 28,90',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500',
    popular: true,
    rating: 4
  },
  {
    id: 3,
    category: 'pratos',
    name: 'Filé à Parmegiana',
    description: 'Filé mignon empanado com molho especial e queijo gratinado',
    price: 'R$ 59,90',
    image: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=500',
    popular: true,
    rating: 5
  },
  {
    id: 4,
    category: 'pratos',
    name: 'Feijoada Completa',
    description: 'Feijoada tradicional com todas as carnes e acompanhamentos',
    price: 'R$ 69,90',
    image: 'https://images.unsplash.com/photo-1565608087341-404b25492c5e?w=500',
    popular: false,
    rating: 5
  },
  {
    id: 5,
    category: 'bebidas',
    name: 'Caipirinha Especial',
    description: 'Caipirinha de limão com cachaça premium',
    price: 'R$ 19,90',
    image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=500',
    popular: true,
    rating: 5
  },
  {
    id: 6,
    category: 'bebidas',
    name: 'Suco Natural',
    description: 'Sucos naturais da fruta',
    price: 'R$ 12,90',
    image: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=500',
    popular: false,
    rating: 4
  },
  {
    id: 7,
    category: 'sobremesas',
    name: 'Pudim de Leite',
    description: 'Pudim de leite condensado caseiro',
    price: 'R$ 18,90',
    image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=500',
    popular: true,
    rating: 5
  },
  {
    id: 8,
    category: 'sobremesas',
    name: 'Petit Gateau',
    description: 'Bolo de chocolate com sorvete de creme',
    price: 'R$ 25,90',
    image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500',
    popular: false,
    rating: 4
  }
];

const categories = [
  { id: 'todos', name: 'Todos' },
  { id: 'petiscos', name: 'Petiscos' },
  { id: 'pratos', name: 'Pratos' },
  { id: 'bebidas', name: 'Bebidas' },
  { id: 'sobremesas', name: 'Sobremesas' }
];

const Menu = () => {
  const [activeCategory, setActiveCategory] = useState('todos');
  const [favorites, setFavorites] = useState([]);

  const filteredItems = activeCategory === 'todos' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
    );
  };

  return (
    <section id="menu" className="menu section-padding">
      <div className="container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Nosso Cardápio</h2>
          <p>Pratos preparados com ingredientes selecionados e muito amor</p>
        </motion.div>

        <motion.div 
          className="menu-categories"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </motion.div>

        <motion.div 
          className="menu-grid"
          layout
        >
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              className="menu-item"
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -10 }}
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="menu-item-image">
                <img src={item.image} alt={item.name} />
                <button 
                  className={`favorite-btn ${favorites.includes(item.id) ? 'active' : ''}`}
                  onClick={() => toggleFavorite(item.id)}
                >
                  <FaHeart />
                </button>
                {item.popular && (
                  <span className="popular-badge">
                    <FaStar /> Popular
                  </span>
                )}
              </div>
              <div className="menu-item-content">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className="menu-item-footer">
                  <span className="price">{item.price}</span>
                  <div className="rating">
                    {[...Array(item.rating)].map((_, i) => (
                      <FaStar key={i} className="star" />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="text-center mt-5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Link to="/menu" className="btn btn-primary">
            Ver Cardápio Completo
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Menu;