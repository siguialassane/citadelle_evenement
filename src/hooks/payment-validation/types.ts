
// Types pour le système de validation des paiements
// Créé lors de la refactorisation du hook usePaymentValidation pour améliorer la structure du code
// Mise à jour: Ajout de commentaires pour clarifier l'utilisation des types

import { Payment } from "@/types/payment";

export interface ValidationResponse {
  success: boolean;
  message?: string;
  error?: any;
}

export interface PaymentValidationState {
  payments: Payment[];
  currentPayment: Payment | null;
  searchQuery: string;
  filteredPayments: Payment[];
  isLoading: boolean;
  isSubmitting: boolean;
  isRejecting: boolean;
  isValidating: boolean;
  error: string | null;
  totalPayments: number;
}

// Paramètres nécessaires pour l'envoi d'email de confirmation à l'administrateur
// après la validation d'un paiement par l'administrateur
export interface EmailConfirmationParams {
  participantId: string;
  participantEmail: string;  // Email du participant (sera utilisé uniquement pour l'affichage)
  participantName: string;   // Nom complet du participant
  participantPhone: string;  // Numéro de téléphone du participant
  amount: number;            // Montant du paiement
  paymentMethod: string;     // Méthode de paiement utilisée
  paymentId: string;         // ID du paiement validé
  isMember: boolean;         // Statut d'adhésion du participant
  qrCodeId: string;          // ID du QR code généré
}
