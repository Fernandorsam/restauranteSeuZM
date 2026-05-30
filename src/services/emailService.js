// src/services/emailService.js
import { createTransport } from 'nodemailer';
import { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } from '../config/environment.js';
import { reservationConfirmation, reservationConfirmed,
reservationCancelled, reservationReminder, contactConfirmation } from '../utils/emailTemplates.js';
import { info as _info, error as _error } from '../middlewares/logger.js';

class EmailService {
  constructor() {
    this.transporter = createTransport({
     host: EMAIL_HOST,
      port: EMAIL_PORT, 
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });
  }

  async sendEmail({ to, subject, html, attachments = [] }) {
    try {
      const mailOptions = {
        from: `"Seu Zé e Seu Mané" <${EMAIL_USER}>`,
        to,
        subject,
        html,
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      _info(`Email enviado: ${info.messageId}`);
      return info;
    } catch (error) {
      _error('Erro ao enviar email:', error);
      throw error;
    }
  }

  async sendReservationConfirmation(reservation) {
    const template = reservationConfirmation(reservation);
    
    return this.sendEmail({
      to: reservation.customer.email,
      subject: 'Reserva Recebida - Seu Zé e Seu Mané',
      html: template
    });
  }

  async sendConfirmationEmail(reservation) {
    const template = reservationConfirmed(reservation);
    
    return this.sendEmail({
      to: reservation.customer.email,
      subject: 'Reserva Confirmada - Seu Zé e Seu Mané',
      html: template
    });
  }

  async sendCancellationEmail(reservation) {
    const template = reservationCancelled(reservation);
    
    return this.sendEmail({
      to: reservation.customer.email,
      subject: 'Reserva Cancelada - Seu Zé e Seu Mané',
      html: template
    });
  }

  async sendReminderEmail(reservation) {
    const template = reservationReminder(reservation);
    
    return this.sendEmail({
      to: reservation.customer.email,
      subject: 'Lembrete de Reserva - Seu Zé e Seu Mané',
      html: template
    });
  }

  async sendContactConfirmation(contact) {
    const template = contactConfirmation(contact);
    
    return this.sendEmail({
      to: contact.email,
      subject: 'Recebemos sua mensagem - Seu Zé e Seu Mané',
      html: template
    });
  }
}

const emailService = new EmailService();
export default emailService;
