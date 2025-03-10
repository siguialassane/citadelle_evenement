
// Service d'envoi d'emails - Point d'entrée principal
// Refactoré pour une meilleure organisation et maintenabilité

export { sendAdminNotification, sendParticipantInitialEmail } from './emails/initialEmailService';
export { sendPaymentRejectionEmail } from './emails/rejectionEmailService';

