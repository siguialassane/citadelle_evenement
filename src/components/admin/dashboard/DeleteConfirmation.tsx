
// Composant pour confirmer la suppression des participants
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

interface DeleteConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteConfirmation = ({ 
  open, 
  onOpenChange 
}: DeleteConfirmationProps) => {
  const [deleteCode, setDeleteCode] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const SECURITY_CODE = "010203"; // Code de sécurité pour la suppression

  const handleDeleteAllParticipants = async () => {
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
      // Supprimer d'abord les paiements (en raison des contraintes de clé étrangère)
      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .neq('id', ''); // Condition toujours vraie pour supprimer tous les enregistrements

      if (paymentsError) throw paymentsError;

      // Supprimer ensuite les participants
      const { error: participantsError } = await supabase
        .from('participants')
        .delete()
        .neq('id', ''); // Condition toujours vraie pour supprimer tous les enregistrements

      if (participantsError) throw participantsError;
      
      onOpenChange(false);
      setDeleteCode("");
      
      toast({
        title: "Base de données vidée",
        description: "Tous les participants ont été supprimés avec succès.",
      });

      // Force page refresh to update the UI
      window.location.reload();
    } catch (error) {
      console.error("Erreur lors de la suppression des participants:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les participants. Veuillez réessayer.",
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
            Cette action supprimera <strong>tous les participants</strong> de la base de données. 
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
            Attention : Tous les participants et leurs données de paiement seront définitivement supprimés.
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
            onClick={handleDeleteAllParticipants}
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
};
