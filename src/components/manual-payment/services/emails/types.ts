
// Types partagés pour les services d'email
// Mise à jour: 
// - Ajout de types pour les formulaires d'adhésion
// - Mise à jour des schémas de paiement pour inclure mobile_money
// - Ajout des types pour les emails de remerciement qui manquaient

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

// Type pour les formulaires d'adhésion
export interface MembershipFormData {
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  profession: string;
  address?: string;
  subscription_amount: number;
  subscription_start_month?: string;
  payment_method: 'especes' | 'cheque' | 'virement' | 'mobile_money';
  payment_frequency: 'mensuelle' | 'trimestrielle' | 'annuelle';
  competence_domains?: string;
  club_expectations?: string[];
  other_expectations?: string;
  agree_terms: boolean;
}

// Types des attentes vis-à-vis du club
export type ClubExpectationType = 'formation' | 'loisirs' | 'echanges' | 'reseau';

export interface ClubExpectationOption {
  id: ClubExpectationType;
  label: string;
}

export const CLUB_EXPECTATIONS: ClubExpectationOption[] = [
  { id: 'formation', label: 'Formation' },
  { id: 'loisirs', label: 'Loisirs' },
  { id: 'echanges', label: 'Échanges et débats' },
  { id: 'reseau', label: 'Appartenir à un réseau' }
];
