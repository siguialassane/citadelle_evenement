
import { CINETPAY_API_KEY, CINETPAY_SITE_ID, CINETPAY_API_URL, PAYMENT_CHANNELS, PAYMENT_METHOD_MAP } from './config';
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
 * Initialise un paiement avec CinetPay
 * @param participant Informations du participant
 * @param amount Montant du paiement
 * @param paymentMethod Méthode de paiement choisie
 * @returns Promise avec la réponse de l'API CinetPay
 */
export const initiateCinetPayPayment = async (
  participant: Participant,
  amount: number,
  paymentMethod: string
): Promise<CinetPayInitResponse> => {
  // Générer un ID de transaction unique
  const transactionId = `TRX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  
  // URL de base de l'application pour les redirections
  const baseUrl = window.location.origin;

  // Construire le payload pour CinetPay
  const payload = {
    apikey: CINETPAY_API_KEY,
    site_id: CINETPAY_SITE_ID,
    transaction_id: transactionId,
    amount: amount,
    currency: "XOF",
    description: `Paiement pour ${participant.first_name} ${participant.last_name}`,
    notify_url: `${baseUrl}/api/webhooks/cinetpay/notification`,
    return_url: `${baseUrl}/confirmation/${participant.id}`,
    channels: PAYMENT_CHANNELS,
    metadata: JSON.stringify({
      participant_id: participant.id,
      payment_method: paymentMethod
    }),
    // Informations du client (obligatoires même si on n'utilise pas la carte bancaire)
    customer_name: participant.first_name,
    customer_surname: participant.last_name,
    customer_email: participant.email,
    customer_phone_number: participant.contact_number,
    customer_address: "Adresse non fournie",
    customer_city: "Abidjan", // Fournir une valeur valide pour la ville
    customer_country: "CI", // Code ISO pour la Côte d'Ivoire
    customer_state: "CI",
    customer_zip_code: "00000"
  };

  try {
    // Appel à l'API CinetPay
    const response = await fetch(CINETPAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Réponse d'erreur CinetPay:", errorData);
      throw new Error(`Erreur HTTP: ${response.status} - ${errorData.message || 'Erreur inconnue'}`);
    }

    const data = await response.json();
    return data as CinetPayInitResponse;
  } catch (error) {
    console.error("Erreur lors de l'initialisation du paiement CinetPay:", error);
    throw error;
  }
};

/**
 * Vérifie le statut d'un paiement CinetPay
 * @param transactionId ID de la transaction ou token de paiement
 * @returns Promise avec la réponse de l'API CinetPay
 */
export const checkCinetPayPayment = async (
  transactionId: string
): Promise<any> => {
  try {
    const response = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transaction_id: transactionId,
        site_id: CINETPAY_SITE_ID,
        apikey: CINETPAY_API_KEY
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la vérification du paiement CinetPay:", error);
    throw error;
  }
};
