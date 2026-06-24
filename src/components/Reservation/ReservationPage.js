// pages/ReservationPage.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ReservationPage.css';

const ReservationPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: new Date(),
    time: '19:00',
    guests: 2,
    occasion: '',
    specialRequests: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aqui você implementaria a lógica de envio para o backend
    console.log('Reservation data:', formData);
    toast.success('Reserva realizada com sucesso! Enviaremos uma confirmação por e-mail.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      date: new Date(),
      time: '19:00',
      guests: 2,
      occasion: '',
      specialRequests: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2);

  return (
    <motion.div
      className="reservation-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="reservation-hero">
        <div className="container">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Faça sua Reserva
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Reserve sua mesa e garanta uma experiência gastronômica inesquecível
          </motion.p>
        </div>
      </div>

      <div className="container">
        <div className="reservation-content">
          <motion.div 
            className="reservation-form-container"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2>Dados da Reserva</h2>
            <form onSubmit={handleSubmit} className="reservation-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nome Completo *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Seu nome"
                  />
                </div>
                <div className="form-group">
                  <label>Telefone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="(61) 99999-9999"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>E-mail *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="seu@email.com"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data *</label>
                  <DatePicker
                    selected={formData.date}
                    onChange={(date) => setFormData({...formData, date})}
                    minDate={minDate}
                    maxDate={maxDate}
                    dateFormat="dd/MM/yyyy"
                    className="date-picker"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Horário *</label>
                  <select
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                  >
                    <option value="11:00">11:00</option>
                    <option value="11:30">11:30</option>
                    <option value="12:00">12:00</option>
                    <option value="12:30">12:30</option>
                    <option value="13:00">13:00</option>
                    <option value="13:30">13:30</option>
                    <option value="14:00">14:00</option>
                    <option value="18:00">18:00</option>
                    <option value="18:30">18:30</option>
                    <option value="19:00">19:00</option>
                    <option value="19:30">19:30</option>
                    <option value="20:00">20:00</option>
                    <option value="20:30">20:30</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Número de Pessoas *</label>
                  <select
                    name="guests"
                    value={formData.guests}
                    onChange={handleChange}
                    required
                  >
                    {[1,2,3,4,5,6,7,8].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'pessoa' : 'pessoas'}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Ocasião</label>
                  <select
                    name="occasion"
                    value={formData.occasion}
                    onChange={handleChange}
                  >
                    <option value="">Selecione...</option>
                    <option value="aniversario">Aniversário</option>
                    <option value="namoro">Jantar Romântico</option>
                    <option value="familia">Reunião de Família</option>
                    <option value="negocios">Negócios</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Pedidos Especiais</label>
                <textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Alguma restrição alimentar ou pedido especial?"
                ></textarea>
              </div>

              <motion.button
                type="submit"
                className="btn btn-primary btn-block"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Confirmar Reserva
              </motion.button>
            </form>
          </motion.div>

          <motion.div 
            className="reservation-info"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="info-card">
              <h3>Informações Importantes</h3>
              <ul>
                <li>Reservas confirmadas em até 24 horas</li>
                <li>Chegue com 15 minutos de antecedência</li>
                <li>Tolerância de 15 minutos de atraso</li>
                <li>Estacionamento próprio disponível</li>
                <li>Aceitamos principais cartões</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>Política de Cancelamento</h3>
              <p>
                Cancelamentos podem ser feitos até 2 horas antes do horário reservado. 
                Cancelamentos após esse prazo podem estar sujeitos a cobrança.
              </p>
            </div>

            <div className="info-card contact-card">
              <h3>Precisa de Ajuda?</h3>
              <p>Entre em contato conosco:</p>
              <p className="phone">📞 (61) 99999-9999</p>
              <p className="email">✉️ contato@seuzeeseumane.com.br</p>
            </div>
          </motion.div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={5000} />
    </motion.div>
  );
};

export default ReservationPage;