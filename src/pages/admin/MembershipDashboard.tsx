
// Dashboard d'adhésion - Tableau de bord spécialisé pour la gestion des adhésions
// Mis à jour pour utiliser la nouvelle table memberships
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle, UserPlus, Eye } from "lucide-react";
import { Header } from "@/components/admin/dashboard/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sendMembershipConfirmationEmail } from "@/components/manual-payment/services/emailService";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

// Interface pour les adhésions
interface Membership {
  id: string;
  participant_id: string | null;
  status: string;
  requested_at: string;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  address: string | null;
  profession: string;
  subscription_amount: number;
  subscription_start_month: string | null;
  payment_method: string;
  payment_frequency: string;
  competence_domains: string | null;
  club_expectations: string[] | null;
  other_expectations: string | null;
}

const MembershipDashboard = () => {
  const navigate = useNavigate();
  const [membershipRequests, setMembershipRequests] = useState<Membership[]>([]);
  const [members, setMembers] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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
    fetchMembershipData();
  }, [navigate]);

  const fetchMembershipData = async () => {
    setIsLoading(true);
    try {
      // Récupérer les demandes d'adhésion en attente
      const { data: pendingRequests, error: pendingError } = await supabase
        .from('memberships')
        .select('*')
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (pendingError) throw pendingError;
      
      // Récupérer les membres approuvés
      const { data: approvedMembers, error: approvedError } = await supabase
        .from('memberships')
        .select('*')
        .eq('status', 'approved')
        .order('approved_at', { ascending: false });

      if (approvedError) throw approvedError;

      setMembershipRequests(pendingRequests || []);
      setMembers(approvedMembers || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des données d'adhésion:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les données d'adhésion.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (membershipId: string) => {
    try {
      // Mettre à jour le statut de l'adhésion
      const { data: updatedMembership, error: updateError } = await supabase
        .from('memberships')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: localStorage.getItem("adminEmail") || "admin"
        })
        .eq('id', membershipId)
        .select()
        .single();

      if (updateError) throw updateError;
      
      // Mettre à jour le statut de membre du participant associé s'il existe
      if (updatedMembership.participant_id) {
        const { error: participantError } = await supabase
          .from('participants')
          .update({
            is_member: true
          })
          .eq('id', updatedMembership.participant_id);

        if (participantError) throw participantError;
      }
      
      // Récupérer les informations complètes du participant
      let participantData = {
        id: updatedMembership.participant_id,
        first_name: updatedMembership.first_name,
        last_name: updatedMembership.last_name,
        email: updatedMembership.email,
        membership_status: 'approved'
      };
      
      if (updatedMembership.participant_id) {
        const { data: participant } = await supabase
          .from('participants')
          .select('*')
          .eq('id', updatedMembership.participant_id)
          .maybeSingle();
          
        if (participant) {
          participantData = {
            ...participant,
            membership_status: 'approved'
          };
        }
      }
      
      // Envoyer l'email de confirmation
      const emailSent = await sendMembershipConfirmationEmail(participantData);
      
      if (emailSent) {
        toast({
          title: "Adhésion approuvée",
          description: "L'adhésion a été approuvée et l'email de confirmation a été envoyé.",
        });
      } else {
        toast({
          title: "Adhésion approuvée",
          description: "L'adhésion a été approuvée mais l'email de confirmation n'a pas pu être envoyé.",
          variant: "destructive",
        });
      }
      
      // Rafraîchir les données
      fetchMembershipData();
    } catch (error) {
      console.error("Erreur lors de l'approbation de l'adhésion:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'approuver l'adhésion.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (membershipId: string) => {
    try {
      // Mettre à jour le statut de l'adhésion
      const { error: updateError } = await supabase
        .from('memberships')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: localStorage.getItem("adminEmail") || "admin"
        })
        .eq('id', membershipId);

      if (updateError) throw updateError;
      
      toast({
        title: "Adhésion rejetée",
        description: "La demande d'adhésion a été rejetée.",
      });
      
      // Rafraîchir les données
      fetchMembershipData();
    } catch (error) {
      console.error("Erreur lors du rejet de l'adhésion:", error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter l'adhésion.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (membership: Membership) => {
    setSelectedMembership(membership);
    setDetailsOpen(true);
  };

  const handleBackToDashboard = () => {
    navigate("/admin/dashboard");
  };

  const formatMembershipDetails = (membership: Membership | null) => {
    if (!membership) return [];
    
    return [
      { label: "Prénom", value: membership.first_name },
      { label: "Nom", value: membership.last_name },
      { label: "Email", value: membership.email },
      { label: "Téléphone", value: membership.contact_number },
      { label: "Profession", value: membership.profession },
      { label: "Adresse", value: membership.address || "Non spécifiée" },
      { label: "Montant de souscription", value: `${membership.subscription_amount.toLocaleString()} FCFA` },
      { label: "Mois de début", value: membership.subscription_start_month || "Non spécifié" },
      { label: "Mode de règlement", value: membership.payment_method },
      { label: "Périodicité", value: membership.payment_frequency },
      { label: "Domaines de compétence", value: membership.competence_domains || "Non spécifiés" },
      { label: "Attentes vis-à-vis du Club", value: membership.club_expectations ? membership.club_expectations.join(", ") : "Non spécifiées" },
      { label: "Autres attentes", value: membership.other_expectations || "Non spécifiées" },
      { label: "Date de demande", value: new Date(membership.requested_at).toLocaleDateString('fr-FR') }
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={() => {
        localStorage.removeItem("adminAuth");
        navigate("/");
      }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBackToDashboard}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour au tableau de bord
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestion des adhésions
            </h1>
          </div>
          
          <Button 
            onClick={fetchMembershipData}
            variant="outline"
          >
            Actualiser
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Demandes en attente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{membershipRequests.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Membres approuvés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{members.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{membershipRequests.length + members.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gérer les adhésions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" value={activeTab} onValueChange={(v) => setActiveTab(v as "pending" | "approved")}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="pending">Demandes en attente</TabsTrigger>
                <TabsTrigger value="approved">Membres</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending">
                {isLoading ? (
                  <div className="text-center py-4">Chargement...</div>
                ) : membershipRequests.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Aucune demande d'adhésion en attente</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>Date de demande</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {membershipRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>{request.first_name} {request.last_name}</TableCell>
                            <TableCell>{request.email}</TableCell>
                            <TableCell>{request.contact_number}</TableCell>
                            <TableCell>
                              {new Date(request.requested_at).toLocaleDateString('fr-FR')}
                            </TableCell>
                            <TableCell className="flex justify-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(request)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(request.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approuver
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReject(request.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeter
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="approved">
                {isLoading ? (
                  <div className="text-center py-4">Chargement...</div>
                ) : members.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Aucun membre approuvé</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>Date d'approbation</TableHead>
                          <TableHead>Approuvé par</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>{member.first_name} {member.last_name}</TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>{member.contact_number}</TableCell>
                            <TableCell>
                              {member.approved_at ? new Date(member.approved_at).toLocaleDateString('fr-FR') : 'N/A'}
                            </TableCell>
                            <TableCell>{member.approved_by || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(member)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Dialogue de détails de l'adhésion */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'adhésion</DialogTitle>
            <DialogDescription>
              Informations complètes sur la demande d'adhésion
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {formatMembershipDetails(selectedMembership).map((detail, index) => (
              <div key={index} className="space-y-1">
                <h4 className="text-sm font-medium text-gray-500">{detail.label}</h4>
                <p className="text-sm">{detail.value}</p>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end mt-6 gap-2">
            {selectedMembership?.status === 'pending' && (
              <>
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    handleApprove(selectedMembership.id);
                    setDetailsOpen(false);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approuver
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleReject(selectedMembership.id);
                    setDetailsOpen(false);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejeter
                </Button>
              </>
            )}
            <DialogClose asChild>
              <Button variant="outline">Fermer</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembershipDashboard;
