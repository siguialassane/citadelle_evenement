
// Ce fichier contient la configuration pour l'intégration avec CinetPay

// Clés d'API CinetPay (fournies par CinetPay)
export const CINETPAY_API_KEY = "152913513467c83763ee8962.23212316";
export const CINETPAY_SITE_ID = "105889251";
export const CINETPAY_SECRET_KEY = "68104760967c83797a4fb21.75621429";

// URL de l'API CinetPay
export const CINETPAY_API_URL = "https://api-checkout.cinetpay.com/v2/payment";
export const CINETPAY_CHECK_URL = "https://api-checkout.cinetpay.com/v2/payment/check";

// Configuration des canaux de paiement
// N'utiliser que le mobile money (pas de carte bancaire)
export const PAYMENT_CHANNELS = "MOBILE_MONEY";
export const PAYMENT_CURRENCY = "XOF";

// Correspondance entre les méthodes de paiement internes et les canaux CinetPay
export const PAYMENT_METHOD_MAP: Record<string, string> = {
  "MOBILE_MONEY": "ALL", // Tous les moyens de paiement mobile
  "wave": "WAVE",
  "orange_money": "OM",
  "moov_money": "MOOV",
  "mtn_money": "MTN",
  "CREDIT_CARD": "CREDIT_CARD",
  "ALL": "ALL"
};

// Configuration pour le transfert d'argent (si besoin futur)
export const CINETPAY_AUTH_URL = "https://client.cinetpay.com/v1/auth/login";
export const CINETPAY_TRANSFER_CHECK_BALANCE_URL = "https://client.cinetpay.com/v1/transfer/check/balance";
export const CINETPAY_TRANSFER_CONTACT_URL = "https://client.cinetpay.com/v1/transfer/contact";
export const CINETPAY_TRANSFER_MONEY_URL = "https://client.cinetpay.com/v1/transfer/money/send/contact";
