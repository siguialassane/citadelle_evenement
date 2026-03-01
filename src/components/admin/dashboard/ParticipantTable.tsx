
// Composant pour afficher le tableau des participants
// Mise à jour: Ajout de la fonctionnalité de paiement rapide
// Mise à jour: Ajout de la fonctionnalité de modification du statut de membre
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Info,
  RefreshCw,
  Trash,
  CreditCard,
  Zap,
  UserCheck,
  UserX,
  Users
} from "lucide-react";
import { type Participant, type Payment } from "../../../types/participant";
import { ParticipantDeleteDialog } from "./ParticipantDeleteDialog";
import { useNavigate } from "react-router-dom";
import { QuickPaymentDialog } from "./QuickPaymentDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ParticipantTableProps {
  participants: Participant[];
  isLoading: boolean;
  searchTerm: string;
  pdfDownloaded?: boolean;
  onViewDetails: (participant: Participant) => void;
  onCheckIn: (participantId: string, currentStatus: boolean | null) => void;
  onGuestCheckIn?: (guestId: string, currentStatus: boolean) => void;
  onDelete?: () => void;
  onPaymentProcessed?: () => void;
  onMemberStatusChanged?: () => void; // Nouveau callback pour le statut de membre
}

export const ParticipantTable = ({
  participants,
  isLoading,
  searchTerm,
  pdfDownloaded = false,
  onViewDetails,
  onCheckIn,
  onGuestCheckIn,
  onDelete,
  onPaymentProcessed,
  onMemberStatusChanged
}: ParticipantTableProps) => {
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [participantForQuickPayment, setParticipantForQuickPayment] = useState<Participant | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quickPaymentDialogOpen, setQuickPaymentDialogOpen] = useState(false);
  const [changingMemberStatus, setChangingMemberStatus] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const handleRedirectToPayment = (participantId: string) => {
    navigate(`/payment/${participantId}`);
  };

  // Fonction pour ouvrir le dialogue de paiement rapide
  const handleQuickPayment = (participant: Participant) => {
    setParticipantForQuickPayment(participant);
    setQuickPaymentDialogOpen(true);
  };

  // Fonction pour modifier le statut de membre d'un participant
  const handleToggleMemberStatus = async (participant: Participant) => {
    try {
      setChangingMemberStatus(participant.id);
      const newStatus = !participant.is_member;
      
      const { error } = await supabase
        .from('participants')
        .update({ is_member: newStatus })
        .eq('id', participant.id);
        
      if (error) throw error;
      
      toast({
        title: `Statut modifié`,
        description: newStatus 
          ? `${participant.first_name} ${participant.last_name} est maintenant membre` 
          : `${participant.first_name} ${participant.last_name} n'est plus membre`,
      });
      
      // Appeler le callback pour rafraîchir les données
      if (onMemberStatusChanged) {
        onMemberStatusChanged();
      }
    } catch (error) {
      console.error("Erreur lors de la modification du statut de membre:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de membre",
        variant: "destructive",
      });
    } finally {
      setChangingMemberStatus(null);
    }
  };

  // Fonction pour dédupliquer la liste des participants
  const getUniqueParticipants = (participants: Participant[]) => {
    const uniqueParticipants = new Map();
    
    participants.forEach(participant => {
      // Si le participant existe déjà, mettre à jour seulement si le nouveau a un paiement confirmé
      const existingParticipant = uniqueParticipants.get(participant.id);
      
      if (!existingParticipant) {
        uniqueParticipants.set(participant.id, participant);
      } else {
        // Si le nouveau participant a un paiement confirmé, il remplace l'ancien
        const hasConfirmedPayment = participant.payments?.some(p => 
          ["APPROVED", "SUCCESS", "COMPLETED"].includes(p.status.toUpperCase())
        ) || participant.manual_payments?.some(p => 
          p.status.toLowerCase() === "completed"
        );
        
        if (hasConfirmedPayment) {
          uniqueParticipants.set(participant.id, participant);
        }
      }
    });
    
    return Array.from(uniqueParticipants.values());
  };

  const getPaymentStatusBadge = (participant: Participant) => {
    // Vérifier d'abord les paiements standard
    if (participant.payments && participant.payments.length > 0) {
      const payment = participant.payments[0];
      
      switch (payment.status.toUpperCase()) {
        case "APPROVED":
        case "SUCCESS":
        case "COMPLETED":
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
    }
    
    // Vérifier ensuite les paiements manuels
    if (participant.manual_payments && participant.manual_payments.length > 0) {
      const manualPayment = participant.manual_payments[0];
      
      switch (manualPayment.status.toLowerCase()) {
        case "completed":
          return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmé</Badge>;
        case "pending":
          return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
        case "rejected":
          return <Badge variant="destructive">Rejeté</Badge>;
        default:
          return <Badge variant="outline">{manualPayment.status}</Badge>;
      }
    }
    
    // Aucun paiement trouvé - afficher le bouton de paiement rapide et le bouton normal
    return (
      <div className="flex flex-col space-y-1">
        <Button 
          size="sm" 
          variant="outline" 
          className="bg-gray-100 text-gray-800 hover:bg-gray-200 flex items-center gap-1"
          onClick={() => handleRedirectToPayment(participant.id)}
        >
          <CreditCard className="h-3 w-3" />
          <span>Non payé</span>
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="bg-orange-100 text-orange-800 hover:bg-orange-200 flex items-center gap-1"
          onClick={() => handleQuickPayment(participant)}
        >
          <Zap className="h-3 w-3" />
          <span>Paiement rapide</span>
        </Button>
      </div>
    );
  };

  const handleDeleteClick = (participant: Participant) => {
    setParticipantToDelete(participant);
    setDeleteDialogOpen(true);
  };
  
  const handleQuickPaymentSuccess = () => {
    setQuickPaymentDialogOpen(false);
    // Appeler le callback pour rafraîchir les données
    if (onPaymentProcessed) {
      onPaymentProcessed();
    }
  };

  // Utiliser la liste dédupliquée pour le rendu
  const uniqueParticipants = getUniqueParticipants(participants);

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-x-auto w-full">
        <Table id="participants-table" className="w-full min-w-[1200px]">
          <TableCaption>Liste des participants à l'événement</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Membre</TableHead>
              <TableHead>Date d'inscription</TableHead>
              <TableHead>Paiement</TableHead>
              <TableHead className="text-center">Détails</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  <div className="flex justify-center items-center">
                    <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                    Chargement des participants...
                  </div>
                </TableCell>
              </TableRow>
            ) : uniqueParticipants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
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
              uniqueParticipants.map(participant => {
                const companions = participant.guests?.filter(g => !g.is_main_participant) || [];
                const hasCompanions = companions.length > 0;
                
                return (
                <TableRow key={participant.id}>
                  {/* Colonne Nom: participant principal + accompagnants en dessous */}
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-0">
                      {/* Participant principal */}
                      <div className="flex items-center gap-2">
                        <span>{participant.last_name} {participant.first_name}</span>
                        {hasCompanions && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs px-1.5 py-0">
                            <Users className="h-3 w-3 mr-1" />
                            {companions.length + 1} places
                          </Badge>
                        )}
                      </div>
                      {/* Accompagnants collés en dessous */}
                      {companions.map((guest, idx) => (
                        <div key={guest.id} className="flex items-center gap-1 pl-4 border-l-2 border-blue-200 mt-1">
                          <span className="text-sm text-blue-700">
                            {guest.first_name} {guest.last_name}
                          </span>
                          <span className="text-xs text-blue-400">(accompagnant)</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{participant.email}</TableCell>
                  <TableCell>{participant.contact_number}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {participant.is_member ? (
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 mr-2">Membre</Badge>
                      ) : (
                        <Badge variant="outline" className="mr-2">Non-membre</Badge>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleMemberStatus(participant)}
                        disabled={changingMemberStatus === participant.id}
                        title={participant.is_member ? "Retirer le statut de membre" : "Définir comme membre"}
                        className="h-6 w-6"
                      >
                        {changingMemberStatus === participant.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : participant.is_member ? (
                          <UserX className="h-3 w-3 text-red-500" />
                        ) : (
                          <UserCheck className="h-3 w-3 text-green-500" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(participant.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(participant)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => onViewDetails(participant)}
                    >
                      <Info className="h-3 w-3" />
                      <span className="hidden sm:inline">Détails</span>
                    </Button>
                  </TableCell>
                  {/* Colonne Actions: un bouton Présent/Absent par personne */}
                  <TableCell className="text-right">
                    <div className="flex flex-col gap-1 items-end">
                      {/* Bouton check-in du participant principal */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 hidden sm:inline">
                          {participant.last_name}
                        </span>
                        <Button
                          size="sm"
                          variant={participant.check_in_status ? "outline" : "default"}
                          className={`flex items-center gap-1 ${
                            participant.check_in_status 
                              ? "border-red-200 text-red-700 hover:bg-red-50" 
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                          onClick={() => onCheckIn(participant.id, participant.check_in_status)}
                        >
                          {participant.check_in_status ? (
                            <>
                              <XCircle className="h-3 w-3" />
                              <span className="hidden sm:inline">Absent</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              <span className="hidden sm:inline">Présent</span>
                            </>
                          )}
                        </Button>
                      </div>
                      {/* Boutons check-in pour chaque accompagnant */}
                      {companions.map((guest) => (
                        <div key={guest.id} className="flex items-center gap-2">
                          <span className="text-xs text-blue-500 hidden sm:inline">
                            {guest.last_name}
                          </span>
                          <Button
                            size="sm"
                            variant={guest.check_in_status ? "outline" : "default"}
                            className={`flex items-center gap-1 ${
                              guest.check_in_status 
                                ? "border-red-200 text-red-700 hover:bg-red-50" 
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                            onClick={() => onGuestCheckIn && onGuestCheckIn(guest.id, guest.check_in_status)}
                          >
                            {guest.check_in_status ? (
                              <>
                                <XCircle className="h-3 w-3" />
                                <span className="hidden sm:inline">Absent</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                <span className="hidden sm:inline">Présent</span>
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                      {/* Bouton supprimer */}
                      {pdfDownloaded && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 border-red-200 text-red-700 hover:bg-red-50 mt-1"
                          onClick={() => handleDeleteClick(participant)}
                        >
                          <Trash className="h-3 w-3" />
                          <span className="hidden sm:inline">Supprimer</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      <ParticipantDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        participant={participantToDelete}
        onSuccess={onDelete}
      />
      
      <QuickPaymentDialog
        open={quickPaymentDialogOpen}
        onOpenChange={setQuickPaymentDialogOpen}
        participant={participantForQuickPayment}
        onSuccess={handleQuickPaymentSuccess}
      />
    </>
  );
};
