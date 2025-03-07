
// Ce fichier contient l'intégration avec le SDK CinetPay Seamless
// Modifications:
// - Ajout d'une vérification complète du SDK avec retry
// - Correction de l'initialisation selon la documentation officielle
// - Simplification du callback selon la documentation officielle
// - Mise en place d'un délai d'attente pour l'initialisation complète

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
 * Vérifie si le SDK CinetPay est disponible avec retry automatique
 */
export const isCinetPaySDKLoaded = (maxRetries = 3, retryInterval = 1000): Promise<boolean> => {
  console.log(`[CinetPay Seamless] Vérification du chargement du SDK (tentatives max: ${maxRetries})`);
  
  return new Promise((resolve) => {
    let retryCount = 0;
    
    const checkSDK = () => {
      const isLoaded = typeof window !== 'undefined' && 
                     window.CinetPay !== undefined && 
                     typeof window.CinetPay.setConfig === 'function' &&
                     typeof window.CinetPay.getCheckout === 'function' && 
                     typeof window.CinetPay.waitResponse === 'function';
      
      console.log(`[CinetPay Seamless] Tentative ${retryCount + 1}/${maxRetries}: SDK chargé:`, isLoaded);
      
      if (isLoaded) {
        console.log(`[CinetPay Seamless] SDK correctement chargé après ${retryCount} tentatives`);
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
        
        // Attendre un peu plus pour s'assurer que l'objet est complètement initialisé
        setTimeout(() => resolve(true), 500);
        return;
      }
      
      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`[CinetPay Seamless] Nouvelle tentative dans ${retryInterval}ms...`);
        setTimeout(checkSDK, retryInterval);
      } else {
        console.warn(`[CinetPay Seamless] Le SDK n'est pas chargé après ${maxRetries} tentatives!`);
        resolve(false);
      }
    };
    
    // Démarrer la vérification
    checkSDK();
  });
};

/**
 * Initialise le SDK CinetPay avec les paramètres de base
 * Conforme à la documentation: https://docs.cinetpay.com/integration/integrate/sdk-javascript/seamless-sdk
 */
export const initCinetPaySDK = async (notifyUrl: string): Promise<boolean> => {
  console.log(`[CinetPay Seamless] Initialisation du SDK avec URL de notification:`, notifyUrl);
  
  // Vérifier que le SDK est chargé avec retries
  const sdkLoaded = await isCinetPaySDKLoaded(5, 1000);
  if (!sdkLoaded) {
    console.error(`[CinetPay Seamless] CinetPay SDK n'est pas chargé, impossible d'initialiser`);
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
      notify_url: notifyUrl,
      lang: 'fr' // Ajouter une langue par défaut
    });
    
    // Vérification après initialisation
    console.log(`[CinetPay Seamless] CinetPay SDK configuré. États des propriétés:`, {
      config: !!window.CinetPay.config,
      loaded: !!window.CinetPay.loaded
    });
    
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
 * Strictement conforme à la documentation: https://docs.cinetpay.com/integration/integrate/sdk-javascript/seamless-sdk
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
  
  try {
    if (!window.CinetPay) {
      console.error(`[CinetPay Seamless] L'objet CinetPay n'est pas disponible sur window`);
      return false;
    }
    
    // Vérifier que toutes les méthodes nécessaires sont disponibles
    if (typeof window.CinetPay.getCheckout !== 'function') {
      console.error(`[CinetPay Seamless] La méthode getCheckout n'est pas une fonction!`);
      return false;
    }
    
    // Formater le numéro de téléphone pour CinetPay
    const formattedPhoneNumber = formatPhoneForCinetPay(paymentData.customer_phone_number);
    
    // IMPORTANT: Préparer les données exactement comme dans la documentation
    // avec amount en string et seulement les paramètres requis
    const checkoutData = {
      transaction_id: paymentData.transaction_id,
      amount: String(paymentData.amount), // Conversion en string selon la documentation
      currency: paymentData.currency,
      channels: paymentData.channels,
      description: paymentData.description,
      // Paramètres obligatoires pour paiement par carte bancaire
      customer_name: paymentData.customer_name,
      customer_surname: paymentData.customer_surname,
      customer_email: paymentData.customer_email,
      customer_phone_number: formattedPhoneNumber,
      customer_address: paymentData.customer_address,
      customer_city: paymentData.customer_city,
      customer_country: paymentData.customer_country,
      customer_state: paymentData.customer_state,
      customer_zip_code: paymentData.customer_zip_code,
      metadata: paymentData.metadata
    };
    
    console.log(`[CinetPay Seamless] Appel à getCheckout avec:`, checkoutData);
    
    // Petite attente pour s'assurer que le SDK est prêt
    setTimeout(() => {
      try {
        // Appel à la méthode getCheckout de CinetPay
        window.CinetPay.getCheckout(checkoutData);
        console.log(`[CinetPay Seamless] Appel à getCheckout effectué avec succès`);
        
        // Vérification après appel
        setTimeout(() => {
          console.log(`[CinetPay Seamless] Vérification après appel getCheckout:`, {
            hasGetCheckout: typeof window.getCheckout !== 'undefined',
            hasCheckoutData: typeof window.checkoutData !== 'undefined'
          });
        }, 1000);
      } catch (callError) {
        console.error(`[CinetPay Seamless] Erreur lors de l'appel à getCheckout:`, callError);
      }
    }, 500);
    
    return true;
  } catch (error) {
    console.error(`[CinetPay Seamless] Erreur lors du démarrage du paiement CinetPay:`, error);
    return false;
  }
};

/**
 * Configure la callback pour recevoir le résultat du paiement
 * Strictement conforme à la documentation: https://docs.cinetpay.com/integration/integrate/sdk-javascript/seamless-sdk
 */
export const setupCinetPayCallback = (callback: (data: CinetPayCallbackData) => void): boolean => {
  console.log(`[CinetPay Seamless] Configuration du callback CinetPay`);
  
  if (!window.CinetPay) {
    console.error(`[CinetPay Seamless] L'objet CinetPay n'est pas disponible sur window`);
    return false;
  }
  
  try {
    // Vérifier que waitResponse est bien une fonction
    if (typeof window.CinetPay.waitResponse !== 'function') {
      console.error(`[CinetPay Seamless] La méthode waitResponse n'est pas une fonction!`);
      return false;
    }
    
    // Configuration de la callback exactement selon la documentation
    console.log(`[CinetPay Seamless] Installation du listener waitResponse`);
    window.CinetPay.waitResponse((data: CinetPayCallbackData) => {
      console.log(`[CinetPay Seamless] CALLBACK REÇU de CinetPay:`, data);
      
      // Suivre exactement l'exemple de la documentation
      if (data.status === "REFUSED") {
        console.log(`[CinetPay Seamless] Paiement refusé`);
      } else if (data.status === "ACCEPTED") {
        console.log(`[CinetPay Seamless] Paiement accepté`);
      } 
      
      // Appel du callback personnalisé
      callback(data);
    });
    
    // Configuration des gestionnaires d'erreur et de fermeture si disponibles
    if (typeof window.CinetPay.onError === 'function') {
      window.CinetPay.onError(function(error: any) {
        console.error('[CinetPay Seamless] Erreur CinetPay:', error);
      });
    }
    
    if (typeof window.CinetPay.onClose === 'function') {
      window.CinetPay.onClose(function() {
        console.log('[CinetPay Seamless] Fenêtre CinetPay fermée');
      });
    }
    
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
