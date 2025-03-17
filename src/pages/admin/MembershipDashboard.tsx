
// Dashboard d'adhésion - Nouveau tableau de bord spécialisé pour la gestion des adhésions
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle, UserPlus } from "lucide-react";
import { Header } from "@/components/admin/dashboard/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sendMembershipConfirmationEmail } from "@/components/manual-payment/services/emailService";

const MembershipDashboard = () => {
  const navigate = useNavigate();
  const [membershipRequests, setMembershipRequests] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");

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
        .from('participants')
        .select('*')
        .eq('membership_status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingError) throw pendingError;
      
      // Récupérer les membres approuvés
      const { data: approvedMembers, error: approvedError } = await supabase
        .from('participants')
        .select('*')
        .eq('membership_status', 'approved')
        .order('created_at', { ascending: false });

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

  const handleApprove = async (participantId: string) => {
    try {
      // Récupérer les données du participant
      const { data: participant, error: fetchError } = await supabase
        .from('participants')
        .select('*')
        .eq('id', participantId)
        .single();

      if (fetchError) throw fetchError;
      
      // Mettre à jour le statut de l'adhésion
      const { error: updateError } = await supabase
        .from('participants')
        .update({
          membership_status: 'approved',
          is_member: true,
          membership_approved_at: new Date().toISOString(),
          membership_approved_by: localStorage.getItem("adminEmail") || "admin"
        })
        .eq('id', participantId);

      if (updateError) throw updateError;
      
      // Envoyer l'email de confirmation
      const emailSent = await sendMembershipConfirmationEmail(participant);
      
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

  const handleReject = async (participantId: string) => {
    try {
      // Mettre à jour le statut de l'adhésion
      const { error: updateError } = await supabase
        .from('participants')
        .update({
          membership_status: 'rejected',
          is_member: false,
          membership_rejected_at: new Date().toISOString(),
          membership_rejected_by: localStorage.getItem("adminEmail") || "admin"
        })
        .eq('id', participantId);

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

  const handleBackToDashboard = () => {
    navigate("/admin/dashboard");
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
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left">Nom</th>
                          <th className="px-4 py-2 text-left">Email</th>
                          <th className="px-4 py-2 text-left">Téléphone</th>
                          <th className="px-4 py-2 text-left">Date de demande</th>
                          <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {membershipRequests.map((request) => (
                          <tr key={request.id} className="border-b">
                            <td className="px-4 py-3">{request.first_name} {request.last_name}</td>
                            <td className="px-4 py-3">{request.email}</td>
                            <td className="px-4 py-3">{request.contact_number}</td>
                            <td className="px-4 py-3">
                              {new Date(request.membership_requested_at || request.created_at).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-4 py-3 flex justify-center space-x-2">
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left">Nom</th>
                          <th className="px-4 py-2 text-left">Email</th>
                          <th className="px-4 py-2 text-left">Téléphone</th>
                          <th className="px-4 py-2 text-left">Date d'approbation</th>
                          <th className="px-4 py-2 text-left">Approuvé par</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member) => (
                          <tr key={member.id} className="border-b">
                            <td className="px-4 py-3">{member.first_name} {member.last_name}</td>
                            <td className="px-4 py-3">{member.email}</td>
                            <td className="px-4 py-3">{member.contact_number}</td>
                            <td className="px-4 py-3">
                              {new Date(member.membership_approved_at).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-4 py-3">{member.membership_approved_by}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MembershipDashboard;
