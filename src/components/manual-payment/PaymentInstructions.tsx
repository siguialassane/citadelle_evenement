
// Ce composant affiche les instructions de paiement

import { Button } from "@/components/ui/button";
import { Info, Copy, Check } from "lucide-react";
import { PaymentMethod, PaymentNumbers, CopyStates } from "./types";

type PaymentInstructionsProps = {
  paymentMethod: PaymentMethod;
  paymentNumbers: PaymentNumbers;
  isCopied: CopyStates;
  copyToClipboard: (text: string, key: string) => void;
  paymentAmount: number;
};

export function PaymentInstructions({
  paymentMethod,
  paymentNumbers,
  isCopied,
  copyToClipboard,
  paymentAmount
}: PaymentInstructionsProps) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">2</span>
        Effectuez votre paiement
      </h3>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-md border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Montant à payer:</span>
            <span className="font-bold text-green-700">{paymentAmount.toLocaleString()} XOF</span>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Numéro de réception:</span>
            <div className="flex items-center">
              <span className="mr-2">{paymentNumbers[paymentMethod]}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(paymentNumbers[paymentMethod], 'number')}
              >
                {isCopied['number'] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-start p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <Info className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-yellow-700">
            <p><strong>Important:</strong> Veuillez tenir compte des frais qui pourraient être appliqués par l'opérateur lors de votre transfert mobile money. Assurez-vous d'envoyer un montant suffisant pour couvrir le coût total.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
