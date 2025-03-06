
// Ce fichier contient l'intégration avec le SDK CinetPay Seamless
// Modifications:
// - Ajout de logs détaillés pour le débogage des interactions CinetPay
// - Amélioration des logs de suivi pour identifier la source des problèmes
// - Ajout de vérifications supplémentaires pour éviter les erreurs TypeScript
// - Ajout de logs de tous les événements CinetPay

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
      hasCheckoutData: typeof window.checkoutData !== 'undefined',
      cinetPayFunctions: window.CinetPay ? Object.keys(window.CinetPay) : 'aucune' // Liste des fonctions disponibles
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
    
    // DEBUG: Afficher l'état actuel des fonctions CinetPay
    console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Configuration du SDK avec:`, {
      apikey: CINETPAY_API_KEY.substring(0, 5) + '...',
      site_id: CINETPAY_SITE_ID,
      notify_url: notifyUrl
    });
    
    // Configuration du SDK
    window.CinetPay.setConfig({
      apikey: CINETPAY_API_KEY,
      site_id: CINETPAY_SITE_ID,
      notify_url: notifyUrl,
      type: "WEB", // Ajout du paramètre type selon la documentation
      close_after_response: false // Ne pas fermer automatiquement pour gérer nous-mêmes la redirection
    });
    
    console.log(`[CinetPay Seamless] ${new Date().toISOString()} - CinetPay SDK initialisé avec succès`);
    
    // Vérifier à nouveau si les fonctions sont disponibles après initialisation
    if (window.CinetPay) {
      console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Méthodes CinetPay après initialisation:`, {
        hasSetConfig: typeof window.CinetPay.setConfig === 'function',
        hasGetCheckout: typeof window.CinetPay.getCheckout === 'function', 
        hasWaitResponse: typeof window.CinetPay.waitResponse === 'function'
      });
    }
    
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
    
    // Vérifier que getCheckout est bien une fonction
    if (typeof window.CinetPay.getCheckout !== 'function') {
      console.error(`[CinetPay Seamless] ${new Date().toISOString()} - La méthode getCheckout n'est pas une fonction!`, 
                   typeof window.CinetPay.getCheckout);
      return false;
    }
    
    // Capturer tous les événements CinetPay disponibles
    // Cette section ajoute des écouteurs d'événements pour tous les événements possibles
    try {
      if (typeof document !== 'undefined') {
        const possibleEvents = [
          'cinetpay-payment-success', 'cinetpay-payment-error', 
          'cinetpay-payment-cancelled', 'cinetpay-window-closed',
          'cinetpay-response-received'
        ];
        
        possibleEvents.forEach(eventName => {
          document.addEventListener(eventName, (event) => {
            console.log(`[CinetPay Seamless] ÉVÉNEMENT DÉTECTÉ: ${eventName}`, event);
          });
          console.log(`[CinetPay Seamless] Écouteur ajouté pour l'événement ${eventName}`);
        });
        
        // Ajouter un écouteur générique pour tous les événements non standard
        document.addEventListener('DOMContentLoaded', () => {
          console.log(`[CinetPay Seamless] Document chargé, observant les événements CinetPay`);
        });
      }
    } catch (eventError) {
      console.error(`[CinetPay Seamless] Erreur lors de l'ajout des écouteurs d'événements:`, eventError);
    }
    
    // Appel à la méthode getCheckout de CinetPay avec try-catch pour capturer les erreurs
    try {
      console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Juste avant l'appel à getCheckout`);
      window.CinetPay.getCheckout(formattedData);
      console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Appel à getCheckout effectué avec succès`);
      
      // Vérifier si des objets globaux ont été créés après l'appel
      setTimeout(() => {
        console.log(`[CinetPay Seamless] État global après getCheckout:`, {
          hasGetCheckout: typeof window.getCheckout !== 'undefined',
          hasCheckoutData: typeof window.checkoutData !== 'undefined',
          windowElements: Object.keys(window).filter(k => k.toLowerCase().includes('cinetpay') || k.toLowerCase().includes('checkout'))
        });
      }, 1000);
      
      return true;
    } catch (getCheckoutError) {
      console.error(`[CinetPay Seamless] ${new Date().toISOString()} - Erreur lors de l'appel à getCheckout:`, getCheckoutError);
      return false;
    }
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
    
    // Vérifier que waitResponse est bien une fonction
    if (typeof window.CinetPay.waitResponse !== 'function') {
      console.error(`[CinetPay Seamless] ${new Date().toISOString()} - La méthode waitResponse n'est pas une fonction!`,
                    typeof window.CinetPay.waitResponse);
      return false;
    }
    
    // Configuration de la callback
    console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Installation du listener waitResponse`);
    window.CinetPay.waitResponse((data: CinetPayCallbackData) => {
      console.log(`[CinetPay Seamless] ${new Date().toISOString()} - CALLBACK REÇU de CinetPay!`);
      console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Réponse du paiement CinetPay reçue:`, data);
      console.log(`[CinetPay Seamless] Type de données reçues:`, typeof data, Array.isArray(data) ? 'array' : 'non-array');
      
      // Gestion similaire à l'exemple de la documentation
      if (data.status === "REFUSED") {
        console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Paiement refusé`);
      } else if (data.status === "ACCEPTED") {
        console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Paiement accepté`);
      } else {
        console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Statut de paiement non reconnu:`, data.status);
      }
      
      // Appel du callback personnalisé pour traitement supplémentaire
      console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Exécution du callback utilisateur`);
      callback(data);
    });
    
    // Double vérification pour s'assurer que le callback est bien configuré
    console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Callback CinetPay configuré avec succès`);
    
    return true;
  } catch (error) {
    console.error(`[CinetPay Seamless] ${new Date().toISOString()} - Erreur lors de la configuration de la callback CinetPay:`, error);
    console.error(`[CinetPay Seamless] Stack trace:`, error instanceof Error ? error.stack : 'Pas de stack trace disponible');
    return false;
  }
};

// Fonction pour surveiller les changements dans le DOM qui pourraient indiquer une fenêtre CinetPay
export const monitorCinetPayIntegration = (): void => {
  console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Démarrage de la surveillance de l'intégration CinetPay`);
  
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
                console.log(`[CinetPay Seamless] Iframe détecté:`, {
                  src: iframe.src,
                  id: iframe.id,
                  name: iframe.name,
                  classList: Array.from(iframe.classList)
                });
              });
              
              // Rechercher d'autres éléments qui pourraient être liés à CinetPay
              if (node.id?.includes('cinetpay') || 
                  node.className?.includes('cinetpay') || 
                  node.innerHTML?.includes('cinetpay')) {
                console.log(`[CinetPay Seamless] Élément potentiellement lié à CinetPay détecté:`, {
                  id: node.id,
                  className: node.className,
                  tagName: node.tagName
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
    
    console.log(`[CinetPay Seamless] ${new Date().toISOString()} - Observateur de mutations configuré pour surveiller l'intégration CinetPay`);
  } else {
    console.log(`[CinetPay Seamless] ${new Date().toISOString()} - MutationObserver non disponible, surveillance limitée`);
  }
};
