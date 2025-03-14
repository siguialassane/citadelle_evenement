
// Composant pour afficher le dialogue de paiement rapide
// Ce dialogue permet de valider rapidement un paiement avec un minimum d'interaction

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Zap } from "lucide-react";
import { type Participant } from "../../../types/participant";
import { performQuickPayment } from "@/hooks/payment-validation/quickPaymentService";

interface QuickPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participant: Participant | null;
  onSuccess?: () => void;
}

export const QuickPaymentDialog = ({
  open,
  onOpenChange,
  participant,
  onSuccess
}: QuickPaymentDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmPayment, setConfirmPayment] = useState(false);

  if (!participant) {
    return null;
  }

  const handleProcessPayment = async () => {
    if (!confirmPayment) {
      toast({
        title: "Confirmation requise",
        description: "Veuillez confirmer que vous souhaitez effectuer ce paiement rapide.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const success = await performQuickPayment(
        participant.id,
        participant.email,
        participant.contact_number
      );

      if (success) {
        toast({
          title: "Paiement effectué",
          description: "Le paiement a été validé et un email de confirmation a été envoyé au participant.",
        });
        // Réinitialiser le dialogue
        setConfirmPayment(false);
        onOpenChange(false);
        
        // Notifier le composant parent pour rafraîchir les données
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error("Erreur lors du paiement rapide:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du traitement du paiement.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Extraire le numéro de téléphone sans préfixe international si nécessaire
  const phoneNumber = participant.contact_number.replace("+225", "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Paiement Rapide
          </DialogTitle>
          <DialogDescription>
            Validation rapide du paiement via WAVE avec envoi automatique du QR code
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Participant</h3>
            <p className="text-sm">
              {participant.first_name} {participant.last_name}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Email</h3>
              <p className="text-sm truncate">{participant.email}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Téléphone</h3>
              <p className="text-sm">{participant.contact_number}</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Détails du paiement</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <h4 className="text-xs text-gray-500">Méthode</h4>
                <p className="text-sm font-medium">WAVE</p>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-xs text-gray-500">Téléphone utilisé</h4>
                <p className="text-sm font-medium">{phoneNumber}</p>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="confirmPayment" 
                checked={confirmPayment} 
                onCheckedChange={(checked) => setConfirmPayment(checked as boolean)}
              />
              <Label htmlFor="confirmPayment">
                Je confirme que le paiement de 30.000 FCFA a été effectué via WAVE
              </Label>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Annuler
          </Button>
          
          <Button
            type="submit"
            disabled={isProcessing || !confirmPayment}
            onClick={handleProcessPayment}
            className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Valider le paiement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
