
// Ce service fournit des utilitaires pour la gestion des transactions
// Il contient des fonctions pour générer des références et autres traitements liés aux transactions

/**
 * Génère une référence de transaction unique basée sur les informations du participant
 */
export const generateTransactionReference = (firstName: string, lastName: string) => {
  const prefix = "PAY";
  const participantInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${participantInitials}-${randomDigits}`;
};
