
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
import { AlertTriangle, Download, QrCode, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type Participant, type Payment } from "../../../types/participant";
import { type ManualPayment } from "../../../types/payment";
import html2canvas from 'html2canvas';
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [isRegeneratingQR, setIsRegeneratingQR] = useState(false);
  const isMobile = useIsMobile();
  
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

  const generateQrCodeUrl = (participant: Participant) => {
    if (!participant) return null;
    const baseUrl = window.location.origin;
    return `${baseUrl}/confirmation/${participant.id}`;
  };

  const regenerateQrCode = async () => {
    if (!participant) return;
    
    try {
      setIsRegeneratingQR(true);
      
      // Générer un nouveau QR code ID unique
      const newQrCodeId = crypto.randomUUID();
      
      // Mettre à jour dans la base de données
      const { error } = await supabase
        .from('participants')
        .update({ qr_code_id: newQrCodeId })
        .eq('id', participant.id);
        
      if (error) throw error;
      
      toast({
        title: "QR Code régénéré",
        description: "Le QR Code a été régénéré avec succès.",
      });
      
      // Forcer le rafraîchissement des données (ceci dépend de votre implémentation)
      // Idéalement, il faudrait appeler une fonction du composant parent pour recharger les données
    } catch (error) {
      console.error("Erreur lors de la régénération du QR code:", error);
      toast({
        title: "Erreur",
        description: "Impossible de régénérer le QR code.",
        variant: "destructive",
      });
    } finally {
      setIsRegeneratingQR(false);
    }
  };

  const downloadQrCode = async () => {
    if (!participant) return;
    
    const qrCodeElement = document.getElementById('participant-qr-code');
    if (!qrCodeElement) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le QR code.",
        variant: "destructive",
      });
      return;
    }

    try {
      const canvas = await html2canvas(qrCodeElement);
      const dataUrl = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = `qrcode-${participant.last_name}-${participant.first_name}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Téléchargement réussi",
        description: "Le QR code a été téléchargé avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors du téléchargement du QR code:", error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le QR code.",
        variant: "destructive",
      });
    }
  };

  const activePayment = participant ? getActivePayment(participant) : null;
  const qrCodeUrl = participant ? generateQrCodeUrl(participant) : null;
  const hasPayment = activePayment && (activePayment.payment.status.toUpperCase() === "APPROVED" || 
                                     activePayment.payment.status.toUpperCase() === "SUCCESS" || 
                                     activePayment.payment.status.toUpperCase() === "COMPLETED");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

            {/* Carte pour le QR Code */}
            {hasPayment && (
              <Card className={`${isMobile ? "col-span-1" : "col-span-2"}`}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <QrCode className="h-5 w-5 mr-2" />
                    QR Code d'accès
                  </CardTitle>
                  <CardDescription>
                    Le QR code permettant l'accès à l'événement
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  {qrCodeUrl ? (
                    <>
                      <div 
                        id="participant-qr-code"
                        className="border-2 border-dashed border-gray-300 p-4 rounded-lg mb-4 bg-white"
                      >
                        <div className="text-center mb-2">
                          <p className="font-bold">{participant.last_name} {participant.first_name}</p>
                          <p className="text-xs text-gray-500">ID: {participant.id.slice(0, 8)}...</p>
                        </div>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                          alt="QR Code d'accès"
                          className="mx-auto h-48 w-48"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={downloadQrCode}
                          variant="outline"
                          className="flex items-center"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                        <Button
                          onClick={regenerateQrCode}
                          variant="outline"
                          className="flex items-center"
                          disabled={isRegeneratingQR}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${isRegeneratingQR ? 'animate-spin' : ''}`} />
                          Régénérer
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-500">
                      <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
                      <p>QR code non disponible</p>
                      <p className="text-sm">Le QR code sera disponible après validation du paiement</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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
