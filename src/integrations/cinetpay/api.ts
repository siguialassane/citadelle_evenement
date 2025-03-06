
// Ce fichier contient l'API d'intégration avec CinetPay qui utilise le SDK Seamless
import { CINETPAY_API_KEY, CINETPAY_SITE_ID, CINETPAY_API_URL, PAYMENT_CHANNELS, PAYMENT_METHOD_MAP } from './config';
import { initiatePaymentWithSDK, checkPaymentStatusWithSDK } from './sdk';
import type { Database } from '../supabase/types';

type Participant = Database['public']['Tables']['participants']['Row'];

interface CinetPayInitResponse {
  code: string;
  message: string;
  description: string;
  data: {
    payment_token: string;
    payment_data?: any; // Données pour l'approche Seamless
    payment_url?: string; // URL pour l'approche de redirection
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
  
  try {
    // Utiliser le SDK CinetPay Seamless pour initialiser le paiement
    const sdkResponse = await initiatePaymentWithSDK(participant, amount, paymentMethod);
    
    // Transformer la réponse du SDK au format attendu par l'application
    const formattedResponse: CinetPayInitResponse = {
      code: sdkResponse.code,
      message: sdkResponse.message,
      description: sdkResponse.description || '',
      data: {
        payment_token: sdkResponse.data?.payment_token || '',
        payment_data: sdkResponse.data?.payment_data || null
      },
      api_response_id: sdkResponse.api_response_id || ''
    };
    
    return formattedResponse;
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
    // Utiliser le SDK CinetPay pour vérifier le statut du paiement
    const checkResponse = await checkPaymentStatusWithSDK(transactionId);
    return checkResponse;
  } catch (error: any) {
    console.error("CinetPayAPI: Erreur lors de la vérification du paiement CinetPay:", error);
    console.error("CinetPayAPI: Stack trace:", error.stack);
    throw error;
  }
};
