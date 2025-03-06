import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, 
  Search, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FileText,
  Info
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Type pour les participants
type Participant = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  is_member: boolean;
  check_in_status: boolean;
  created_at: string;
  payments: Payment[];
};

// Type pour les paiements
type Payment = {
  id: string;
  status: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  currency: string;
  transaction_id?: string;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    // Vérifier si l'admin est connecté
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
  }, [navigate]);

  // Filtrer les participants en fonction du terme de recherche
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

  // Récupérer les données des participants
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
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setParticipants(data || []);
      setFilteredParticipants(data || []);
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

  // Rafraîchir les données
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchParticipants();
    setIsRefreshing(false);
    toast({
      title: "Données actualisées",
      description: "La liste des participants a été mise à jour.",
    });
  };

  // Marquer un participant comme enregistré (check-in)
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

      // Mettre à jour l'état local
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

  // Se déconnecter
  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès.",
    });
    navigate("/");
  };

  // Ouvrir la modal avec les détails du participant
  const handleViewDetails = (participant: Participant) => {
    setSelectedParticipant(participant);
    setDetailsOpen(true);
  };

  // Formatage de la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir le statut du paiement avec une couleur appropriée
  const getPaymentStatusBadge = (payment?: Payment) => {
    if (!payment) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">Non payé</Badge>;
    }
    
    switch (payment.status.toUpperCase()) {
      case "APPROVED":
      case "SUCCESS":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmé</Badge>;
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">En cours</Badge>;
      case "FAILED":
      case "CANCELLED":
      case "REJECTED":
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="outline">{payment.status}</Badge>;
    }
  };

  // Exporter les données au format CSV
  const handleExportCSV = () => {
    const headers = [
      "Nom", 
      "Prénom", 
      "Email", 
      "Téléphone", 
      "Membre", 
      "Présent", 
      "Date d'inscription", 
      "Statut du paiement", 
      "Montant"
    ];
    
    const rows = participants.map(participant => [
      participant.last_name,
      participant.first_name,
      participant.email,
      participant.contact_number,
      participant.is_member ? "Oui" : "Non",
      participant.check_in_status ? "Oui" : "Non",
      new Date(participant.created_at).toLocaleDateString(),
      participant.payments?.[0]?.status || "Non payé",
      participant.payments?.[0]?.amount ? `${participant.payments[0].amount} ${participant.payments[0].currency || 'XOF'}` : "N/A"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `participants-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exporter les données au format PDF
  const handleExportPDF = async () => {
    const tableElement = document.getElementById('participants-table');
    if (!tableElement) return;

    toast({
      title: "Génération du PDF",
      description: "Veuillez patienter pendant la création du PDF...",
    });

    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      // Ajouter un titre
      pdf.setFontSize(18);
      pdf.text('Liste des participants', 15, 15);
      
      // Ajouter la date d'extraction
      pdf.setFontSize(10);
      pdf.text(`Extrait le: ${new Date().toLocaleDateString('fr-FR')}`, 15, 22);
      
      // Capturer le tableau en image
      const canvas = await html2canvas(tableElement, {
        scale: 1,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Ajouter l'image du tableau
      pdf.addImage(imgData, 'PNG', 10, 30, 280, 0);
      
      // Sauvegarder le PDF
      pdf.save(`participants-${new Date().toISOString().slice(0,10)}.pdf`);
      
      toast({
        title: "PDF généré",
        description: "Le fichier PDF a été téléchargé avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête du tableau de bord */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord administrateur</h1>
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Barre d'outils */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                className="pl-10"
                placeholder="Rechercher un participant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button 
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleExportCSV}
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button 
                className="flex items-center gap-2"
                onClick={handleExportPDF}
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
          
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-indigo-800 font-medium">Total des participants</p>
              <p className="text-2xl font-bold">{participants.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800 font-medium">Paiements confirmés</p>
              <p className="text-2xl font-bold">
                {participants.filter(p => p.payments?.[0]?.status?.toUpperCase() === "SUCCESS" || p.payments?.[0]?.status?.toUpperCase() === "APPROVED").length}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 font-medium">Participants enregistrés</p>
              <p className="text-2xl font-bold">
                {participants.filter(p => p.check_in_status).length}
              </p>
            </div>
          </div>
        </div>

        {/* Tableau des participants */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table id="participants-table">
            <TableCaption>Liste des participants à l'événement</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Membre</TableHead>
                <TableHead>Date d'inscription</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>Présence</TableHead>
                <TableHead className="text-center">Détails</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">
                    <div className="flex justify-center items-center">
                      <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                      Chargement des participants...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredParticipants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">
                    {searchTerm ? (
                      <div className="flex flex-col items-center">
                        <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                        <p>Aucun participant ne correspond à votre recherche</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <AlertTriangle className="h-8 w-8 text-gray-400 mb-2" />
                        <p>Aucun participant n'est inscrit à l'événement</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredParticipants.map(participant => (
                  <TableRow key={participant.id}>
                    <TableCell className="font-medium">
                      {participant.last_name} {participant.first_name}
                    </TableCell>
                    <TableCell>{participant.email}</TableCell>
                    <TableCell>{participant.contact_number}</TableCell>
                    <TableCell>
                      {participant.is_member ? (
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Membre</Badge>
                      ) : (
                        <Badge variant="outline">Non-membre</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(participant.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(participant.payments?.[0])}
                    </TableCell>
                    <TableCell>
                      {participant.check_in_status ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Présent</Badge>
                      ) : (
                        <Badge variant="outline">Non enregistré</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={() => handleViewDetails(participant)}
                      >
                        <Info className="h-3 w-3" />
                        <span className="hidden sm:inline">Détails</span>
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={participant.check_in_status ? "outline" : "default"}
                        className={`flex items-center gap-1 ${
                          participant.check_in_status 
                            ? "border-red-200 text-red-700 hover:bg-red-50" 
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                        onClick={() => handleCheckIn(participant.id, participant.check_in_status)}
                      >
                        {participant.check_in_status ? (
                          <>
                            <XCircle className="h-3 w-3" />
                            <span className="hidden sm:inline">Annuler</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="hidden sm:inline">Présent</span>
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Modal de détails du participant */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Détails du participant
            </DialogTitle>
            <DialogDescription>
              Informations complètes et détails de paiement
            </DialogDescription>
          </DialogHeader>
          
          {selectedParticipant && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations personnelles */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations personnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Nom complet</p>
                    <p className="font-medium">{selectedParticipant.last_name} {selectedParticipant.first_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedParticipant.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{selectedParticipant.contact_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <div className="flex items-center mt-1 gap-2">
                      {selectedParticipant.is_member && <Badge className="bg-purple-100 text-purple-800">Membre</Badge>}
                      {selectedParticipant.check_in_status ? 
                        <Badge className="bg-green-100 text-green-800">Présent</Badge> : 
                        <Badge variant="outline">Non enregistré</Badge>
                      }
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date d'inscription</p>
                    <p className="font-medium">{formatDate(selectedParticipant.created_at)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Détails du paiement */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Détails du paiement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedParticipant.payments && selectedParticipant.payments.length > 0 ? (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Statut</p>
                        <div className="mt-1">{getPaymentStatusBadge(selectedParticipant.payments[0])}</div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Montant</p>
                        <p className="font-medium">{selectedParticipant.payments[0].amount} {selectedParticipant.payments[0].currency || 'XOF'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Méthode de paiement</p>
                        <p className="font-medium">{selectedParticipant.payments[0].payment_method || 'Non spécifiée'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date de paiement</p>
                        <p className="font-medium">{formatDate(selectedParticipant.payments[0].payment_date)}</p>
                      </div>
                      {selectedParticipant.payments[0].transaction_id && (
                        <div>
                          <p className="text-sm text-muted-foreground">ID de transaction</p>
                          <p className="font-medium">{selectedParticipant.payments[0].transaction_id}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-8 text-center">
                      <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                      <p className="text-muted-foreground">Aucun paiement enregistré</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fermer</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
