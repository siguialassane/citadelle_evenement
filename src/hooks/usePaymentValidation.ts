
// Hook personnalisé pour gérer la logique de validation des paiements
// Extrait pour une meilleure séparation de la logique et de l'interface

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import emailjs from '@emailjs/browser';
import { 
  PAYMENT_CONFIRMATION_EMAILJS_SERVICE_ID, 
  PAYMENT_CONFIRMATION_EMAILJS_TEMPLATE_ID, 
  PAYMENT_CONFIRMATION_EMAILJS_PUBLIC_KEY 
} from "@/components/manual-payment/config";
import { Payment } from "@/types/payment";

export const usePaymentValidation = (paymentId?: string) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPayments, setTotalPayments] = useState(0);

  useEffect(() => {
    document.title = paymentId
      ? `Valider le paiement | IFTAR 2024`
      : "Validation des paiements | IFTAR 2024";

    if (paymentId) {
      fetchPaymentById(paymentId);
    } else {
      fetchPendingPayments();
    }
  }, [paymentId]);

  const fetchPendingPayments = async () => {
    try {
      setIsLoading(true);
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('manual_payments')
        .select(`
          *,
          participants(*)
        `)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      if (!paymentsData || paymentsData.length === 0) {
        toast({
          title: "Aucun paiement trouvé",
          description: "Il n'y a aucun paiement dans le système pour le moment.",
        });
        setPayments([]);
        setFilteredPayments([]);
        setTotalPayments(0);
        return;
      }

      const formattedPayments = paymentsData.map(payment => {
        const date = new Date(payment.created_at);
        const formattedDate = date.toLocaleDateString('fr-FR');
        const formattedTime = date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        });

        return {
          id: payment.id,
          participant_id: payment.participant_id,
          amount: payment.amount,
          payment_method: payment.payment_method,
          phone_number: payment.phone_number,
          status: payment.status,
          comments: payment.comments,
          created_at: payment.created_at,
          formatted_date: formattedDate,
          formatted_time: formattedTime,
          participant_name: `${payment.participants.first_name} ${payment.participants.last_name}`,
          participant_email: payment.participants.email,
          participant_phone: payment.participants.contact_number,
          participant: payment.participants
        };
      });

      const pendingPayments = formattedPayments.filter(p => p.status === 'pending');
      setTotalPayments(pendingPayments.length);
      
      setPayments(formattedPayments);
      setFilteredPayments(formattedPayments);

    } catch (error: any) {
      console.error("Erreur lors de la récupération des paiements:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentById = async (id: string) => {
    try {
      setIsLoading(true);
      
      const { data: paymentData, error: paymentError } = await supabase
        .from('manual_payments')
        .select(`
          *,
          participants(*)
        `)
        .eq('id', id)
        .single();

      if (paymentError) throw paymentError;

      if (!paymentData) {
        setError("Paiement non trouvé");
        return;
      }

      const date = new Date(paymentData.created_at);
      const formattedDate = date.toLocaleDateString('fr-FR');
      const formattedTime = date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      const formattedPayment = {
        id: paymentData.id,
        participant_id: paymentData.participant_id,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        phone_number: paymentData.phone_number,
        status: paymentData.status,
        comments: paymentData.comments,
        created_at: paymentData.created_at,
        formatted_date: formattedDate,
        formatted_time: formattedTime,
        participant_name: `${paymentData.participants.first_name} ${paymentData.participants.last_name}`,
        participant_email: paymentData.participants.email,
        participant_phone: paymentData.participants.contact_number,
        participant: paymentData.participants
      };

      setCurrentPayment(formattedPayment);
      setFilteredPayments([formattedPayment]);

    } catch (error: any) {
      console.error("Erreur lors de la récupération du paiement:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    filterPayments(e.target.value);
  };

  const filterPayments = (query: string) => {
    const lowerCaseQuery = query.toLowerCase();
    const filtered = payments.filter(payment =>
      payment.participant_name.toLowerCase().includes(lowerCaseQuery) ||
      payment.participant_email.toLowerCase().includes(lowerCaseQuery) ||
      payment.phone_number.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredPayments(filtered);
  };

  const validatePayment = async (paymentId: string) => {
    try {
      setIsValidating(true);
      
      const { error: updateError } = await supabase
        .from('manual_payments')
        .update({ 
          status: 'completed',
          validated_at: new Date().toISOString(),
          validated_by: "Admin" // Idéalement, remplacer par l'ID ou le nom de l'admin connecté
        })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      const paymentToValidate = currentPayment || payments.find(p => p.id === paymentId);
      
      if (!paymentToValidate) {
        throw new Error("Données de paiement manquantes");
      }

      const { error: participantError } = await supabase
        .from('participants')
        .update({ 
          payment_status: 'completed',
          qr_code_id: uuidv4()
        })
        .eq('id', paymentToValidate.participant_id);

      if (participantError) throw participantError;

      const { data: participantData, error: fetchError } = await supabase
        .from('participants')
        .select('*')
        .eq('id', paymentToValidate.participant_id)
        .single();

      if (fetchError) throw fetchError;
      if (!participantData) throw new Error("Participant non trouvé");

      await sendConfirmationEmail(participantData, participantData.qr_code_id);

      toast({
        title: "Paiement validé avec succès",
        description: `Un email de confirmation a été envoyé à ${paymentToValidate.participant_email}`,
        variant: "default",
      });

      const updatedPayments = payments.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'completed' } 
          : payment
      );
      
      setPayments(updatedPayments);
      filterPayments(searchQuery);

      return true;

    } catch (error: any) {
      console.error("Erreur lors de la validation du paiement:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la validation du paiement",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const rejectPayment = async (paymentId: string) => {
    try {
      setIsRejecting(true);

      const { error: updateError } = await supabase
        .from('manual_payments')
        .update({ status: 'rejected' })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      toast({
        title: "Paiement rejeté avec succès",
        description: "Le paiement a été rejeté et le participant sera notifié.",
        variant: "default",
      });

      const updatedPayments = payments.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'rejected' } 
          : payment
      );
      
      setPayments(updatedPayments);
      filterPayments(searchQuery);

      return true;

    } catch (error: any) {
      console.error("Erreur lors du rejet du paiement:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du rejet du paiement",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsRejecting(false);
    }
  };

  const sendConfirmationEmail = async (participantData: any, qrCodeId: string) => {
    try {
      console.log("Envoi de l'email de confirmation au participant après validation...");
      
      console.log("Données du participant:", JSON.stringify(participantData));
      
      const appUrl = window.location.origin;
      
      const statut = participantData.is_member ? "Membre" : "Non-membre";
      
      const confirmationUrl = `${appUrl}/confirmation/${participantData.id}`;
      
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(confirmationUrl)}`;
      
      const templateParams = {
        to_email: participantData.email.trim(),
        prenom: participantData.first_name.trim(),
        nom: participantData.last_name.trim(),
        email: participantData.email.trim(),
        tel: participantData.contact_number,
        status: statut,
        qr_code_url: qrCodeUrl,
        participant_id: participantData.id,
        app_url: appUrl,
        receipt_url: `${appUrl}/confirmation/${participantData.id}`,
        
        to_name: `${participantData.first_name} ${participantData.last_name}`,
        from_name: "IFTAR 2024",
        reply_to: "ne-pas-repondre@lacitadelle.ci"
      };

      console.log("Paramètres pour EmailJS (confirmation après validation):", templateParams);
      console.log("URL de confirmation:", confirmationUrl);
      console.log("URL du QR code:", qrCodeUrl);

      // Utilisation du template de confirmation de paiement avec QR code
      const response = await emailjs.send(
        PAYMENT_CONFIRMATION_EMAILJS_SERVICE_ID,
        PAYMENT_CONFIRMATION_EMAILJS_TEMPLATE_ID,
        templateParams,
        PAYMENT_CONFIRMATION_EMAILJS_PUBLIC_KEY
      );

      console.log("Email de confirmation avec QR code envoyé avec succès:", response);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email de confirmation au participant:", error);
      throw error;
    }
  };

  const handleRefresh = () => {
    fetchPendingPayments();
    toast({
      title: "Liste actualisée",
      description: "La liste des paiements a été actualisée",
    });
  };

  return {
    payments,
    filteredPayments,
    currentPayment,
    searchQuery,
    isLoading,
    isSubmitting,
    isRejecting,
    isValidating,
    error,
    totalPayments,
    handleSearch,
    validatePayment,
    rejectPayment,
    handleRefresh,
    setCurrentPayment,
  };
};
