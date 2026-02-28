// Composant de sélection du nombre de places (1-10)

import { Minus, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PAYMENT_AMOUNT } from "./config";

type PlaceSelectorProps = {
  numberOfPlaces: number;
  setNumberOfPlaces: (n: number) => void;
};

export function PlaceSelector({ numberOfPlaces, setNumberOfPlaces }: PlaceSelectorProps) {
  const totalAmount = numberOfPlaces * PAYMENT_AMOUNT;

  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">1</span>
        Nombre de places
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setNumberOfPlaces(Math.max(1, numberOfPlaces - 1))}
            disabled={numberOfPlaces <= 1}
            className="h-10 w-10"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2 min-w-[100px] justify-center">
            <Users className="h-5 w-5 text-green-600" />
            <span className="text-3xl font-bold text-green-700">{numberOfPlaces}</span>
            <span className="text-gray-500">place{numberOfPlaces > 1 ? 's' : ''}</span>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setNumberOfPlaces(Math.min(10, numberOfPlaces + 1))}
            disabled={numberOfPlaces >= 10}
            className="h-10 w-10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="bg-white p-4 rounded-md border border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            {numberOfPlaces} place{numberOfPlaces > 1 ? 's' : ''} × {PAYMENT_AMOUNT.toLocaleString()} FCFA
          </p>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {totalAmount.toLocaleString()} FCFA
          </p>
        </div>

        {numberOfPlaces > 1 && (
          <p className="text-xs text-gray-500 text-center">
            Vous devrez renseigner le nom de chaque invité à l'étape suivante
          </p>
        )}
      </div>
    </div>
  );
}
