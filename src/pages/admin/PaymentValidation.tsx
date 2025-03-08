// Ce fichier gère la page d'administration pour la validation des paiements manuels
// Il permet aux administrateurs de voir les paiements en attente, de consulter les informations
// et de valider ou rejeter les paiements

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  SearchIcon, 
  XCircle,
  AlertCircle
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import emailjs from '@emailjs/browser';
import { v4 as uuidv4 } from 'uuid';
import { 
  PARTICIPANT_EMAILJS_SERVICE_ID, 
  PARTICIPANT_EMAILJS_TEMPLATE_ID, 
  PARTICIPANT_EMAILJS_PUBLIC_KEY 
} from "@/components/manual-payment/config";
import { PARTICIPANT_PAYMENT_CONFIRMATION_TEMPLATE } from "@/components/manual-payment/EmailTemplates";

interface Payment {
  id: string;
  participant_id: string;
  amount: number;
  payment_method: string;
  phone_number: string;
  status: string;
  comments: string;
  created_at: string;
  participant_name: string;
  participant_email: string;
  participant_phone: string;
  participant: any;
}

const PaymentValidation = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { paymentId } = useParams();
  const navigate = useNavigate();

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
        .eq('status', 'pending');

      if (paymentsError) throw paymentsError;

      if (!paymentsData || paymentsData.length === 0) {
        toast({
          title: "Aucun paiement en attente",
          description: "Il n'y a aucun paiement en attente de validation pour le moment.",
        });
        setPayments([]);
        setFilteredPayments([]);
        return;
      }

      const formattedPayments = paymentsData.map(payment => ({
        id: payment.id,
        participant_id: payment.participant_id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        phone_number: payment.phone_number,
        status: payment.status,
        comments: payment.comments,
        created_at: new Date(payment.created_at).toLocaleString(),
        participant_name: `${payment.participants.first_name} ${payment.participants.last_name}`,
        participant_email: payment.participants.email,
        participant_phone: payment.participants.contact_number,
        participant: payment.participants
      }));

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

      const formattedPayment = {
        id: paymentData.id,
        participant_id: paymentData.participant_id,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        phone_number: paymentData.phone_number,
        status: paymentData.status,
        comments: paymentData.comments,
        created_at: new Date(paymentData.created_at).toLocaleString(),
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
        .update({ status: 'completed' })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      if (!currentPayment) {
        throw new Error("Données de paiement manquantes");
      }

      const { error: participantError } = await supabase
        .from('participants')
        .update({ 
          payment_status: 'completed',
          qr_code_id: uuidv4()
        })
        .eq('id', currentPayment.participant_id);

      if (participantError) throw participantError;

      const { data: participantData, error: fetchError } = await supabase
        .from('participants')
        .select('*')
        .eq('id', currentPayment.participant_id)
        .single();

      if (fetchError) throw fetchError;
      if (!participantData) throw new Error("Participant non trouvé");

      await sendConfirmationEmail(participantData, participantData.qr_code_id);

      toast({
        title: "Paiement validé avec succès",
        description: `Un email de confirmation a été envoyé à ${currentPayment.participant_email}`,
        variant: "default",
      });

      if (paymentId) {
        fetchPaymentById(paymentId);
      } else {
        fetchPendingPayments();
      }

    } catch (error: any) {
      console.error("Erreur lors de la validation du paiement:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la validation du paiement",
        variant: "destructive",
      });
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

      if (paymentId) {
        fetchPaymentById(paymentId);
      } else {
        fetchPendingPayments();
      }

    } catch (error: any) {
      console.error("Erreur lors du rejet du paiement:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du rejet du paiement",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const sendConfirmationEmail = async (participantData: any, qrCodeId: string) => {
    try {
      console.log("Envoi de l'email de confirmation au participant...");
      
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
        
        to_name: `${participantData.first_name} ${participantData.last_name}`,
        from_name: "IFTAR 2024",
        reply_to: "ne-pas-repondre@lacitadelle.ci"
      };

      console.log("Paramètres pour EmailJS (participant):", templateParams);
      console.log("URL de confirmation:", confirmationUrl);
      console.log("URL du QR code:", qrCodeUrl);

      const response = await emailjs.send(
        PARTICIPANT_EMAILJS_SERVICE_ID,
        PARTICIPANT_EMAILJS_TEMPLATE_ID,
        templateParams,
        PARTICIPANT_EMAILJS_PUBLIC_KEY
      );

      console.log("Email de confirmation envoyé avec succès:", response);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email au participant:", error);
      throw error;
    }
  };

  const handleBackToList = () => {
    navigate("/admin/payment-validation");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="mx-auto h-6 w-6 animate-spin text-gray-500" />
          <p className="mt-2 text-sm text-gray-500">Chargement des paiements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex items-center justify-between">
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={handleBackToList}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Button>
        
        {!paymentId && (
          <div className="relative w-64">
            <Input
              type="text"
              placeholder="Rechercher un participant..."
              value={searchQuery}
              onChange={handleSearch}
              className="pr-10"
            />
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          </div>
        )}
      </div>

      {filteredPayments.length === 0 && !isLoading ? (
        <Alert variant="default">
          <AlertTitle>Aucun paiement trouvé</AlertTitle>
          <AlertDescription>
            Aucun paiement ne correspond à votre recherche.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPayments.map((payment) => (
            <Card key={payment.id}>
              <CardHeader>
                <CardTitle>
                  {payment.participant_name}
                </CardTitle>
                <CardDescription>
                  {payment.participant_email}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    Méthode: {payment.payment_method}
                  </p>
                  <p className="text-sm text-gray-500">
                    Montant: {payment.amount} XOF
                  </p>
                  <p className="text-sm text-gray-500">
                    Téléphone: {payment.phone_number}
                  </p>
                  <p className="text-sm text-gray-500">
                    Date: {payment.created_at}
                  </p>
                  <Separator />
                  <p className="text-sm text-gray-500">
                    Commentaires: {payment.comments || "Aucun commentaire"}
                  </p>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button 
                  variant="ghost"
                  onClick={() => rejectPayment(payment.id)}
                  disabled={isRejecting}
                >
                  {isRejecting ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Rejet en cours...
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Rejeter
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={() => validatePayment(payment.id)}
                  disabled={isValidating}
                >
                  {isValidating ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Validation...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Valider
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentValidation;
