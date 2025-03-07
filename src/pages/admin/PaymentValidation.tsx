
// Ce fichier gère la page d'administration pour la validation des paiements manuels
// Il permet aux administrateurs de voir les paiements en attente, de consulter les preuves
// et de valider ou rejeter les paiements

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy, Download, ExternalLink, Eye, LogOut, Search, X } from "lucide-react";
import emailjs from '@emailjs/browser';
import { v4 as uuidv4 } from 'uuid';
import { Input } from "@/components/ui/input";

// Configuration EmailJS pour la notification de validation
const EMAILJS_SERVICE_ID = "service_is5645q";
const EMAILJS_PAYMENT_TEMPLATE_ID = "template_xvdr1iq";
const EMAILJS_PUBLIC_KEY = "j9nKf3IoZXvL8mSae";

const PAYMENT_AMOUNT = 1000; // Montant fixé à 1000 XOF

const PaymentValidation = () => {
  const navigate = useNavigate();
  const { paymentId } = useParams(); // Pour afficher directement un paiement spécifique
  
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [participant, setParticipant] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);

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
    fetchPendingPayments();
  }, [navigate]);

  // Filtrer les paiements lorsque le terme de recherche change
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPayments(pendingPayments);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filtered = pendingPayments.filter(payment => {
      const participantName = `${payment.participant?.first_name} ${payment.participant?.last_name}`.toLowerCase();
      const participantEmail = payment.participant?.email.toLowerCase();
      const participantPhone = payment.participant?.contact_number;
      const paymentMethod = payment.payment_method?.toLowerCase();
      const paymentPhone = payment.phone_number;

      return (
        participantName.includes(searchTermLower) ||
        participantEmail.includes(searchTermLower) ||
        participantPhone.includes(searchTerm) ||
        paymentMethod?.includes(searchTermLower) ||
        paymentPhone?.includes(searchTerm)
      );
    });

    setFilteredPayments(filtered);
  }, [searchTerm, pendingPayments]);

  // Ouvrir les détails d'un paiement spécifique s'il est fourni dans l'URL
  useEffect(() => {
    if (paymentId && pendingPayments.length > 0) {
      const payment = pendingPayments.find(p => p.id === paymentId);
      if (payment) {
        handleViewDetails(payment);
      }
    }
  }, [paymentId, pendingPayments]);

  const fetchPendingPayments = async () => {
    try {
      setIsLoading(true);
      
      const { data: payments, error } = await supabase
        .from('manual_payments')
        .select(`
          *,
          participant: participant_id (
            id,
            first_name,
            last_name,
            email,
            contact_number,
            is_member
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log("Paiements récupérés:", payments);
      setPendingPayments(payments || []);
      setFilteredPayments(payments || []);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des paiements:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de récupérer la liste des paiements.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (payment: any) => {
    setSelectedPayment(payment);
    setParticipant(payment.participant);
    setAdminNotes("");
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedPayment(null);
    setParticipant(null);
    setDetailsOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Fonction pour envoyer un email de confirmation au participant
  const sendConfirmationEmail = async (participantData: any, qrCodeId: string) => {
    try {
      console.log("Préparation de l'envoi d'email de confirmation via EmailJS");
      
      // Vérifier que l'email du participant existe
      if (!participantData.email) {
        console.error("Erreur: L'adresse email du participant est manquante");
        return false;
      }

      // Log plus détaillé de l'objet participant pour le débogage
      console.log("Données du participant:", JSON.stringify(participantData));
      
      // Déterminer le statut du participant
      const statut = participantData.is_member ? "Membre" : "Non-membre";
      
      // Créer l'URL de confirmation
      const confirmationUrl = `${window.location.origin}/confirmation/${participantData.id}`;
      
      // Générer l'URL du QR code
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(confirmationUrl)}`;
      
      // Créer l'URL du badge (simulée pour le moment)
      const badgeUrl = `${window.location.origin}/badge/${qrCodeId}`;
      
      // Adapter les paramètres pour correspondre au template
      const templateParams = {
        // Variables du template
        nom: participantData.last_name,
        prenom: participantData.first_name,
        email: participantData.email.trim(),
        tel: participantData.contact_number,
        status: statut,
        badge_url: badgeUrl,
        qr_code_url: qrCodeUrl,
        confirmation_url: confirmationUrl,
        app_url: confirmationUrl,
        
        // Variables nécessaires pour EmailJS
        to_name: `${participantData.first_name} ${participantData.last_name}`,
        to_email: participantData.email.trim(),
        from_name: "La Citadelle",
        from_email: "no-reply@lacitadelle.ci",
        reply_to: "info@lacitadelle.ci",
        
        // Informations de paiement
        payment_amount: `${PAYMENT_AMOUNT.toLocaleString()} XOF`,
        payment_method: "Mobile Money (Validation manuelle)",
        transaction_id: selectedPayment.id,
        payment_date: new Date().toLocaleString(),
        qr_code_id: qrCodeId,
        event_name: "Conférence La Citadelle"
      };

      console.log("Paramètres du template EmailJS:", JSON.stringify(templateParams));
      
      // Vérification supplémentaire avant l'envoi
      if (!templateParams.to_email) {
        throw new Error("L'adresse email du destinataire est vide");
      }
      
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_PAYMENT_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      console.log("Email envoyé avec succès:", response);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      return false;
    }
  };

  const validatePayment = async () => {
    if (!selectedPayment || !participant) return;
    
    try {
      setIsProcessing(true);
      
      // 1. Générer un QR code pour le participant
      const qrCodeId = `QR-${participant.id}-${Date.now()}`;
      console.log(`Génération du QR code ${qrCodeId}`);
      
      // 2. Mettre à jour le participant avec le QR code
      const { error: participantUpdateError } = await supabase
        .from('participants')
        .update({
          qr_code_id: qrCodeId
        })
        .eq('id', participant.id);

      if (participantUpdateError) {
        console.error("Erreur lors de la mise à jour du participant:", participantUpdateError);
        throw participantUpdateError;
      }

      // 3. Mettre à jour le statut du paiement
      const { error: paymentUpdateError } = await supabase
        .from('manual_payments')
        .update({
          status: 'completed',
          validated_at: new Date().toISOString(),
          validated_by: "admin",
          admin_notes: adminNotes
        })
        .eq('id', selectedPayment.id);

      if (paymentUpdateError) {
        console.error("Erreur lors de la mise à jour du paiement:", paymentUpdateError);
        throw paymentUpdateError;
      }

      // 4. Créer un enregistrement de paiement normal
      const { error: paymentRecordError } = await supabase
        .from('payments')
        .insert({
          participant_id: participant.id,
          amount: PAYMENT_AMOUNT,
          payment_method: `Manuel (${selectedPayment.payment_method})`,
          status: 'completed',
          transaction_id: selectedPayment.id,
          currency: "XOF"
        });

      if (paymentRecordError) {
        console.error("Erreur lors de l'enregistrement du paiement:", paymentRecordError);
        throw paymentRecordError;
      }

      // 5. Envoyer un email de confirmation
      const emailSent = await sendConfirmationEmail(participant, qrCodeId);
      
      if (emailSent) {
        console.log("Email de confirmation envoyé avec succès");
      } else {
        console.warn("L'email de confirmation n'a pas pu être envoyé");
        // Continuer malgré l'échec de l'email
      }

      // 6. Mettre à jour l'interface
      toast({
        title: "Paiement validé",
        description: "Le paiement a été validé avec succès. Un email a été envoyé au participant.",
        variant: "default",
      });
      
      // 7. Actualiser les données et fermer le modal
      await fetchPendingPayments();
      handleCloseDetails();
      
    } catch (error: any) {
      console.error("Erreur lors de la validation du paiement:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la validation du paiement.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const rejectPayment = async () => {
    if (!selectedPayment) return;
    
    try {
      setIsProcessing(true);
      
      // Mettre à jour le statut du paiement
      const { error } = await supabase
        .from('manual_payments')
        .update({
          status: 'rejected',
          validated_at: new Date().toISOString(),
          validated_by: "admin",
          admin_notes: adminNotes
        })
        .eq('id', selectedPayment.id);

      if (error) {
        console.error("Erreur lors du rejet du paiement:", error);
        throw error;
      }

      // Mettre à jour l'interface
      toast({
        title: "Paiement rejeté",
        description: "Le paiement a été rejeté.",
        variant: "default",
      });
      
      // Actualiser les données et fermer le modal
      await fetchPendingPayments();
      handleCloseDetails();
      
    } catch (error: any) {
      console.error("Erreur lors du rejet du paiement:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du rejet du paiement.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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

  const handleGoToDashboard = () => {
    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête avec navigation */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Validation des Paiements
              </h1>
              <p className="text-sm text-gray-600">
                Gérez les paiements en attente de validation
              </p>
            </div>
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={handleGoToDashboard}
              >
                Tableau de bord
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barre de recherche et filtres */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher par nom, email, téléphone..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 w-full"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {filteredPayments.length} paiement(s) trouvé(s)
            </span>
            <Button 
              onClick={() => fetchPendingPayments()} 
              variant="outline" 
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
              ) : "Actualiser"}
            </Button>
          </div>
        </div>

        {/* Tableau des paiements */}
        <Card>
          <Table>
            <TableCaption>Liste des paiements en attente de validation</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Participant</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Chargement des paiements...</p>
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <p className="text-gray-500">Aucun paiement trouvé</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {new Date(payment.created_at).toLocaleDateString()}
                      <div className="text-xs text-gray-500">
                        {new Date(payment.created_at).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.participant?.first_name} {payment.participant?.last_name}
                      <div className="text-xs text-gray-500">{payment.participant?.email}</div>
                    </TableCell>
                    <TableCell>
                      {payment.payment_method}
                      <div className="text-xs text-gray-500">{payment.phone_number}</div>
                    </TableCell>
                    <TableCell>{payment.amount} XOF</TableCell>
                    <TableCell>
                      {payment.status === 'pending' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          En attente
                        </span>
                      ) : payment.status === 'completed' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Validé
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Rejeté
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleViewDetails(payment)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Voir détails</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </main>

      {/* Modal de détails du paiement */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Détails du paiement</DialogTitle>
            <DialogDescription>
              Vérifiez les informations et validez ou rejetez ce paiement
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && participant && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations du participant */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Informations du participant</h3>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium text-sm">Nom complet:</div>
                  <div className="col-span-2 text-sm">{participant.first_name} {participant.last_name}</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium text-sm">Email:</div>
                  <div className="col-span-2 text-sm">{participant.email}</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium text-sm">Téléphone:</div>
                  <div className="col-span-2 text-sm">{participant.contact_number}</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium text-sm">Membre:</div>
                  <div className="col-span-2 text-sm">{participant.is_member ? "Oui" : "Non"}</div>
                </div>
                
                <h3 className="font-medium text-lg border-b pb-2 mt-6">Détails du paiement</h3>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium text-sm">Montant:</div>
                  <div className="col-span-2 text-sm">{selectedPayment.amount} XOF</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium text-sm">Méthode:</div>
                  <div className="col-span-2 text-sm">{selectedPayment.payment_method}</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium text-sm">Numéro utilisé:</div>
                  <div className="col-span-2 text-sm">{selectedPayment.phone_number}</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium text-sm">Date:</div>
                  <div className="col-span-2 text-sm">{new Date(selectedPayment.created_at).toLocaleString()}</div>
                </div>
                
                {selectedPayment.comments && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-medium text-sm">Commentaires:</div>
                    <div className="col-span-2 text-sm">{selectedPayment.comments}</div>
                  </div>
                )}
                
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">
                    Notes administratives (facultatif):
                  </label>
                  <Textarea
                    placeholder="Ajoutez des notes concernant ce paiement"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full"
                    rows={3}
                  />
                </div>
              </div>

              {/* Preuve de paiement */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Preuve de paiement</h3>
                
                {selectedPayment.screenshot_url ? (
                  <div className="space-y-2">
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src={selectedPayment.screenshot_url} 
                        alt="Preuve de paiement" 
                        className="w-full object-contain"
                        style={{ maxHeight: '400px' }}
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => window.open(selectedPayment.screenshot_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Ouvrir en grand
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedPayment.screenshot_url;
                          link.download = `preuve-paiement-${participant.last_name}.jpg`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-500">
                    Aucune preuve de paiement disponible
                  </div>
                )}
                
                <div className="mt-6 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                  <h4 className="font-medium text-yellow-800">Instructions pour la vérification :</h4>
                  <ul className="mt-2 space-y-2 text-sm text-yellow-700">
                    <li>1. Vérifiez que le montant correspond (1000 XOF)</li>
                    <li>2. Vérifiez que le numéro utilisé pour le paiement correspond</li>
                    <li>3. Vérifiez que la date et l'heure du transfert sont récentes</li>
                    <li>4. Vérifiez que le numéro de transaction est visible et unique</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:justify-between">
              <Button
                variant="outline"
                onClick={handleCloseDetails}
                disabled={isProcessing}
              >
                Annuler
              </Button>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="destructive"
                  onClick={rejectPayment}
                  disabled={isProcessing || selectedPayment?.status !== 'pending'}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Rejeter
                </Button>
                
                <Button
                  variant="default"
                  onClick={validatePayment}
                  disabled={isProcessing || selectedPayment?.status !== 'pending'}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Valider le paiement
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentValidation;
