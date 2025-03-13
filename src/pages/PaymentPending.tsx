import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventLogo from "@/components/EventLogo";
import { toast } from "@/hooks/use-toast";

const PaymentPending = () => {
  const { participantId } = useParams();
  const navigate = useNavigate();
  const [participant, setParticipant] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Logs supplémentaires pour le débogage
        console.log("PaymentPending - Chargement avec ID participant:", participantId);
        console.log("PaymentPending - URL complète:", window.location.href);
        
        if (!participantId) {
          console.error("PaymentPending - Erreur: ID participant manquant");
          setError("Identifiant de participant manquant");
          return;
        }

        // Vérification du format de l'ID (UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(participantId)) {
          console.error("PaymentPending - Erreur: Format d'ID invalide:", participantId);
          setError("Format d'identifiant invalide");
          return;
        }

        // Récupérer les informations du participant
        const { data: participantData, error: participantError } = await supabase
          .from('participants')
          .select('*')
          .eq('id', participantId)
          .single();

        if (participantError) {
          console.error("Erreur lors de la récupération du participant:", participantError);
          throw participantError;
        }

        if (!participantData) {
          console.error("PaymentPending - Participant non trouvé pour ID:", participantId);
          setError("Participant non trouvé");
          return;
        }

        console.log("PaymentPending - Participant trouvé:", participantData.id);
        setParticipant(participantData);

        // Récupérer le dernier paiement manuel du participant
        const { data: paymentData, error: paymentError } = await supabase
          .from('manual_payments')
          .select('*')
          .eq('participant_id', participantId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(); // Utiliser maybeSingle au lieu de single pour éviter l'erreur

        if (paymentError) {
          console.error("Erreur lors de la récupération du paiement:", paymentError);
          // Ne pas définir d'erreur ici, car le participant peut ne pas avoir encore de paiement
        } else if (paymentData) {
          console.log("PaymentPending - Paiement trouvé:", paymentData.id, "Statut:", paymentData.status);
          setPayment(paymentData);

          // Si le paiement a été validé, rediriger vers la page de confirmation
          if (paymentData.status === 'completed') {
            console.log("PaymentPending - Paiement validé, redirection vers confirmation");
            toast({
              title: "Paiement validé",
              description: "Votre paiement a été validé. Vous allez être redirigé vers la page de confirmation.",
              variant: "default",
            });
            
            // Rediriger vers la page de confirmation
            setTimeout(() => {
              navigate(`/confirmation/${participantId}`);
            }, 2000);
          }
        } else {
          console.log("PaymentPending - Aucun paiement trouvé pour le participant:", participantId);
          // Aucun paiement trouvé, mais ce n'est pas nécessairement une erreur
        }
      } catch (err: any) {
        console.error("PaymentPending - Erreur lors de la récupération des données:", err);
        setError(err.message || "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Configurer un intervalle pour vérifier régulièrement le statut du paiement
    const checkPaymentStatus = setInterval(async () => {
      try {
        if (!participantId) return;

        console.log("PaymentPending - Vérification du statut de paiement pour:", participantId);
        
        const { data, error } = await supabase
          .from('manual_payments')
          .select('*')
          .eq('participant_id', participantId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Erreur lors de la vérification du statut:", error);
          return;
        }

        if (data && data.status === 'completed') {
          console.log("PaymentPending - Paiement validé détecté durant la vérification périodique");
          toast({
            title: "Paiement validé",
            description: "Votre paiement a été validé. Vous allez être redirigé vers la page de confirmation.",
            variant: "default",
          });
          
          // Rediriger vers la page de confirmation
          setTimeout(() => {
            navigate(`/confirmation/${participantId}`);
          }, 2000);
        }

        if (data) {
          setPayment(data);
        }
      } catch (err) {
        console.error("Erreur lors de la vérification du statut:", err);
      }
    }, 30000); // Vérifier toutes les 30 secondes

    return () => {
      clearInterval(checkPaymentStatus);
    };
  }, [participantId, navigate]);

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

  // Afficher un message si aucun paiement n'a été trouvé
  if (!payment) {
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
          
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Aucun paiement en attente</AlertTitle>
            <AlertDescription>
              Aucun paiement en attente n'a été trouvé pour ce participant. Si vous venez de soumettre un paiement, veuillez actualiser la page.
            </AlertDescription>
          </Alert>
          
          <div className="text-center">
            <Button onClick={() => window.location.reload()}>
              Actualiser la page
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
            <span className="block text-green-700">Paiement en attente de validation</span>
            <span className="block text-orange-500 text-2xl sm:text-3xl">IFTAR 2025 - 14e Édition</span>
          </h1>
        </div>

        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Paiement en cours de validation</AlertTitle>
          <AlertDescription>
            Votre preuve de paiement a été soumise avec succès et est en attente de validation par un administrateur. Ce processus peut prendre jusqu'à 24 heures. Vous recevrez un email de confirmation une fois votre paiement validé.
          </AlertDescription>
        </Alert>

        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-green-100">
          <div className="px-4 py-5 sm:px-6 bg-green-50">
            <h2 className="text-lg leading-6 font-medium text-green-700">
              Détails du paiement
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-green-600">
              Les informations de votre paiement
            </p>
          </div>
          
          <div className="border-t border-green-100">
            <dl>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Participant</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {participant?.first_name} {participant?.last_name}
                </dd>
              </div>
              
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Montant</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {payment?.amount.toLocaleString() || "1000"} XOF
                </dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Méthode</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {payment?.payment_method}
                </dd>
              </div>
              
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Statut</dt>
                <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="mr-1 h-3 w-3" />
                    En attente de validation
                  </span>
                </dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Date de soumission</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {payment?.created_at ? new Date(payment.created_at).toLocaleString() : "Non disponible"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-yellow-100">
          <h3 className="font-medium text-lg mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            Que se passe-t-il ensuite ?
          </h3>
          
          <div className="space-y-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-600">
                  1
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-base font-medium">Vérification</h4>
                <p className="mt-1 text-sm text-gray-500">Un administrateur vérifiera votre preuve de paiement.</p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-600">
                  2
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-base font-medium">Validation</h4>
                <p className="mt-1 text-sm text-gray-500">Une fois validé, votre inscription sera confirmée.</p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-600">
                  3
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-base font-medium">Confirmation par email</h4>
                <p className="mt-1 text-sm text-gray-500">Vous recevrez un email avec votre QR code et votre reçu.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Vous pouvez vérifier le statut de votre paiement en actualisant cette page.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-2"
            >
              Actualiser le statut
            </Button>
          </div>
        </div>
        
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
};

export default PaymentPending;
