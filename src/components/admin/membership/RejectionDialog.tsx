
// Dialogue pour saisir la raison du rejet d'une adhésion
// Ajouté pour améliorer l'expérience utilisateur et envoyer des emails de rejet personnalisés

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { XCircle } from 'lucide-react';

interface RejectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  membershipId: string | null;
}

const RejectionDialog: React.FC<RejectionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  membershipId
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = () => {
    if (!reason.trim()) {
      setReason("Votre demande ne correspond pas à nos critères d'adhésion actuels.");
    }
    
    setIsSubmitting(true);
    onConfirm(reason.trim() || "Votre demande ne correspond pas à nos critères d'adhésion actuels.");
    setIsSubmitting(false);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
            Rejeter la demande d'adhésion
          </DialogTitle>
          <DialogDescription>
            Veuillez fournir une raison pour le rejet de cette demande. Cette information sera incluse dans l'email envoyé au participant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Raison du rejet</Label>
            <Textarea
              id="rejection-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Votre demande ne correspond pas à nos critères d'adhésion actuels."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            Confirmer le rejet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectionDialog;
