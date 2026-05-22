// src/services/contactService.js

import Contact from '../models/Contact.js';
import notificationService from './notificationService.js';
import  sendEmail  from './emailService.js';
import { business, error as _error, info } from '../middlewares/logger.js';
import ApiError from '../utils/ApiError.js';

class ContactService {
  /**
   * Cria um novo contato (mensagem de formulário do site)
   * @param {object} data - Dados do contato
   * @returns {Promise<Object>} Contato criado
   */
  async createContact(data) {
    try {
      // Criar registro no banco de dados
      const contact = await Contact.create({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject || 'Geral',
        message: data.message,
        status: 'unread'
      });

      business('Novo contato criado', {
        contactId: contact._id,
        email: contact.email,
        subject: contact.subject
      });

      // Enviar e-mail automático de confirmação para o cliente
      await this.sendCustomerConfirmation(contact);

      // Notificar administradores sobre novo contato
      await notificationService.notifyAdminNewContact(contact);

      return contact;
    } catch (error) {
      _error('Erro ao criar contato:', {
        error: error.message,
        data
      });
      throw error;
    }
  }

  /**
   * Lista contatos com filtros e paginação
   * @param {object} filters - Filtros (status, etc.)
   * @param {object} options - Opções de paginação e ordenação
   * @returns {Promise<Object>} Lista paginada de contatos
   */
  async getContacts(filters = {}, options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 }
    } = options;

    const query = Contact.find(filters)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    const [contacts, total] = await Promise.all([
      query.exec(),
      Contact.countDocuments(filters)
    ]);

    return {
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Busca um contato pelo ID
   * @param {string} id - ID do contato
   * @returns {Promise<Object>} Contato encontrado
   */
  async getContactById(id) {
    const contact = await Contact.findById(id);

    if (!contact) {
      throw new ApiError(404, 'Mensagem não encontrada');
    }

    return contact;
  }

  /**
   * Marca um contato como lido
   * @param {string} id - ID do contato
   * @returns {Promise<Object>} Contato atualizado
   */
  async markContactAsRead(id) {
    const contact = await Contact.findByIdAndUpdate(
      id,
      {
        status: 'read',
        readAt: new Date()
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!contact) {
      throw new ApiError(404, 'Mensagem não encontrada');
    }

    business('Contato marcado como lido', {
      contactId: contact._id,
      previousStatus: contact.status
    });

    return contact;
  }

  /**
   * Arquiva um contato
   * @param {string} id - ID do contato
   * @returns {Promise<Object>} Contato atualizado
   */
  async archiveContact(id) {
    const contact = await Contact.findByIdAndUpdate(
      id,
      {
        status: 'archived',
        archivedAt: new Date()
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!contact) {
      throw new ApiError(404, 'Mensagem não encontrada');
    }

    business('Contato arquivado', {
      contactId: contact._id
    });

    return contact;
  }

  /**
   * Exclui um contato (soft delete ou permanente)
   * @param {string} id - ID do contato
   * @returns {Promise<Object>} Contato excluído
   */
  async deleteContact(id) {
    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      throw new ApiError(404, 'Mensagem não encontrada');
    }

    business('Contato excluído', {
      contactId: contact._id,
      email: contact.email
    });

    return contact;
  }

  /**
   * Obtém estatísticas de contatos para dashboard
   * @returns {Promise<Object>} Estatísticas
   */
  async getContactStats() {
    const [total, unread, read, archived, today] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: 'unread' }),
      Contact.countDocuments({ status: 'read' }),
      Contact.countDocuments({ status: 'archived' }),
      Contact.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
    ]);

    return {
      total,
      unread,
      read,
      archived,
      today
    };
  }

  /**
   * Envia e-mail automático de confirmação para o cliente que enviou contato
   * @param {Object} contact - Dados do contato
   * @returns {Promise<void>}
   */
  async sendCustomerConfirmation(contact) {
    try {
      const emailPayload = {
        to: contact.email,
        subject: 'Recebemos sua mensagem - Seu Zé & Seu Mané',
        html: await this.generateCustomerConfirmationHTML(contact)
      };

      await sendEmail(emailPayload);

      info('E-mail de confirmação enviado para cliente', {
        contactId: contact._id,
        email: contact.email
      });
    } catch (error) {
      _error('Erro ao enviar e-mail de confirmação:', {
        error: error.message,
        contactId: contact._id
      });
      // Não propaga erro para não interromper o fluxo principal
    }
  }

  /**
   * Gera HTML do e-mail de confirmação para o cliente
   * @param {Object} contact - Dados do contato
   * @returns {string} HTML do e-mail
   */
  async generateCustomerConfirmationHTML(contact) {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mensagem Recebida</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f4f1ea; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1ea; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <!-- Cabeçalho -->
                <tr>
                  <td style="background-color:#8B4513; padding: 30px 20px; text-align:center;">
                    <h1 style="margin:0; color:#FFD700; font-family: 'Playfair Display', serif; font-size: 32px;">Seu Zé & Seu Mané</h1>
                    <p style="margin:5px 0 0; color:#ffffff; font-size:14px;">O sabor da tradição em cada prato</p>
                  </td>
                </tr>
                <!-- Conteúdo -->
                <tr>
                  <td style="padding: 30px 40px;">
                    <h2 style="color:#8B4513; margin-top:0;">Mensagem Recebida!</h2>
                    <p>Olá, <strong>${contact.name}</strong>!</p>
                    <p>Agradecemos por entrar em contato conosco. Sua mensagem foi recebida com sucesso e será respondida em breve.</p>
                    
                    <div style="background-color:#f9f5f0; padding:15px; border-radius:5px; margin:20px 0;">
                      <h3 style="color:#8B4513; margin:0 0 10px;">Resumo da sua mensagem:</h3>
                      <p style="margin:5px 0;"><strong>Assunto:</strong> ${contact.subject || 'Geral'}</p>
                      <p style="margin:5px 0;"><strong>E-mail informado:</strong> ${contact.email}</p>
                      ${contact.phone ? `<p style="margin:5px 0;"><strong>Telefone:</strong> ${contact.phone}</p>` : ''}
                      <p style="margin:5px 0;"><strong>Mensagem:</strong></p>
                      <blockquote style="background-color:#fff; padding:10px; border-left:3px solid #8B4513; margin:10px 0;">
                        ${contact.message.substring(0, 200)}${contact.message.length > 200 ? '...' : ''}
                      </blockquote>
                    </div>
                    
                    <p><strong>Prazo de resposta:</strong> Nossa equipe geralmente responde em até 24 horas úteis.</p>
                    <p>Enquanto isso, que tal conhecer nosso cardápio?</p>
                    <a href="https://www.seuzeeseumane.com.br/menu" 
                       style="display:inline-block; background-color:#8B4513; color:#ffffff; text-decoration:none; padding:12px 25px; border-radius:5px; margin:15px 0;">
                      Ver Cardápio
                    </a>
                    
                    <p>Atenciosamente,<br>Equipe <strong>Seu Zé & Seu Mané</strong></p>
                  </td>
                </tr>
                <!-- Rodapé -->
                <tr>
                  <td style="background-color:#2C1810; padding: 20px; text-align:center;">
                    <p style="margin:0; color:#ccc; font-size:12px;">
                      Seu Zé & Seu Mané - Recanto das Emas, Brasília - DF<br>
                      Telefone: (61) 99999-9999<br>
                      <a href="https://www.seuzeeseumane.com.br" style="color:#FFD700; text-decoration:none;">www.seuzeeseumane.com.br</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}

const contactService = new ContactService();
export default contactService;