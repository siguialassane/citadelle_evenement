// Composant pour afficher le tableau des participants
// Mise à jour: Ajout de la fonctionnalité de paiement rapide
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
  Zap
} from "lucide-react";
import { type Participant, type Payment } from "../../../types/participant";
import { ParticipantDeleteDialog } from "./ParticipantDeleteDialog";
import { useNavigate } from "react-router-dom";
import { QuickPaymentDialog } from "./QuickPaymentDialog";

interface ParticipantTableProps {
  participants: Participant[];
  isLoading: boolean;
  searchTerm: string;
  pdfDownloaded?: boolean;
  onViewDetails: (participant: Participant) => void;
  onCheckIn: (participantId: string, currentStatus: boolean | null) => void;
  onDelete?: () => void;
  onPaymentProcessed?: () => void;
}

export const ParticipantTable = ({
  participants,
  isLoading,
  searchTerm,
  pdfDownloaded = false,
  onViewDetails,
  onCheckIn,
  onDelete,
  onPaymentProcessed
}: ParticipantTableProps) => {
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [participantForQuickPayment, setParticipantForQuickPayment] = useState<Participant | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quickPaymentDialogOpen, setQuickPaymentDialogOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleRedirectToPayment = (participantId: string) => {
    navigate(`/payment/${participantId}`);
  };

  // Fonction pour ouvrir le dialogue de paiement rapide
  const handleQuickPayment = (participant: Participant) => {
    setParticipantForQuickPayment(participant);
    setQuickPaymentDialogOpen(true);
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
            ) : uniqueParticipants.length === 0 ? (
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
              uniqueParticipants.map(participant => (
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
                    {getPaymentStatusBadge(participant)}
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
                      onClick={() => onViewDetails(participant)}
                    >
                      <Info className="h-3 w-3" />
                      <span className="hidden sm:inline">Détails</span>
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
                            <span className="hidden sm:inline">Annuler</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="hidden sm:inline">Présent</span>
                          </>
                        )}
                      </Button>
                      
                      {pdfDownloaded && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteClick(participant)}
                        >
                          <Trash className="h-3 w-3" />
                          <span className="hidden sm:inline">Supprimer</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
