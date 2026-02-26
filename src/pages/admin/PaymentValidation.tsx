
// Ce fichier a été refactorisé pour organiser le code en composants plus petits
// Mise à jour: Clarification du flux de validation et uniformisation des services EmailJS
// Mise à jour: Ajout des statistiques financières pour une meilleure vue d'ensemble

import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePaymentValidation } from "@/hooks/usePaymentValidation";
import { PaymentSearchBar } from "@/components/admin/payment-validation/PaymentSearchBar";
import { PaymentList } from "@/components/admin/payment-validation/PaymentList";
import { PaymentDetailCard } from "@/components/admin/payment-validation/PaymentDetailCard";
import { DashboardCommunication } from "@/components/admin/dashboard/DashboardCommunication";
import { PaymentStatistics } from "@/components/admin/payment-validation/PaymentStatistics";

const PaymentValidation = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const {
    filteredPayments,
    currentPayment,
    searchQuery,
    isLoading,
    isValidating,
    isRejecting,
    error,
    handleSearch,
    validatePayment,
    rejectPayment,
    handleRefresh,
    setCurrentPayment,
  } = usePaymentValidation(paymentId);

  const handleBackToList = () => {
    navigate("/admin/payment-validation");
  };
  
  const handleViewDetails = (paymentId: string) => {
    navigate(`/admin/payment-validation/${paymentId}`);
  };

  const handleValidatePayment = async (paymentId: string) => {
    // Cette fonction déclenche l'envoi de l'email de confirmation avec QR code
    // et la notification à l'administrateur
    console.log("Validation du paiement par l'administrateur, ID:", paymentId);
    console.log("Utilisation de la configuration EmailJS unifiée pour tous les emails");
    
    const success = await validatePayment(paymentId);
    if (success) {
      console.log("Validation réussie, tous les emails ont été envoyés avec le service unifié");
      setTimeout(() => {
        navigate("/admin/payment-validation");
      }, 1500);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    const success = await rejectPayment(paymentId);
    if (success) {
      setTimeout(() => {
        navigate("/admin/payment-validation");
      }, 1500);
    }
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
      <div className="w-full px-4 sm:px-6 lg:px-8 py-10">
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
        
        <PaymentDetailCard
          payment={currentPayment}
          isValidating={isValidating}
          isRejecting={isRejecting}
          onBack={handleBackToList}
          onValidate={handleValidatePayment}
          onReject={handleRejectPayment}
        />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-10">
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

      {/* Nouvelle section de statistiques */}
      <PaymentStatistics payments={filteredPayments} />

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <PaymentSearchBar 
          searchQuery={searchQuery} 
          onSearchChange={handleSearch} 
        />
        
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">{filteredPayments.length} paiement(s) trouvé(s)</p>
          <Button variant="outline" onClick={handleRefresh} className="flex gap-2 items-center">
            Actualiser
          </Button>
        </div>
      </div>

      <PaymentList
        payments={filteredPayments}
        isLoading={isLoading}
        currentPaymentId={currentPayment?.id}
        isValidating={isValidating}
        isRejecting={isRejecting}
        onViewDetails={handleViewDetails}
        onValidatePayment={handleValidatePayment}
        onRejectPayment={handleRejectPayment}
      />
    </div>
  );
};

export default PaymentValidation;
