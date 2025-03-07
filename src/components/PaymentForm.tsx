
// Ce fichier contient le formulaire de paiement original
// Il a été remplacé par la fonctionnalité de paiement manuel
// Les dépendances CinetPay ont été supprimées car nous utilisons maintenant un système de paiement manuel

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CreditCard, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

type PaymentFormProps = {
  participant: any;
};

const PaymentForm = ({ participant }: PaymentFormProps) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transaction, setTransaction] = useState<{
    id: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    // Fonction simplifiée pour créer une transaction sans CinetPay
    const initializeTransaction = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Déterminer le montant à payer en fonction du statut de membre
        const amount = participant.is_member ? 10000 : 15000;

        // Créer une entrée de paiement dans la base de données
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .insert({
            participant_id: participant.id,
            amount: amount,
            status: 'pending',
            payment_method: 'manual',
            transaction_id: `IFTAR-${Date.now().toString(36).toUpperCase()}`
          })
          .select('*')
          .single();

        if (paymentError) {
          throw paymentError;
        }

        setTransaction({
          id: paymentData.id,
          amount: amount
        });

      } catch (err: any) {
        console.error("Erreur lors de l'initialisation de la transaction:", err);
        setError(err.message || "Une erreur s'est produite lors de l'initialisation du paiement.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeTransaction();
  }, [participant]);

  const handleProceedToPayment = () => {
    // Rediriger vers la page de paiement manuel en attente
    navigate(`/payment-pending/${participant.id}`);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" /> Détails du paiement
        </CardTitle>
        <CardDescription>Veuillez procéder au paiement pour finaliser votre inscription</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-sm">Participation à l'Iftar</div>
            <div className="text-sm font-medium text-right">
              {participant.is_member ? "10,000" : "15,000"} XOF
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="text-base font-semibold">Total</div>
            <div className="text-base font-bold text-right text-green-600">
              {participant.is_member ? "10,000" : "15,000"} XOF
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleProceedToPayment} 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? "Préparation du paiement..." : "Procéder au paiement"}
          {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PaymentForm;
