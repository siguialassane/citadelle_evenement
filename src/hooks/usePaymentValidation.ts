
// Hook personnalisé pour gérer la logique de validation des paiements
// Refactorisé: Séparation des responsabilités en services spécialisés
// Amélioration: Meilleure gestion des erreurs et organisation du code
// Mise à jour: Ajout de la gestion des paiements déjà traités
// Mise à jour: Correction de la séparation des services d'envoi d'emails
// Mise à jour: Ajout de délais pour éviter les conflits entre les emails

import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Payment } from "@/types/payment";
import { PaymentValidationState } from "./payment-validation/types";
import { 
  fetchAllPayments, 
  fetchPaymentById 
} from "./payment-validation/supabaseService";
import { 
  validatePayment, 
  rejectPayment 
} from "./payment-validation/validationService";

export const usePaymentValidation = (paymentId?: string) => {
  const [state, setState] = useState<PaymentValidationState>({
    payments: [],
    currentPayment: null,
    searchQuery: "",
    filteredPayments: [],
    isLoading: true,
    isSubmitting: false,
    isRejecting: false,
    isValidating: false,
    error: null,
    totalPayments: 0
  });

  useEffect(() => {
    document.title = paymentId
      ? `Valider le paiement | IFTAR 2024`
      : "Validation des paiements | IFTAR 2024";

    if (paymentId) {
      fetchPaymentDetails(paymentId);
    } else {
      fetchPendingPayments();
    }
  }, [paymentId]);

  const fetchPendingPayments = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const paymentsData = await fetchAllPayments();
      
      if (paymentsData.length === 0) {
        toast({
          title: "Aucun paiement trouvé",
          description: "Il n'y a aucun paiement dans le système pour le moment.",
        });
        setState(prev => ({
          ...prev,
          payments: [],
          filteredPayments: [],
          totalPayments: 0,
          isLoading: false
        }));
        return;
      }

      const pendingPayments = paymentsData.filter(p => p.status === 'pending');
      
      setState(prev => ({
        ...prev,
        payments: paymentsData,
        filteredPayments: paymentsData,
        totalPayments: pendingPayments.length,
        isLoading: false
      }));

    } catch (error: any) {
      console.error("Erreur lors de la récupération des paiements:", error);
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
    }
  };

  const fetchPaymentDetails = async (id: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const paymentData = await fetchPaymentById(id);
      
      if (!paymentData) {
        setState(prev => ({
          ...prev,
          error: "Paiement non trouvé",
          isLoading: false
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        currentPayment: paymentData,
        filteredPayments: [paymentData],
        isLoading: false
      }));

    } catch (error: any) {
      console.error("Erreur lors de la récupération du paiement:", error);
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setState(prev => ({ ...prev, searchQuery: query }));
    filterPayments(query);
  };

  const filterPayments = (query: string) => {
    const lowerCaseQuery = query.toLowerCase();
    const filtered = state.payments.filter(payment =>
      payment.participant_name.toLowerCase().includes(lowerCaseQuery) ||
      payment.participant_email.toLowerCase().includes(lowerCaseQuery) ||
      payment.phone_number.toLowerCase().includes(lowerCaseQuery)
    );
    setState(prev => ({ ...prev, filteredPayments: filtered }));
  };

  const handleValidatePayment = async (paymentId: string) => {
    try {
      setState(prev => ({ ...prev, isValidating: true }));

      console.log("Début du processus de validation avec services d'email SÉPARÉS");
      console.log("Configuration: Service CONFIRMATION_EMAILJS_SERVICE_ID pour la confirmation UNIQUEMENT");

      const paymentToValidate = state.currentPayment || 
                               state.payments.find(p => p.id === paymentId);
      
      if (!paymentToValidate) {
        console.error("Paiement non trouvé pour validation:", paymentId);
        toast({
          title: "Erreur",
          description: "Paiement non trouvé",
          variant: "destructive",
        });
        setState(prev => ({ ...prev, isValidating: false }));
        return false;
      }
      
      // IMPORTANT: Vérifier le statut du paiement avant de continuer
      if (paymentToValidate.status === 'completed') {
        console.log("Ce paiement a déjà été validé, annulation du processus");
        toast({
          title: "Information",
          description: "Ce paiement a déjà été validé précédemment.",
          variant: "default",
        });
        setState(prev => ({ ...prev, isValidating: false }));
        return true;
      }
      
      if (paymentToValidate.status === 'rejected') {
        console.log("Ce paiement a déjà été rejeté, impossible de le valider");
        toast({
          title: "Information",
          description: "Ce paiement a déjà été rejeté précédemment et ne peut pas être validé.",
          variant: "default",
        });
        setState(prev => ({ ...prev, isValidating: false }));
        return false;
      }
      
      console.log("Validation du paiement:", paymentToValidate);
      const result = await validatePayment(paymentId, paymentToValidate);

      // Ne pas mettre à jour l'interface si le paiement était déjà traité
      if (result.alreadyProcessed) {
        console.log("Paiement déjà traité, aucune action supplémentaire nécessaire");
        setState(prev => ({ ...prev, isValidating: false }));
        return true;
      }

      if (result.success) {
        console.log("Validation réussie, mise à jour de l'interface utilisateur");
        // Mise à jour locale des données
        const updatedPayments = state.payments.map(payment => 
          payment.id === paymentId 
            ? { ...payment, status: 'completed' } 
            : payment
        );
        
        setState(prev => ({
          ...prev,
          payments: updatedPayments,
          isValidating: false
        }));
        
        // Mettre à jour la liste filtrée
        filterPayments(state.searchQuery);
        return true;
      } else {
        console.error("Échec de la validation:", result.error);
        setState(prev => ({ ...prev, isValidating: false }));
        return false;
      }
    } catch (error) {
      console.error("Erreur lors de la validation du paiement:", error);
      setState(prev => ({ ...prev, isValidating: false }));
      return false;
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      setState(prev => ({ ...prev, isRejecting: true }));

      console.log("Début du processus de rejet avec services d'email SÉPARÉS");
      console.log("Configuration: NOUVEAU service REJECTION_EMAILJS_SERVICE_ID pour le rejet UNIQUEMENT");

      // IMPORTANT: Vérifier le statut du paiement avant de continuer
      const paymentToReject = state.currentPayment || 
                             state.payments.find(p => p.id === paymentId);
      
      if (!paymentToReject) {
        console.error("Paiement non trouvé pour rejet:", paymentId);
        toast({
          title: "Erreur",
          description: "Paiement non trouvé",
          variant: "destructive",
        });
        setState(prev => ({ ...prev, isRejecting: false }));
        return false;
      }
      
      if (paymentToReject.status === 'completed') {
        console.log("Ce paiement a déjà été validé, impossible de le rejeter");
        toast({
          title: "Information",
          description: "Ce paiement a déjà été validé précédemment et ne peut pas être rejeté.",
          variant: "default",
        });
        setState(prev => ({ ...prev, isRejecting: false }));
        return false;
      }
      
      if (paymentToReject.status === 'rejected') {
        console.log("Ce paiement a déjà été rejeté, annulation du processus");
        toast({
          title: "Information",
          description: "Ce paiement a déjà été rejeté précédemment.",
          variant: "default",
        });
        setState(prev => ({ ...prev, isRejecting: false }));
        return true;
      }

      const result = await rejectPayment(paymentId);

      // Ne pas mettre à jour l'interface si le paiement était déjà traité
      if (result.alreadyProcessed) {
        console.log("Paiement déjà traité, aucune action supplémentaire nécessaire");
        setState(prev => ({ ...prev, isRejecting: false }));
        return true;
      }

      if (result.success) {
        console.log("Rejet réussi, mise à jour de l'interface utilisateur");
        // Mise à jour locale des données
        const updatedPayments = state.payments.map(payment => 
          payment.id === paymentId 
            ? { ...payment, status: 'rejected' } 
            : payment
        );
        
        setState(prev => ({
          ...prev,
          payments: updatedPayments,
          isRejecting: false
        }));
        
        // Mettre à jour la liste filtrée
        filterPayments(state.searchQuery);
        return true;
      } else {
        console.error("Échec du rejet:", result.error);
        setState(prev => ({ ...prev, isRejecting: false }));
        return false;
      }
    } catch (error) {
      console.error("Erreur lors du rejet du paiement:", error);
      setState(prev => ({ ...prev, isRejecting: false }));
      return false;
    }
  };

  const handleRefresh = () => {
    fetchPendingPayments();
    toast({
      title: "Liste actualisée",
      description: "La liste des paiements a été actualisée",
    });
  };

  const setCurrentPayment = (payment: Payment | null) => {
    setState(prev => ({ ...prev, currentPayment: payment }));
  };

  return {
    payments: state.payments,
    filteredPayments: state.filteredPayments,
    currentPayment: state.currentPayment,
    searchQuery: state.searchQuery,
    isLoading: state.isLoading,
    isSubmitting: state.isSubmitting,
    isRejecting: state.isRejecting,
    isValidating: state.isValidating,
    error: state.error,
    totalPayments: state.totalPayments,
    handleSearch,
    validatePayment: handleValidatePayment,
    rejectPayment: handleRejectPayment,
    handleRefresh,
    setCurrentPayment,
  };
};
