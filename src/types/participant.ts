
// Types pour les participants et les paiements
import { ManualPayment } from './payment';

export type Participant = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  is_member: boolean;
  check_in_status: boolean;
  created_at: string;
  qr_code_id?: string; // ID du QR code
  check_in_timestamp?: string; // Horodatage du check-in
  payments: Payment[];
  manual_payments?: ManualPayment[]; // Paiements manuels
};

export type Payment = {
  id: string;
  status: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  currency: string;
  transaction_id?: string;
};

// Nous définissons un type pour les vérifications d'unicité de participant
export type ParticipantIdentity = {
  first_name: string;
  last_name: string;
  email: string;
};
