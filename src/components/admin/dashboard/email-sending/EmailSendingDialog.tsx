
// Service d'envoi d'emails pour les participants
// Mise à jour: Correction des erreurs de type
// Mise à jour: Correction des importations manquantes

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  sendPersonalThanksEmail,
  sendPublicThanksEmail 
} from "@/components/manual-payment/services/emails/thanksEmailService";
import { type Participant } from "@/types/participant";
import { EmailSendResult } from "@/components/manual-payment/services/emails/types";

interface EmailSendingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
  activeTab: "private" | "public";
  personalMessage: string;
  publicMessage: string;
}

export const EmailSendingDialog = ({
  open,
  onOpenChange,
  participants,
  activeTab,
  personalMessage,
  publicMessage
}: EmailSendingDialogProps) => {
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({
    total: 0,
    sent: 0,
    failed: 0
  });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (open && participants.length > 0) {
      handleSendEmails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, participants.length]);

  const handleSendEmails = async () => {
    if (participants.length === 0) {
      toast({
        title: "Aucun participant sélectionné",
        description: "Veuillez sélectionner au moins un participant pour envoyer des emails.",
        variant: "destructive",
      });
      onOpenChange(false);
      return;
    }

    setIsSending(true);
    setProgress({
      total: participants.length,
      sent: 0,
      failed: 0
    });

    try {
      if (activeTab === "private") {
        // Envoi d'emails personnalisés individuels
        let sentCount = 0;
        let failedCount = 0;

        for (const participant of participants) {
          try {
            const result = await sendPersonalThanksEmail(participant, personalMessage);
            
            if (result) {
              sentCount++;
            } else {
              failedCount++;
            }
            
            setProgress(prev => ({
              ...prev,
              sent: sentCount,
              failed: failedCount
            }));
          } catch (error) {
            console.error(`Erreur lors de l'envoi à ${participant.email}:`, error);
            failedCount++;
            setProgress(prev => ({
              ...prev,
              failed: failedCount
            }));
          }
        }
      } else {
        // Envoi d'un email public à tous les participants
        const result = await sendPublicThanksEmail(participants, publicMessage);
        
        setProgress(prev => ({
          ...prev,
          sent: result.success,
          failed: result.failed
        }));
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi des emails:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi des emails.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      setIsComplete(true);
    }
  };

  const handleClose = () => {
    setIsComplete(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isSending ? "Envoi des emails en cours..." : isComplete ? "Emails envoyés" : "Confirmation d'envoi"}
          </DialogTitle>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleClose}
            disabled={isSending}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {isSending ? (
            <div className="space-y-4">
              <div className="flex justify-between mb-2">
                <span>Progression :</span>
                <span>{Math.floor((progress.sent + progress.failed) / progress.total * 100)}%</span>
              </div>
              
              <progress
                className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
                value={progress.sent + progress.failed}
                max={progress.total}
              />
              
              <div className="text-sm text-gray-500">
                Envoi en cours... {progress.sent + progress.failed} / {progress.total}
              </div>
            </div>
          ) : isComplete ? (
            <div className="space-y-4">
              <p className="text-center mb-4">
                Les emails ont été envoyés avec succès à {progress.sent} participants.
                {progress.failed > 0 && ` ${progress.failed} envois ont échoué.`}
              </p>
              
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Envoyés: {progress.sent}</span>
                {progress.failed > 0 && (
                  <span className="text-red-600">Échoués: {progress.failed}</span>
                )}
              </div>
              
              <Button
                className="w-full"
                onClick={handleClose}
              >
                Fermer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p>
                Vous êtes sur le point d'envoyer des emails à {participants.length} participants.
                Voulez-vous continuer ?
              </p>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSendEmails}
                >
                  Envoyer
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
