
// Ce fichier contient l'intégration avec le SDK CinetPay Seamless
// Modifications:
// - Ajout du paramètre type: "WEB" dans setConfig
// - Amélioration du formatage des numéros de téléphone pour suivre la documentation CinetPay
// - Ajout de typages pour les données de callback

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
  return typeof window !== 'undefined' && 'CinetPay' in window;
};

/**
 * Initialise le SDK CinetPay avec les paramètres de base
 * Conforme à la documentation: https://docs.cinetpay.com/integration/integrate/sdk-javascript/seamless-sdk
 */
export const initCinetPaySDK = (notifyUrl: string): boolean => {
  if (!isCinetPaySDKLoaded()) {
    console.error("CinetPay SDK n'est pas chargé");
    return false;
  }

  try {
    // @ts-ignore - CinetPay est défini globalement par le script
    window.CinetPay.setConfig({
      apikey: CINETPAY_API_KEY,
      site_id: CINETPAY_SITE_ID,
      notify_url: notifyUrl,
      type: "WEB", // Ajout du paramètre type selon la documentation
      close_after_response: false // Ne pas fermer automatiquement pour gérer nous-mêmes la redirection
    });
    
    console.log("CinetPay SDK initialisé avec succès");
    return true;
  } catch (error) {
    console.error("Erreur lors de l'initialisation du SDK CinetPay:", error);
    return false;
  }
};

/**
 * Formate un numéro de téléphone pour CinetPay
 * Selon la documentation CinetPay: client peut envoyer avec ou sans code pays
 * Exemples acceptés par CinetPay: "088767611" ou "22588767611"
 */
export const formatPhoneForCinetPay = (phoneNumber: string): string => {
  // Retirer tous les caractères non numériques
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Si le numéro commence déjà par 225, on peut le laisser tel quel
  if (cleaned.startsWith('225')) {
    // Si CinetPay attend sans code pays, décommenter la ligne suivante
    // return cleaned.substring(3); // Retirer le code pays
    return cleaned;
  }
  
  // Si le numéro ne commence pas par 225 et est court (8-10 chiffres)
  // Nous n'ajoutons pas automatiquement 225 car CinetPay semble accepter
  // les numéros sans code pays d'après la documentation
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
  if (!isCinetPaySDKLoaded()) {
    console.error("CinetPay SDK n'est pas chargé");
    return false;
  }

  try {
    // Formater le numéro de téléphone pour CinetPay
    const formattedData = {
      ...paymentData,
      customer_phone_number: formatPhoneForCinetPay(paymentData.customer_phone_number)
    };
    
    console.log("Démarrage du paiement avec CinetPay SDK:", formattedData);
    console.log("Numéro formaté pour CinetPay:", formattedData.customer_phone_number);
    
    // @ts-ignore - CinetPay est défini globalement par le script
    window.CinetPay.getCheckout(formattedData);
    return true;
  } catch (error) {
    console.error("Erreur lors du démarrage du paiement CinetPay:", error);
    return false;
  }
};

/**
 * Configure la callback pour recevoir le résultat du paiement
 * Conforme à la documentation: https://docs.cinetpay.com/integration/integrate/sdk-javascript/seamless-sdk
 */
export const setupCinetPayCallback = (callback: (data: CinetPayCallbackData) => void): boolean => {
  if (!isCinetPaySDKLoaded()) {
    console.error("CinetPay SDK n'est pas chargé");
    return false;
  }

  try {
    // @ts-ignore - CinetPay est défini globalement par le script
    window.CinetPay.waitResponse((data: CinetPayCallbackData) => {
      console.log("Réponse du paiement CinetPay reçue:", data);
      
      // Gestion similaire à l'exemple de la documentation
      if (data.status === "REFUSED") {
        console.log("Paiement refusé");
      } else if (data.status === "ACCEPTED") {
        console.log("Paiement accepté");
      }
      
      // Appel du callback personnalisé pour traitement supplémentaire
      callback(data);
    });
    return true;
  } catch (error) {
    console.error("Erreur lors de la configuration de la callback CinetPay:", error);
    return false;
  }
};
