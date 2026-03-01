
// Types pour les participants et les paiements
// Modifications:
// - Commentaires améliorés
// - Types rendus plus clairs
// - Support explicite pour les paiements multiples

import { ManualPayment, GuestRecord } from './payment';

export type Participant = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  is_member: boolean;
  check_in_status: boolean;
  created_at: string;
  qr_code_id?: string; // ID du QR code associé au participant
  sms_code?: string; // Code SMS unique pour vérification
  sms_sent_at?: string; // Date d'envoi du SMS
  check_in_timestamp?: string; // Horodatage du check-in
  payments: Payment[]; // Liste des paiements associés au participant
  manual_payments?: ManualPayment[]; // Liste des paiements manuels
  guests?: GuestRecord[]; // Liste des invités/accompagnants
};

export type Payment = {
  id: string;
  status: string; // "pending", "completed", "rejected"
  amount: number;
  payment_method: string;
  payment_date: string;
  currency: string;
  transaction_id?: string;
};

// Type pour les vérifications d'identité de participant - désormais ignoré
// Conservé uniquement pour référence mais ne sera plus utilisé
export type ParticipantIdentity = {
  first_name: string;
  last_name: string;
  email: string;
};
