
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { initiateCinetPayPayment } from "@/integrations/cinetpay/api";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Définition des constantes
const PAYMENT_AMOUNT = 1000; // Montant fixé à 1000 XOF

// Schéma de validation pour le formulaire de paiement
const paymentFormSchema = z.object({
  paymentMethod: z.enum(["ALL", "MOBILE_MONEY", "CREDIT_CARD"], {
    required_error: "Veuillez sélectionner une méthode de paiement"
  })
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

type PaymentFormProps = {
  participant: any;
};

export function PaymentForm({ participant }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const navigate = useNavigate();

  console.log("PaymentForm: Mounted with participant ID:", participant.id);

  // Initialiser le formulaire avec react-hook-form et zod
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMethod: "ALL" // Par défaut, tous les moyens de paiement
    }
  });

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

  async function onSubmit(values: PaymentFormValues) {
    try {
      // Réinitialiser les erreurs précédentes
      setPaymentError(null);
      console.log("PaymentForm: Payment process started");
      setIsProcessing(true);

      console.log("PaymentForm: Initialisation du paiement avec CinetPay");
      console.log("PaymentForm: Pour le participant:", participant.id);
      console.log("PaymentForm: Nom complet:", participant.first_name, participant.last_name);
      console.log("PaymentForm: Email:", participant.email);
      console.log("PaymentForm: Numéro de téléphone:", participant.contact_number);
      console.log("PaymentForm: Montant:", PAYMENT_AMOUNT, "XOF");
      console.log("PaymentForm: Méthode de paiement sélectionnée:", values.paymentMethod);

      // Appeler l'API CinetPay pour initialiser le paiement
      console.log("PaymentForm: Appel à initiateCinetPayPayment...");
      
      let cinetPayResponse;
      try {
        cinetPayResponse = await initiateCinetPayPayment(
          participant,
          PAYMENT_AMOUNT,
          values.paymentMethod
        );
        console.log("PaymentForm: Réponse reçue de initiateCinetPayPayment:", cinetPayResponse);
      } catch (apiError: any) {
        console.error("PaymentForm: Erreur lors de l'appel à l'API CinetPay:", apiError);
        throw new Error(`Erreur de communication avec CinetPay: ${apiError.message}`);
      }

      if (!cinetPayResponse) {
        throw new Error("Aucune réponse reçue de CinetPay");
      }

      if (cinetPayResponse.code !== "201") {
        console.error("PaymentForm: Erreur CinetPay - code:", cinetPayResponse.code);
        console.error("PaymentForm: Erreur CinetPay - message:", cinetPayResponse.message);
        console.error("PaymentForm: Erreur CinetPay - description:", cinetPayResponse.description);
        throw new Error(`Erreur CinetPay: ${cinetPayResponse.message} - ${cinetPayResponse.description}`);
      }

      // Vérifier les données essentielles dans la réponse
      if (!cinetPayResponse.data || !cinetPayResponse.data.payment_url || !cinetPayResponse.data.payment_token) {
        console.error("PaymentForm: Données manquantes dans la réponse CinetPay:", cinetPayResponse);
        throw new Error("Données manquantes dans la réponse CinetPay");
      }

      // Enregistrer les détails du paiement dans Supabase
      console.log("PaymentForm: Enregistrement du paiement dans Supabase", {
        participant_id: participant.id,
        amount: PAYMENT_AMOUNT,
        payment_method: values.paymentMethod,
        transaction_id: cinetPayResponse.api_response_id,
        cinetpay_token: cinetPayResponse.data.payment_token,
        cinetpay_payment_url: cinetPayResponse.data.payment_url
      });

      try {
        const { data: paymentRecord, error } = await supabase
          .from('payments')
          .insert({
            participant_id: participant.id,
            amount: PAYMENT_AMOUNT,
            payment_method: values.paymentMethod,
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
      } catch (dbError: any) {
        console.error("PaymentForm: Erreur de base de données:", dbError);
        // Ne pas bloquer le flux de paiement si l'enregistrement en base échoue
        toast({
          title: "Attention",
          description: "Le paiement peut continuer mais nous avons rencontré un problème pour enregistrer les détails.",
          variant: "destructive",
        });
      }

      console.log("PaymentForm: Redirection vers la page de paiement CinetPay:", cinetPayResponse.data.payment_url);

      // Rediriger l'utilisateur vers la page de paiement CinetPay
      window.location.href = cinetPayResponse.data.payment_url;
      
    } catch (error: any) {
      console.error("PaymentForm: Erreur lors du traitement du paiement:", error);
      console.error("PaymentForm: Stack trace:", error.stack);
      
      // Capturer le message d'erreur pour l'afficher dans l'interface
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
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <div className="flex justify-between mb-2">
            <span className="font-medium">Montant à payer:</span>
            <span className="font-bold">{PAYMENT_AMOUNT.toLocaleString()} XOF</span>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Choisissez votre méthode de paiement préférée et cliquez sur le bouton ci-dessous 
            pour être redirigé vers la plateforme de paiement sécurisée.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Méthode de paiement</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="ALL" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Tous les moyens de paiement
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="MOBILE_MONEY" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Mobile Money (Orange Money, MTN Mobile Money, Moov Money)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="CREDIT_CARD" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Carte bancaire (Visa, Mastercard)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
