
// Types pour les paiements manuels
// Créé pour une meilleure structure du projet et une utilisation des types cohérente

export interface Payment {
  id: string;
  participant_id: string;
  amount: number;
  payment_method: string;
  phone_number: string;
  status: string;
  comments: string;
  created_at: string;
  formatted_date: string;
  formatted_time: string;
  participant_name: string;
  participant_email: string;
  participant_phone: string;
  participant: any;
}

export interface ManualPayment {
  id: string;
  participant_id: string;
  amount: number;
  payment_method: string;
  phone_number: string;
  status: string;
  comments?: string;
  created_at: string;
  screenshot_url?: string;
  admin_notes?: string;
  validated_at?: string;
  validated_by?: string;
}

