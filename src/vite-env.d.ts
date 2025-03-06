
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
    }) => void;
    getCheckout: (data: any) => void;
    waitResponse: (callback: (data: any) => void) => void;
  };
  getCheckout?: any;
  checkoutData?: any;
}

