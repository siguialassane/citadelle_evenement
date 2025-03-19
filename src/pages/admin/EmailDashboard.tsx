// Dashboard d'envoi d'emails - Nouveau tableau de bord spécialisé
// Mise à jour: Déplacement du bouton d'envoi dans le header du MessageComposer
// Mise à jour: Correction du formatage des variables dynamiques prénom et nom
// Mise à jour: Filtrage par défaut des participants non-membres uniquement
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { type Participant } from "../../types/participant";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/admin/dashboard/Header";
import { EmailSendingDialog } from "@/components/admin/dashboard/email-sending/EmailSendingDialog";
import { ParticipantSelector } from "@/components/admin/dashboard/email-sending/ParticipantSelector";
import { MessageComposer } from "@/components/admin/dashboard/email-sending/MessageComposer";
import { MessagePreview } from "@/components/admin/dashboard/email-sending/MessagePreview";
import { SendingProgress } from "@/components/admin/dashboard/email-sending/SendingProgress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatisticsSection } from "@/components/admin/dashboard/search-export/StatisticsSection";
const EmailDashboard = () => {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedParticipants, setSelectedParticipants] = useState<Participant[]>([]);
  const [hiddenParticipants, setHiddenParticipants] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"private" | "public">("private");
  const [personalMessage, setPersonalMessage] = useState("");
  const [publicMessage, setPublicMessage] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendingStats, setSendingStats] = useState<{
    total: number;
    sent: number;
    failed: number;
  }>({
    total: 0,
    sent: 0,
    failed: 0
  });
  useEffect(() => {
    const checkAuth = () => {
      const isAdmin = localStorage.getItem("adminAuth") === "true";
      if (!isAdmin) {
        toast({
          title: "Accès non autorisé",
          description: "Veuillez vous connecter pour accéder au tableau de bord.",
          variant: "destructive"
        });
        navigate("/admin/login");
      }
    };
    checkAuth();
    fetchParticipants();
  }, [navigate]);
  const fetchParticipants = async () => {
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('participants').select(`
          *,
          payments (
            id,
            status,
            amount,
            payment_method,
            payment_date,
            currency,
            transaction_id
          ),
          manual_payments (
            id,
            status,
            amount,
            payment_method,
            phone_number,
            created_at,
            comments,
            screenshot_url,
            admin_notes,
            validated_at,
            validated_by
          )
        `).order('created_at', {
        ascending: false
      });
      if (error) {
        throw error;
      }
      setParticipants(data || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des participants:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer la liste des participants.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion de la sélection/désélection des participants
  const handleParticipantSelection = (participant: Participant, selected: boolean) => {
    if (selected) {
      setSelectedParticipants(prev => [...prev, participant]);
    } else {
      setSelectedParticipants(prev => prev.filter(p => p.id !== participant.id));
    }
  };

  // Basculer l'affichage d'un participant
  const handleToggleParticipantVisibility = (participantId: string) => {
    setHiddenParticipants(prev => prev.includes(participantId) ? prev.filter(id => id !== participantId) : [...prev, participantId]);
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
  const handleBackToDashboard = () => {
    navigate("/admin/dashboard");
  };

  // Nouveau gestionnaire pour ouvrir le dialogue d'envoi
  const handleOpenSendingDialog = () => {
    setIsSending(true);
  };
  return <div className="min-h-screen bg-gray-50">
      <Header onLogout={() => {
      localStorage.removeItem("adminAuth");
      navigate("/");
    }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleBackToDashboard} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour au tableau de bord
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestion des emails
            </h1>
          </div>
        </div>

        <StatisticsSection participants={participants} />

        <div className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Envoi d'emails de demande d'adhésion</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="private" value={activeTab} onValueChange={v => setActiveTab(v as "private" | "public")}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="private">Emails personnalisés</TabsTrigger>
                  <TabsTrigger value="public">Email public groupé</TabsTrigger>
                </TabsList>
                
                <TabsContent value="private" className="space-y-4">
                  {isPreview ? <MessagePreview messageType="personal" message={personalMessage} participant={selectedParticipants[0]} onBack={() => setIsPreview(false)} /> : isSending ? <SendingProgress total={sendingStats.total} sent={sendingStats.sent} failed={sendingStats.failed} /> : <>
                      <MessageComposer messageType="personal" value={personalMessage} onChange={setPersonalMessage} onPreview={() => selectedParticipants.length > 0 && setIsPreview(true)} onSend={handleOpenSendingDialog} previewDisabled={selectedParticipants.length === 0} sendDisabled={selectedParticipants.length === 0 || !personalMessage.trim()} />
                    </>}
                </TabsContent>
                
                <TabsContent value="public" className="space-y-4">
                  {isPreview ? <MessagePreview messageType="public" message={publicMessage} participant={selectedParticipants[0]} onBack={() => setIsPreview(false)} /> : isSending ? <SendingProgress total={sendingStats.total} sent={sendingStats.sent} failed={sendingStats.failed} /> : <>
                      <MessageComposer messageType="public" value={publicMessage} onChange={setPublicMessage} onPreview={() => selectedParticipants.length > 0 && setIsPreview(true)} onSend={handleOpenSendingDialog} previewDisabled={selectedParticipants.length === 0} sendDisabled={selectedParticipants.length === 0 || !publicMessage.trim()} />
                    </>}
                </TabsContent>
              </Tabs>
              
              {!isPreview && !isSending && <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Sélection des participants</h3>
                  
                  <ParticipantSelector 
                    allParticipants={participants} 
                    selectedParticipants={selectedParticipants} 
                    hiddenParticipants={hiddenParticipants} 
                    onSelectParticipant={handleParticipantSelection} 
                    onToggleVisibility={handleToggleParticipantVisibility} 
                    onSelectAll={handleSelectAllVisible} 
                    onDeselectAll={handleDeselectAll}
                    filterNonMembers={true} // Filtrer par défaut pour n'afficher que les non-membres
                  />
                  
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" className="mr-2" onClick={() => {
                  setPersonalMessage("");
                  setPublicMessage("");
                  setSelectedParticipants([]);
                }}>
                      Réinitialiser
                    </Button>
                  </div>
                </div>}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialogue complet pour la gestion des emails */}
      <EmailSendingDialog open={isSending} onOpenChange={setIsSending} participants={selectedParticipants} activeTab={activeTab} personalMessage={personalMessage} publicMessage={publicMessage} />
    </div>;
};
export default EmailDashboard;
