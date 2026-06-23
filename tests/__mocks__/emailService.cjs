// // tests/__mocks__/emailService.js
//  export default {
//   sendEmail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
//   sendReservationConfirmation: jest.fn(),
//   sendConfirmationEmail: jest.fn(),
//   sendCancellationEmail: jest.fn(),
//   sendContactConfirmation: jest.fn(),
// };

// tests/__mocks__/emailService.cjs
const { jest } = require('@jest/globals');

module.exports = {
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  sendReservationConfirmation: jest.fn().mockResolvedValue(true),
  sendConfirmationEmail: jest.fn().mockResolvedValue(true),
  sendCancellationEmail: jest.fn().mockResolvedValue(true),
  sendContactConfirmation: jest.fn().mockResolvedValue(true),
};