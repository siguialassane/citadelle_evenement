
// Ce fichier contient les types utilisés dans les composants de paiement manuel

// Type de méthode de paiement
export type PaymentMethod = "MTN" | "MOOV" | "WAVE";

// Type pour les numéros de paiement
export type PaymentNumbers = {
  MTN: string;
  MOOV: string;
  WAVE: string;
};

// Informations du participant
export type Participant = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  is_member: boolean;
  [key: string]: any;
};

// Propriétés du formulaire de paiement manuel
export type ManualPaymentFormProps = {
  participant: Participant;
};

// États de copie dans le presse-papier
export type CopyStates = Record<string, boolean>;
