
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
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Zap } from "lucide-react";
import { type Participant } from "../../../types/participant";
import { performQuickPayment } from "@/hooks/payment-validation/quickPaymentService";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PaymentMethod, PaymentNumbers } from "@/components/manual-payment/types";
import { PAYMENT_NUMBERS } from "@/components/manual-payment/config";

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("WAVE");
  const [phoneNumber, setPhoneNumber] = useState("");

  if (!participant) {
    return null;
  }

  // Initialiser le numéro de téléphone du participant lorsque le dialogue s'ouvre
  if (open && phoneNumber === "" && participant.contact_number) {
    // Supprimer le préfixe +225 si présent
    const cleanNumber = participant.contact_number.replace("+225", "");
    setPhoneNumber(cleanNumber);
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

    // Validation du numéro de téléphone
    if (!phoneNumber || phoneNumber.length !== 10) {
      toast({
        title: "Numéro de téléphone invalide",
        description: "Veuillez entrer un numéro de téléphone valide (10 chiffres).",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const success = await performQuickPayment(
        participant.id,
        participant.email,
        phoneNumber,
        paymentMethod
      );

      if (success) {
        toast({
          title: "Paiement effectué",
          description: "Le paiement a été validé et un email de confirmation a été envoyé au participant.",
        });
        // Réinitialiser le dialogue
        setConfirmPayment(false);
        setPaymentMethod("WAVE");
        setPhoneNumber("");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Paiement Rapide
          </DialogTitle>
          <DialogDescription>
            Validation rapide du paiement via mobile money avec envoi automatique du QR code
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
            <h3 className="text-sm font-medium mb-3">Méthode de paiement</h3>
            <Select 
              value={paymentMethod} 
              onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir une méthode de paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ORANGE">
                  Orange Money ({PAYMENT_NUMBERS.ORANGE})
                </SelectItem>
                <SelectItem value="MOOV">
                  Moov Money ({PAYMENT_NUMBERS.MOOV})
                </SelectItem>
                <SelectItem value="WAVE">
                  Wave ({PAYMENT_NUMBERS.WAVE})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium">
                Numéro utilisé pour le paiement
              </Label>
              <Input
                id="phoneNumber"
                type="text"
                value={phoneNumber}
                onChange={(e) => {
                  // Permettre uniquement des chiffres et limiter à 10
                  const value = e.target.value.replace(/\D/g, '').substring(0, 10);
                  setPhoneNumber(value);
                }}
                placeholder="Ex: 0759567966"
              />
              <p className="text-xs text-gray-500">
                Entrez les 10 chiffres sans le préfixe +225
              </p>
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
                Je confirme que le paiement de 30.000 FCFA a été effectué via {paymentMethod === "ORANGE" ? "Orange Money" : paymentMethod === "MOOV" ? "Moov Money" : "Wave"}
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
            disabled={isProcessing || !confirmPayment || !phoneNumber}
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
