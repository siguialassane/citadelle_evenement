
// Types pour le système de validation des paiements
// Créé lors de la refactorisation du hook usePaymentValidation pour améliorer la structure du code

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

export interface EmailConfirmationParams {
  participantId: string;
  participantEmail: string;
  participantName: string;
  participantPhone: string;
  amount: number;
  paymentMethod: string;
  paymentId: string;
  isMember: boolean;
  qrCodeId: string;
}
