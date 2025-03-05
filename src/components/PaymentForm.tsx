
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { initiateCinetPayPayment } from "@/integrations/cinetpay/api";

// Définition des constantes
const PAYMENT_AMOUNT = 1000; // Montant fixé à 1000 XOF

type PaymentFormProps = {
  participant: any;
};

export function PaymentForm({ participant }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  console.log("PaymentForm: Mounted with participant ID:", participant.id);

  // Nettoyer les éventuels scripts CinetPay lors du démontage
  useEffect(() => {
    console.log("PaymentForm: Setting up cleanup function");
    return () => {
      // Supprimer les éléments CinetPay qui pourraient avoir été ajoutés au DOM
      const cinetPayScripts = document.querySelectorAll('script[src*="cinetpay"]');
      console.log("PaymentForm: Cleanup - Removing", cinetPayScripts.length, "CinetPay scripts");
      cinetPayScripts.forEach(script => script.remove());
    };
  }, []);

  async function handlePayment() {
    try {
      console.log("PaymentForm: Payment process started");
      setIsProcessing(true);

      console.log("PaymentForm: Initialisation du paiement avec CinetPay");
      console.log("PaymentForm: Pour le participant:", participant.id);
      console.log("PaymentForm: Nom complet:", participant.first_name, participant.last_name);
      console.log("PaymentForm: Email:", participant.email);
      console.log("PaymentForm: Numéro de téléphone:", participant.contact_number);
      console.log("PaymentForm: Montant:", PAYMENT_AMOUNT, "XOF");

      // Par défaut, utiliser tous les canaux disponibles
      const paymentMethod = "ALL";
      console.log("PaymentForm: Méthode de paiement sélectionnée:", paymentMethod);

      // Appeler l'API CinetPay pour initialiser le paiement
      console.log("PaymentForm: Appel à initiateCinetPayPayment...");
      const cinetPayResponse = await initiateCinetPayPayment(
        participant,
        PAYMENT_AMOUNT,
        paymentMethod
      );

      console.log("PaymentForm: Réponse reçue de initiateCinetPayPayment:", cinetPayResponse);

      if (cinetPayResponse.code !== "201") {
        console.error("PaymentForm: Erreur CinetPay - code:", cinetPayResponse.code);
        console.error("PaymentForm: Erreur CinetPay - message:", cinetPayResponse.message);
        console.error("PaymentForm: Erreur CinetPay - description:", cinetPayResponse.description);
        throw new Error(`Erreur CinetPay: ${cinetPayResponse.message} - ${cinetPayResponse.description}`);
      }

      // Enregistrer les détails du paiement dans Supabase
      console.log("PaymentForm: Enregistrement du paiement dans Supabase", {
        participant_id: participant.id,
        amount: PAYMENT_AMOUNT,
        payment_method: paymentMethod,
        transaction_id: cinetPayResponse.api_response_id,
        cinetpay_token: cinetPayResponse.data.payment_token,
        cinetpay_payment_url: cinetPayResponse.data.payment_url
      });

      const { data: paymentRecord, error } = await supabase
        .from('payments')
        .insert({
          participant_id: participant.id,
          amount: PAYMENT_AMOUNT,
          payment_method: paymentMethod,
          status: 'pending', // Le statut sera mis à jour après confirmation du paiement
          transaction_id: cinetPayResponse.api_response_id,
          cinetpay_token: cinetPayResponse.data.payment_token,
          cinetpay_payment_url: cinetPayResponse.data.payment_url,
          cinetpay_api_response_id: cinetPayResponse.api_response_id,
          currency: "XOF"
        })
        .select()
        .single();

      if (error) {
        console.error("PaymentForm: Erreur Supabase lors de l'insertion du paiement:", error);
        throw error;
      }

      console.log("PaymentForm: Paiement enregistré avec succès. ID:", paymentRecord.id);
      console.log("PaymentForm: Redirection vers la page de paiement CinetPay:", cinetPayResponse.data.payment_url);

      // Rediriger l'utilisateur vers la page de paiement CinetPay
      window.location.href = cinetPayResponse.data.payment_url;
      
    } catch (error: any) {
      console.error("PaymentForm: Erreur lors du traitement du paiement:", error);
      console.error("PaymentForm: Stack trace:", error.stack);
      toast({
        title: "Erreur de paiement",
        description: error.message || "Une erreur est survenue lors du traitement de votre paiement.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Paiement</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between mb-2">
            <span className="font-medium">Montant à payer:</span>
            <span className="font-bold">{PAYMENT_AMOUNT.toLocaleString()} XOF</span>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            En cliquant sur le bouton ci-dessous, vous serez redirigé vers la plateforme de paiement CinetPay.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handlePayment} 
          className="w-full" 
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Traitement en cours...
            </>
          ) : (
            `Payer ${PAYMENT_AMOUNT.toLocaleString()} XOF`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
