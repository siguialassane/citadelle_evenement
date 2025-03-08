// Ce fichier gère la page d'administration pour la validation des paiements manuels
// Il permet aux administrateurs de voir les paiements sous forme de tableau
// Il conserve toutes les fonctionnalités existantes mais avec une interface en tableau
// Dernière mise à jour: Ajout du bouton de communication avec le dashboard principal

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  SearchIcon, 
  XCircle,
  AlertCircle,
  Eye
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import emailjs from '@emailjs/browser';
import { v4 as uuidv4 } from 'uuid';
import { 
  PARTICIPANT_EMAILJS_SERVICE_ID, 
  PARTICIPANT_EMAILJS_TEMPLATE_ID, 
  PARTICIPANT_EMAILJS_PUBLIC_KEY 
} from "@/components/manual-payment/config";
import { PARTICIPANT_PAYMENT_CONFIRMATION_TEMPLATE } from "@/components/manual-payment/EmailTemplates";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardCommunication } from "@/components/admin/dashboard/DashboardCommunication";

interface Payment {
  id: string;
  participant_id: string;
  amount: number;
  payment_method: string;
  phone_number: string;
  status: string;
  comments: string;
  created_at: string;
  formatted_date: string;
  formatted_time: string;
  participant_name: string;
  participant_email: string;
  participant_phone: string;
  participant: any;
}

const PaymentValidation = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPayments, setTotalPayments] = useState(0);
  const { paymentId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = paymentId
      ? `Valider le paiement | IFTAR 2024`
      : "Validation des paiements | IFTAR 2024";

    if (paymentId) {
      fetchPaymentById(paymentId);
    } else {
      fetchPendingPayments();
    }
  }, [paymentId]);

  const fetchPendingPayments = async () => {
    try {
      setIsLoading(true);
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('manual_payments')
        .select(`
          *,
          participants(*)
        `)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      if (!paymentsData || paymentsData.length === 0) {
        toast({
          title: "Aucun paiement trouvé",
          description: "Il n'y a aucun paiement dans le système pour le moment.",
        });
        setPayments([]);
        setFilteredPayments([]);
        setTotalPayments(0);
        return;
      }

      const formattedPayments = paymentsData.map(payment => {
        const date = new Date(payment.created_at);
        const formattedDate = date.toLocaleDateString('fr-FR');
        const formattedTime = date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        });

        return {
          id: payment.id,
          participant_id: payment.participant_id,
          amount: payment.amount,
          payment_method: payment.payment_method,
          phone_number: payment.phone_number,
          status: payment.status,
          comments: payment.comments,
          created_at: payment.created_at,
          formatted_date: formattedDate,
          formatted_time: formattedTime,
          participant_name: `${payment.participants.first_name} ${payment.participants.last_name}`,
          participant_email: payment.participants.email,
          participant_phone: payment.participants.contact_number,
          participant: payment.participants
        };
      });

      const pendingPayments = formattedPayments.filter(p => p.status === 'pending');
      setTotalPayments(pendingPayments.length);
      
      setPayments(formattedPayments);
      setFilteredPayments(formattedPayments);

    } catch (error: any) {
      console.error("Erreur lors de la récupération des paiements:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentById = async (id: string) => {
    try {
      setIsLoading(true);
      
      const { data: paymentData, error: paymentError } = await supabase
        .from('manual_payments')
        .select(`
          *,
          participants(*)
        `)
        .eq('id', id)
        .single();

      if (paymentError) throw paymentError;

      if (!paymentData) {
        setError("Paiement non trouvé");
        return;
      }

      const date = new Date(paymentData.created_at);
      const formattedDate = date.toLocaleDateString('fr-FR');
      const formattedTime = date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      const formattedPayment = {
        id: paymentData.id,
        participant_id: paymentData.participant_id,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        phone_number: paymentData.phone_number,
        status: paymentData.status,
        comments: paymentData.comments,
        created_at: paymentData.created_at,
        formatted_date: formattedDate,
        formatted_time: formattedTime,
        participant_name: `${paymentData.participants.first_name} ${paymentData.participants.last_name}`,
        participant_email: paymentData.participants.email,
        participant_phone: paymentData.participants.contact_number,
        participant: paymentData.participants
      };

      setCurrentPayment(formattedPayment);
      setFilteredPayments([formattedPayment]);

    } catch (error: any) {
      console.error("Erreur lors de la récupération du paiement:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    filterPayments(e.target.value);
  };

  const filterPayments = (query: string) => {
    const lowerCaseQuery = query.toLowerCase();
    const filtered = payments.filter(payment =>
      payment.participant_name.toLowerCase().includes(lowerCaseQuery) ||
      payment.participant_email.toLowerCase().includes(lowerCaseQuery) ||
      payment.phone_number.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredPayments(filtered);
  };

  const validatePayment = async (paymentId: string) => {
    try {
      setIsValidating(true);
      
      const { error: updateError } = await supabase
        .from('manual_payments')
        .update({ status: 'completed' })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      const paymentToValidate = currentPayment || payments.find(p => p.id === paymentId);
      
      if (!paymentToValidate) {
        throw new Error("Données de paiement manquantes");
      }

      const { error: participantError } = await supabase
        .from('participants')
        .update({ 
          payment_status: 'completed',
          qr_code_id: uuidv4()
        })
        .eq('id', paymentToValidate.participant_id);

      if (participantError) throw participantError;

      const { data: participantData, error: fetchError } = await supabase
        .from('participants')
        .select('*')
        .eq('id', paymentToValidate.participant_id)
        .single();

      if (fetchError) throw fetchError;
      if (!participantData) throw new Error("Participant non trouvé");

      await sendConfirmationEmail(participantData, participantData.qr_code_id);

      toast({
        title: "Paiement validé avec succès",
        description: `Un email de confirmation a été envoyé à ${paymentToValidate.participant_email}`,
        variant: "default",
      });

      const updatedPayments = payments.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'completed' } 
          : payment
      );
      
      setPayments(updatedPayments);
      filterPayments(searchQuery);

      setTimeout(() => {
        navigate("/admin/payment-validation");
      }, 1500);

    } catch (error: any) {
      console.error("Erreur lors de la validation du paiement:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la validation du paiement",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const rejectPayment = async (paymentId: string) => {
    try {
      setIsRejecting(true);

      const { error: updateError } = await supabase
        .from('manual_payments')
        .update({ status: 'rejected' })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      toast({
        title: "Paiement rejeté avec succès",
        description: "Le paiement a été rejeté et le participant sera notifié.",
        variant: "default",
      });

      const updatedPayments = payments.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'rejected' } 
          : payment
      );
      
      setPayments(updatedPayments);
      filterPayments(searchQuery);

      setTimeout(() => {
        navigate("/admin/payment-validation");
      }, 1500);

    } catch (error: any) {
      console.error("Erreur lors du rejet du paiement:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du rejet du paiement",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const sendConfirmationEmail = async (participantData: any, qrCodeId: string) => {
    try {
      console.log("Envoi de l'email de confirmation au participant...");
      
      console.log("Données du participant:", JSON.stringify(participantData));
      
      const appUrl = window.location.origin;
      
      const statut = participantData.is_member ? "Membre" : "Non-membre";
      
      const confirmationUrl = `${appUrl}/confirmation/${participantData.id}`;
      
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(confirmationUrl)}`;
      
      const templateParams = {
        to_email: participantData.email.trim(),
        prenom: participantData.first_name.trim(),
        nom: participantData.last_name.trim(),
        email: participantData.email.trim(),
        tel: participantData.contact_number,
        status: statut,
        qr_code_url: qrCodeUrl,
        participant_id: participantData.id,
        app_url: appUrl,
        
        to_name: `${participantData.first_name} ${participantData.last_name}`,
        from_name: "IFTAR 2024",
        reply_to: "ne-pas-repondre@lacitadelle.ci"
      };

      console.log("Paramètres pour EmailJS (participant):", templateParams);
      console.log("URL de confirmation:", confirmationUrl);
      console.log("URL du QR code:", qrCodeUrl);

      const response = await emailjs.send(
        PARTICIPANT_EMAILJS_SERVICE_ID,
        PARTICIPANT_EMAILJS_TEMPLATE_ID,
        templateParams,
        PARTICIPANT_EMAILJS_PUBLIC_KEY
      );

      console.log("Email de confirmation envoyé avec succès:", response);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email au participant:", error);
      throw error;
    }
  };

  const handleBackToList = () => {
    navigate("/admin/payment-validation");
  };
  
  const handleViewDetails = (paymentId: string) => {
    navigate(`/admin/payment-validation/${paymentId}`);
  };
  
  const handleRefresh = () => {
    fetchPendingPayments();
    toast({
      title: "Liste actualisée",
      description: "La liste des paiements a été actualisée",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="mx-auto h-6 w-6 animate-spin text-gray-500" />
          <p className="mt-2 text-sm text-gray-500">Chargement des paiements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (paymentId && currentPayment) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleBackToList}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la liste
          </Button>
          
          <DashboardCommunication variant="outline" />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>
              Détails du paiement de {currentPayment.participant_name}
            </CardTitle>
            <CardDescription>
              {currentPayment.participant_email} • {currentPayment.participant_phone}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Méthode de paiement</p>
                  <p>{currentPayment.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Montant</p>
                  <p>{currentPayment.amount} XOF</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Numéro de téléphone</p>
                  <p>{currentPayment.phone_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date de création</p>
                  <p>{currentPayment.formatted_date} à {currentPayment.formatted_time}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-gray-500">Commentaires</p>
                <p>{currentPayment.comments || "Aucun commentaire"}</p>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-gray-500">Statut actuel</p>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentPayment.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : currentPayment.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {currentPayment.status === 'completed' 
                    ? 'Validé' 
                    : currentPayment.status === 'rejected'
                    ? 'Rejeté'
                    : 'En attente'}
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <Button 
              variant="outline"
              onClick={handleBackToList}
            >
              Retour
            </Button>
            
            {currentPayment.status === 'pending' && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => rejectPayment(currentPayment.id)}
                  disabled={isRejecting || isValidating}
                  className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                >
                  {isRejecting ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Rejet en cours...
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Rejeter
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={() => validatePayment(currentPayment.id)}
                  disabled={isValidating || isRejecting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isValidating ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Validation...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Valider
                    </>
                  )}
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Validation des Paiements</h1>
          {filteredPayments.filter(p => p.status === 'pending').length > 0 ? (
            <p className="text-gray-600 mt-1">
              {filteredPayments.filter(p => p.status === 'pending').length} paiement(s) en attente de validation
            </p>
          ) : (
            <p className="text-gray-600 mt-1">
              Tous les paiements ont été traités
            </p>
          )}
        </div>
        
        <DashboardCommunication />
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <Input
            type="text"
            placeholder="Rechercher un participant..."
            value={searchQuery}
            onChange={handleSearch}
            className="pr-10"
          />
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
        </div>
        
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">{filteredPayments.length} paiement(s) trouvé(s)</p>
          <Button variant="outline" onClick={handleRefresh} className="flex gap-2 items-center">
            Actualiser
          </Button>
        </div>
      </div>

      {filteredPayments.length === 0 && !isLoading ? (
        <Alert variant="default">
          <AlertTitle>Aucun paiement trouvé</AlertTitle>
          <AlertDescription>
            Aucun paiement ne correspond à votre recherche.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead>Participant</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    <div>{payment.formatted_date}</div>
                    <div className="text-xs text-gray-500">{payment.formatted_time}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{payment.participant_name}</div>
                    <div className="text-xs text-gray-500">{payment.participant_email}</div>
                  </TableCell>
                  <TableCell>
                    <div>{payment.payment_method}</div>
                    <div className="text-xs text-gray-500">{payment.phone_number}</div>
                  </TableCell>
                  <TableCell>{payment.amount} XOF</TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payment.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : payment.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status === 'completed' 
                        ? 'Validé' 
                        : payment.status === 'rejected'
                        ? 'Rejeté'
                        : 'En attente'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleViewDetails(payment.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {payment.status === 'pending' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => rejectPayment(payment.id)}
                            disabled={isRejecting || isValidating}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {isRejecting && payment.id === currentPayment?.id ? (
                              <Clock className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => validatePayment(payment.id)}
                            disabled={isValidating || isRejecting}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            {isValidating && payment.id === currentPayment?.id ? (
                              <Clock className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PaymentValidation;
