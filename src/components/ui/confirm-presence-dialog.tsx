
// Dialogue de confirmation de présence avec vérification de code
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
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ConfirmPresenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantId: string;
  participantName: string;
  onSuccess: () => void;
}

export function ConfirmPresenceDialog({
  open,
  onOpenChange,
  participantId,
  participantName,
  onSuccess,
}: ConfirmPresenceDialogProps) {
  const [code, setCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const SECURITY_CODE = "009"; // Code de validation fixe
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (code !== SECURITY_CODE) {
      setError("Code de validation incorrect");
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Mettre à jour le statut de présence du participant
      const { error } = await supabase
        .from('participants')
        .update({ 
          check_in_status: true,
          check_in_timestamp: new Date().toISOString()
        })
        .eq('id', participantId);
      
      if (error) throw error;
      
      // Enregistrer le check-in
      const { error: checkInError } = await supabase
        .from('check_ins')
        .insert([
          { 
            participant_id: participantId,
            checked_in_at: new Date().toISOString(),
            checked_by: 'self-check-in',
            notes: 'Auto-validation via code'
          }
        ]);
      
      if (checkInError) throw checkInError;
      
      setSuccess(true);
      toast({
        title: "Présence confirmée",
        description: "Votre présence a été enregistrée avec succès.",
        variant: "default",
      });
      
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 2000);
      
    } catch (err: any) {
      console.error("Erreur lors de la confirmation de présence:", err);
      setError(err.message || "Une erreur est survenue lors de la confirmation de votre présence.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmer votre présence</DialogTitle>
          <DialogDescription>
            Veuillez entrer le code de validation pour confirmer votre présence à l'événement.
          </DialogDescription>
        </DialogHeader>
        
        {success ? (
          <div className="flex flex-col items-center justify-center py-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
            <p className="text-center text-lg font-medium text-green-700">Présence confirmée !</p>
            <p className="text-center text-gray-500">Merci de votre participation</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="py-4">
              <p className="mb-2 text-sm text-gray-700">
                Participant: <span className="font-medium">{participantName}</span>
              </p>
              <Input
                id="code"
                placeholder="Entrez le code de validation"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mb-4"
                disabled={isProcessing}
                autoComplete="off"
              />
              
              {error && (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              
              <p className="text-sm text-gray-500">
                Ce code vous a été communiqué par l'organisateur de l'événement.
              </p>
            </div>
            
            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isProcessing}
              >
                Annuler
              </Button>
              <Button 
                type="submit"
                disabled={isProcessing || !code}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  'Confirmer ma présence'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
