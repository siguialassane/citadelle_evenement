
// Ce fichier contient les fonctions d'intégration avec le SDK CinetPay
import CinetPay from 'cinetpay-nodejs';
import { 
  CINETPAY_API_KEY, 
  CINETPAY_SITE_ID, 
  CINETPAY_SECRET_KEY
} from './config';
import type { Database } from '../supabase/types';

type Participant = Database['public']['Tables']['participants']['Row'];

/**
 * Configure et initialise le SDK CinetPay
 * @returns Instance du SDK CinetPay configurée
 */
export const initCinetPaySDK = () => {
  // Vérifier que les clés d'API sont définies
  if (!CINETPAY_API_KEY || !CINETPAY_SITE_ID || !CINETPAY_SECRET_KEY) {
    console.error("CinetPaySDK: Configuration CinetPay manquante:", {
      API_KEY_SET: !!CINETPAY_API_KEY,
      SITE_ID_SET: !!CINETPAY_SITE_ID,
      SECRET_KEY_SET: !!CINETPAY_SECRET_KEY
    });
    throw new Error("Configuration CinetPay incomplète. Veuillez contacter l'administrateur.");
  }

  // Configurer le SDK CinetPay
  const cinetpay = new CinetPay({
    apikey: CINETPAY_API_KEY,
    site_id: CINETPAY_SITE_ID,
    secret_key: CINETPAY_SECRET_KEY
  });

  return cinetpay;
};

/**
 * Initialise un paiement avec le SDK CinetPay
 * @param participant Informations du participant
 * @param amount Montant du paiement
 * @param paymentMethod Méthode de paiement choisie
 * @returns Promise avec la réponse du SDK CinetPay
 */
export const initiatePaymentWithSDK = async (
  participant: Participant,
  amount: number,
  paymentMethod: string
) => {
  console.log("CinetPaySDK: Début de l'initialisation du paiement");
  
  try {
    // Initialiser le SDK
    const cinetpay = initCinetPaySDK();
    
    // Vérifier que les informations du participant sont valides
    if (!participant || !participant.id || !participant.first_name || !participant.last_name || !participant.email || !participant.contact_number) {
      console.error("CinetPaySDK: Informations du participant invalides:", participant);
      throw new Error("Informations du participant invalides ou incomplètes");
    }
    
    // Générer un ID de transaction unique - format YYYYMMDD-HHMMSS-RandomNum
    const date = new Date();
    const dateStr = date.toISOString().replace(/[^0-9]/g, '').slice(0, 8); // YYYYMMDD
    const timeStr = `${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}`;
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const transactionId = `TR${dateStr}${timeStr}${randomNum}`;
    
    console.log("CinetPaySDK: ID de transaction généré:", transactionId);
    
    // URL de base de l'application pour les redirections
    const baseUrl = window.location.origin;
    console.log("CinetPaySDK: URL de base pour les redirections:", baseUrl);
    
    // Construction de l'URL de notification pour webhook
    const notifyUrl = `${baseUrl}/api/webhooks/cinetpay/notification`;
    console.log("CinetPaySDK: URL de notification (webhook):", notifyUrl);
    
    // Construction de l'URL de retour
    const returnUrl = `${baseUrl}/confirmation/${participant.id}`;
    console.log("CinetPaySDK: URL de retour après paiement:", returnUrl);

    // Formater le numéro de téléphone pour qu'il soit sans espaces et +
    const formattedPhoneNumber = participant.contact_number.replace(/\s+/g, '').replace(/^\+/, '');
    console.log("CinetPaySDK: Numéro de téléphone formaté:", formattedPhoneNumber);

    // Préparer les données pour le SDK
    const paymentData = {
      transaction_id: transactionId,
      amount: amount,
      currency: "XOF",
      description: `Paiement pour ${participant.first_name} ${participant.last_name}`,
      notify_url: notifyUrl,
      return_url: returnUrl,
      channels: paymentMethod,
      // Métadonnées pour le suivi
      metadata: JSON.stringify({
        participant_id: participant.id,
        payment_method: paymentMethod
      }),
      // Informations du client
      customer_name: participant.first_name,
      customer_surname: participant.last_name,
      customer_email: participant.email,
      customer_phone_number: formattedPhoneNumber,
      customer_address: "Adresse non fournie",
      customer_city: "Abidjan",
      customer_country: "CI", // Code ISO pour la Côte d'Ivoire
      customer_state: "CI",
      customer_zip_code: "00000"
    };

    console.log("CinetPaySDK: Données de paiement préparées:", paymentData);
    
    // Initialiser le paiement avec le SDK
    const paymentResponse = await cinetpay.generatePaymentLink(paymentData);
    console.log("CinetPaySDK: Réponse du SDK CinetPay:", paymentResponse);
    
    return paymentResponse;
  } catch (error: any) {
    console.error("CinetPaySDK: Erreur lors de l'initialisation du paiement:", error);
    throw new Error(`Erreur SDK CinetPay: ${error.message || "Erreur inconnue"}`);
  }
};

/**
 * Vérifie le statut d'un paiement avec le SDK CinetPay
 * @param transactionId ID de la transaction
 * @returns Promise avec la réponse du SDK CinetPay
 */
export const checkPaymentStatusWithSDK = async (transactionId: string) => {
  console.log("CinetPaySDK: Vérification du paiement pour la transaction:", transactionId);
  
  try {
    // Initialiser le SDK
    const cinetpay = initCinetPaySDK();
    
    // Vérifier le statut du paiement
    const checkResponse = await cinetpay.checkPaymentStatus(transactionId);
    console.log("CinetPaySDK: Réponse de vérification:", checkResponse);
    
    return checkResponse;
  } catch (error: any) {
    console.error("CinetPaySDK: Erreur lors de la vérification du paiement:", error);
    throw new Error(`Erreur de vérification CinetPay: ${error.message || "Erreur inconnue"}`);
  }
};
