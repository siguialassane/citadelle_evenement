// Composant pour afficher les détails d'un participant
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { type Participant, type Payment } from "../../../types/participant";
import { type ManualPayment } from "../../../types/payment";

interface ParticipantDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participant: Participant | null;
}

export const ParticipantDetails = ({ 
  open, 
  onOpenChange, 
  participant 
}: ParticipantDetailsProps) => {
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusBadge = (payment?: Payment | ManualPayment) => {
    if (!payment) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">Non payé</Badge>;
    }
    
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
  };

  const getActivePayment = (participant: Participant | null) => {
    if (!participant) return null;
    
    if (participant.payments?.length > 0) {
      return { 
        payment: participant.payments[0], 
        type: 'standard' 
      };
    }
    
    if (participant.manual_payments?.length > 0) {
      return { 
        payment: participant.manual_payments[0], 
        type: 'manual' 
      };
    }
    
    return null;
  };

  const activePayment = participant ? getActivePayment(participant) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Détails du participant
          </DialogTitle>
          <DialogDescription>
            Informations complètes et détails de paiement
          </DialogDescription>
        </DialogHeader>
        
        {participant && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nom complet</p>
                  <p className="font-medium">{participant.last_name} {participant.first_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{participant.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{participant.contact_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <div className="flex items-center mt-1 gap-2">
                    {participant.is_member && <Badge className="bg-purple-100 text-purple-800">Membre</Badge>}
                    {participant.check_in_status ? 
                      <Badge className="bg-green-100 text-green-800">Présent</Badge> : 
                      <Badge variant="outline">Non enregistré</Badge>
                    }
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date d'inscription</p>
                  <p className="font-medium">{formatDate(participant.created_at)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Détails du paiement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activePayment ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Statut</p>
                      <div className="mt-1">{getPaymentStatusBadge(activePayment.payment)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Montant</p>
                      <p className="font-medium">
                        {activePayment.payment.amount} 
                        {activePayment.type === 'standard' 
                          ? ` ${(activePayment.payment as Payment).currency || 'XOF'}`
                          : ' XOF'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Méthode de paiement</p>
                      <p className="font-medium">{activePayment.payment.payment_method || 'Non spécifiée'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date de paiement</p>
                      <p className="font-medium">
                        {formatDate(activePayment.type === 'standard' 
                          ? (activePayment.payment as Payment).payment_date
                          : (activePayment.payment as ManualPayment).created_at
                        )}
                      </p>
                    </div>
                    {activePayment.type === 'standard' && (activePayment.payment as Payment).transaction_id && (
                      <div>
                        <p className="text-sm text-muted-foreground">ID de transaction</p>
                        <p className="font-medium">{(activePayment.payment as Payment).transaction_id}</p>
                      </div>
                    )}
                    {activePayment.type === 'manual' && (activePayment.payment as ManualPayment).comments && (
                      <div>
                        <p className="text-sm text-muted-foreground">Commentaires</p>
                        <p className="font-medium">{(activePayment.payment as ManualPayment).comments}</p>
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
  );
};
