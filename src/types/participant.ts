
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
  payments: Payment[];
  manual_payments?: ManualPayment[]; // Ajout de la propriété manual_payments
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
