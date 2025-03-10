
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

