
// Ce fichier contient l'intégration avec le SDK CinetPay Seamless
// Modifications:
// - Ajout du paramètre type: "WEB" dans setConfig
// - Amélioration du formatage des numéros de téléphone pour TOUJOURS supprimer le code pays
// - Ajout de typages pour les données de callback
// - Ajout de logs détaillés pour mieux tracer les opérations
// - Correction des vérifications de types pour TypeScript

import { CINETPAY_API_KEY, CINETPAY_SITE_ID } from './config';

/**
 * Interface pour les données retournées par le callback CinetPay
 * Selon la documentation officielle
 */
export interface CinetPayCallbackData {
  amount: string;         // Montant payé
  currency: string;       // Devise (XOF, etc.)
  status: "ACCEPTED" | "REFUSED"; // État de la transaction
  payment_method: string; // Moyen de paiement (MTN, ORANGE, FLOOZ, etc.)
  description: string;    // Description fournie à l'initialisation
  metadata: string;       // Metadata fournie à l'initialisation
  operator_id: string;    // Identifiant de l'opérateur
  payment_date: string;   // Date de paiement (format: "YYYY-MM-DD HH:MM:SS")
  api_response_id?: string; // ID de réponse API (extension personnalisée)
  transaction_id?: string;  // ID de transaction (extension personnalisée)
}

/**
 * Vérifie si le SDK CinetPay est disponible
 */
export const isCinetPaySDKLoaded = (): boolean => {
  const isLoaded = typeof window !== 'undefined' && 'CinetPay' in window;
  console.log(`[CinetPay Seamless] ${new Date().toISOString()} - SDK chargé:`, isLoaded);
  
  if (isLoaded) {
    console.log(`[CinetPay Seamless] Propriétés globales:`, {
      hasCinetPay: typeof window.CinetPay !== 'undefined',
      hasGetCheckout: typeof window.getCheckout !== 'undefined',
      hasCheckoutData: typeof window.checkoutData !== 'undefined'
    });
  } else {
    console.warn(`[CinetPay Seamless] ${new Date().toISOString()} - Le SDK n'est pas chargé!`);
  }
  
  return isLoaded;
};

/**
 * Initialise le SDK CinetPay avec les paramètres de base
 * Conforme à la documentation: https://docs.cinetpay.com/integration/integrate/sdk-javascript/seamless-sdk
 */
export const initCinetPaySDK = (notifyUrl: string): boolean => {
  console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Tentative d'initialisation du SDK avec URL de notification:`, notifyUrl);
  
  if (!isCinetPaySDKLoaded()) {
    console.error(`[CinetPay Seamless] ${new Date().toISOString()} - CinetPay SDK n'est pas chargé`);
    return false;
  }

  try {
    if (!window.CinetPay) {
      console.error(`[CinetPay Seamless] ${new Date().toISOString()} - L'objet CinetPay n'est pas disponible sur window`);
      return false;
    }
    
    // Configuration du SDK
    window.CinetPay.setConfig({
      apikey: CINETPAY_API_KEY,
      site_id: CINETPAY_SITE_ID,
      notify_url: notifyUrl,
      type: "WEB", // Ajout du paramètre type selon la documentation
      close_after_response: false // Ne pas fermer automatiquement pour gérer nous-mêmes la redirection
    });
    
    console.log(`[CinetPay Seamless] ${new Date().toISOString()} - CinetPay SDK initialisé avec succès`);
    return true;
  } catch (error) {
    console.error(`[CinetPay Seamless] ${new Date().toISOString()} - Erreur lors de l'initialisation du SDK CinetPay:`, error);
    return false;
  }
};

/**
 * Formate un numéro de téléphone pour CinetPay
 * Selon la documentation CinetPay: retirer toujours le code pays
 * Format attendu: "088767611" (sans code pays)
 */
export const formatPhoneForCinetPay = (phoneNumber: string): string => {
  if (!phoneNumber) return "";
  
  console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Formatage du numéro de téléphone:`, phoneNumber);
  
  // Retirer tous les caractères non numériques
  let cleaned = phoneNumber.replace(/\D/g, '');
  console.log(`[CinetPay Seamless] Après nettoyage des caractères non numériques:`, cleaned);
  
  // Si le numéro commence par 225, on retire le code pays
  if (cleaned.startsWith('225')) {
    cleaned = cleaned.substring(3);
    console.log(`[CinetPay Seamless] Numéro après suppression du code pays 225:`, cleaned);
  }
  
  // Si le numéro a plus de 10 chiffres et ne commence pas par 225
  // il s'agit probablement d'un autre format avec code pays
  if (cleaned.length > 10 && cleaned.length <= 13) {
    // On garde seulement les 10 derniers chiffres maximum
    cleaned = cleaned.substring(cleaned.length - 10);
    console.log(`[CinetPay Seamless] Numéro tronqué aux 10 derniers chiffres:`, cleaned);
  }
  
  console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Numéro formaté final:`, cleaned);
  return cleaned;
};

/**
 * Lance le processus de paiement avec le SDK CinetPay
 * Conforme à la documentation: https://docs.cinetpay.com/integration/integrate/sdk-javascript/seamless-sdk
 */
export const startCinetPayPayment = (paymentData: {
  transaction_id: string;
  amount: number;
  currency: string;
  channels: string;
  description: string;
  customer_name: string;
  customer_surname: string;
  customer_email: string;
  customer_phone_number: string;
  customer_address: string;
  customer_city: string;
  customer_country: string;
  customer_state: string;
  customer_zip_code: string;
  metadata: string;
}): boolean => {
  console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Démarrage du paiement avec les données:`, paymentData);
  
  if (!isCinetPaySDKLoaded()) {
    console.error(`[CinetPay Seamless] ${new Date().toISOString()} - CinetPay SDK n'est pas chargé`);
    return false;
  }

  try {
    if (!window.CinetPay) {
      console.error(`[CinetPay Seamless] ${new Date().toISOString()} - L'objet CinetPay n'est pas disponible sur window`);
      return false;
    }
    
    // Formater le numéro de téléphone pour CinetPay
    const formattedData = {
      ...paymentData,
      customer_phone_number: formatPhoneForCinetPay(paymentData.customer_phone_number)
    };
    
    console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Démarrage du paiement avec CinetPay SDK:`, formattedData);
    console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Numéro formaté pour CinetPay:`, formattedData.customer_phone_number);
    
    // Appel à la méthode getCheckout de CinetPay
    window.CinetPay.getCheckout(formattedData);
    console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Appel à getCheckout effectué avec succès`);
    return true;
  } catch (error) {
    console.error(`[CinetPay Seamless] ${new Date().toISOString()} - Erreur lors du démarrage du paiement CinetPay:`, error);
    return false;
  }
};

/**
 * Configure la callback pour recevoir le résultat du paiement
 * Conforme à la documentation: https://docs.cinetpay.com/integration/integrate/sdk-javascript/seamless-sdk
 */
export const setupCinetPayCallback = (callback: (data: CinetPayCallbackData) => void): boolean => {
  console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Configuration du callback CinetPay`);
  
  if (!isCinetPaySDKLoaded()) {
    console.error(`[CinetPay Seamless] ${new Date().toISOString()} - CinetPay SDK n'est pas chargé`);
    return false;
  }

  try {
    if (!window.CinetPay) {
      console.error(`[CinetPay Seamless] ${new Date().toISOString()} - L'objet CinetPay n'est pas disponible sur window`);
      return false;
    }
    
    // Configuration de la callback
    window.CinetPay.waitResponse((data: CinetPayCallbackData) => {
      console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Réponse du paiement CinetPay reçue:`, data);
      
      // Gestion similaire à l'exemple de la documentation
      if (data.status === "REFUSED") {
        console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Paiement refusé`);
      } else if (data.status === "ACCEPTED") {
        console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Paiement accepté`);
      }
      
      // Appel du callback personnalisé pour traitement supplémentaire
      console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Exécution du callback utilisateur`);
      callback(data);
    });
    console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Callback CinetPay configuré avec succès`);
    return true;
  } catch (error) {
    console.error(`[CinetPay Seamless] ${new Date().toISOString()} - Erreur lors de la configuration de la callback CinetPay:`, error);
    return false;
  }
};
