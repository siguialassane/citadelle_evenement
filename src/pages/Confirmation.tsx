
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, CheckCircle, Download } from "lucide-react";

const Confirmation = () => {
  const { participantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [participant, setParticipant] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (!participantId) {
          setError("Identifiant de participant manquant");
          return;
        }

        // Récupérer les informations du participant
        const { data: participantData, error: participantError } = await supabase
          .from('participants')
          .select('*')
          .eq('id', participantId)
          .single();

        if (participantError) {
          throw participantError;
        }

        // Récupérer les informations de paiement
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('participant_id', participantId)
          .order('payment_date', { ascending: false })
          .limit(1)
          .single();

        if (paymentError) {
          throw paymentError;
        }

        setParticipant(participantData);
        setPayment(paymentData);

        // Note: We've removed the CinetPay API verification code since we're using form submission
        // Status updates are now handled by the webhook directly

      } catch (err: any) {
        console.error("Erreur lors de la récupération des données:", err);
        setError(err.message || "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [participantId]);

  const handleBackToHome = () => {
    navigate("/");
  };

  // Fonction pour formater la méthode de paiement
  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      wave: "Wave",
      orange_money: "Orange Money",
      moov_money: "Moov Money",
      mtn_money: "MTN Money",
      bank_card: "Carte bancaire",
    };
    return methods[method] || method;
  };

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

  // Vérifier si le paiement est toujours en attente
  const isPending = payment?.status === 'pending';

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
          {isPending ? (
            <>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                <span className="block">Paiement en cours de traitement</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                Veuillez patienter pendant que nous vérifions votre paiement...
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                <span className="block">Inscription confirmée</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                Merci pour votre inscription! Votre paiement a été traité avec succès.
              </p>
            </>
          )}
        </div>

        {/* Carte de confirmation */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-indigo-50">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              Détails de votre inscription
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Référence de transaction: {payment?.transaction_id || payment?.cinetpay_api_response_id}
            </p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Nom complet</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {participant?.first_name} {participant?.last_name}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {participant?.email}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Numéro de contact</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {participant?.contact_number}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Membre de la Citadelle</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {participant?.is_member ? "Oui" : "Non"}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Montant payé</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {payment?.amount.toLocaleString()} {payment?.currency}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Méthode de paiement</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatPaymentMethod(payment?.payment_method)}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Date de paiement</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {payment?.payment_date ? new Date(payment.payment_date).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : "En attente"}
                </dd>
              </div>
              {payment?.cinetpay_operator_id && (
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Identifiant de l'opération</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {payment.cinetpay_operator_id}
                  </dd>
                </div>
              )}
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Statut</dt>
                <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                  {isPending ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      En attente
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Confirmé
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {!isPending && (
            <Button 
              variant="outline" 
              className="flex items-center gap-2 w-full md:w-auto"
            >
              <Download className="h-4 w-4" />
              Télécharger le reçu
            </Button>
          )}
          <Button 
            className="w-full md:w-auto"
            onClick={handleBackToHome}
          >
            Retourner à l'accueil
          </Button>
        </div>

        {/* Instructions */}
        {!isPending && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTitle className="text-blue-800">Instructions importantes</AlertTitle>
            <AlertDescription className="text-blue-700">
              <p>Un email de confirmation contenant votre QR code d'accès a été envoyé à votre adresse email. Assurez-vous de présenter ce QR code lors de votre arrivée à l'événement.</p>
              <p className="mt-2">Pour toute question, veuillez nous contacter à l'adresse email: support@example.com</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Message en cas de paiement en cours */}
        {isPending && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTitle className="text-yellow-800">Paiement en cours de traitement</AlertTitle>
            <AlertDescription className="text-yellow-700">
              <p>Votre paiement est en cours de traitement. Cette page se mettra à jour automatiquement dès que nous aurons reçu la confirmation.</p>
              <p className="mt-2">Si vous avez déjà effectué le paiement via votre opérateur mobile et que cette page ne se met pas à jour, veuillez rafraîchir la page ou nous contacter à support@example.com</p>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default Confirmation;
