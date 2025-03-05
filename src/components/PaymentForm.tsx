
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Définition des constantes
const PAYMENT_AMOUNT = 1000; // Montant fixé à 1000 XOF
const CINETPAY_SITE_ID = "105889251";
const CINETPAY_API_KEY = "152913513467c83763ee8962.23212316";
const CINETPAY_CHECKOUT_URL = "https://checkout.cinetpay.com";

type PaymentFormProps = {
  participant: any;
};

export function PaymentForm({ participant }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const navigate = useNavigate();

  console.log("PaymentForm: Participant ID:", participant.id);

  // Nettoyer les éventuels scripts CinetPay lors du démontage
  useEffect(() => {
    return () => {
      // Supprimer les éléments CinetPay qui pourraient avoir été ajoutés au DOM
      const cinetPayScripts = document.querySelectorAll('script[src*="cinetpay"]');
      cinetPayScripts.forEach(script => script.remove());
    };
  }, []);

  // Fonction pour générer un ID de transaction unique
  const generateTransactionId = () => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000000);
    return `TR${timestamp}${random}`;
  };

  async function handlePayment() {
    try {
      // Réinitialiser les erreurs précédentes
      setPaymentError(null);
      setIsProcessing(true);
      
      console.log("PaymentForm: Initiation du paiement CinetPay");
      
      // Génération d'un ID de transaction unique
      const transactionId = generateTransactionId();
      console.log("PaymentForm: ID de transaction:", transactionId);
      
      // URL de base de l'application pour les redirections
      const baseUrl = window.location.origin;
      const returnUrl = `${baseUrl}/confirmation/${participant.id}`;
      const notifyUrl = `${baseUrl}/api/webhooks/cinetpay/notification`;
      
      // Enregistrer le paiement dans Supabase comme "pending"
      try {
        const { error } = await supabase
          .from('payments')
          .insert({
            participant_id: participant.id,
            amount: PAYMENT_AMOUNT,
            payment_method: "MOBILE_MONEY",
            status: 'pending',
            transaction_id: transactionId,
            currency: "XOF"
          });

        if (error) {
          console.error("PaymentForm: Erreur Supabase lors de l'insertion du paiement:", error);
          throw error;
        }
        
        console.log("PaymentForm: Paiement enregistré dans Supabase");
      } catch (dbError: any) {
        console.error("PaymentForm: Erreur base de données:", dbError);
        toast({
          title: "Attention",
          description: "Problème d'enregistrement du paiement. Veuillez réessayer.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      // Création des paramètres pour l'initialisation de CinetPay
      const cinetpayParams = {
        transaction_id: transactionId,
        amount: PAYMENT_AMOUNT,
        currency: "XOF",
        channels: "MOBILE_MONEY",
        description: `Paiement pour ${participant.first_name} ${participant.last_name}`,
        
        // Informations client
        customer_name: participant.first_name,
        customer_surname: participant.last_name,
        customer_email: participant.email,
        customer_phone_number: participant.contact_number.replace(/\s+/g, '').replace(/^\+/, ''),
        
        // URLs de retour et notification
        return_url: returnUrl,
        notify_url: notifyUrl,
        
        // Options CinetPay
        lang: "fr",
        metadata: JSON.stringify({ participant_id: participant.id })
      };
      
      // Création de l'URL de redirection CinetPay avec les paramètres dans l'URL
      const queryParams = new URLSearchParams({
        apikey: CINETPAY_API_KEY,
        site_id: CINETPAY_SITE_ID
      }).toString();
      
      // Construction de l'URL de redirection
      const redirectUrl = `${CINETPAY_CHECKOUT_URL}/payment?${queryParams}`;
      
      // Créer un formulaire pour la redirection POST vers CinetPay
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = redirectUrl;
      form.style.display = 'none';
      
      // Ajout des paramètres au formulaire
      Object.entries(cinetpayParams).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });
      
      // Ajout du formulaire au DOM et soumission
      document.body.appendChild(form);
      console.log("PaymentForm: Redirection vers CinetPay...", redirectUrl);
      console.log("PaymentForm: Paramètres", cinetpayParams);
      form.submit();
      
    } catch (error: any) {
      console.error("PaymentForm: Erreur lors du traitement du paiement:", error);
      
      setPaymentError(error.message || "Une erreur est survenue lors du traitement de votre paiement.");
      
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
        {paymentError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de paiement</AlertTitle>
            <AlertDescription>{paymentError}</AlertDescription>
          </Alert>
        )}
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
