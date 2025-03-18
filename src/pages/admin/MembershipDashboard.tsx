
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle, UserPlus, Eye, FileText, Download, Trash, FileCheck } from "lucide-react";
import { Header } from "@/components/admin/dashboard/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sendMembershipConfirmationEmail } from "@/components/manual-payment/services/emailService";
import { sendMembershipRejectionEmail } from "@/components/manual-payment/services/emails/membershipRejectionService";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import MembershipDetails from "@/components/admin/membership/MembershipDetails";
import RejectionDialog from "@/components/admin/membership/RejectionDialog";
import { exportToCSV } from "@/utils/exportUtils";
import { REJECTION_EMAILJS_SERVICE_ID, REJECTION_EMAILJS_PUBLIC_KEY, REJECTION_TEMPLATE_ID } from "@/components/manual-payment/config";

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
  const [rejectedRequests, setRejectedRequests] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [membershipToReject, setMembershipToReject] = useState<string | null>(null);

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
      
      // Récupérer les demandes rejetées
      const { data: rejectedMembers, error: rejectedError } = await supabase
        .from('memberships')
        .select('*')
        .eq('status', 'rejected')
        .order('rejected_at', { ascending: false });

      if (rejectedError) throw rejectedError;

      setMembershipRequests(pendingRequests || []);
      setMembers(approvedMembers || []);
      setRejectedRequests(rejectedMembers || []);
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

  const handleOpenRejectDialog = (membershipId: string) => {
    setMembershipToReject(membershipId);
    setRejectionDialogOpen(true);
  };

  const handleRejectConfirm = async (rejectionReason: string) => {
    if (!membershipToReject) return;
    
    try {
      // Récupérer les données de l'adhésion
      const { data: membershipData, error: fetchError } = await supabase
        .from('memberships')
        .select('*')
        .eq('id', membershipToReject)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Mettre à jour le statut de l'adhésion
      const { error: updateError } = await supabase
        .from('memberships')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: localStorage.getItem("adminEmail") || "admin"
        })
        .eq('id', membershipToReject);

      if (updateError) throw updateError;
      
      // Envoyer l'email de rejet avec les nouvelles clés API
      console.log("Utilisation des nouvelles clés API pour le rejet:", {
        serviceID: REJECTION_EMAILJS_SERVICE_ID,
        templateID: REJECTION_TEMPLATE_ID,
        publicKey: REJECTION_EMAILJS_PUBLIC_KEY
      });
      
      const emailSent = await sendMembershipRejectionEmail(membershipData, rejectionReason);
      
      if (emailSent) {
        toast({
          title: "Adhésion rejetée",
          description: "La demande d'adhésion a été rejetée et l'email a été envoyé au demandeur.",
        });
      } else {
        toast({
          title: "Adhésion rejetée",
          description: "La demande d'adhésion a été rejetée mais l'email n'a pas pu être envoyé.",
          variant: "destructive",
        });
      }
      
      // Fermer le dialogue et réinitialiser
      setRejectionDialogOpen(false);
      setMembershipToReject(null);
      
      // Rafraîchir les données
      fetchMembershipData();
    } catch (error) {
      console.error("Erreur lors du rejet de l'adhésion:", error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter l'adhésion.",
        variant: "destructive",
      });
      setRejectionDialogOpen(false);
      setMembershipToReject(null);
    }
  };

  const handleRejectCancel = () => {
    setRejectionDialogOpen(false);
    setMembershipToReject(null);
  };

  const handleDelete = async (membershipId: string) => {
    try {
      // Supprimer l'adhésion
      const { error: deleteError } = await supabase
        .from('memberships')
        .delete()
        .eq('id', membershipId);

      if (deleteError) throw deleteError;
      
      toast({
        title: "Adhésion supprimée",
        description: "L'adhésion a été supprimée avec succès.",
      });
      
      // Rafraîchir les données
      fetchMembershipData();
    } catch (error) {
      console.error("Erreur lors de la suppression de l'adhésion:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'adhésion.",
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

  const handleGoToMembershipForm = () => {
    navigate("/membership");
  };

  const handleExportCSV = (data: Membership[], type: 'pending' | 'approved' | 'rejected' | 'all') => {
    const fileName = type === 'pending' 
      ? 'demandes_adhesion_en_attente' 
      : type === 'approved' 
        ? 'membres_approuves' 
        : type === 'rejected'
          ? 'demandes_adhesion_rejetees'
          : 'toutes_les_adhesions';
    
    const success = exportToCSV(data, fileName);
    
    if (success) {
      toast({
        title: "Exportation réussie",
        description: `Les données ont été exportées dans le fichier "${fileName}.xlsx"`,
      });
    } else {
      toast({
        title: "Erreur d'exportation",
        description: "Impossible d'exporter les données.",
        variant: "destructive"
      });
    }
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
          
          <div className="flex gap-2">
            <Button 
              onClick={handleGoToMembershipForm}
              variant="dashboard"
              className="flex items-center gap-1"
            >
              <FileCheck className="h-4 w-4" />
              Formulaire d'adhésion
            </Button>
            <Button 
              onClick={() => handleExportCSV([...membershipRequests, ...members, ...rejectedRequests], 'all')}
              variant="outline"
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Exporter tout
            </Button>
            <Button 
              onClick={fetchMembershipData}
              variant="outline"
            >
              Actualiser
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
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
              <CardTitle className="text-base font-medium">Demandes rejetées</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{rejectedRequests.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{membershipRequests.length + members.length + rejectedRequests.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-wrap justify-between items-center">
            <CardTitle>Gérer les adhésions</CardTitle>
            {activeTab === 'pending' && membershipRequests.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExportCSV(membershipRequests, 'pending')}
                className="flex items-center gap-1"
              >
                <FileText className="h-4 w-4 mr-1" />
                Exporter les demandes
              </Button>
            )}
            {activeTab === 'approved' && members.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExportCSV(members, 'approved')}
                className="flex items-center gap-1"
              >
                <FileText className="h-4 w-4 mr-1" />
                Exporter les membres
              </Button>
            )}
            {activeTab === 'rejected' && rejectedRequests.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExportCSV(rejectedRequests, 'rejected')}
                className="flex items-center gap-1"
              >
                <FileText className="h-4 w-4 mr-1" />
                Exporter les rejets
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" value={activeTab} onValueChange={(v) => setActiveTab(v as "pending" | "approved" | "rejected")}>
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="pending" className="relative">
                  Demandes en attente
                  {membershipRequests.length > 0 && (
                    <span className="absolute top-0 right-1 transform -translate-y-1/4 translate-x-1/4 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {membershipRequests.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved">Membres</TabsTrigger>
                <TabsTrigger value="rejected">Demandes rejetées</TabsTrigger>
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
                                title="Voir les détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(request.id)}
                                title="Approuver"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approuver
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleOpenRejectDialog(request.id)}
                                title="Rejeter"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeter
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(request.id)}
                                title="Supprimer"
                              >
                                <Trash className="h-4 w-4" />
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
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetails(member)}
                                  title="Voir les détails"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(member.id)}
                                  title="Supprimer"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="rejected">
                {isLoading ? (
                  <div className="text-center py-4">Chargement...</div>
                ) : rejectedRequests.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Aucune demande d'adhésion rejetée</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>Date de rejet</TableHead>
                          <TableHead>Rejeté par</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rejectedRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>{request.first_name} {request.last_name}</TableCell>
                            <TableCell>{request.email}</TableCell>
                            <TableCell>{request.contact_number}</TableCell>
                            <TableCell>
                              {request.rejected_at ? new Date(request.rejected_at).toLocaleDateString('fr-FR') : 'N/A'}
                            </TableCell>
                            <TableCell>{request.rejected_by || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetails(request)}
                                  title="Voir les détails"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(request.id)}
                                  title="Supprimer"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
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
      <MembershipDetails
        membership={selectedMembership}
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onApprove={handleApprove}
        onReject={handleOpenRejectDialog}
        onDelete={handleDelete}
      />

      {/* Dialogue de rejet avec motif */}
      <RejectionDialog
        isOpen={rejectionDialogOpen}
        onClose={handleRejectCancel}
        onConfirm={handleRejectConfirm}
        membershipId={membershipToReject}
      />
    </div>
  );
};

export default MembershipDashboard;
