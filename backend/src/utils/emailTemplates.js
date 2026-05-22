// src/utils/emailTemplates.js

/**
 * Gera o layout base dos e-mails com cabeçalho, rodapé e estilos inline.
 * @param {string} content - Conteúdo HTML principal do e-mail.
 * @returns {string} HTML completo do e-mail.
 */
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu Zé & Seu Mané</title>
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
              ${content}
            </td>
          </tr>
          <!-- Rodapé -->
          <tr>
            <td style="background-color:#2C1810; padding: 20px; text-align:center;">
              <p style="margin:0; color:#ccc; font-size:12px;">
                Seu Zé & Seu Mané - Recanto das Emas, Brasília - DF<br>
                Telefone: (61) 99999-9999 | E-mail: contato@seuzeeseumane.com.br<br>
                <a href="https://www.seuzeeseumane.com.br" style="color:#FFD700; text-decoration:none;">www.seuzeeseumane.com.br</a>
              </p>
              <div style="margin-top:10px;">
                <a href="https://facebook.com" style="margin:0 5px;"><img src="https://img.icons8.com/ios-filled/24/ffffff/facebook-new.png" alt="Facebook" width="24"></a>
                <a href="https://instagram.com" style="margin:0 5px;"><img src="https://img.icons8.com/ios-filled/24/ffffff/instagram-new.png" alt="Instagram" width="24"></a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Formata a data para exibição no padrão brasileiro.
 * @param {Date|string} date - Data a ser formatada.
 * @returns {string} Data formatada (ex: "15 de outubro de 2024")
 */
const formatDate = (date) => {
  const d = new Date(date);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return d.toLocaleDateString('pt-BR', options);
};

/**
 * Converte horário (ex: "19:00") para formato legível.
 * @param {string} time - Horário no formato HH:mm.
 * @returns {string} Horário formatado.
 */
const formatTime = (time) => {
  const [hours, minutes] = time.split(':');
  return `${hours}h${minutes}`;
};

// ========================
// TEMPLATES ESPECÍFICOS
// ========================

/**
 * E-mail enviado imediatamente após o cliente fazer a reserva.
 * (Reserva ainda pendente de confirmação pelo restaurante)
 * @param {Object} reservation - Dados da reserva.
 */
const reservationConfirmation = (reservation) => {
  const content = `
    <h2 style="color:#8B4513; margin-top:0;">Reserva Recebida!</h2>
    <p>Olá, <strong>${reservation.customer.name}</strong>!</p>
    <p>Sua solicitação de reserva foi recebida com sucesso. Em breve nossa equipe confirmará sua mesa.</p>
    
    <div style="background-color:#f9f5f0; padding:15px; border-radius:5px; margin:20px 0;">
      <h3 style="color:#8B4513; margin:0 0 10px;">Detalhes da Reserva:</h3>
      <p style="margin:5px 0;"><strong>📅 Data:</strong> ${formatDate(reservation.reservationDetails.date)}</p>
      <p style="margin:5px 0;"><strong>⏰ Horário:</strong> ${formatTime(reservation.reservationDetails.time)}</p>
      <p style="margin:5px 0;"><strong>👥 Número de pessoas:</strong> ${reservation.reservationDetails.guests}</p>
      ${reservation.occasion ? `<p style="margin:5px 0;"><strong>🎉 Ocasião:</strong> ${reservation.occasion}</p>` : ''}
      ${reservation.specialRequests ? `<p style="margin:5px 0;"><strong>📝 Observações:</strong> ${reservation.specialRequests}</p>` : ''}
    </div>
    
    <p>Se precisar alterar ou cancelar, entre em contato conosco pelos canais abaixo.</p>
    <p>Aguardamos você!<br>Equipe <strong>Seu Zé & Seu Mané</strong></p>
  `;
  return baseTemplate(content);
};

/**
 * E-mail enviado quando o restaurante confirma a reserva.
 * @param {Object} reservation - Dados da reserva.
 */
const reservationConfirmed = (reservation) => {
  const content = `
    <h2 style="color:#28a745; margin-top:0;">✅ Reserva Confirmada!</h2>
    <p>Olá, <strong>${reservation.customer.name}</strong>!</p>
    <p>Sua reserva foi <strong>confirmada</strong>. Estamos ansiosos para recebê-lo!</p>
    
    <div style="background-color:#f9f5f0; padding:15px; border-radius:5px; margin:20px 0;">
      <h3 style="color:#8B4513; margin:0 0 10px;">Detalhes da Reserva:</h3>
      <p style="margin:5px 0;"><strong>📅 Data:</strong> ${formatDate(reservation.reservationDetails.date)}</p>
      <p style="margin:5px 0;"><strong>⏰ Horário:</strong> ${formatTime(reservation.reservationDetails.time)}</p>
      <p style="margin:5px 0;"><strong>👥 Número de pessoas:</strong> ${reservation.reservationDetails.guests}</p>
      ${reservation.reservationDetails.tableNumber ? `<p style="margin:5px 0;"><strong>🪑 Mesa:</strong> ${reservation.reservationDetails.tableNumber}</p>` : ''}
      ${reservation.occasion ? `<p style="margin:5px 0;"><strong>🎉 Ocasião:</strong> ${reservation.occasion}</p>` : ''}
      ${reservation.specialRequests ? `<p style="margin:5px 0;"><strong>📝 Observações:</strong> ${reservation.specialRequests}</p>` : ''}
    </div>
    
    <p><strong>Importante:</strong> Chegue com 15 minutos de antecedência. A tolerância de atraso é de 15 minutos.</p>
    <p>Até breve!<br>Equipe <strong>Seu Zé & Seu Mané</strong></p>
  `;
  return baseTemplate(content);
};

/**
 * E-mail enviado quando a reserva é cancelada (pelo cliente ou restaurante).
 * @param {Object} reservation - Dados da reserva.
 */
const reservationCancelled = (reservation) => {
  const content = `
    <h2 style="color:#dc3545; margin-top:0;">❌ Reserva Cancelada</h2>
    <p>Olá, <strong>${reservation.customer.name}</strong>!</p>
    <p>Informamos que sua reserva para o dia <strong>${formatDate(reservation.reservationDetails.date)}</strong> às <strong>${formatTime(reservation.reservationDetails.time)}</strong> foi cancelada.</p>
    ${reservation.cancellationReason ? `<p><strong>Motivo:</strong> ${reservation.cancellationReason}</p>` : ''}
    <p>Se foi um engano ou deseja fazer uma nova reserva, entre em contato conosco.</p>
    <p>Atenciosamente,<br>Equipe <strong>Seu Zé & Seu Mané</strong></p>
  `;
  return baseTemplate(content);
};

/**
 * E-mail lembrete enviado 24 horas antes da reserva.
 * @param {Object} reservation - Dados da reserva.
 */
const reservationReminder = (reservation) => {
  const content = `
    <h2 style="color:#FFD700; margin-top:0;">🔔 Lembrete de Reserva</h2>
    <p>Olá, <strong>${reservation.customer.name}</strong>!</p>
    <p>Não se esqueça: sua reserva é amanhã!</p>
    
    <div style="background-color:#f9f5f0; padding:15px; border-radius:5px; margin:20px 0;">
      <h3 style="color:#8B4513; margin:0 0 10px;">Detalhes:</h3>
      <p style="margin:5px 0;"><strong>📅 Data:</strong> ${formatDate(reservation.reservationDetails.date)}</p>
      <p style="margin:5px 0;"><strong>⏰ Horário:</strong> ${formatTime(reservation.reservationDetails.time)}</p>
      <p style="margin:5px 0;"><strong>👥 Pessoas:</strong> ${reservation.reservationDetails.guests}</p>
    </div>
    
    <p>Se precisar alterar algo, ligue para (61) 99999-9999.</p>
    <p>Estamos te esperando!<br>Equipe <strong>Seu Zé & Seu Mané</strong></p>
  `;
  return baseTemplate(content);
};

/**
 * E-mail de confirmação de recebimento de contato.
 * @param {Object} contact - Dados do formulário de contato.
 */
const contactConfirmation = (contact) => {
  const content = `
    <h2 style="color:#8B4513; margin-top:0;">Mensagem Recebida!</h2>
    <p>Olá, <strong>${contact.name}</strong>!</p>
    <p>Agradecemos seu contato. Nossa equipe analisará sua mensagem e retornará em breve.</p>
    
    <div style="background-color:#f9f5f0; padding:15px; border-radius:5px; margin:20px 0;">
      <p style="margin:5px 0;"><strong>Assunto:</strong> ${contact.subject || 'Contato geral'}</p>
      <p style="margin:5px 0;"><strong>E-mail informado:</strong> ${contact.email}</p>
      ${contact.phone ? `<p style="margin:5px 0;"><strong>Telefone:</strong> ${contact.phone}</p>` : ''}
    </div>
    
    <p>Enquanto isso, que tal conhecer nosso cardápio no site?</p>
    <a href="https://www.seuzeeseumane.com.br/menu" style="display:inline-block; background-color:#8B4513; color:#ffffff; text-decoration:none; padding:12px 25px; border-radius:5px; margin:15px 0;">Ver Cardápio</a>
    
    <p>Atenciosamente,<br>Equipe <strong>Seu Zé & Seu Mané</strong></p>
  `;
  return baseTemplate(content);
};

// Exportação dos templates
export  {
  reservationConfirmation,
  reservationConfirmed,
  reservationCancelled,
  reservationReminder,
  contactConfirmation
};