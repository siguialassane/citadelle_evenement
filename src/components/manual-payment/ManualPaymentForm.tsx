
// Ce fichier est le point d'entrée principal du formulaire de paiement manuel
// Il utilise les composants plus petits et le hook personnalisé pour gérer la logique

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { PaymentInstructions } from "./PaymentInstructions";
import { PaymentForm } from "./PaymentForm";
import { useManualPayment } from "./useManualPayment";
import { PAYMENT_AMOUNT, PAYMENT_NUMBERS } from "./config";
import { ManualPaymentFormProps } from "./types";

export function ManualPaymentForm({ participant }: ManualPaymentFormProps) {
  const {
    isProcessing,
    paymentMethod,
    setPaymentMethod,
    phoneNumber,
    setPhoneNumber,
    comments,
    setComments,
    transactionReference,
    isCopied,
    copyToClipboard,
    handleSubmit
  } = useManualPayment(participant);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">
          Paiement Mobile Money
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Étape 1: Choisir le mode de paiement */}
          <PaymentMethodSelector 
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            paymentNumbers={PAYMENT_NUMBERS}
          />
          
          {/* Étape 2: Instructions de paiement */}
          <PaymentInstructions 
            paymentMethod={paymentMethod}
            paymentNumbers={PAYMENT_NUMBERS}
            transactionReference={transactionReference}
            isCopied={isCopied}
            copyToClipboard={copyToClipboard}
            paymentAmount={PAYMENT_AMOUNT}
          />
          
          {/* Étape 3: Formulaire de soumission */}
          <PaymentForm 
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            comments={comments}
            setComments={setComments}
            isProcessing={isProcessing}
            handleSubmit={handleSubmit}
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col items-start text-xs text-gray-500">
        <p>
          La validation de votre paiement peut prendre jusqu'à 24 heures. Vous recevrez un email de confirmation une fois le paiement validé.
        </p>
      </CardFooter>
    </Card>
  );
}
