// Ce fichier gère la page de confirmation d'inscription après le paiement
// Modifications:
// - Amélioration du traitement des URL de QR code avec paramètres supplémentaires
// - Support robuste pour les paramètres type=qr et pid pour identifier la source
// - Logging étendu pour faciliter le débogage des redirections QR code
// - Ajout du bouton d'auto-validation de présence avec code de sécurité

import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, CheckCircle, Download, UserCheck } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from 'html2canvas';
import EventLogo from "@/components/EventLogo";
import { ConfirmPresenceDialog } from "@/components/ui/confirm-presence-dialog";

const Confirmation = () => {
  // ... keep existing code (déclaration des paramètres, constantes d'état, etc.)
  const { participantId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [participant, setParticipant] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [isManualPayment, setIsManualPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Ajout d'états pour la gestion du dialogue de confirmation de présence
  const [confirmPresenceDialogOpen, setConfirmPresenceDialogOpen] = useState(false);
  const [isPresent, setIsPresent] = useState(false);

  useEffect(() => {
    // ... keep existing code (fetchData function)
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (!participantId) {
          console.error("Aucun paramètre d'URL trouvé");
          setError("Identifiant de participant manquant");
          return;
        }

        // Extraction des paramètres de l'URL
        const queryParams = new URLSearchParams(location.search);
        const isQrCodeAccess = queryParams.get('type') === 'qr';
        const providedParticipantId = queryParams.get('pid');
        
        console.log("==== ANALYSE DE L'URL DE CONFIRMATION ====");
        console.log("URL complète:", window.location.href);
        console.log("Paramètre URL principal:", participantId);
        console.log("Paramètres querystring:", location.search);
        console.log("Est un accès via QR code:", isQrCodeAccess ? "Oui" : "Non");
        console.log("ID participant fourni dans l'URL:", providedParticipantId);
        
        // AMÉLIORATION: Stratégie de recherche hiérarchique
        let currentParticipant = null;
        let searchMethod = "";
        
        // 1. Si c'est un accès via QR code et un ID de participant est fourni
        if (isQrCodeAccess && providedParticipantId) {
          console.log("Stratégie: Utilisation de l'ID participant fourni dans l'URL QR code");
          searchMethod = "pid_from_qr";
          const { data: participantByProvidedId, error: pidError } = await supabase
            .from('participants')
            .select('*')
            .eq('id', providedParticipantId)
            .maybeSingle();
          
          if (pidError) {
            console.error("Erreur lors de la recherche par ID participant fourni:", pidError);
          } else if (participantByProvidedId) {
            console.log("Participant trouvé via ID fourni dans l'URL QR:", participantByProvidedId);
            currentParticipant = participantByProvidedId;
          }
        }
        
        // 2. Si aucun participant trouvé, essayer de trouver par QR code ID
        if (!currentParticipant) {
          console.log("Stratégie: Recherche par QR code ID");
          searchMethod = "qr_code_id";
          const { data: participantByQrCode, error: qrCodeError } = await supabase
            .from('participants')
            .select('*')
            .eq('qr_code_id', participantId)
            .maybeSingle();
          
          if (qrCodeError) {
            console.error("Erreur lors de la recherche par QR code ID:", qrCodeError);
          } else if (participantByQrCode) {
            console.log("Participant trouvé via QR code ID:", participantByQrCode);
            currentParticipant = participantByQrCode;
          }
        }
        
        // 3. Si toujours aucun participant, essayer par ID participant direct
        if (!currentParticipant) {
          console.log("Stratégie: Recherche par ID participant direct");
          searchMethod = "participant_id";
          const { data: participantById, error: participantError } = await supabase
            .from('participants')
            .select('*')
            .eq('id', participantId)
            .maybeSingle();
          
          if (participantError) {
            console.error("Erreur lors de la recherche du participant par ID:", participantError);
          } else if (participantById) {
            console.log("Participant trouvé via ID participant:", participantById);
            currentParticipant = participantById;
          }
        }
        
        // Si aucun participant trouvé après toutes les tentatives
        if (!currentParticipant) {
          console.error(`Aucun participant trouvé avec l'identifiant: ${participantId} (Méthode: ${searchMethod})`);
          setError("Participant non trouvé. Veuillez vérifier l'URL ou contacter le support.");
          return;
        }
        
        console.log(`Participant identifié avec succès via la méthode: ${searchMethod}`);
        setParticipant(currentParticipant);
        
        // Vérifier si le participant est déjà marqué comme présent
        setIsPresent(currentParticipant.check_in_status || false);
        
        const actualParticipantId = currentParticipant.id;
        console.log("ID du participant identifié:", actualParticipantId);

        // Recherche des paiements avec l'ID du participant trouvé
        // 1. Essayer d'abord de récupérer un paiement manuel
        const { data: manualPaymentData, error: manualPaymentError } = await supabase
          .from('manual_payments')
          .select('*')
          .eq('participant_id', actualParticipantId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (manualPaymentError) {
          console.error("Erreur lors de la récupération du paiement manuel:", manualPaymentError);
        } else {
          console.log("Résultat de la recherche de paiement manuel:", manualPaymentData);
        }

        // 2. Si un paiement manuel existe, l'utiliser
        if (manualPaymentData) {
          console.log("Paiement manuel trouvé:", manualPaymentData);
          setPayment({
            ...manualPaymentData,
            currency: 'XOF',
            payment_date: manualPaymentData.validated_at || manualPaymentData.created_at,
            transaction_id: `MANUAL-${manualPaymentData.id.substring(0, 8)}`,
          });
          setIsManualPayment(true);
        } else {
          console.log("Aucun paiement manuel trouvé pour ce participant, recherche de paiement standard...");
          
          // 3. Sinon, essayer de récupérer un paiement standard
          const { data: standardPaymentData, error: standardPaymentError } = await supabase
            .from('payments')
            .select('*')
            .eq('participant_id', actualParticipantId)
            .order('payment_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (standardPaymentError) {
            console.error("Erreur lors de la récupération du paiement standard:", standardPaymentError);
          } else {
            console.log("Résultat de la recherche de paiement standard:", standardPaymentData);
          }

          if (standardPaymentData) {
            console.log("Paiement standard trouvé:", standardPaymentData);
            setPayment(standardPaymentData);
            setIsManualPayment(false);
          } else {
            console.error("Aucun paiement trouvé pour ce participant");
            setError("Aucun paiement validé trouvé pour ce participant.");
          }
        }

      } catch (err: any) {
        console.error("Erreur lors de la récupération des données:", err);
        setError(err.message || "Une erreur est survenue lors de la récupération des données de paiement.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [participantId, location]);

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleDownloadReceipt = async () => {
    // ... keep existing code (gestion du téléchargement du reçu)
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

  // Nouvelle fonction pour gérer la confirmation de présence
  const handleConfirmPresence = () => {
    setConfirmPresenceDialogOpen(true);
  };

  // Fonction appelée après une validation réussie
  const handlePresenceConfirmed = () => {
    setIsPresent(true);
  };

  const formatPaymentMethod = (method: string) => {
    // ... keep existing code (formatage des méthodes de paiement)
    const methods: Record<string, string> = {
      wave: "Wave",
      orange_money: "Orange Money",
      moov_money: "Moov Money",
      MTN: "MTN Money",
      ORANGE: "Orange Money",
      MOOV: "Moov Money",
      mtn_money: "MTN Money",
      bank_card: "Carte bancaire",
    };
    return methods[method] || method;
  };

  // ... keep existing code (loading, error states, etc)
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

  // Si aucun paiement n'a été trouvé
  if (!payment) {
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
          
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Aucun paiement validé</AlertTitle>
            <AlertDescription>
              Nous n'avons pas trouvé de paiement validé pour votre inscription. Si vous avez récemment effectué un paiement, 
              il est possible qu'il soit en cours de traitement. Veuillez vérifier la page d'état de votre paiement ou contacter l'administrateur.
            </AlertDescription>
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
          <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-green-50 flex justify-between items-center">
            <div>
              <h2 className="text-lg leading-6 font-medium text-gray-900">
                Détails de votre inscription
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Référence de transaction: {payment?.transaction_id || (isManualPayment ? `M-${payment?.id.substring(0, 8)}` : 'N/A')}
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
                  {payment?.amount.toLocaleString()} {payment?.currency || 'XOF'}
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
                  }) : (
                    isManualPayment && payment?.validated_at ? 
                    new Date(payment.validated_at).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : "En attente"
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Statut</dt>
                <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2 flex flex-wrap items-center gap-2">
                  {isPending ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      En attente
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Confirmé
                    </span>
                  )}
                  
                  {isPresent && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Présence confirmée
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {!isPending && (
            <>
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
              
              {/* Nouveau bouton pour confirmer sa présence */}
              {!isPresent && (
                <Button 
                  className="flex items-center gap-2 w-full md:w-auto bg-blue-600 hover:bg-blue-700"
                  onClick={handleConfirmPresence}
                >
                  <UserCheck className="h-4 w-4" />
                  Confirmer ma présence
                </Button>
              )}
            </>
          )}
        </div>

        {!isPending && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTitle className="text-blue-800">Instructions importantes</AlertTitle>
            <AlertDescription className="text-blue-700">
              <p>Un email de confirmation contenant votre invitation a été envoyé à votre adresse email. {!isPresent && "N'oubliez pas de confirmer votre présence le jour de l'événement en utilisant le bouton \"Confirmer ma présence\"."}</p>
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
      
      {/* Dialogue de confirmation de présence */}
      <ConfirmPresenceDialog
        open={confirmPresenceDialogOpen}
        onOpenChange={setConfirmPresenceDialogOpen}
        participantId={participant?.id || ""}
        participantName={`${participant?.first_name || ""} ${participant?.last_name || ""}`}
        onSuccess={handlePresenceConfirmed}
      />
    </div>
  );
};

export default Confirmation;
