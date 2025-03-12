
// Ce composant contient le formulaire de saisie du numéro de paiement et des commentaires

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
  // État local pour afficher les erreurs de validation
  const [phoneError, setPhoneError] = useState<string | null>(null);
  
  // Fonction pour valider le format du numéro de téléphone
  const validatePhoneNumber = (value: string) => {
    // Retirer tout ce qui n'est pas un chiffre
    const digits = value.replace(/\D/g, "");
    
    // Vérifier si le nombre de chiffres est exact (10)
    if (digits.length !== 10) {
      setPhoneError("Le numéro doit contenir exactement 10 chiffres");
      return false;
    } else {
      setPhoneError(null);
      return true;
    }
  };
  
  // Gérer le changement du numéro de téléphone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Limiter à 10 chiffres maximum
    const input = e.target.value;
    const digits = input.replace(/\D/g, "");
    const formatted = digits.substring(0, 10);
    
    setPhoneNumber(formatted);
    validatePhoneNumber(formatted);
  };
  
  // Gérer la soumission du formulaire avec validation
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valider le numéro avant de soumettre
    if (validatePhoneNumber(phoneNumber)) {
      handleSubmit(e);
    }
  };
  
  return (
    <form onSubmit={handleFormSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">3</span>
        <span className="text-xl font-semibold text-red-600">PRECISEZ SVP LE NUMERO DE TELEPHONE AYANT SERVI AU PAIEMENT</span>
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
            onChange={handlePhoneChange}
            required
            className={`w-full ${phoneError ? 'border-red-500' : ''}`}
          />
          {phoneError && (
            <p className="text-sm text-red-500 mt-1">{phoneError}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Entrez les 10 chiffres sans le préfixe +225
          </p>
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
          disabled={isProcessing || !!phoneError}
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
