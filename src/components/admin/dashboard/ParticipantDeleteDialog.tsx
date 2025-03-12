
// Dialogue de confirmation pour la suppression d'un participant
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { type Participant } from "@/types/participant";

interface ParticipantDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participant: Participant | null;
  onSuccess?: () => void;
}

export function ParticipantDeleteDialog({ 
  open, 
  onOpenChange,
  participant,
  onSuccess
}: ParticipantDeleteDialogProps) {
  const [deleteCode, setDeleteCode] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const SECURITY_CODE = "010203"; // Code de sécurité pour la suppression

  const handleDeleteParticipant = async () => {
    if (!participant) return;
    
    if (deleteCode !== SECURITY_CODE) {
      toast({
        title: "Code incorrect",
        description: "Le code de sécurité saisi est incorrect.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Supprimer dans l'ordre pour respecter les contraintes de clé étrangère
      
      // 1. D'abord les paiements manuels
      const { error: manualPaymentsError } = await supabase
        .from('manual_payments')
        .delete()
        .eq('participant_id', participant.id);

      if (manualPaymentsError) throw manualPaymentsError;
      
      // 2. Puis les paiements normaux
      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .eq('participant_id', participant.id);

      if (paymentsError) throw paymentsError;
      
      // 3. Les check-ins si cette table existe
      try {
        await supabase
          .from('check_ins')
          .delete()
          .eq('participant_id', participant.id);
      } catch (checkInError) {
        // Si cette table n'existe pas ou si une erreur se produit, on continue
        console.log("Note: check_ins n'a pas pu être vidée ou n'existe pas", checkInError);
      }

      // 4. Enfin le participant
      const { error: participantError } = await supabase
        .from('participants')
        .delete()
        .eq('id', participant.id);

      if (participantError) throw participantError;
      
      onOpenChange(false);
      setDeleteCode("");
      
      toast({
        title: "Participant supprimé",
        description: `${participant.first_name} ${participant.last_name} a été supprimé avec succès.`,
      });

      // Appeler la fonction de callback de succès si elle existe
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du participant:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le participant. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Confirmation de suppression</DialogTitle>
          <DialogDescription>
            Cette action supprimera <strong>{participant?.first_name} {participant?.last_name}</strong> de la base de données. 
            Cette opération est irréversible.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="mb-4 text-sm text-muted-foreground">
            Pour confirmer cette action, veuillez saisir le code de sécurité :
          </p>
          <Input
            value={deleteCode}
            onChange={(e) => setDeleteCode(e.target.value)}
            placeholder="Entrez le code de sécurité"
            className="mb-2"
            type="password"
          />
          <p className="text-xs text-destructive">
            Attention : Le participant et toutes ses données de paiement seront définitivement supprimés.
          </p>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setDeleteCode("");
            }}
            className="sm:order-1"
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteParticipant}
            disabled={isDeleting}
            className="sm:order-2"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Confirmer la suppression
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
