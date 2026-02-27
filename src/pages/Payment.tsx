
// Ce fichier gère la page de paiement pour finaliser l'inscription
// Modifications:
// - Remplacement du système CinetPay par un système de paiement manuel
// - Mise à jour des imports pour utiliser le composant ManualPaymentForm refactorisé
// - Notification par email à l'administrateur pour la validation

import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ManualPaymentForm } from "@/components/manual-payment/ManualPaymentForm";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventLogo from "@/components/EventLogo";

const Payment = () => {
  const { participantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [participant, setParticipant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Désactiver la restauration automatique du scroll par le navigateur (important pour mobile)
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, []);

  useEffect(() => {
    console.log("Payment Page: Rendu avec URL:", window.location.href);
    console.log("Payment Page: participantId:", participantId);
    console.log("Payment Page: Location pathname:", location.pathname);
    console.log("Payment Page: Query params:", location.search);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-700">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="fixed top-0 left-0 w-full h-2 flex">
          <div className="bg-orange-500 w-1/3 h-full"></div>
          <div className="bg-white w-1/3 h-full"></div>
          <div className="bg-green-600 w-1/3 h-full"></div>
        </div>
        
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
        
        <div className="fixed bottom-0 left-0 w-full h-2 flex">
          <div className="bg-orange-500 w-1/3 h-full"></div>
          <div className="bg-white w-1/3 h-full"></div>
          <div className="bg-green-600 w-1/3 h-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="fixed top-0 left-0 w-full h-2 flex">
        <div className="bg-orange-500 w-1/3 h-full"></div>
        <div className="bg-white w-1/3 h-full"></div>
        <div className="bg-green-600 w-1/3 h-full"></div>
      </div>
    
      <div className="max-w-3xl mx-auto space-y-10">
        <Button 
          variant="outline" 
          className="mb-6 flex items-center gap-2"
          onClick={handleBackToHome}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Button>
        
        <div className="text-center space-y-4">
          <EventLogo size="medium" />
          
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            <span className="block text-green-700">Finaliser votre inscription</span>
            <span className="block text-orange-500 text-2xl sm:text-3xl">IFTAR 2026 - 15e Édition</span>
          </h1>
          
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Effectuez votre paiement et soumettez votre preuve de transfert pour compléter votre inscription.
          </p>
        </div>

        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-green-100">
          <div className="px-4 py-5 sm:px-6 bg-green-50">
            <h2 className="text-lg leading-6 font-medium text-green-700">
              Résumé de l'inscription
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-green-600">
              Informations personnelles
            </p>
          </div>
          <div className="border-t border-green-100">
            <dl>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Nom complet</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {participant.first_name} {participant.last_name}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {participant.email}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Numéro de contact</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {participant.contact_number}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Membre de la Citadelle</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {participant.is_member ? "Oui" : "Non"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <ManualPaymentForm participant={participant} />
        
        <div className="w-full flex justify-center my-10">
          <div className="h-8 w-64 bg-contain bg-center bg-no-repeat islamic-divider" 
               style={{ backgroundImage: "url('https://i.pinimg.com/originals/3e/0a/d7/3e0ad78af1ba7e3870f73f7694f30fb7.png')" }}>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 w-full h-2 flex">
        <div className="bg-orange-500 w-1/3 h-full"></div>
        <div className="bg-white w-1/3 h-full"></div>
        <div className="bg-green-600 w-1/3 h-full"></div>
      </div>
    </div>
  );
}

export default Payment;
