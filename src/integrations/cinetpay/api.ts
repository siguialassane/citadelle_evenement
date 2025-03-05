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
  console.log("CinetPayAPI: Début de l'initialisation du paiement");
  
  // Vérifier que les clés d'API sont définies
  if (!CINETPAY_API_KEY || !CINETPAY_SITE_ID || !CINETPAY_API_URL) {
    console.error("CinetPayAPI: Configuration CinetPay manquante:", {
      API_KEY_SET: !!CINETPAY_API_KEY,
      SITE_ID_SET: !!CINETPAY_SITE_ID,
      API_URL_SET: !!CINETPAY_API_URL
    });
    throw new Error("Configuration CinetPay incomplète. Veuillez contacter l'administrateur.");
  }
  
  // Vérifier que les informations du participant sont valides
  if (!participant || !participant.id || !participant.first_name || !participant.last_name || !participant.email || !participant.contact_number) {
    console.error("CinetPayAPI: Informations du participant invalides:", participant);
    throw new Error("Informations du participant invalides ou incomplètes");
  }
  
  // Générer un ID de transaction unique - format YYYYMMDD-HHMMSS-RandomNum
  const date = new Date();
  const dateStr = date.toISOString().replace(/[^0-9]/g, '').slice(0, 8); // YYYYMMDD
  const timeStr = `${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}`;
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const transactionId = `TR${dateStr}${timeStr}${randomNum}`;
  
  console.log("CinetPayAPI: ID de transaction généré:", transactionId);
  
  // URL de base de l'application pour les redirections
  const baseUrl = window.location.origin;
  console.log("CinetPayAPI: URL de base pour les redirections:", baseUrl);
  
  // Construction de l'URL de notification pour webhook
  const notifyUrl = `${baseUrl}/api/webhooks/cinetpay/notification`;
  console.log("CinetPayAPI: URL de notification (webhook):", notifyUrl);
  
  // Construction de l'URL de retour
  const returnUrl = `${baseUrl}/confirmation/${participant.id}`;
  console.log("CinetPayAPI: URL de retour après paiement:", returnUrl);

  // Formater le numéro de téléphone pour qu'il soit sans espaces et +
  const originalPhoneNumber = participant.contact_number;
  const formattedPhoneNumber = participant.contact_number.replace(/\s+/g, '').replace(/^\+/, '');
  console.log("CinetPayAPI: Numéro de téléphone original:", originalPhoneNumber);
  console.log("CinetPayAPI: Numéro de téléphone formaté:", formattedPhoneNumber);

  // Construire le payload pour CinetPay selon la documentation
  const payload = {
    apikey: CINETPAY_API_KEY,
    site_id: CINETPAY_SITE_ID,
    transaction_id: transactionId,
    amount: amount,
    currency: "XOF",
    description: `Paiement pour ${participant.first_name} ${participant.last_name}`,
    notify_url: notifyUrl,
    return_url: returnUrl,
    channels: PAYMENT_CHANNELS,
    metadata: JSON.stringify({
      participant_id: participant.id,
      payment_method: paymentMethod
    }),
    // Informations du client (obligatoires selon la documentation)
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

  try {
    console.log("CinetPayAPI: Configuration CinetPay:", {
      APIKEY: CINETPAY_API_KEY ? "DÉFINIE" : "NON DÉFINIE",
      SITE_ID: CINETPAY_SITE_ID,
      API_URL: CINETPAY_API_URL,
      CHANNELS: PAYMENT_CHANNELS
    });
    
    console.log("CinetPayAPI: Envoi du payload à CinetPay:", JSON.stringify(payload, null, 2));
    console.log("CinetPayAPI: URL d'appel API:", CINETPAY_API_URL);
    
    // Appel à l'API CinetPay avec un timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes de timeout
    
    const startTime = Date.now();
    console.log("CinetPayAPI: Début de l'appel API à", new Date().toISOString());
    
    try {
      const response = await fetch(CINETPAY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      console.log(`CinetPayAPI: Appel API terminé en ${endTime - startTime}ms à`, new Date().toISOString());
      console.log("CinetPayAPI: Status HTTP:", response.status);
      console.log("CinetPayAPI: Headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("CinetPayAPI: Texte de la réponse d'erreur:", errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.error("CinetPayAPI: Réponse d'erreur CinetPay (parsée):", errorData);
        } catch (parseError) {
          console.error("CinetPayAPI: Erreur lors du parsing de la réponse:", parseError);
          errorData = { message: errorText };
        }
        
        throw new Error(`Erreur de réponse CinetPay (${response.status}): ${errorData.message || 'Erreur inconnue'}`);
      }

      const responseText = await response.text();
      console.log("CinetPayAPI: Texte de la réponse:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("CinetPayAPI: Réponse de CinetPay (parsée):", data);
      } catch (parseError) {
        console.error("CinetPayAPI: Erreur lors du parsing de la réponse réussie:", parseError);
        throw new Error("Erreur lors du parsing de la réponse CinetPay");
      }
      
      // Vérifier que les données attendues sont présentes
      if (!data.code || !data.data || !data.data.payment_token || !data.data.payment_url) {
        console.error("CinetPayAPI: Données manquantes dans la réponse:", data);
        throw new Error("Réponse CinetPay incomplète: données manquantes");
      }
      
      return data as CinetPayInitResponse;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error("CinetPayAPI: Timeout lors de l'appel à l'API CinetPay (30s)");
        throw new Error("Délai d'attente dépassé lors de la communication avec CinetPay. Veuillez réessayer.");
      }
      
      throw fetchError;
    }
  } catch (error: any) {
    console.error("CinetPayAPI: Erreur lors de l'initialisation du paiement CinetPay:", error);
    console.error("CinetPayAPI: Stack trace:", error.stack);
    
    // Ajouter des informations supplémentaires au message d'erreur
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      throw new Error("Impossible de communiquer avec CinetPay. Vérifiez votre connexion internet et réessayez.");
    }
    
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
    console.log("CinetPayAPI: Vérification du paiement CinetPay pour la transaction:", transactionId);
    
    const checkPayload = {
      transaction_id: transactionId,
      site_id: CINETPAY_SITE_ID,
      apikey: CINETPAY_API_KEY
    };
    
    console.log("CinetPayAPI: Payload de vérification:", checkPayload);
    
    const response = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkPayload)
    });

    console.log("CinetPayAPI: Status de la réponse de vérification:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("CinetPayAPI: Texte de la réponse d'erreur de vérification:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        console.error("CinetPayAPI: Réponse d'erreur de vérification CinetPay (parsée):", errorData);
      } catch (parseError) {
        console.error("CinetPayAPI: Erreur lors du parsing de la réponse d'erreur de vérification:", parseError);
        errorData = { message: errorText };
      }
      
      throw new Error(`Erreur HTTP: ${response.status} - ${errorData.message || 'Erreur inconnue'}`);
    }

    const responseText = await response.text();
    console.log("CinetPayAPI: Texte de la réponse de vérification:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log("CinetPayAPI: Réponse de vérification CinetPay (parsée):", data);
    } catch (parseError) {
      console.error("CinetPayAPI: Erreur lors du parsing de la réponse de vérification:", parseError);
      throw new Error("Erreur lors du parsing de la réponse de vérification CinetPay");
    }
    
    return data;
  } catch (error: any) {
    console.error("CinetPayAPI: Erreur lors de la vérification du paiement CinetPay:", error);
    console.error("CinetPayAPI: Stack trace:", error.stack);
    throw error;
  }
};
