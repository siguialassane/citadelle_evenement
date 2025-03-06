
// Ce fichier contient l'API d'intégration avec CinetPay qui utilise des appels POST directs
// Modifications: 
// - Utilisation d'UUID pour les identifiants de transaction
// - Simplification du format de métadonnées pour suivre la documentation CinetPay
// - Utilisation de la fonction de formatage des numéros de téléphone SANS code pays
// - Ajout du paramètre type: "WEB" dans les requêtes API

import { v4 as uuidv4 } from 'uuid';
import { CINETPAY_API_KEY, CINETPAY_SITE_ID, CINETPAY_API_URL, CINETPAY_CHECK_URL, PAYMENT_CHANNELS, PAYMENT_METHOD_MAP } from './config';
import { formatPhoneForCinetPay } from './seamless';
import type { Database } from '../supabase/types';

type Participant = Database['public']['Tables']['participants']['Row'];

interface CinetPayInitResponse {
  code: string;
  message: string;
  description: string;
  data: {
    payment_token: string;
    payment_url: string;
  };
  api_response_id: string;
}

/**
 * Initialise un paiement avec CinetPay via appel POST direct
 * Conforme à la documentation: https://docs.cinetpay.com/integration/integrate/api-endpoints
 */
export const initiateCinetPayPayment = async (
  participant: Participant,
  amount: number,
  paymentMethod: string
): Promise<CinetPayInitResponse> => {
  console.log("CinetPayAPI: Début de l'initialisation du paiement via POST");
  
  try {
    // Générer un ID de transaction unique en utilisant UUID
    const uuid = uuidv4();
    const transactionId = `TR-${uuid}`;
    console.log("CinetPayAPI: ID de transaction généré:", transactionId);
    
    // URL de base de l'application pour les redirections
    const baseUrl = window.location.origin;
    
    // Construction des URLs
    const notifyUrl = `${baseUrl}/api/webhooks/cinetpay/notification`;
    const returnUrl = `${baseUrl}/confirmation/${participant.id}`;
    
    // Formater le numéro de téléphone pour CinetPay (SANS code pays)
    const formattedPhoneNumber = formatPhoneForCinetPay(participant.contact_number);
    console.log("CinetPayAPI: Numéro original:", participant.contact_number);
    console.log("CinetPayAPI: Numéro formaté pour CinetPay (sans code pays):", formattedPhoneNumber);
    
    // Trouver le canal CinetPay correspondant
    const paymentChannel = PAYMENT_METHOD_MAP[paymentMethod] || "ALL";
    
    // Métadonnées simplifiées selon documentation (format string)
    const metadata = `PARTICIPANT:${participant.id}`;
    
    // Préparer les données pour l'appel API
    const paymentData = {
      apikey: CINETPAY_API_KEY,
      site_id: CINETPAY_SITE_ID,
      transaction_id: transactionId,
      amount: amount,
      currency: "XOF",
      description: `Paiement pour ${participant.first_name} ${participant.last_name}`,
      notify_url: notifyUrl,
      return_url: returnUrl,
      channels: paymentChannel,
      type: "WEB", // Ajout du paramètre type selon la documentation
      customer_name: `${participant.first_name} ${participant.last_name}`,
      customer_surname: participant.last_name,
      customer_email: participant.email,
      customer_phone_number: formattedPhoneNumber,
      customer_address: "Adresse non fournie",
      customer_city: "Abidjan",
      customer_country: "CI",
      customer_state: "CI",
      customer_zip_code: "00000",
      metadata: metadata
    };

    console.log("CinetPayAPI: Données de paiement préparées:", paymentData);

    // Faire l'appel POST à l'API CinetPay
    const response = await fetch(CINETPAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("CinetPayAPI: Réponse de l'API:", responseData);

    return {
      code: responseData.code,
      message: responseData.message,
      description: responseData.description || '',
      data: {
        payment_token: responseData.data?.payment_token || '',
        payment_url: responseData.data?.payment_url || ''
      },
      api_response_id: responseData.api_response_id || ''
    };
  } catch (error: any) {
    console.error("CinetPayAPI: Erreur lors de l'initialisation du paiement:", error);
    throw error;
  }
};

/**
 * Vérifie le statut d'un paiement CinetPay via appel POST direct
 */
export const checkCinetPayPayment = async (paymentToken: string) => {
  console.log("CinetPayAPI: Vérification du statut du paiement:", paymentToken);
  
  try {
    const response = await fetch(CINETPAY_CHECK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apikey: CINETPAY_API_KEY,
        site_id: CINETPAY_SITE_ID,
        transaction_id: paymentToken
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log("CinetPayAPI: Réponse de la vérification:", data);

    return data;
  } catch (error) {
    console.error("CinetPayAPI: Erreur lors de la vérification du paiement:", error);
    throw error;
  }
};
