
// Tableau de bord administrateur refactorisé en composants plus petits
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { type Participant } from "../../types/participant";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail } from "lucide-react";

// Composants refactorisés
import { Header } from "@/components/admin/dashboard/Header";
import { SearchAndExport } from "@/components/admin/dashboard/search-export";
import { ParticipantTable } from "@/components/admin/dashboard/ParticipantTable";
import { ParticipantDetails } from "@/components/admin/dashboard/ParticipantDetails";
import { DeleteConfirmation } from "@/components/admin/dashboard/DeleteConfirmation";
import { EmailSendingDialog } from "@/components/admin/dashboard/email-sending/EmailSendingDialog";

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
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [confirmedPayments, setConfirmedPayments] = useState<number>(0);
  const [checkedInCount, setCheckedInCount] = useState<number>(0);

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

  useEffect(() => {
    // Calculer les statistiques quand les participants changent
    if (participants.length > 0) {
      // Nombre de participants ayant fait le check-in
      const checkedIn = participants.filter(p => p.check_in_status).length;
      setCheckedInCount(checkedIn);
      
      // Nombre de paiements confirmés
      const confirmed = participants.filter(p => 
        (p.payments && p.payments.length > 0 && p.payments[0].status.toLowerCase() === 'completed') ||
        (p.manual_payments && p.manual_payments.length > 0 && p.manual_payments[0].status.toLowerCase() === 'completed')
      ).length;
      setConfirmedPayments(confirmed);
    }
  }, [participants]);

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

  const openEmailDialog = () => {
    setEmailDialogOpen(true);
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
              onClick={openEmailDialog} 
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Mail className="h-4 w-4" />
              Envoi Email
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

        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-blue-700">Total Participants</p>
                <p className="text-2xl font-bold text-blue-900">{participants.length}</p>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="h-5 w-5 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-green-700">Paiements confirmés</p>
                <p className="text-2xl font-bold text-green-900">
                  {confirmedPayments} <span className="text-sm font-normal">
                  ({participants.length > 0 ? Math.round((confirmedPayments / participants.length) * 100) : 0}%)
                  </span>
                </p>
              </div>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4 flex items-center gap-3">
              <div className="bg-amber-100 p-3 rounded-full">
                <svg className="h-5 w-5 text-amber-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-amber-700">Participants enregistrés</p>
                <p className="text-2xl font-bold text-amber-900">
                  {checkedInCount} <span className="text-sm font-normal">
                  ({participants.length > 0 ? Math.round((checkedInCount / participants.length) * 100) : 0}%)
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

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
          onViewDetails={handleViewDetails}
          onCheckIn={handleCheckIn}
        />
      </main>

      {/* Composants de dialogue */}
      <ParticipantDetails 
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        participant={selectedParticipant}
      />
      
      <DeleteConfirmation 
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
      
      <EmailSendingDialog 
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        participants={participants}
      />
    </div>
  );
};

export default AdminDashboard;
