
// Types partagés pour les services d'email
export interface EmailTemplateParams {
  to_email: string;
  to_name?: string;
  from_name: string;
  prenom: string;
  nom: string;
  participant_phone?: string;
  status?: string;
  payment_method?: string;
  payment_amount?: string;
  payment_phone?: string;
  app_url: string;
  reply_to: string;
  maps_url?: string;
  event_location?: string;
  event_address?: string;
  [key: string]: any;
}

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

// Types pour les emails de remerciement
export interface ParticipantEmailData {
  participantEmail: string;
  subject: string;
  templateParams: {
    participant_name: string;
    payment_amount?: string;
    payment_date?: string;
    message: string;
    website_link: string;
    [key: string]: any;
  };
}

export interface AdminNotificationEmailData {
  adminEmails: string[];
  subject: string;
  templateParams: {
    participant_name: string;
    participant_email: string;
    participant_id: string;
    payment_amount?: string;
    payment_date?: string;
    message: string;
    admin_action_link: string;
    [key: string]: any;
  };
}

// Type de retour pour les envois d'emails groupés
export interface EmailSendResult {
  success: number;
  failed: number;
}
