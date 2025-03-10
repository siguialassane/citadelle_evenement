
// Utilitaires de validation d'email
export const validateEmailData = (email: string | undefined, participantData: any): EmailValidationResult => {
  if (!participantData) {
    return { isValid: false, error: "Données du participant manquantes" };
  }

  if (!email) {
    return { isValid: false, error: "Email manquant" };
  }

  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return { isValid: false, error: "Email vide après nettoyage" };
  }

  return { isValid: true };
};

export const prepareEmailData = (email: string): string => {
  return email.trim();
};

