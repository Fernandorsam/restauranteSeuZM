// src/services/notificationService.js

import emailService, { templates } from './emailService.js';
import { warn, info, error as _error, business } from '../middlewares/logger.js';
import { ADMIN_EMAIL, MANAGER_EMAILS, FRONTEND_URL } from '../config/environment.js';

/**
 * Serviço de Notificações
 * 
 * Centraliza o envio de mensagens para diferentes canais:
 * - E-mail (via emailService)
 * - SMS (via integração futura com Twilio, TotalVoice, etc.)
 * - Push (via Firebase Cloud Messaging, OneSignal, etc.)
 *
 * Permite notificar clientes, administradores e gerentes sobre
 * eventos importantes do restaurante (reservas, contatos, promoções).
 */
class NotificationService {
  constructor() {
    // Canais disponíveis e seus status
    this.channels = {
      email: {
        enabled: true,
        service: emailService
      },
      sms: {
        enabled: false, // Será ativado quando houver integração com provedor SMS
        service: null
      },
      push: {
        enabled: false, // Para notificações push no app ou dashboard
        service: null
      }
    };

    // E-mail do administrador (ou lista de e-mails)
    this.adminEmail = ADMIN_EMAIL || 'admin@seuzeeseumane.com.br';
    
    // Lista de e-mails de gerentes que também recebem alertas
    this.managerEmails = MANAGER_EMAILS 
      ? MANAGER_EMAILS.split(',') 
      : [];
  }

  /**
   * Envia uma notificação através de um canal específico
   * @param {string} channel - Canal de notificação ('email', 'sms', 'push')
   * @param {object} payload - Dados específicos do canal
   * @returns {Promise<object>} Resultado do envio
   */
  async send(channel, payload) {
    try {
      if (!this.channels[channel] || !this.channels[channel].enabled) {
        warn(`Canal de notificação "${channel}" desativado ou não configurado`);
        return { success: false, message: `Canal "${channel}" indisponível` };
      }

      const result = await this.channels[channel].service.send(payload);
      
      info(`Notificação enviada via ${channel}`, {
        channel,
        to: payload.to || payload.recipient,
        subject: payload.subject,
        success: true
      });

      return result;
    } catch (error) {
      _error(`Erro ao enviar notificação via ${channel}:`, {
        error: error.message,
        channel,
        payload: { ...payload, html: payload.html ? '[HTML_CONTENT]' : undefined }
      });
      
      // Não propaga o erro para não interromper o fluxo principal
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // NOTIFICAÇÕES RELACIONADAS A RESERVAS
  // =============================================

  /**
   * Notifica o cliente que a reserva foi recebida (pendente de confirmação)
   * @param {Object} reservation - Dados completos da reserva
   */
  async notifyNewReservation(reservation) {
    business('Nova reserva criada', { 
      reservationId: reservation._id,
      customer: reservation.customer.email 
    });

    const emailPayload = {
      to: reservation.customer.email,
      subject: 'Reserva Recebida - Seu Zé e Seu Mané',
      html: templates.reservationConfirmation(reservation)
    };

    // Enviar para cliente
    await this.send('email', emailPayload);

    // Notificar administradores
    await this.notifyAdminNewReservation(reservation);
  }

  /**
   * Notifica o cliente que a reserva foi confirmada
   * @param {Object} reservation - Dados completos da reserva
   */
  async notifyReservationConfirmed(reservation) {
    business('Reserva confirmada', { 
      reservationId: reservation._id,
      customer: reservation.customer.email 
    });

    const emailPayload = {
      to: reservation.customer.email,
      subject: 'Reserva Confirmada - Seu Zé e Seu Mané',
      html: templates.reservationConfirmed(reservation)
    };

    await this.send('email', emailPayload);

    // Se cliente tiver telefone e SMS estiver habilitado, enviar SMS
    if (this.channels.sms.enabled && reservation.customer.phone) {
      await this.sendSMS(
        reservation.customer.phone,
        `Seu Zé & Seu Mané: Reserva confirmada para ${this.formatSMSDate(reservation.reservationDetails.date)} às ${reservation.reservationDetails.time}. Aguardamos você!`
      );
    }
  }

  /**
   * Notifica o cliente sobre o cancelamento da reserva
   * @param {Object} reservation - Dados completos da reserva
   */
  async notifyReservationCancelled(reservation) {
    business('Reserva cancelada', { 
      reservationId: reservation._id,
      customer: reservation.customer.email,
      reason: reservation.cancellationReason
    });

    const emailPayload = {
      to: reservation.customer.email,
      subject: 'Reserva Cancelada - Seu Zé e Seu Mané',
      html: templates.reservationCancelled(reservation)
    };

    await this.send('email', emailPayload);
  }

  /**
   * Envia lembrete 24h antes da reserva
   * @param {Object} reservation - Dados completos da reserva
   */
  async notifyReservationReminder(reservation) {
    business('Lembrete de reserva enviado', { 
      reservationId: reservation._id,
      customer: reservation.customer.email,
      scheduledDate: reservation.reservationDetails.date
    });

    const emailPayload = {
      to: reservation.customer.email,
      subject: 'Lembrete de Reserva - Seu Zé e Seu Mané',
      html: templates.reservationReminder(reservation)
    };

    await this.send('email', emailPayload);

    // SMS de lembrete (se habilitado)
    if (this.channels.sms.enabled && reservation.customer.phone) {
      await this.sendSMS(
        reservation.customer.phone,
        `Lembrete: você tem uma reserva amanhã no Seu Zé & Seu Mané às ${reservation.reservationDetails.time}. Aguardamos você!`
      );
    }
  }

  // =============================================
  // NOTIFICAÇÕES PARA ADMINISTRADORES
  // =============================================

  /**
   * Notifica administradores sobre nova reserva
   * @param {Object} reservation - Dados completos da reserva
   */
  async notifyAdminNewReservation(reservation) {
    const adminHtml = `
      <h2>Nova Reserva Recebida</h2>
      <p><strong>Cliente:</strong> ${reservation.customer.name}</p>
      <p><strong>E-mail:</strong> ${reservation.customer.email}</p>
      <p><strong>Telefone:</strong> ${reservation.customer.phone}</p>
      <p><strong>Data:</strong> ${new Date(reservation.reservationDetails.date).toLocaleDateString('pt-BR')}</p>
      <p><strong>Horário:</strong> ${reservation.reservationDetails.time}</p>
      <p><strong>Pessoas:</strong> ${reservation.reservationDetails.guests}</p>
      ${reservation.occasion ? `<p><strong>Ocasião:</strong> ${reservation.occasion}</p>` : ''}
      ${reservation.specialRequests ? `<p><strong>Observações:</strong> ${reservation.specialRequests}</p>` : ''}
      <hr>
      <p>Acesse o painel para confirmar ou gerenciar esta reserva.</p>
      <a href="${FRONTEND_URL}/admin/reservations/${reservation._id}" 
         style="display:inline-block; background-color:#8B4513; color:#ffffff; text-decoration:none; padding:10px 20px; border-radius:5px;">
         Ver Reserva
      </a>
    `;

    // Enviar para admin principal
    await this.send('email', {
      to: this.adminEmail,
      subject: `Nova Reserva - ${reservation.customer.name} - ${new Date(reservation.reservationDetails.date).toLocaleDateString('pt-BR')}`,
      html: adminHtml
    });

    // Copiar para gerentes (se houver)
    for (const managerEmail of this.managerEmails) {
      await this.send('email', {
        to: managerEmail,
        subject: `[Cópia] Nova Reserva - ${reservation.customer.name}`,
        html: adminHtml
      });
    }
  }

  /**
   * Notifica administradores sobre novo contato via site
   * @param {Object} contact - Dados do formulário de contato
   */
  async notifyAdminNewContact(contact) {
    business('Novo contato recebido', { 
      contactId: contact._id,
      from: contact.email 
    });

    const adminHtml = `
      <h2>Novo Contato via Site</h2>
      <p><strong>Nome:</strong> ${contact.name}</p>
      <p><strong>E-mail:</strong> ${contact.email}</p>
      <p><strong>Telefone:</strong> ${contact.phone || 'Não informado'}</p>
      <p><strong>Assunto:</strong> ${contact.subject || 'Geral'}</p>
      <p><strong>Mensagem:</strong></p>
      <blockquote style="background-color:#f9f5f0; padding:15px; border-left:4px solid #8B4513;">
        ${contact.message}
      </blockquote>
      <p>Recebido em: ${new Date(contact.createdAt).toLocaleString('pt-BR')}</p>
    `;

    await this.send('email', {
      to: this.adminEmail,
      subject: `Novo Contato - ${contact.name} - ${contact.subject || 'Geral'}`,
      html: adminHtml
    });
  }

  /**
   * Alerta administradores sobre reserva cancelada
   * @param {Object} reservation - Dados da reserva cancelada
   */
  async notifyAdminCancellation(reservation) {
    const adminHtml = `
      <h2>Reserva Cancelada</h2>
      <p><strong>Cliente:</strong> ${reservation.customer.name}</p>
      <p><strong>Data:</strong> ${new Date(reservation.reservationDetails.date).toLocaleDateString('pt-BR')}</p>
      <p><strong>Horário:</strong> ${reservation.reservationDetails.time}</p>
      <p><strong>Pessoas:</strong> ${reservation.reservationDetails.guests}</p>
      <p><strong>Motivo:</strong> ${reservation.cancellationReason || 'Não informado'}</p>
      <p><strong>Cancelado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
    `;

    await this.send('email', {
      to: this.adminEmail,
      subject: `Reserva Cancelada - ${reservation.customer.name}`,
      html: adminHtml
    });
  }

  // =============================================
  // NOTIFICAÇÕES PROMOCIONAIS / MARKETING
  // =============================================

  /**
   * Envia e-mail marketing para lista de clientes
   * @param {Array<string>} recipients - Lista de e-mails
   * @param {string} subject - Assunto do e-mail
   * @param {string} html - Conteúdo HTML
   */
  async sendMarketingEmail(recipients, subject, html) {
    info(`Enviando e-mail marketing para ${recipients.length} destinatários`);
    
    const results = [];
    for (const email of recipients) {
      const result = await this.send('email', {
        to: email,
        subject,
        html
      });
      results.push({ email, ...result });
    }

    info('Campanha de e-mail concluída', { 
      total: recipients.length,
      successful: results.filter(r => r.success).length 
    });

    return results;
  }

  /**
   * Envia notificação de aniversário para cliente cadastrado
   * @param {Object} customer - Dados do cliente (nome, email, data de nascimento)
   */
  async sendBirthdayGreeting(customer) {
    const html = `
      <h2>🎂 Feliz Aniversário, ${customer.name}!</h2>
      <p>A equipe do <strong>Seu Zé & Seu Mané</strong> deseja um dia maravilhoso!</p>
      <p>Para celebrar, preparamos um desconto especial de <strong>15%</strong> em sua próxima refeição conosco.</p>
      <p>Use o cupom: <strong>ANIVERSARIO${new Date().getFullYear()}</strong></p>
      <a href="${FRONTEND_URL}/reservas" 
         style="display:inline-block; background-color:#8B4513; color:#ffffff; text-decoration:none; padding:12px 25px; border-radius:5px; margin-top:15px;">
         Fazer Reserva
      </a>
      <p>Válido até 7 dias após seu aniversário.</p>
    `;

    await this.send('email', {
      to: customer.email,
      subject: `Feliz Aniversário, ${customer.name}! - Seu Zé & Seu Mané`,
      html
    });
  }

  // =============================================
  // MÉTODOS AUXILIARES
  // =============================================

  /**
   * Envia SMS (placeholder para integração futura)
   * @param {string} phone - Número de telefone (formato E.164)
   * @param {string} message - Corpo da mensagem
   */
  async sendSMS(phone, message) {
    if (!this.channels.sms.enabled) {
      warn('Serviço de SMS não configurado');
      return { success: false, message: 'SMS desabilitado' };
    }

    // Exemplo de integração com Twilio ou TotalVoice
    // const twilioClient = require('twilio')(accountSid, authToken);
    // return twilioClient.messages.create({ body: message, from: '+1234567890', to: phone });
    
    info(`[SMS] Para: ${phone} - Mensagem: ${message}`);
    return { success: true, message: 'SMS enviado (simulação)' };
  }

  /**
   * Formata data para exibição em SMS
   * @param {Date} date - Data a ser formatada
   * @returns {string} Data formatada resumida
   */
  formatSMSDate(date) {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Habilita um canal de notificação dinamicamente
   * @param {string} channel - Nome do canal ('email', 'sms', 'push')
   * @param {object} service - Instância do serviço de envio
   */
  enableChannel(channel, service) {
    if (this.channels[channel]) {
      this.channels[channel].enabled = true;
      this.channels[channel].service = service;
      info(`Canal "${channel}" habilitado`);
    } else {
      warn(`Canal "${channel}" não reconhecido`);
    }
  }

  /**
   * Desabilita um canal de notificação
   * @param {string} channel - Nome do canal
   */
  disableChannel(channel) {
    if (this.channels[channel]) {
      this.channels[channel].enabled = false;
      info(`Canal "${channel}" desabilitado`);
    }
  }
}

// Exporta instância única do serviço
export default new NotificationService();