
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PaymentForm } from "@/components/PaymentForm";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Payment = () => {
  const { participantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [participant, setParticipant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Logger les informations de navigation pour le débogage
  useEffect(() => {
    console.log("Payment Page: Rendu avec URL:", window.location.href);
    console.log("Payment Page: participantId:", participantId);
    console.log("Payment Page: Location pathname:", location.pathname);
    console.log("Payment Page: Query params:", location.search);
    
    // Vérifier les paramètres d'URL pour détecter un retour de CinetPay
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.has('transaction_id') || urlParams.has('token') || urlParams.has('status')) {
      console.log("Payment Page: Paramètres de retour CinetPay détectés:", 
        Object.fromEntries(urlParams.entries()));
    }
  }, [location, participantId]);

  useEffect(() => {
    const fetchParticipant = async () => {
      try {
        setLoading(true);
        console.log("Payment Page: Tentative de récupération du participant:", participantId);
        
        if (!participantId) {
          console.error("Payment Page: Identifiant de participant manquant");
          setError("Identifiant de participant manquant");
          return;
        }

        const { data, error } = await supabase
          .from('participants')
          .select('*')
          .eq('id', participantId)
          .single();

        if (error) {
          console.error("Payment Page: Erreur Supabase:", error);
          throw error;
        }

        if (!data) {
          console.error("Payment Page: Participant non trouvé");
          setError("Participant non trouvé");
          return;
        }

        console.log("Payment Page: Participant récupéré:", data);
        setParticipant(data);
      } catch (err: any) {
        console.error("Payment Page: Erreur lors de la récupération du participant:", err);
        setError(err.message || "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    fetchParticipant();
  }, [participantId]);

  const handleBackToHome = () => {
    navigate("/");
  };

  // Vérifier si l'utilisateur revient de CinetPay
  useEffect(() => {
    const checkReturnFromCinetPay = () => {
      const urlParams = new URLSearchParams(location.search);
      // Si on détecte des paramètres de retour CinetPay
      if (urlParams.has('transaction_id') || urlParams.has('token') || urlParams.has('status')) {
        console.log("Payment Page: Retour détecté de CinetPay avec paramètres:", 
          Object.fromEntries(urlParams.entries()));
        
        // Si le statut indique un succès, rediriger vers la page de confirmation
        if (participantId && (urlParams.get('status') === 'ACCEPTED' || urlParams.get('status') === 'SUCCESS')) {
          console.log("Payment Page: Redirection vers la page de confirmation après paiement réussi");
          navigate(`/confirmation/${participantId}`);
          return true;
        }
      }
      return false;
    };
    
    // Exécuter la vérification seulement si le participant est chargé
    if (participant && !loading) {
      checkReturnFromCinetPay();
    }
  }, [participant, loading, location, navigate, participantId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-indigo-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Button 
            variant="outline" 
            className="mb-6 flex items-center gap-2"
            onClick={handleBackToHome}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Button>
          
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <div className="text-center">
            <Button onClick={handleBackToHome}>
              Retourner à la page d'accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-10">
        <Button 
          variant="outline" 
          className="mb-6 flex items-center gap-2"
          onClick={handleBackToHome}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Button>
        
        {/* En-tête de la page */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            <span className="block">Finaliser votre inscription</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Choisissez votre méthode de paiement et complétez votre inscription.
          </p>
        </div>

        {/* Résumé de l'inscription */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              Résumé de l'inscription
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Informations personnelles
            </p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Nom complet</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {participant.first_name} {participant.last_name}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {participant.email}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Numéro de contact</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {participant.contact_number}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Membre de la Citadelle</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {participant.is_member ? "Oui" : "Non"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Formulaire de paiement */}
        <PaymentForm participant={participant} />
      </div>
    </div>
  );
}

export default Payment;
