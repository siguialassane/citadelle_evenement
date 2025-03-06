// Ce fichier contient l'API d'intégration avec CinetPay qui utilise des appels POST directs
import { CINETPAY_API_KEY, CINETPAY_SITE_ID, CINETPAY_API_URL, CINETPAY_CHECK_URL, PAYMENT_CHANNELS, PAYMENT_METHOD_MAP } from './config';
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
 */
export const initiateCinetPayPayment = async (
  participant: Participant,
  amount: number,
  paymentMethod: string
): Promise<CinetPayInitResponse> => {
  console.log("CinetPayAPI: Début de l'initialisation du paiement via POST");
  
  try {
    // Générer un ID de transaction unique
    const date = new Date();
    const dateStr = date.toISOString().replace(/[^0-9]/g, '').slice(0, 8);
    const timeStr = `${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}`;
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const transactionId = `TR${dateStr}${timeStr}${randomNum}`;
    
    // URL de base de l'application pour les redirections
    const baseUrl = window.location.origin;
    
    // Construction des URLs
    const notifyUrl = `${baseUrl}/api/webhooks/cinetpay/notification`;
    const returnUrl = `${baseUrl}/confirmation/${participant.id}`;
    
    // Formater le numéro de téléphone
    const formattedPhoneNumber = participant.contact_number.replace(/\s+/g, '').replace(/^\+/, '');
    
    // Trouver le canal CinetPay correspondant
    const paymentChannel = PAYMENT_METHOD_MAP[paymentMethod] || "ALL";
    
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
      customer_name: `${participant.first_name} ${participant.last_name}`,
      customer_surname: participant.last_name,
      customer_email: participant.email,
      customer_phone_number: formattedPhoneNumber,
      customer_address: "Adresse non fournie",
      customer_city: "Abidjan",
      customer_country: "CI",
      customer_state: "CI",
      customer_zip_code: "00000",
      metadata: JSON.stringify({
        participant_id: participant.id,
        payment_method: paymentMethod
      })
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
