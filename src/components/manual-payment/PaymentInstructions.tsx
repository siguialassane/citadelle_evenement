
// Ce composant affiche les instructions de paiement et les numéros à utiliser
// Correction: Amélioration de la compatibilité mobile
// Correction: Ajout de meilleure visibilité pour les numéros de téléphone

import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PaymentMethod, PaymentNumbers, CopyStates } from "./types";

type PaymentInstructionsProps = {
  paymentMethod: PaymentMethod;
  paymentNumbers: PaymentNumbers;
  paymentAmount: number;
  isCopied: CopyStates;
  copyToClipboard: (text: string, key: string) => void;
};

export function PaymentInstructions({
  paymentMethod,
  paymentNumbers,
  paymentAmount,
  isCopied,
  copyToClipboard
}: PaymentInstructionsProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const phoneNumber = paymentNumbers[paymentMethod];
  
  return (
    <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center flex-wrap">
        <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">2</span>
        <span className="text-base sm:text-xl font-semibold text-red-600">SUIVEZ CES INSTRUCTIONS POUR EFFECTUER VOTRE PAIEMENT</span>
      </h3>
      
      <div className="space-y-5">
        <div className="rounded-md bg-blue-50 p-4 border border-blue-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-blue-700">
                Vous allez effectuer un transfert de <span className="font-bold">{formatAmount(paymentAmount)} FCFA</span> via {paymentMethod}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <h4 className="text-lg font-semibold text-green-700 mb-4">Étapes à suivre</h4>
          <ol className="list-decimal pl-5 space-y-3 text-sm sm:text-base">
            <li className="mb-2">Ouvrez votre application {paymentMethod} sur votre téléphone</li>
            <li className="mb-2">Sélectionnez "Envoyer de l'argent" ou "Transfert"</li>
            <li className="mb-2">
              Entrez le numéro suivant: 
              <div className="bg-gray-100 p-3 my-2 rounded-md flex items-center justify-between">
                <span className="font-mono text-lg text-green-800 font-bold">{phoneNumber}</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(phoneNumber, 'phoneNumber')}
                  className="flex items-center gap-1"
                >
                  {isCopied['phoneNumber'] ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span className="hidden sm:inline">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="hidden sm:inline">Copier</span>
                    </>
                  )}
                </Button>
              </div>
            </li>
            <li className="mb-2">
              Entrez le montant: 
              <div className="bg-gray-100 p-3 my-2 rounded-md flex items-center justify-between">
                <span className="font-mono text-lg text-green-800 font-bold">{formatAmount(paymentAmount)} FCFA</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(paymentAmount.toString(), 'amount')}
                  className="flex items-center gap-1"
                >
                  {isCopied['amount'] ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span className="hidden sm:inline">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="hidden sm:inline">Copier</span>
                    </>
                  )}
                </Button>
              </div>
            </li>
            <li className="mb-2">Validez votre paiement en entrant votre code secret</li>
            <li>Une fois le transfert effectué, continuez ci-dessous pour soumettre votre paiement</li>
          </ol>
        </div>

        <Alert className="bg-amber-50 border-amber-200">
          <AlertDescription className="text-amber-700">
            N'oubliez pas de conserver votre reçu ou référence de transaction comme preuve de paiement.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
