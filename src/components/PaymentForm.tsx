
// Commentaires: Ce fichier simule temporairement le paiement pour les tests
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

// Définition des constantes
const PAYMENT_AMOUNT = 1000; // Montant fixé à 1000 XOF

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

      // Afficher un message de succès
      toast({
        title: "Paiement simulé réussi",
        description: "Le paiement a été simulé avec succès pour les tests.",
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
        <p>Mode test : La simulation créera un paiement réussi dans la base de données.</p>
      </CardFooter>
    </Card>
  );
}
