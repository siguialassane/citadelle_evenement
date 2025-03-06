
/// <reference types="vite/client" />

/**
 * Déclaration des types pour le SDK CinetPay qui est chargé globalement
 * via un script dans le HTML
 */
interface Window {
  CinetPay?: {
    setConfig: (config: {
      apikey: string;
      site_id: string;
      notify_url: string;
      type?: string;
      close_after_response?: boolean;
      lang?: string; // Langue de l'interface (FR, EN, etc.)
      display_mode?: string; // Mode d'affichage (DISPLAY_MODE_POPUP ou DISPLAY_MODE_INLINE)
      return_url?: string; // URL de retour après paiement
    }) => void;
    getCheckout: (data: {
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
    }) => void;
    waitResponse: (callback: (data: {
      amount: string;
      currency: string;
      status: "ACCEPTED" | "REFUSED";
      payment_method: string;
      description: string;
      metadata: string;
      operator_id: string;
      payment_date: string;
      api_response_id?: string;
      transaction_id?: string;
    }) => void) => void;
    onError?: (callback: (data: any) => void) => void;
    onClose?: (callback: () => void) => void;
  };
  getCheckout?: any; // Généré dynamiquement par CinetPay après l'appel de getCheckout
  checkoutData?: any; // Généré dynamiquement par CinetPay après l'appel de getCheckout
  
  // Autres propriétés que CinetPay pourrait potentiellement générer
  cinetpay_payment_iframe?: HTMLIFrameElement;
  cinetpay_checkout_container?: HTMLElement;
  cinetpay_callback_received?: boolean;
  cinetpay_transaction_status?: string;
}

// Événements personnalisés que CinetPay pourrait déclencher
interface WindowEventMap {
  'cinetpay-payment-success': CustomEvent<any>;
  'cinetpay-payment-error': CustomEvent<any>;
  'cinetpay-payment-cancelled': CustomEvent<any>;
  'cinetpay-window-closed': CustomEvent<any>;
  'cinetpay-response-received': CustomEvent<any>;
}
