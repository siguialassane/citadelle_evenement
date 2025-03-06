
// Commentaires: Ce fichier gère la simulation du paiement et l'envoi d'emails de confirmation via EmailJS
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
import emailjs from '@emailjs/browser';

// Définition des constantes
const PAYMENT_AMOUNT = 1000; // Montant fixé à 1000 XOF

// Configuration EmailJS
const EMAILJS_SERVICE_ID = "service_is5645q";
const EMAILJS_TEMPLATE_ID = "template_dwx7qnw"; // Template standard
const EMAILJS_PAYMENT_TEMPLATE_ID = "template_xvdr1iq"; // Template de paiement
const EMAILJS_PUBLIC_KEY = "j9nKf3IoZXvL8mSae";

// Schéma de validation pour le formulaire de paiement
const paymentFormSchema = z.object({
  paymentMethod: z.enum(["MOBILE_MONEY", "CREDIT_CARD", "ALL"], {
    required_error: "Veuillez sélectionner une méthode de paiement"
  })
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

type PaymentFormProps = {
  participant: any;
};

export function PaymentForm({ participant }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  console.log("PaymentForm: Simulation de paiement pour le participant ID:", participant.id);

  // Initialiser le formulaire avec react-hook-form et zod
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMethod: "MOBILE_MONEY"
    }
  });

  // Fonction pour envoyer un email de confirmation
  const sendConfirmationEmail = async (participantData: any, paymentData: any, qrCodeId: string) => {
    try {
      console.log("Préparation de l'envoi d'email de confirmation via EmailJS");
      
      // Vérifier que l'email du participant existe
      if (!participantData.email) {
        console.error("Erreur: L'adresse email du participant est manquante");
        return false;
      }

      // Log plus détaillé de l'objet participant pour le débogage
      console.log("Données du participant:", JSON.stringify(participantData));
      
      const templateParams = {
        to_name: `${participantData.first_name} ${participantData.last_name}`,
        to_email: participantData.email.trim(), // S'assurer qu'il n'y a pas d'espaces
        from_name: "La Citadelle",
        from_email: "no-reply@lacitadelle.ci", // Email d'expéditeur (peut être fictif pour les tests)
        payment_amount: `${PAYMENT_AMOUNT.toLocaleString()} XOF`,
        payment_method: paymentData.payment_method,
        transaction_id: paymentData.transaction_id,
        payment_date: new Date().toLocaleString(),
        qr_code_id: qrCodeId,
        event_name: "Conférence La Citadelle",
        reply_to: "info@lacitadelle.ci" // Adresse pour les réponses
      };

      console.log("Paramètres du template EmailJS:", JSON.stringify(templateParams));
      
      // Vérification supplémentaire avant l'envoi
      if (!templateParams.to_email) {
        throw new Error("L'adresse email du destinataire est vide");
      }
      
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_PAYMENT_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      console.log("Email envoyé avec succès:", response);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      return false;
    }
  };

  async function onSubmit(values: PaymentFormValues) {
    try {
      console.log("PaymentForm: Début de la simulation du paiement");
      setIsProcessing(true);

      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Générer un ID de transaction simulé
      const transactionId = `SIM-${participant.id.slice(0, 8)}-${Date.now()}`;
      
      // Simuler l'enregistrement du paiement dans Supabase
      const { data: paymentRecord, error } = await supabase
        .from('payments')
        .insert({
          participant_id: participant.id,
          amount: PAYMENT_AMOUNT,
          payment_method: values.paymentMethod,
          status: 'completed', // Simuler un paiement réussi
          transaction_id: transactionId,
          currency: "XOF"
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Générer un QR code pour le participant
      const qrCodeId = `QR-${participant.id}-${Date.now()}`;
      const { error: participantUpdateError } = await supabase
        .from('participants')
        .update({
          qr_code_id: qrCodeId
        })
        .eq('id', participant.id);

      if (participantUpdateError) {
        console.error("Erreur lors de la mise à jour du participant:", participantUpdateError);
      }

      // Envoyer un email de confirmation
      const emailSent = await sendConfirmationEmail(participant, paymentRecord, qrCodeId);
      
      if (emailSent) {
        console.log("Email de confirmation envoyé avec succès");
      } else {
        console.warn("L'email de confirmation n'a pas pu être envoyé, mais le paiement a été enregistré");
      }

      // Afficher un message de succès
      toast({
        title: "Paiement simulé réussi",
        description: "Le paiement a été simulé avec succès. Un email de confirmation a été envoyé.",
        variant: "default",
      });
      
      // Rediriger vers la page de confirmation
      navigate(`/confirmation/${participant.id}`);
      
    } catch (error: any) {
      console.error("PaymentForm: Erreur lors de la simulation:", error);
      toast({
        title: "Erreur de simulation",
        description: error.message || "Une erreur est survenue lors de la simulation du paiement.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Simulation de Paiement</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <div className="flex justify-between mb-2">
            <span className="font-medium">Montant à payer:</span>
            <span className="font-bold">{PAYMENT_AMOUNT.toLocaleString()} XOF</span>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Mode test : Le paiement sera simulé automatiquement comme réussi.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Méthode de paiement (simulation)</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="MOBILE_MONEY" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Mobile Money (Orange Money, MTN Mobile Money, Moov Money, Wave)
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
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="ALL" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Tous les moyens de paiement
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
                  Simulation en cours...
                </>
              ) : (
                `Simuler le paiement de ${PAYMENT_AMOUNT.toLocaleString()} XOF`
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-start text-xs text-gray-500">
        <p>Mode test : La simulation créera un paiement réussi dans la base de données et enverra un email de confirmation.</p>
      </CardFooter>
    </Card>
  );
}
