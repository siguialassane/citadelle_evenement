
// Ce fichier contient les fonctions d'intégration avec le SDK CinetPay-Seamless
import { 
  CINETPAY_API_KEY, 
  CINETPAY_SITE_ID, 
  CINETPAY_SECRET_KEY,
  PAYMENT_METHOD_MAP
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

  // Le SDK CinetPay n'est pas utilisé directement comme un import
  // Au lieu de cela, nous allons utiliser le SDK Seamless qui est chargé via un script dans le navigateur
  console.log("CinetPaySDK: SDK Seamless prêt à être utilisé");
  
  return {
    apikey: CINETPAY_API_KEY,
    site_id: CINETPAY_SITE_ID,
    secret_key: CINETPAY_SECRET_KEY
  };
};

/**
 * Initialise un paiement avec le SDK CinetPay Seamless
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
  console.log("CinetPaySDK: Début de l'initialisation du paiement Seamless");
  
  try {
    // Initialiser la configuration
    const config = initCinetPaySDK();
    
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

    // Trouver le canal CinetPay correspondant à la méthode de paiement
    const paymentChannel = PAYMENT_METHOD_MAP[paymentMethod] || "ALL";
    console.log("CinetPaySDK: Canal de paiement:", paymentChannel);
    
    // Préparer les données pour l'appel direct à l'API CinetPay (méthode Seamless)
    const paymentData = {
      apikey: config.apikey,
      site_id: config.site_id,
      transaction_id: transactionId,
      amount: amount,
      currency: "XOF",
      description: `Paiement pour ${participant.first_name} ${participant.last_name}`,
      notify_url: notifyUrl,
      return_url: returnUrl,
      channels: paymentChannel,
      // Métadonnées pour le suivi
      metadata: JSON.stringify({
        participant_id: participant.id,
        payment_method: paymentMethod
      }),
      // Informations du client
      customer_name: `${participant.first_name} ${participant.last_name}`,
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
    
    // Retourner les données pour qu'elles puissent être utilisées avec le SDK Seamless dans le composant
    return {
      code: "201",
      message: "Paiement initialisé",
      description: "Les données de paiement ont été préparées avec succès",
      data: {
        payment_token: transactionId,
        payment_data: paymentData
      },
      api_response_id: transactionId
    };
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
    // Initialiser la configuration
    const config = initCinetPaySDK();
    
    // Préparer les données pour la vérification
    const checkData = {
      apikey: config.apikey,
      site_id: config.site_id,
      transaction_id: transactionId
    };
    
    // Effectuer la requête de vérification directement
    const response = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(checkData)
    });
    
    const checkResponse = await response.json();
    console.log("CinetPaySDK: Réponse de vérification:", checkResponse);
    
    return checkResponse;
  } catch (error: any) {
    console.error("CinetPaySDK: Erreur lors de la vérification du paiement:", error);
    throw new Error(`Erreur de vérification CinetPay: ${error.message || "Erreur inconnue"}`);
  }
};
