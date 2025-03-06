
// Ce fichier contient l'intégration avec le SDK CinetPay Seamless
// Modifications:
// - Mise en conformité avec la documentation officielle CinetPay
// - Correction du format des données envoyées (amount en string)
// - Simplification du callback selon l'exemple de la documentation
// - Nettoyage des logs et ajout de logs pertinents
// - Amélioration de la gestion des erreurs

import { CINETPAY_API_KEY, CINETPAY_SITE_ID } from './config';

/**
 * Interface pour les données retournées par le callback CinetPay
 * Selon la documentation officielle
 */
export interface CinetPayCallbackData {
  amount: string;         // Montant payé (string selon doc)
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
  console.log(`[CinetPay Seamless] SDK chargé:`, isLoaded);
  
  if (isLoaded) {
    console.log(`[CinetPay Seamless] Propriétés globales:`, {
      hasCinetPay: typeof window.CinetPay !== 'undefined',
      hasGetCheckout: typeof window.getCheckout !== 'undefined',
      hasCheckoutData: typeof window.checkoutData !== 'undefined',
      cinetPayFunctions: window.CinetPay ? Object.keys(window.CinetPay) : 'aucune'
    });
    
    // Vérifier si les méthodes requises sont disponibles
    if (window.CinetPay) {
      console.log(`[CinetPay Seamless] Méthodes CinetPay disponibles:`, {
        hasSetConfig: typeof window.CinetPay.setConfig === 'function',
        hasGetCheckout: typeof window.CinetPay.getCheckout === 'function', 
        hasWaitResponse: typeof window.CinetPay.waitResponse === 'function'
      });
    }
  } else {
    console.warn(`[CinetPay Seamless] Le SDK n'est pas chargé!`);
  }
  
  return isLoaded;
};

/**
 * Initialise le SDK CinetPay avec les paramètres de base
 * Conforme à la documentation: https://docs.cinetpay.com/integration/integrate/sdk-javascript/seamless-sdk
 */
export const initCinetPaySDK = (notifyUrl: string): boolean => {
  console.log(`[CinetPay Seamless] Initialisation du SDK avec URL de notification:`, notifyUrl);
  
  if (!isCinetPaySDKLoaded()) {
    console.error(`[CinetPay Seamless] CinetPay SDK n'est pas chargé`);
    return false;
  }

  try {
    if (!window.CinetPay) {
      console.error(`[CinetPay Seamless] L'objet CinetPay n'est pas disponible sur window`);
      return false;
    }
    
    console.log(`[CinetPay Seamless] Configuration du SDK avec:`, {
      apikey: CINETPAY_API_KEY.substring(0, 5) + '...',
      site_id: CINETPAY_SITE_ID,
      notify_url: notifyUrl
    });
    
    // Configuration du SDK selon la documentation
    window.CinetPay.setConfig({
      apikey: CINETPAY_API_KEY,
      site_id: CINETPAY_SITE_ID,
      notify_url: notifyUrl
    });
    
    console.log(`[CinetPay Seamless] CinetPay SDK initialisé avec succès`);
    return true;
  } catch (error) {
    console.error(`[CinetPay Seamless] Erreur lors de l'initialisation du SDK CinetPay:`, error);
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
  
  console.log(`[CinetPay Seamless] Formatage du numéro de téléphone:`, phoneNumber);
  
  // Retirer tous les caractères non numériques
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Si le numéro commence par 225, on retire le code pays
  if (cleaned.startsWith('225')) {
    cleaned = cleaned.substring(3);
  }
  
  // Si le numéro a plus de 10 chiffres et ne commence pas par 225
  // il s'agit probablement d'un autre format avec code pays
  if (cleaned.length > 10 && cleaned.length <= 13) {
    // On garde seulement les 10 derniers chiffres maximum
    cleaned = cleaned.substring(cleaned.length - 10);
  }
  
  console.log(`[CinetPay Seamless] Numéro formaté final:`, cleaned);
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
  console.log(`[CinetPay Seamless] Démarrage du paiement avec les données:`, paymentData);
  
  if (!isCinetPaySDKLoaded()) {
    console.error(`[CinetPay Seamless] CinetPay SDK n'est pas chargé`);
    return false;
  }

  try {
    if (!window.CinetPay) {
      console.error(`[CinetPay Seamless] L'objet CinetPay n'est pas disponible sur window`);
      return false;
    }
    
    // Formater le numéro de téléphone pour CinetPay
    const formattedPhoneNumber = formatPhoneForCinetPay(paymentData.customer_phone_number);
    
    // IMPORTANT: Convertir le montant en string comme indiqué dans la documentation
    const checkoutData = {
      ...paymentData,
      amount: String(paymentData.amount), // Conversion en string selon la documentation
      customer_phone_number: formattedPhoneNumber
    };
    
    console.log(`[CinetPay Seamless] Appel à getCheckout avec:`, checkoutData);
    
    // Vérifier que getCheckout est bien une fonction
    if (typeof window.CinetPay.getCheckout !== 'function') {
      console.error(`[CinetPay Seamless] La méthode getCheckout n'est pas une fonction!`);
      return false;
    }
    
    // Appel à la méthode getCheckout de CinetPay
    window.CinetPay.getCheckout(checkoutData);
    console.log(`[CinetPay Seamless] Appel à getCheckout effectué avec succès`);
    
    return true;
  } catch (error) {
    console.error(`[CinetPay Seamless] Erreur lors du démarrage du paiement CinetPay:`, error);
    return false;
  }
};

/**
 * Configure la callback pour recevoir le résultat du paiement
 * Conforme à la documentation: https://docs.cinetpay.com/integration/integrate/sdk-javascript/seamless-sdk
 */
export const setupCinetPayCallback = (callback: (data: CinetPayCallbackData) => void): boolean => {
  console.log(`[CinetPay Seamless] Configuration du callback CinetPay`);
  
  if (!isCinetPaySDKLoaded()) {
    console.error(`[CinetPay Seamless] CinetPay SDK n'est pas chargé`);
    return false;
  }

  try {
    if (!window.CinetPay) {
      console.error(`[CinetPay Seamless] L'objet CinetPay n'est pas disponible sur window`);
      return false;
    }
    
    // Vérifier que waitResponse est bien une fonction
    if (typeof window.CinetPay.waitResponse !== 'function') {
      console.error(`[CinetPay Seamless] La méthode waitResponse n'est pas une fonction!`);
      return false;
    }
    
    // Configuration de la callback selon la documentation
    console.log(`[CinetPay Seamless] Installation du listener waitResponse`);
    window.CinetPay.waitResponse((data: CinetPayCallbackData) => {
      console.log(`[CinetPay Seamless] CALLBACK REÇU de CinetPay:`, data);
      
      // Vérification du statut selon la documentation
      if (data.status === "REFUSED") {
        console.log(`[CinetPay Seamless] Paiement refusé`);
      } else if (data.status === "ACCEPTED") {
        console.log(`[CinetPay Seamless] Paiement accepté`);
      } 
      
      // Appel du callback personnalisé
      callback(data);
    });
    
    console.log(`[CinetPay Seamless] Callback CinetPay configuré avec succès`);
    return true;
  } catch (error) {
    console.error(`[CinetPay Seamless] Erreur lors de la configuration du callback:`, error);
    return false;
  }
};

// Fonction pour surveiller les changements dans le DOM qui pourraient indiquer une fenêtre CinetPay
export const monitorCinetPayIntegration = (): void => {
  console.log(`[CinetPay Seamless] Démarrage de la surveillance de l'intégration CinetPay`);
  
  // Observer les modifications du DOM pour détecter les iframes de CinetPay
  if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node instanceof HTMLElement) {
              // Rechercher les iframes qui pourraient être liés à CinetPay
              const iframes = node.querySelectorAll('iframe');
              iframes.forEach(iframe => {
                if (iframe.src?.includes('cinetpay') || iframe.id?.includes('cinetpay')) {
                  console.log(`[CinetPay Seamless] Iframe CinetPay détecté:`, {
                    src: iframe.src,
                    id: iframe.id
                  });
                }
              });
              
              // Rechercher d'autres éléments qui pourraient être liés à CinetPay
              if (node.id?.includes('cinetpay') || 
                  node.className?.includes('cinetpay')) {
                console.log(`[CinetPay Seamless] Élément CinetPay détecté:`, {
                  id: node.id,
                  className: node.className
                });
              }
            }
          });
        }
      });
    });
    
    // Observer le document entier
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
    
    console.log(`[CinetPay Seamless] Observateur de mutations configuré`);
  }
};
