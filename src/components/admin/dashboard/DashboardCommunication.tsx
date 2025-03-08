
// Composant de communication entre dashboards
// Permet d'envoyer un message à l'autre dashboard administrateur
// Ajouté pour faciliter la communication entre administrateurs

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DashboardCommunicationProps {
  variant?: "default" | "outline";
}

export const DashboardCommunication = ({ variant = "default" }: DashboardCommunicationProps) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "Message vide",
        description: "Veuillez saisir un message",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSending(true);
      
      // Simulation d'envoi de message (à remplacer par la vraie logique d'envoi)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé au dashboard principal",
      });
      
      setMessage("");
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant === "outline" ? "outline" : "dashboard"} className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Dashboard Principal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Communication Dashboard</DialogTitle>
          <DialogDescription>
            Envoyez un message au dashboard principal pour communiquer avec les autres administrateurs.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Votre message..."
            className="min-h-32"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleSendMessage} 
            disabled={isSending}
            className="w-full sm:w-auto"
          >
            {isSending ? (
              <>Envoi en cours...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
