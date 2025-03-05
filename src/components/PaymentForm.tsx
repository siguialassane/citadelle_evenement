
import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, SmartphoneIcon } from "lucide-react";

// Définition du schéma de validation
const paymentSchema = z.object({
  paymentMethod: z.enum(["wave", "orange_money", "moov_money", "mtn_money", "bank_card"], {
    required_error: "Veuillez sélectionner une méthode de paiement",
  }),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

// Définition des constantes
const PAYMENT_AMOUNT = 5000; // Montant fixe en XOF
const PAYMENT_METHODS = [
  {
    id: "wave",
    name: "Wave",
    icon: <SmartphoneIcon className="h-5 w-5 text-blue-500" />,
    description: "Payer via votre compte Wave",
  },
  {
    id: "orange_money",
    name: "Orange Money",
    icon: <SmartphoneIcon className="h-5 w-5 text-orange-500" />,
    description: "Payer via Orange Money",
  },
  {
    id: "moov_money",
    name: "Moov Money",
    icon: <SmartphoneIcon className="h-5 w-5 text-purple-500" />,
    description: "Payer via Moov Money",
  },
  {
    id: "mtn_money",
    name: "MTN Money",
    icon: <SmartphoneIcon className="h-5 w-5 text-yellow-500" />,
    description: "Payer via MTN Money",
  },
  {
    id: "bank_card",
    name: "Carte bancaire",
    icon: <CreditCard className="h-5 w-5 text-gray-500" />,
    description: "Payer avec votre carte bancaire",
  },
];

type PaymentFormProps = {
  participant: any;
};

export function PaymentForm({ participant }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: undefined,
    },
  });

  async function onSubmit(data: PaymentFormValues) {
    try {
      setIsProcessing(true);

      // Simuler l'intégration avec Flutterwave
      // Dans un cas réel, vous appelleriez ici l'API Flutterwave pour initialiser le paiement
      console.log("Initialisation du paiement avec:", data.paymentMethod);
      console.log("Pour le participant:", participant.id);
      console.log("Montant:", PAYMENT_AMOUNT, "XOF");

      // Simulation d'un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Enregistrer le paiement dans Supabase (statut en attente)
      const { data: paymentRecord, error } = await supabase
        .from('payments')
        .insert({
          participant_id: participant.id,
          amount: PAYMENT_AMOUNT,
          payment_method: data.paymentMethod,
          status: 'pending', // Le statut sera mis à jour après confirmation du paiement
          transaction_id: `SIM-${Date.now()}`, // Dans un cas réel, ce serait fourni par Flutterwave
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // En environnement de production, vous redirigeriez vers la page de paiement de Flutterwave
      // Pour la démo, nous simulons un paiement réussi
      
      // Mettre à jour le statut du paiement (simulé comme réussi)
      const { error: updateError } = await supabase
        .from('payments')
        .update({ status: 'success' })
        .eq('id', paymentRecord.id);

      if (updateError) {
        throw updateError;
      }

      // Notification de succès
      toast({
        title: "Paiement traité avec succès",
        description: "Votre inscription a été confirmée. Vous allez recevoir un email de confirmation.",
      });

      // Redirection vers une page de confirmation
      navigate(`/confirmation/${participant.id}`);
      
    } catch (error: any) {
      console.error("Erreur lors du traitement du paiement:", error);
      toast({
        title: "Erreur de paiement",
        description: error.message || "Une erreur est survenue lors du traitement de votre paiement.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Méthode de paiement</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Sélectionnez une méthode de paiement</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-3"
                      >
                        {PAYMENT_METHODS.map((method) => (
                          <div key={method.id} className="flex">
                            <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 w-full">
                              <FormControl>
                                <RadioGroupItem value={method.id} />
                              </FormControl>
                              <div className="flex flex-1 items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {method.icon}
                                  <div>
                                    <FormLabel className="text-base">{method.name}</FormLabel>
                                    <p className="text-sm text-gray-500">{method.description}</p>
                                  </div>
                                </div>
                              </div>
                            </FormItem>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Montant à payer:</span>
                <span className="font-bold">{PAYMENT_AMOUNT.toLocaleString()} XOF</span>
              </div>
              <p className="text-sm text-gray-500">
                Le paiement est sécurisé par Flutterwave. Aucune information bancaire n'est stockée sur nos serveurs.
              </p>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={form.handleSubmit(onSubmit)} 
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
