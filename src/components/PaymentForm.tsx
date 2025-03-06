// Commentaires: Ce fichier gère l'intégration du paiement CinetPay Seamless
// Dernière modification: Mise à jour pour utiliser UUID sans préfixe comme identifiant de transaction
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  isCinetPaySDKLoaded, 
  initCinetPaySDK, 
  startCinetPayPayment, 
  setupCinetPayCallback,
  CinetPayCallbackData 
} from "@/integrations/cinetpay/seamless";
import { initiateCinetPayPayment } from "@/integrations/cinetpay/api";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import emailjs from '@emailjs/browser';

// Définition des constantes
const PAYMENT_AMOUNT = 1000; // Montant fixé à 1000 XOF

// Configuration EmailJS
const EMAILJS_SERVICE_ID = "service_is5645q";
const EMAILJS_TEMPLATE_ID = "template_dwx7qnw"; // Template standard
const EMAILJS_PAYMENT_TEMPLATE_ID = "template_xvdr1iq"; // Template de paiement
const EMAILJS_PUBLIC_KEY = "j9nKf3IoZXvL8mSae";

// Schéma de validation pour le formulaire de paiement
const paymentFormSchema = z.object({
  paymentMethod: z.enum(["MOBILE_MONEY", "CREDIT_CARD", "ALL"], {
    required_error: "Veuillez sélectionner une méthode de paiement"
  })
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

type PaymentFormProps = {
  participant: any;
};

export function PaymentForm({ participant }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false); // Mode test/production
  const [isCinetPayLoaded, setIsCinetPayLoaded] = useState(false);
  const [useOldMethod, setUseOldMethod] = useState(false); // Utiliser l'ancienne méthode d'API si le SDK échoue
  const navigate = useNavigate();

  console.log("PaymentForm: Initialisation pour le participant ID:", participant.id);

  // Initialiser le formulaire avec react-hook-form et zod
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMethod: "MOBILE_MONEY"
    }
  });

  // Vérifier si le SDK CinetPay est chargé au chargement du composant
  useEffect(() => {
    const checkCinetPaySDK = () => {
      const sdkLoaded = isCinetPaySDKLoaded();
      console.log("Vérification du SDK CinetPay:", sdkLoaded ? "Chargé" : "Non chargé");
      setIsCinetPayLoaded(sdkLoaded);
      
      if (!sdkLoaded) {
        console.warn("Le SDK CinetPay n'est pas chargé. L'API direct sera utilisée.");
        setUseOldMethod(true);
      }
    };

    // Vérifier après un court délai pour s'assurer que le script a eu le temps de se charger
    const timer = setTimeout(checkCinetPaySDK, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Fonction pour générer un QR code avec l'API QR Code Generator
  const generateQRCode = (url: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  // Fonction pour envoyer un email de confirmation avec le template personnalisé
  const sendConfirmationEmail = async (participantData: any, paymentData: any, qrCodeId: string) => {
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
      
      // Créer l'URL de confirmation (qui sera utilisée pour le QR code)
      const confirmationUrl = `${window.location.origin}/confirmation/${participantData.id}`;
      
      // Générer l'URL du QR code
      const qrCodeUrl = generateQRCode(confirmationUrl);
      
      // Créer l'URL du badge (simulée pour le moment)
      const badgeUrl = `${window.location.origin}/badge/${qrCodeId}`;
      
      // Adapter les paramètres pour correspondre au nouveau template
      const templateParams = {
        // Variables du nouveau template
        nom: participantData.last_name,
        prenom: participantData.first_name,
        email: participantData.email.trim(),
        tel: participantData.contact_number,
        status: statut,
        badge_url: badgeUrl,
        qr_code_url: qrCodeUrl, // URL du QR code généré
        confirmation_url: confirmationUrl, // URL de confirmation
        
        // Variables nécessaires pour EmailJS
        to_name: `${participantData.first_name} ${participantData.last_name}`,
        to_email: participantData.email.trim(),
        from_name: "La Citadelle",
        from_email: "no-reply@lacitadelle.ci",
        reply_to: "info@lacitadelle.ci",
        
        // Informations de paiement (peut-être utilisées dans d'autres parties du template)
        payment_amount: `${PAYMENT_AMOUNT.toLocaleString()} XOF`,
        payment_method: paymentData.payment_method,
        transaction_id: paymentData.transaction_id,
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

  // Fonction pour traiter le paiement une fois complété avec CinetPay Seamless
  const handleCinetPayCallback = async (data: CinetPayCallbackData) => {
    console.log("PaymentForm: Callback CinetPay reçu:", data);
    
    try {
      // Déterminer le statut du paiement
      const paymentStatus = data.status === "ACCEPTED" ? "completed" : 
                           data.status === "REFUSED" ? "failed" : "pending";
      
      // Enregistrer le paiement dans Supabase
      const { data: paymentRecord, error } = await supabase
        .from('payments')
        .insert({
          participant_id: participant.id,
          amount: PAYMENT_AMOUNT,
          payment_method: form.getValues().paymentMethod,
          status: paymentStatus,
          transaction_id: data.transaction_id || data.operator_id,
          cinetpay_operator_id: data.operator_id || null,
          cinetpay_api_response_id: data.api_response_id || data.transaction_id,
          currency: "XOF"
        })
        .select()
        .single();

      if (error) {
        console.error("PaymentForm: Erreur lors de l'enregistrement du paiement:", error);
        throw error;
      }

      console.log("PaymentForm: Paiement enregistré avec succès:", paymentRecord);

      // Si le paiement est réussi, générer un QR code et envoyer un email
      if (paymentStatus === "completed") {
        // Générer un QR code pour le participant
        const qrCodeId = `QR-${participant.id}-${Date.now()}`;
        
        // Mettre à jour le participant avec le QR code
        const { error: participantUpdateError } = await supabase
          .from('participants')
          .update({
            qr_code_id: qrCodeId
          })
          .eq('id', participant.id);

        if (participantUpdateError) {
          console.error("Erreur lors de la mise à jour du participant:", participantUpdateError);
        } else {
          console.log("QR code généré et participant mis à jour avec succès");
        }

        // Envoyer un email de confirmation
        const emailSent = await sendConfirmationEmail(participant, paymentRecord, qrCodeId);
        
        if (emailSent) {
          console.log("Email de confirmation envoyé avec succès");
        } else {
          console.warn("L'email de confirmation n'a pas pu être envoyé, mais le paiement a été enregistré");
        }

        // Afficher un message de succès
        toast({
          title: "Paiement réussi",
          description: "Votre paiement a été traité avec succès. Un email de confirmation a été envoyé.",
          variant: "default",
        });

        // Rediriger vers la page de confirmation
        navigate(`/confirmation/${participant.id}`);
      } else if (paymentStatus === "failed") {
        // Afficher un message d'erreur
        toast({
          title: "Paiement échoué",
          description: "Votre paiement n'a pas pu être traité. Veuillez réessayer.",
          variant: "destructive",
        });
      } else {
        // Paiement en attente
        toast({
          title: "Paiement en attente",
          description: "Votre paiement est en cours de traitement. Nous vous informerons une fois terminé.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("PaymentForm: Erreur lors du traitement du callback CinetPay:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du traitement du paiement.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fonction pour initialiser un paiement avec le SDK Seamless
  const initializeSeamlessPayment = async (values: PaymentFormValues, transactionId: string) => {
    console.log("Initialisation du paiement Seamless");
    
    // Créer les URLs de notification et de retour
    const baseUrl = window.location.origin;
    const notifyUrl = `${baseUrl}/api/webhooks/cinetpay/notification`;
    
    // Formater le numéro de téléphone
    const formattedPhoneNumber = participant.contact_number.replace(/\s+/g, '').replace(/^\+/, '');
    
    // Initialiser le SDK
    if (!initCinetPaySDK(notifyUrl)) {
      console.error("Échec de l'initialisation du SDK CinetPay");
      return false;
    }
    
    // Configurer le callback
    if (!setupCinetPayCallback(handleCinetPayCallback)) {
      console.error("Échec de la configuration du callback CinetPay");
      return false;
    }
    
    // Métadonnées simplifiées selon documentation (format string)
    const metadata = `PARTICIPANT:${participant.id}`;
    
    // Démarrer le paiement
    const paymentStarted = startCinetPayPayment({
      transaction_id: transactionId,
      amount: PAYMENT_AMOUNT,
      currency: "XOF",
      channels: values.paymentMethod,
      description: `Paiement pour ${participant.first_name} ${participant.last_name}`,
      customer_name: participant.first_name,
      customer_surname: participant.last_name,
      customer_email: participant.email,
      customer_phone_number: formattedPhoneNumber,
      customer_address: "Adresse non fournie",
      customer_city: "Abidjan",
      customer_country: "CI",
      customer_state: "CI",
      customer_zip_code: "00000",
      metadata: metadata
    });
    
    return paymentStarted;
  };

  async function onSubmit(values: PaymentFormValues) {
    try {
      setIsProcessing(true);
      
      if (isSimulationMode) {
        // Mode simulation - utiliser le code existant
        console.log("PaymentForm: Début de la simulation du paiement");
        
        // Simuler un délai de traitement
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Générer un UUID pour simulation (garder préfixe SIM pour distinguer des vrais paiements)
        const simTransactionId = `SIM-${uuidv4()}`;
        console.log("Simulation: ID de transaction généré:", simTransactionId);
        
        // Simuler l'enregistrement du paiement dans Supabase
        const { data: paymentRecord, error } = await supabase
          .from('payments')
          .insert({
            participant_id: participant.id,
            amount: PAYMENT_AMOUNT,
            payment_method: values.paymentMethod,
            status: 'completed', // Simuler un paiement réussi
            transaction_id: simTransactionId,
            currency: "XOF"
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Générer un QR code pour le participant
        const qrCodeId = `QR-${participant.id}-${Date.now()}`;
        const { error: participantUpdateError } = await supabase
          .from('participants')
          .update({
            qr_code_id: qrCodeId
          })
          .eq('id', participant.id);

        if (participantUpdateError) {
          console.error("Erreur lors de la mise à jour du participant:", participantUpdateError);
        }

        // Envoyer un email de confirmation
        const emailSent = await sendConfirmationEmail(participant, paymentRecord, qrCodeId);
        
        if (emailSent) {
          console.log("Email de confirmation envoyé avec succès");
        } else {
          console.warn("L'email de confirmation n'a pas pu être envoyé, mais le paiement a été enregistré");
        }

        // Afficher un message de succès
        toast({
          title: "Paiement simulé réussi",
          description: "Le paiement a été simulé avec succès. Un email de confirmation a été envoyé.",
          variant: "default",
        });
        
        // Rediriger vers la page de confirmation
        navigate(`/confirmation/${participant.id}`);
      } else {
        // Mode production - tenter d'utiliser le SDK Seamless, sinon utiliser l'API directe
        console.log("PaymentForm: Début du paiement réel");
        
        // Générer un ID de transaction unique avec UUID (sans préfixe)
        const transactionId = uuidv4();
        console.log("PaymentForm: ID de transaction généré:", transactionId);
        
        // Tenter d'utiliser le SDK Seamless
        if (isCinetPayLoaded && !useOldMethod) {
          console.log("Tentative d'utilisation du SDK Seamless");
          const seamlessSuccess = await initializeSeamlessPayment(values, transactionId);
          
          if (seamlessSuccess) {
            console.log("Paiement via SDK Seamless initié avec succès");
            return; // Le traitement est géré par le callback
          } else {
            console.warn("Échec de l'initialisation du paiement avec SDK Seamless, passage à l'API directe");
          }
        }
        
        // Utiliser l'API directe en cas d'échec du SDK
        console.log("PaymentForm: Utilisation de l'API directe CinetPay");
        
        try {
          // Initialiser le paiement avec CinetPay
          const paymentResponse = await initiateCinetPayPayment(
            participant,
            PAYMENT_AMOUNT,
            values.paymentMethod
          );
          
          console.log("PaymentForm: Réponse CinetPay:", paymentResponse);
          
          if (!paymentResponse.data?.payment_url) {
            throw new Error("URL de paiement manquante dans la réponse");
          }

          // Enregistrer le paiement dans Supabase
          const { data: paymentRecord, error } = await supabase
            .from('payments')
            .insert({
              participant_id: participant.id,
              amount: PAYMENT_AMOUNT,
              payment_method: values.paymentMethod,
              status: 'pending',
              transaction_id: paymentResponse.data.payment_token,
              cinetpay_payment_url: paymentResponse.data.payment_url,
              cinetpay_token: paymentResponse.data.payment_token,
              cinetpay_api_response_id: paymentResponse.api_response_id,
              currency: "XOF"
            })
            .select()
            .single();
            
          if (error) {
            throw error;
          }
          
          console.log("PaymentForm: Paiement enregistré avec succès:", paymentRecord);
          
          // Rediriger vers la page de paiement CinetPay
          window.location.href = paymentResponse.data.payment_url;
          return;
        } catch (cinetpayError: any) {
          console.error("PaymentForm: Erreur CinetPay:", cinetpayError);
          toast({
            title: "Erreur de paiement",
            description: cinetpayError.message || "Une erreur est survenue lors de l'initialisation du paiement.",
            variant: "destructive",
          });
          
          // Ne pas rediriger en cas d'erreur
          setIsProcessing(false);
          return;
        }
      }
      
    } catch (error: any) {
      console.error("PaymentForm: Erreur lors du traitement:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du traitement.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">
          {isSimulationMode ? "Simulation de Paiement" : "Paiement CinetPay"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <div className="flex justify-between mb-2">
            <span className="font-medium">Montant à payer:</span>
            <span className="font-bold">{PAYMENT_AMOUNT.toLocaleString()} XOF</span>
          </div>
          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              id="simulationToggle"
              checked={isSimulationMode}
              onChange={() => setIsSimulationMode(!isSimulationMode)}
              className="mr-2"
            />
            <label htmlFor="simulationToggle" className="text-sm text-gray-600">
              Mode test (simulation de paiement réussi)
            </label>
          </div>
          {!isSimulationMode && (
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="apiToggle"
                checked={useOldMethod}
                onChange={() => setUseOldMethod(!useOldMethod)}
                className="mr-2"
              />
              <label htmlFor="apiToggle" className="text-sm text-gray-600">
                Utiliser l'API directe (sans SDK Seamless)
              </label>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Méthode de paiement</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="MOBILE_MONEY" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Mobile Money (Orange Money, MTN Mobile Money, Moov Money, Wave)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="CREDIT_CARD" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Carte bancaire (Visa, Mastercard)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="ALL" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Tous les moyens de paiement
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isProcessing || (!isSimulationMode && !isCinetPayLoaded && !useOldMethod)}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isSimulationMode ? "Simulation en cours..." : "Traitement en cours..."}
                </>
              ) : (
                isSimulationMode 
                  ? `Simuler le paiement de ${PAYMENT_AMOUNT.toLocaleString()} XOF`
                  : `Payer ${PAYMENT_AMOUNT.toLocaleString()} XOF avec CinetPay`
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-start text-xs text-gray-500">
        <p>
          {isSimulationMode 
            ? "Mode test : La simulation créera un paiement réussi dans la base de données et enverra un email de confirmation."
            : useOldMethod
              ? "Paiement via API CinetPay : Vous serez redirigé vers la page de paiement CinetPay."
              : "Paiement via SDK Seamless : Le paiement s'effectuera directement sur cette page."
          }
        </p>
      </CardFooter>
    </Card>
  );
}
