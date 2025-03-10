
// Ce composant gère la sélection de la méthode de paiement
// Mise à jour: Augmentation de la taille des images pour une meilleure visibilité
// Mise à jour: Correction des images inversées entre Wave et Orange Money

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
        <div className={`p-4 border rounded-lg flex flex-col items-center ${paymentMethod === "ORANGE" ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}>
          <RadioGroupItem value="ORANGE" id="orange" className="sr-only" />
          <Label htmlFor="orange" className="cursor-pointer w-full">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-2">
                <img 
                  src="/lovable-uploads/860c57aa-e79f-4298-97a8-84c1792cf18f.png" 
                  alt="Orange Money" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="font-medium">Orange Money</div>
              <div className="text-sm text-gray-500 mt-2">{paymentNumbers.ORANGE}</div>
            </div>
          </Label>
        </div>
        
        <div className={`p-4 border rounded-lg flex flex-col items-center ${paymentMethod === "MOOV" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
          <RadioGroupItem value="MOOV" id="moov" className="sr-only" />
          <Label htmlFor="moov" className="cursor-pointer w-full">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-2">
                <img 
                  src="/lovable-uploads/dad97159-25eb-40ed-9b77-fc76570cf1ee.png" 
                  alt="Moov Money" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="font-medium">Moov Money</div>
              <div className="text-sm text-gray-500 mt-2">{paymentNumbers.MOOV}</div>
            </div>
          </Label>
        </div>
        
        <div className={`p-4 border rounded-lg flex flex-col items-center ${paymentMethod === "WAVE" ? "border-teal-500 bg-teal-50" : "border-gray-200"}`}>
          <RadioGroupItem value="WAVE" id="wave" className="sr-only" />
          <Label htmlFor="wave" className="cursor-pointer w-full">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-2">
                <img 
                  src="/lovable-uploads/b9ea8b89-890d-460c-b608-1a123b2052a9.png" 
                  alt="Wave" 
                  className="w-full h-full object-contain"
                />
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

