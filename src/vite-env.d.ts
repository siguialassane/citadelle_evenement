
/// <reference types="vite/client" />

/**
 * Déclaration des types pour le SDK CinetPay qui est chargé globalement
 * via un script dans le HTML
 * Documentation: https://docs.cinetpay.com/integration/integrate/sdk-javascript/seamless-sdk
 */
interface Window {
  CinetPay?: {
    setConfig: (config: {
      apikey: string;
      site_id: string;
      notify_url: string;
      lang?: string;
      display_mode?: string;
      return_url?: string;
    }) => void;
    getCheckout: (data: {
      transaction_id: string;
      amount: string; // String comme indiqué dans la documentation
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
}

// Événements personnalisés que CinetPay pourrait déclencher
interface WindowEventMap {
  'cinetpay-payment-success': CustomEvent<any>;
  'cinetpay-payment-error': CustomEvent<any>;
  'cinetpay-payment-cancelled': CustomEvent<any>;
  'cinetpay-window-closed': CustomEvent<any>;
  'cinetpay-response-received': CustomEvent<any>;
}
