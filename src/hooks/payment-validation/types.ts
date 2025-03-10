
// Types pour le processus de validation des paiements
// Mise à jour: Ajout d'un indicateur pour les paiements déjà traités

export interface ValidationResponse {
  success: boolean;
  error?: string;
  alreadyProcessed?: boolean; // Nouveau champ pour indiquer si le paiement a déjà été traité
}

export interface PaymentValidationState {
  payments: any[];
  currentPayment: any | null;
  searchQuery: string;
  filteredPayments: any[];
  isLoading: boolean;
  isSubmitting: boolean;
  isRejecting: boolean;
  isValidating: boolean;
  error: string | null;
  totalPayments: number;
}
