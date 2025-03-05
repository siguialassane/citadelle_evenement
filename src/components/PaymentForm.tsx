
// Commentaires: Ce fichier a été mis à jour pour utiliser l'intégration Seamless de CinetPay
// au lieu de l'API REST. Cela permet d'afficher le guichet de paiement directement sur la page
// sans redirection complète.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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

// Vérification que l'objet CinetPay est disponible
declare global {
  interface Window {
    CinetPay: any;
  }
}

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

  // Initialiser CinetPay une fois au chargement du composant
  useEffect(() => {
    if (window.CinetPay) {
      console.log("PaymentForm: Initialisation de CinetPay Seamless");
      try {
        window.CinetPay.setConfig({
          apikey: import.meta.env.VITE_CINETPAY_API_KEY || '',
          site_id: import.meta.env.VITE_CINETPAY_SITE_ID || '',
          notify_url: `${window.location.origin}/api/webhooks/cinetpay/notification`,
          mode: import.meta.env.VITE_CINETPAY_MODE || 'PRODUCTION',
          close_after_response: true
        });
        console.log("PaymentForm: CinetPay Seamless initialisé avec succès");
      } catch (error) {
        console.error("PaymentForm: Erreur lors de l'initialisation de CinetPay Seamless:", error);
      }
    } else {
      console.error("PaymentForm: CinetPay Seamless SDK n'est pas chargé");
      setPaymentError("Le SDK CinetPay n'est pas correctement chargé. Veuillez rafraîchir la page.");
    }

    // Nettoyer les éventuels scripts CinetPay lors du démontage
    return () => {
      console.log("PaymentForm: Nettoyage des ressources CinetPay");
    };
  }, []);

  async function onSubmit(values: PaymentFormValues) {
    try {
      // Réinitialiser les erreurs précédentes
      setPaymentError(null);
      console.log("PaymentForm: Processus de paiement démarré");
      setIsProcessing(true);

      // Générer un ID de transaction unique
      const transactionId = `TX-${participant.id.slice(0, 8)}-${Date.now()}`;
      
      console.log("PaymentForm: Préparation du paiement avec CinetPay Seamless");
      console.log("PaymentForm: Pour le participant:", participant.id);
      console.log("PaymentForm: Nom complet:", participant.first_name, participant.last_name);
      console.log("PaymentForm: Email:", participant.email);
      console.log("PaymentForm: Numéro de téléphone:", participant.contact_number);
      console.log("PaymentForm: Montant:", PAYMENT_AMOUNT, "XOF");
      console.log("PaymentForm: Méthode de paiement sélectionnée:", values.paymentMethod);
      console.log("PaymentForm: Transaction ID:", transactionId);

      // Formater le numéro de téléphone (supprimez les espaces et le préfixe "+")
      const formattedPhoneNumber = participant.contact_number
        .replace(/\s+/g, '')  // Supprimer tous les espaces
        .replace(/^\+/, '');  // Supprimer le préfixe "+"

      // Enregistrer la transaction dans Supabase avant d'afficher le guichet
      try {
        console.log("PaymentForm: Enregistrement du paiement dans Supabase");
        const { data: paymentRecord, error } = await supabase
          .from('payments')
          .insert({
            participant_id: participant.id,
            amount: PAYMENT_AMOUNT,
            payment_method: values.paymentMethod,
            status: 'pending',
            transaction_id: transactionId,
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

      // Appel au SDK Seamless pour afficher le guichet de paiement
      if (window.CinetPay) {
        console.log("PaymentForm: Affichage du guichet CinetPay Seamless");
        window.CinetPay.getCheckout({
          transaction_id: transactionId,
          amount: PAYMENT_AMOUNT,
          currency: 'XOF',
          channels: values.paymentMethod,
          description: `Paiement inscription - ${participant.first_name} ${participant.last_name}`,
          // Informations du client pour le paiement par carte bancaire
          customer_name: participant.first_name,
          customer_surname: participant.last_name,
          customer_email: participant.email,
          customer_phone_number: formattedPhoneNumber,
          customer_address: "Adresse non spécifiée",
          customer_city: "Abidjan",
          customer_country: "CI", // Code ISO pour la Côte d'Ivoire
          customer_state: "CI",
          customer_zip_code: "00000",
          // Métadonnées pour identification ultérieure
          metadata: JSON.stringify({
            participant_id: participant.id
          })
        });

        // Configurer le callback pour gérer la réponse de paiement
        window.CinetPay.waitResponse(function(data: any) {
          console.log("PaymentForm: Réponse reçue de CinetPay:", data);
          setIsProcessing(false);
          
          if (data.status === "REFUSED") {
            console.log("PaymentForm: Paiement refusé");
            setPaymentError("Votre paiement a été refusé. Veuillez réessayer ou choisir un autre moyen de paiement.");
            toast({
              title: "Paiement refusé",
              description: "Votre paiement n'a pas pu être effectué. Veuillez réessayer.",
              variant: "destructive",
            });
          } 
          else if (data.status === "ACCEPTED") {
            console.log("PaymentForm: Paiement accepté");
            toast({
              title: "Paiement réussi",
              description: "Votre paiement a été effectué avec succès!",
              variant: "default",
            });
            
            // Mettre à jour le statut du paiement dans Supabase
            supabase
              .from('payments')
              .update({ 
                status: 'completed',
                operator_id: data.operator_id || null,
                payment_date: data.payment_date || new Date().toISOString(),
                payment_method: data.payment_method || values.paymentMethod
              })
              .eq('transaction_id', transactionId)
              .then(({ error }) => {
                if (error) {
                  console.error("PaymentForm: Erreur lors de la mise à jour du paiement:", error);
                } else {
                  console.log("PaymentForm: Statut du paiement mis à jour avec succès");
                }
              });
            
            // Rediriger vers la page de confirmation
            navigate(`/confirmation/${participant.id}`);
          }
        });

        // Configurer le callback d'erreur
        window.CinetPay.onError(function(error: any) {
          console.error("PaymentForm: Erreur CinetPay:", error);
          setIsProcessing(false);
          setPaymentError("Une erreur est survenue avec le service de paiement. Veuillez réessayer.");
          toast({
            title: "Erreur de paiement",
            description: "Une erreur est survenue lors du traitement de votre paiement.",
            variant: "destructive",
          });
        });
      } else {
        throw new Error("Le service de paiement n'est pas disponible. Veuillez rafraîchir la page.");
      }
      
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
            pour procéder au paiement sécurisé.
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
