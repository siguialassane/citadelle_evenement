
// Tableau de bord administrateur refactorisé en composants plus petits
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { type Participant } from "../../types/participant";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

// Composants refactorisés
import { Header } from "@/components/admin/dashboard/Header";
import { SearchAndExport } from "@/components/admin/dashboard/search-export";
import { ParticipantTable } from "@/components/admin/dashboard/ParticipantTable";
import { ParticipantDetails } from "@/components/admin/dashboard/ParticipantDetails";
import { DeleteConfirmation } from "@/components/admin/dashboard/DeleteConfirmation";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<number>(0);

  useEffect(() => {
    const checkAuth = () => {
      const isAdmin = localStorage.getItem("adminAuth") === "true";
      if (!isAdmin) {
        toast({
          title: "Accès non autorisé",
          description: "Veuillez vous connecter pour accéder au tableau de bord.",
          variant: "destructive",
        });
        navigate("/admin/login");
      }
    };

    checkAuth();
    fetchParticipants();
    fetchPendingPaymentsCount();
  }, [navigate]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredParticipants(participants);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filtered = participants.filter(
      participant =>
        participant.first_name.toLowerCase().includes(searchTermLower) ||
        participant.last_name.toLowerCase().includes(searchTermLower) ||
        participant.email.toLowerCase().includes(searchTermLower) ||
        participant.contact_number.includes(searchTerm)
    );

    setFilteredParticipants(filtered);
  }, [searchTerm, participants]);

  const fetchParticipants = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('participants')
        .select(`
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
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Avant d'assigner les données au state, nous nous assurons que 
      // les champs obligatoires sont présents dans manual_payments
      const processedData = data?.map(participant => {
        if (participant.manual_payments) {
          // Nous pouvons ajouter participant_id si nécessaire, bien que nous l'ayons rendu optionnel
          participant.manual_payments = participant.manual_payments.map((payment: any) => ({
            ...payment,
            participant_id: participant.id  // Nous ajoutons cette propriété manuellement
          }));
        }
        return participant;
      }) || [];

      setParticipants(processedData);
      setFilteredParticipants(processedData);
    } catch (error) {
      console.error("Erreur lors de la récupération des participants:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer la liste des participants.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingPaymentsCount = async () => {
    try {
      const { data, error, count } = await supabase
        .from('manual_payments')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      if (error) {
        throw error;
      }

      setPendingPayments(count || 0);
    } catch (error) {
      console.error("Erreur lors de la récupération des paiements en attente:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchParticipants();
    await fetchPendingPaymentsCount();
    setIsRefreshing(false);
    toast({
      title: "Données actualisées",
      description: "La liste des participants a été mise à jour.",
    });
  };

  const handleCheckIn = async (participantId: string, currentStatus: boolean | null) => {
    try {
      const { error } = await supabase
        .from('participants')
        .update({ 
          check_in_status: !currentStatus,
          check_in_timestamp: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', participantId);

      if (error) {
        throw error;
      }

      setParticipants(prevParticipants => 
        prevParticipants.map(participant => 
          participant.id === participantId 
            ? { ...participant, check_in_status: !currentStatus } 
            : participant
        )
      );

      toast({
        title: "Statut mis à jour",
        description: !currentStatus 
          ? "Le participant a été enregistré comme présent." 
          : "Le statut d'enregistrement a été annulé.",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut d'enregistrement:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut d'enregistrement.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès.",
    });
    navigate("/");
  };

  const handleViewDetails = (participant: Participant) => {
    setSelectedParticipant(participant);
    setDetailsOpen(true);
  };

  const goToPaymentValidation = () => {
    navigate("/admin/payment-validation");
  };
  
  const goToEmailDashboard = () => {
    navigate("/admin/email-dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Tableau de bord
          </h1>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              onClick={goToEmailDashboard} 
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Mail className="h-4 w-4" />
              Gestion des emails
            </Button>
            
            <Button 
              onClick={goToPaymentValidation} 
              className="flex items-center gap-2"
              variant="outline"
            >
              {pendingPayments > 0 && (
                <Badge className="bg-red-500 text-white">
                  {pendingPayments}
                </Badge>
              )}
              <Bell className="h-4 w-4" />
              Validation des paiements
            </Button>
          </div>
        </div>
        
        {/* Notification concernant la nouvelle méthode d'enregistrement */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <InfoIcon className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-700">Nouvelle méthode d'enregistrement</AlertTitle>
          <AlertDescription className="text-blue-600">
            <p>La fonction de scan QR code a été remplacée par un système d'auto-validation. Les participants peuvent désormais confirmer leur présence directement depuis leur reçu de paiement en utilisant le code de sécurité (009).</p>
            <p className="mt-2">Le statut de présence des participants sera automatiquement mis à jour dans le tableau ci-dessous lorsqu'ils confirmeront leur présence.</p>
          </AlertDescription>
        </Alert>

        <SearchAndExport 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          participants={participants}
          filteredParticipants={filteredParticipants}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          pdfDownloaded={pdfDownloaded}
          onPdfGenerated={() => setPdfDownloaded(true)}
          onDeleteDialogOpen={() => setDeleteDialogOpen(true)}
        />

        <ParticipantTable 
          participants={filteredParticipants}
          isLoading={isLoading}
          searchTerm={searchTerm}
          pdfDownloaded={pdfDownloaded}
          onViewDetails={handleViewDetails}
          onCheckIn={handleCheckIn}
          onDelete={handleRefresh}
        />
      </main>

      <ParticipantDetails 
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        participant={selectedParticipant}
      />
      
      <DeleteConfirmation 
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
};

export default AdminDashboard;
