
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, CheckCircle, Download } from "lucide-react";
import { checkCinetPayPayment } from "@/integrations/cinetpay/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import EventLogo from "@/components/EventLogo";

// Ce fichier gère la page de confirmation d'inscription après le paiement
// Modifications:
// - Correction du problème de génération PDF (erreur removeChild sur Node)
// - Amélioration de la gestion du DOM lors de la génération du PDF
// - Optimisation du processus de création du reçu

const Confirmation = () => {
  const { participantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [participant, setParticipant] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (!participantId) {
          setError("Identifiant de participant manquant");
          return;
        }

        const { data: participantData, error: participantError } = await supabase
          .from('participants')
          .select('*')
          .eq('id', participantId)
          .single();

        if (participantError) {
          throw participantError;
        }

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

        if (paymentData.status === 'pending' && paymentData.cinetpay_token) {
          setIsVerifying(true);
          try {
            const cinetPayStatus = await checkCinetPayPayment(paymentData.cinetpay_token);
            
            if (cinetPayStatus.code === "00" && cinetPayStatus.data.status === "ACCEPTED") {
              const { error: updateError } = await supabase
                .from('payments')
                .update({
                  status: 'success',
                  cinetpay_operator_id: cinetPayStatus.data.operator_id
                })
                .eq('id', paymentData.id);

              if (!updateError) {
                const { data: refreshedPayment } = await supabase
                  .from('payments')
                  .select('*')
                  .eq('id', paymentData.id)
                  .single();
                
                if (refreshedPayment) {
                  setPayment(refreshedPayment);
                }
              }
            }
          } catch (checkError) {
            console.error("Erreur lors de la vérification du statut CinetPay:", checkError);
          } finally {
            setIsVerifying(false);
          }
        }

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

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current || isGeneratingPdf) return;
    
    try {
      setIsGeneratingPdf(true);
      
      // Créer un clone du reçu pour éviter de modifier l'original
      const receiptContent = receiptRef.current.cloneNode(true) as HTMLElement;
      
      // Créer un conteneur temporaire et l'ajouter au body
      const container = document.createElement('div');
      container.id = 'temp-pdf-container';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.padding = '20px';
      container.style.backgroundColor = 'white';
      container.appendChild(receiptContent);
      
      // Ajouter le conteneur au body
      document.body.appendChild(container);
      
      try {
        // Générer le canvas à partir du conteneur
        const canvas = await html2canvas(container, {
          scale: 2,
          logging: false,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        
        // Convertir le canvas en image pour le PDF
        const imgData = canvas.toDataURL('image/png');
        
        // Créer le PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // Calculer les dimensions pour le PDF
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / canvas.height;
        const imgWidth = pdfWidth - 20;
        const imgHeight = imgWidth / ratio;
        
        // Ajouter l'image au PDF
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        
        // Définir le nom du fichier et enregistrer
        const fileName = `recu-paiement-${participant?.last_name}-${participant?.first_name}.pdf`;
        pdf.save(fileName);
      } finally {
        // Vérifier si le conteneur existe et est un enfant de document.body avant de le supprimer
        const tempContainer = document.getElementById('temp-pdf-container');
        if (tempContainer && document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
      }
    } catch (err) {
      console.error("Erreur lors de la génération du PDF:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="fixed top-0 left-0 w-full h-2 flex">
          <div className="bg-orange-500 w-1/3 h-full"></div>
          <div className="bg-white w-1/3 h-full"></div>
          <div className="bg-green-600 w-1/3 h-full"></div>
        </div>
        
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-700">Chargement...</p>
        </div>
        
        <div className="fixed bottom-0 left-0 w-full h-2 flex">
          <div className="bg-orange-500 w-1/3 h-full"></div>
          <div className="bg-white w-1/3 h-full"></div>
          <div className="bg-green-600 w-1/3 h-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="fixed top-0 left-0 w-full h-2 flex">
          <div className="bg-orange-500 w-1/3 h-full"></div>
          <div className="bg-white w-1/3 h-full"></div>
          <div className="bg-green-600 w-1/3 h-full"></div>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <EventLogo size="medium" className="mb-6" />
          
          <Button 
            variant="outline" 
            className="mb-6 flex items-center gap-2 border-green-200 text-green-700"
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
            <Button onClick={handleBackToHome} className="bg-green-700 hover:bg-green-800 text-white">
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

  const isPending = payment?.status === 'pending';

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="fixed top-0 left-0 w-full h-2 flex">
        <div className="bg-orange-500 w-1/3 h-full"></div>
        <div className="bg-white w-1/3 h-full"></div>
        <div className="bg-green-600 w-1/3 h-full"></div>
      </div>
      
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-green-200 text-green-700"
            onClick={handleBackToHome}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Button>
          
          <EventLogo size="medium" />
        </div>
        
        <div className="text-center space-y-4">
          {isPending ? (
            <>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-700"></div>
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
                <CheckCircle className="h-16 w-16 text-green-700" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                <span className="block text-green-700">Inscription confirmée</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-600 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                Merci pour votre inscription à l'IFTAR 2025! Votre paiement a été traité avec succès.
              </p>
            </>
          )}
        </div>

        <div ref={receiptRef} className="bg-white shadow-md overflow-hidden sm:rounded-lg border border-green-100">
          <div className="px-4 py-5 sm:px-6 bg-green-50 flex justify-between items-center">
            <div>
              <h2 className="text-lg leading-6 font-medium text-gray-900">
                Détails de votre inscription
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Référence de transaction: {payment?.transaction_id || payment?.cinetpay_api_response_id}
              </p>
            </div>
            <EventLogo size="small" />
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

        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {!isPending && (
            <Button 
              variant="outline" 
              className="flex items-center gap-2 w-full md:w-auto"
              onClick={handleDownloadReceipt}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-700"></span>
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isGeneratingPdf ? "Génération en cours..." : "Télécharger le reçu"}
            </Button>
          )}
        </div>

        {!isPending && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTitle className="text-blue-800">Instructions importantes</AlertTitle>
            <AlertDescription className="text-blue-700">
              <p>Un email de confirmation contenant votre QR code d'accès a été envoyé à votre adresse email. Assurez-vous de présenter ce QR code lors de votre arrivée à l'événement.</p>
              <p className="mt-2">Pour toute question, veuillez nous contacter à l'adresse email: support@example.com</p>
            </AlertDescription>
          </Alert>
        )}

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
      
      <div className="fixed bottom-0 left-0 w-full h-2 flex">
        <div className="bg-orange-500 w-1/3 h-full"></div>
        <div className="bg-white w-1/3 h-full"></div>
        <div className="bg-green-600 w-1/3 h-full"></div>
      </div>
    </div>
  );
};

export default Confirmation;
