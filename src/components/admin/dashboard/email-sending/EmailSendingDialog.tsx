
// Dialogue principal pour l'envoi d'emails
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { ParticipantSelector } from "./ParticipantSelector";
import { MessageComposer } from "./MessageComposer";
import { MessagePreview } from "./MessagePreview";
import { SendingProgress } from "./SendingProgress";
import { sendPersonalThanksEmail, sendPublicThanksEmail } from "@/components/manual-payment/services/emails/thanksEmailService";
import { type Participant } from "@/types/participant";

interface EmailSendingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
}

export function EmailSendingDialog({ open, onOpenChange, participants }: EmailSendingDialogProps) {
  const [activeTab, setActiveTab] = useState<"private" | "public">("private");
  const [selectedParticipants, setSelectedParticipants] = useState<Participant[]>([]);
  const [hiddenParticipants, setHiddenParticipants] = useState<string[]>([]); // IDs des participants masqués
  const [personalMessage, setPersonalMessage] = useState("");
  const [publicMessage, setPublicMessage] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendingStats, setSendingStats] = useState<{total: number; sent: number; failed: number}>({
    total: 0, sent: 0, failed: 0
  });

  // Réinitialiser les états à la fermeture du dialogue
  useEffect(() => {
    if (!open) {
      setSelectedParticipants([]);
      setPersonalMessage("");
      setPublicMessage("");
      setIsPreview(false);
      setIsSending(false);
      setSendingStats({total: 0, sent: 0, failed: 0});
    }
  }, [open]);

  // Gérer la sélection/désélection des participants
  const handleParticipantSelection = (participant: Participant, selected: boolean) => {
    if (selected) {
      setSelectedParticipants(prev => [...prev, participant]);
    } else {
      setSelectedParticipants(prev => prev.filter(p => p.id !== participant.id));
    }
  };

  // Basculer l'affichage d'un participant
  const handleToggleParticipantVisibility = (participantId: string) => {
    setHiddenParticipants(prev => 
      prev.includes(participantId) 
        ? prev.filter(id => id !== participantId) 
        : [...prev, participantId]
    );
  };

  // Sélectionner tous les participants visibles
  const handleSelectAllVisible = () => {
    const visibleParticipants = participants.filter(p => !hiddenParticipants.includes(p.id));
    setSelectedParticipants(visibleParticipants);
  };

  // Désélectionner tous les participants
  const handleDeselectAll = () => {
    setSelectedParticipants([]);
  };

  // Envoyer les emails
  const handleSendEmails = async () => {
    if (selectedParticipants.length === 0) {
      toast({
        title: "Aucun participant sélectionné",
        description: "Veuillez sélectionner au moins un participant pour envoyer des emails.",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === "private" && !personalMessage.trim()) {
      toast({
        title: "Message personnel vide",
        description: "Veuillez saisir un message personnel avant d'envoyer.",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === "public" && !publicMessage.trim()) {
      toast({
        title: "Message public vide",
        description: "Veuillez saisir un message public avant d'envoyer.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setSendingStats({
      total: selectedParticipants.length,
      sent: 0,
      failed: 0
    });

    try {
      if (activeTab === "private") {
        // Envoi d'emails personnels individuellement
        let sentCount = 0;
        let failedCount = 0;

        for (const participant of selectedParticipants) {
          const success = await sendPersonalThanksEmail(participant, personalMessage);
          
          if (success) {
            sentCount++;
          } else {
            failedCount++;
          }
          
          setSendingStats({
            total: selectedParticipants.length,
            sent: sentCount,
            failed: failedCount
          });
          
          // Petite pause entre les envois
          if (selectedParticipants.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      } else {
        // Envoi d'emails publics en groupe
        const result = await sendPublicThanksEmail(selectedParticipants, publicMessage);
        
        setSendingStats({
          total: selectedParticipants.length,
          sent: result.success,
          failed: result.failed
        });
      }

      toast({
        title: "Emails envoyés",
        description: `${sendingStats.sent} email(s) envoyé(s) avec succès. ${sendingStats.failed} échec(s).`,
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi des emails:", error);
      toast({
        title: "Erreur d'envoi",
        description: "Une erreur est survenue lors de l'envoi des emails.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Envoi d'emails de remerciement</DialogTitle>
        </DialogHeader>

        {!isSending ? (
          <div className="space-y-4">
            <Tabs defaultValue="private" value={activeTab} onValueChange={(v) => setActiveTab(v as "private" | "public")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="private">Emails personnalisés</TabsTrigger>
                <TabsTrigger value="public">Email public groupé</TabsTrigger>
              </TabsList>
              
              <TabsContent value="private" className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Les emails personnalisés sont envoyés individuellement à chaque participant sélectionné.
                    Chaque participant recevra un email avec un message personnalisé.
                  </AlertDescription>
                </Alert>
                
                {isPreview ? (
                  <MessagePreview 
                    messageType="personal"
                    message={personalMessage}
                    participant={selectedParticipants[0]}
                    onBack={() => setIsPreview(false)}
                  />
                ) : (
                  <>
                    <MessageComposer
                      messageType="personal"
                      value={personalMessage}
                      onChange={setPersonalMessage}
                      onPreview={() => selectedParticipants.length > 0 && setIsPreview(true)}
                      previewDisabled={selectedParticipants.length === 0}
                    />
                    
                    <ParticipantSelector
                      allParticipants={participants}
                      selectedParticipants={selectedParticipants}
                      hiddenParticipants={hiddenParticipants}
                      onSelectParticipant={handleParticipantSelection}
                      onToggleVisibility={handleToggleParticipantVisibility}
                      onSelectAll={handleSelectAllVisible}
                      onDeselectAll={handleDeselectAll}
                    />
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="public" className="space-y-4">
                <Alert>
                  <AlertDescription>
                    L'email public est envoyé à tous les participants sélectionnés.
                    Tous recevront le même contenu du message public.
                  </AlertDescription>
                </Alert>
                
                {isPreview ? (
                  <MessagePreview 
                    messageType="public"
                    message={publicMessage}
                    participant={selectedParticipants[0]}
                    onBack={() => setIsPreview(false)}
                  />
                ) : (
                  <>
                    <MessageComposer
                      messageType="public"
                      value={publicMessage}
                      onChange={setPublicMessage}
                      onPreview={() => selectedParticipants.length > 0 && setIsPreview(true)}
                      previewDisabled={selectedParticipants.length === 0}
                    />
                    
                    <ParticipantSelector
                      allParticipants={participants}
                      selectedParticipants={selectedParticipants}
                      hiddenParticipants={hiddenParticipants}
                      onSelectParticipant={handleParticipantSelection}
                      onToggleVisibility={handleToggleParticipantVisibility}
                      onSelectAll={handleSelectAllVisible}
                      onDeselectAll={handleDeselectAll}
                    />
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <SendingProgress 
            total={sendingStats.total}
            sent={sendingStats.sent}
            failed={sendingStats.failed}
          />
        )}

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Annuler
          </Button>
          
          {!isSending && !isPreview && (
            <Button 
              onClick={handleSendEmails}
              disabled={selectedParticipants.length === 0 || 
                (activeTab === "private" && !personalMessage.trim()) || 
                (activeTab === "public" && !publicMessage.trim())}
              className="bg-green-600 hover:bg-green-700"
            >
              {activeTab === "private" ? "Envoyer Emails Personnalisés" : "Envoyer Email Public"}
            </Button>
          )}
          
          {isPreview && (
            <Button onClick={() => setIsPreview(false)}>
              Retour à l'édition
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
