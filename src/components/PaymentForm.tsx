
import { z } from "zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { initiateCinetPayPayment } from "@/integrations/cinetpay/api";

// Définition du schéma de validation
const paymentSchema = z.object({
  paymentMethod: z.enum(["wave", "orange_money", "moov_money", "mtn_money"], {
    required_error: "Veuillez sélectionner une méthode de paiement",
  }),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

// Définition des constantes
const PAYMENT_AMOUNT = 1000; // Montant fixé à 1000 XOF
const PAYMENT_METHODS = [
  {
    id: "wave",
    name: "Wave",
    icon: "/lovable-uploads/6b003492-4875-44bb-bef8-3feecf36716e.png",
    description: "Payer via votre compte Wave",
  },
  {
    id: "orange_money",
    name: "Orange Money",
    icon: "/lovable-uploads/860c57aa-e79f-4298-97a8-84c1792cf18f.png",
    description: "Payer via Orange Money",
  },
  {
    id: "moov_money",
    name: "Moov Money",
    icon: "/lovable-uploads/10df0067-62c4-48ed-bd2d-2559bb5dbf71.png",
    description: "Payer via Moov Money",
  },
  {
    id: "mtn_money",
    name: "MTN Money",
    icon: "/lovable-uploads/b2c951b6-9240-4fd5-86ee-052c25606c40.png",
    description: "Payer via MTN Money",
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

  // Nettoyer les éventuels scripts CinetPay lors du démontage
  useEffect(() => {
    return () => {
      // Supprimer les éléments CinetPay qui pourraient avoir été ajoutés au DOM
      const cinetPayScripts = document.querySelectorAll('script[src*="cinetpay"]');
      cinetPayScripts.forEach(script => script.remove());
    };
  }, []);

  async function onSubmit(data: PaymentFormValues) {
    try {
      setIsProcessing(true);

      // Initialiser le paiement avec CinetPay
      console.log("Initialisation du paiement avec CinetPay:", data.paymentMethod);
      console.log("Pour le participant:", participant.id);
      console.log("Montant:", PAYMENT_AMOUNT, "XOF");

      // Appeler l'API CinetPay pour initialiser le paiement
      const cinetPayResponse = await initiateCinetPayPayment(
        participant,
        PAYMENT_AMOUNT,
        data.paymentMethod
      );

      if (cinetPayResponse.code !== "201") {
        throw new Error(`Erreur CinetPay: ${cinetPayResponse.message} - ${cinetPayResponse.description}`);
      }

      // Enregistrer les détails du paiement dans Supabase
      const { data: paymentRecord, error } = await supabase
        .from('payments')
        .insert({
          participant_id: participant.id,
          amount: PAYMENT_AMOUNT,
          payment_method: data.paymentMethod,
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
        throw error;
      }

      // Rediriger l'utilisateur vers la page de paiement CinetPay
      window.location.href = cinetPayResponse.data.payment_url;
      
    } catch (error: any) {
      console.error("Erreur lors du traitement du paiement:", error);
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
                                <div className="flex items-center space-x-3">
                                  <img 
                                    src={method.icon} 
                                    alt={`Logo ${method.name}`} 
                                    className="h-10 w-auto object-contain"
                                  />
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
