
// Ce composant gère la sélection de la méthode de paiement

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PiggyBank } from "lucide-react";
import { PaymentMethod, PaymentNumbers } from "./types";

type PaymentMethodSelectorProps = {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  paymentNumbers: PaymentNumbers;
};

export function PaymentMethodSelector({ 
  paymentMethod, 
  setPaymentMethod, 
  paymentNumbers 
}: PaymentMethodSelectorProps) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">1</span>
        Choisissez votre méthode de paiement
      </h3>
      
      <RadioGroup 
        value={paymentMethod} 
        onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className={`p-4 border rounded-lg flex flex-col items-center ${paymentMethod === "MTN" ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}>
          <RadioGroupItem value="MTN" id="mtn" className="sr-only" />
          <Label htmlFor="mtn" className="cursor-pointer w-full">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <PiggyBank className="h-6 w-6 text-white" />
              </div>
              <div className="font-medium">MTN Mobile Money</div>
              <div className="text-sm text-gray-500 mt-2">{paymentNumbers.MTN}</div>
            </div>
          </Label>
        </div>
        
        <div className={`p-4 border rounded-lg flex flex-col items-center ${paymentMethod === "MOOV" ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}>
          <RadioGroupItem value="MOOV" id="moov" className="sr-only" />
          <Label htmlFor="moov" className="cursor-pointer w-full">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <PiggyBank className="h-6 w-6 text-white" />
              </div>
              <div className="font-medium">Moov Money</div>
              <div className="text-sm text-gray-500 mt-2">{paymentNumbers.MOOV}</div>
            </div>
          </Label>
        </div>
        
        <div className={`p-4 border rounded-lg flex flex-col items-center ${paymentMethod === "WAVE" ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}>
          <RadioGroupItem value="WAVE" id="wave" className="sr-only" />
          <Label htmlFor="wave" className="cursor-pointer w-full">
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <PiggyBank className="h-6 w-6 text-white" />
              </div>
              <div className="font-medium">Wave</div>
              <div className="text-sm text-gray-500 mt-2">{paymentNumbers.WAVE}</div>
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
