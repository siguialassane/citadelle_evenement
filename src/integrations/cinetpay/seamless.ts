
// Ce fichier contient l'intégration avec le SDK CinetPay Seamless
// Modifications:
// - Amélioration du formatage des numéros de téléphone

import { CINETPAY_API_KEY, CINETPAY_SITE_ID } from './config';

/**
 * Vérifie si le SDK CinetPay est disponible
 */
export const isCinetPaySDKLoaded = (): boolean => {
  return typeof window !== 'undefined' && 'CinetPay' in window;
};

/**
 * Initialise le SDK CinetPay avec les paramètres de base
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
 * Retire les espaces, le +, et s'assure qu'il commence par le code pays
 */
export const formatPhoneForCinetPay = (phoneNumber: string): string => {
  // Retirer tous les caractères non numériques
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // S'assurer que le numéro commence par 225 (sans le +)
  if (cleaned.startsWith('225')) {
    return cleaned;
  } else if (cleaned.length <= 10) {
    return '225' + cleaned;
  }
  
  // Si le numéro est plus long, on suppose que le code pays est déjà inclus
  return cleaned;
};

/**
 * Lance le processus de paiement avec le SDK CinetPay
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
 */
export const setupCinetPayCallback = (callback: (data: any) => void): boolean => {
  if (!isCinetPaySDKLoaded()) {
    console.error("CinetPay SDK n'est pas chargé");
    return false;
  }

  try {
    // @ts-ignore - CinetPay est défini globalement par le script
    window.CinetPay.waitResponse((data: any) => {
      console.log("Réponse du paiement CinetPay reçue:", data);
      callback(data);
    });
    return true;
  } catch (error) {
    console.error("Erreur lors de la configuration de la callback CinetPay:", error);
    return false;
  }
};
