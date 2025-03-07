
// Ce composant contient le formulaire de saisie du numéro de paiement et des commentaires

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type PaymentFormProps = {
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  comments: string;
  setComments: (value: string) => void;
  isProcessing: boolean;
  handleSubmit: (e: React.FormEvent) => void;
};

export function PaymentForm({
  phoneNumber,
  setPhoneNumber,
  comments,
  setComments,
  isProcessing,
  handleSubmit
}: PaymentFormProps) {
  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">3</span>
        Soumettez votre paiement
      </h3>
      
      <div className="space-y-4">
        {/* Numéro utilisé pour le paiement */}
        <div>
          <Label htmlFor="phoneNumber" className="block mb-1">
            Numéro utilisé pour le paiement <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phoneNumber"
            type="text"
            placeholder="Ex: 0701234567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            className="w-full"
          />
        </div>
        
        {/* Commentaires (optionnel) */}
        <div>
          <Label htmlFor="comments" className="block mb-1">
            Commentaires (optionnel)
          </Label>
          <Textarea
            id="comments"
            placeholder="Ex: Salam, je viens d'effectuer le paiement"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full"
            rows={3}
          />
        </div>
        
        {/* Bouton de soumission */}
        <Button 
          type="submit" 
          className="w-full"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Traitement en cours...
            </>
          ) : (
            "Soumettre mon paiement"
          )}
        </Button>
      </div>
    </form>
  );
}
