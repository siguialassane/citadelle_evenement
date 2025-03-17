
// Fonctions utilitaires pour le formatage
// Ajout de la fonction de formatage des numéros de téléphone

/**
 * Formate un numéro de téléphone pour l'affichage
 * @param phone Numéro de téléphone à formater
 * @returns Numéro formaté ou le numéro original si impossible à formater
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Supprimer tous les caractères non numériques
  const cleaned = phone.replace(/\D/g, '');
  
  // Si le numéro est trop court, retourner l'original
  if (cleaned.length < 8) return phone;
  
  // Format pour les numéros africains (+225, etc.)
  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    return `+225 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
  }
  
  // Format standard pour les numéros commençant par 0
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
  }
  
  // Format pour les numéros plus courts (8 chiffres)
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6)}`;
  }
  
  // Si le format n'est pas reconnu, retourner l'original
  return phone;
};
