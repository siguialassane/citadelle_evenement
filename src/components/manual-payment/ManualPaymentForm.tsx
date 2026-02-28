
// Ce fichier est le point d'entrée principal du formulaire de paiement manuel
// Il utilise les composants plus petits et le hook personnalisé pour gérer la logique
// Mise à jour: Support multi-places avec sélection du nombre et noms des invités

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { PaymentInstructions } from "./PaymentInstructions";
import { PaymentForm } from "./PaymentForm";
import { PlaceSelector } from "./PlaceSelector";
import { GuestForm } from "./GuestForm";
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
    isCopied,
    copyToClipboard,
    handleSubmit,
    numberOfPlaces,
    setNumberOfPlaces,
    guests,
    setGuests,
    totalAmount,
  } = useManualPayment(participant);

  // Numéro d'étape dynamique selon le nombre de places
  const hasMultipleGuests = numberOfPlaces > 1;
  const paymentMethodStep = hasMultipleGuests ? 3 : 2;
  const instructionsStep = hasMultipleGuests ? 4 : 3;
  const formStep = hasMultipleGuests ? 5 : 4;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">
          Paiement Mobile Money
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Étape 1: Nombre de places */}
          <PlaceSelector 
            numberOfPlaces={numberOfPlaces}
            setNumberOfPlaces={setNumberOfPlaces}
          />

          {/* Étape 2: Noms des invités (si > 1 place) */}
          {hasMultipleGuests && (
            <GuestForm 
              guests={guests}
              setGuests={setGuests}
              participantName={`${participant.first_name} ${participant.last_name}`}
            />
          )}
          
          {/* Étape N: Choisir le mode de paiement */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">{paymentMethodStep}</span>
              Choisissez votre mode de paiement
            </h3>
            <PaymentMethodSelector 
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              paymentNumbers={PAYMENT_NUMBERS}
            />
          </div>
          
          {/* Étape N+1: Instructions de paiement */}
          <PaymentInstructions 
            paymentMethod={paymentMethod}
            paymentNumbers={PAYMENT_NUMBERS}
            isCopied={isCopied}
            copyToClipboard={copyToClipboard}
            paymentAmount={totalAmount}
            stepNumber={instructionsStep}
          />
          
          {/* Étape N+2: Formulaire de soumission */}
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
