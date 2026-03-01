// Service SMS pour l'envoi de codes de vérification via Orange API Côte d'Ivoire
// Le SMS est envoyé via une Supabase Edge Function pour sécuriser les credentials

import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://iprpojebbueihznjpaxw.supabase.co";

/**
 * Génère un code SMS personnalisé au format XXX-NNNN
 * Ex: SIG-4291, DUP-8372, KON-1458
 * 3 premières lettres du nom (majuscules) + tiret + 4 chiffres aléatoires
 */
export const generateSmsCode = (lastName: string): string => {
  // Nettoyer le nom: retirer accents, caractères spéciaux
  const cleanName = lastName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Retirer accents
    .replace(/[^a-zA-Z]/g, "") // Garder que les lettres
    .toUpperCase();
  
  // Prendre les 3 premières lettres, compléter avec X si trop court
  const prefix = (cleanName + "XXX").substring(0, 3);
  
  // Générer 4 chiffres aléatoires
  const digits = Math.floor(1000 + Math.random() * 9000).toString();
  
  return `${prefix}-${digits}`;
};

/**
 * Vérifie l'unicité d'un code SMS dans la base de données
 * Si collision, régénère un nouveau code (max 5 tentatives)
 */
export const generateUniqueSmsCode = async (lastName: string): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateSmsCode(lastName);
    
    const { data, error } = await supabase
      .from('participants')
      .select('id')
      .eq('sms_code', code)
      .maybeSingle();
    
    if (error) {
      console.error("Erreur vérification unicité code SMS:", error);
      // En cas d'erreur DB, on retourne quand même le code (probabilité de collision très faible)
      return code;
    }
    
    if (!data) {
      // Code unique trouvé
      return code;
    }
    
    console.log(`Code SMS ${code} déjà utilisé, tentative ${attempt + 1}/5`);
  }
  
  // Fallback: ajouter un suffixe supplémentaire pour garantir l'unicité
  const fallbackCode = generateSmsCode(lastName);
  const extraDigit = Math.floor(Math.random() * 10);
  return `${fallbackCode}${extraDigit}`;
};

/**
 * Envoie un SMS via la Supabase Edge Function send-sms
 * L'Edge Function gère l'authentification Orange et l'envoi
 */
export const sendSmsViaEdgeFunction = async (
  phone: string,
  smsCode: string,
  participantName: string
): Promise<boolean> => {
  try {
    console.log(`📱 Envoi SMS au ${phone} avec code ${smsCode} pour ${participantName}`);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
      },
      body: JSON.stringify({
        phone,
        smsCode,
        participantName,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error("Erreur envoi SMS:", result.error || response.statusText);
      return false;
    }

    console.log("✅ SMS envoyé avec succès:", result.message);
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de l'appel Edge Function send-sms:", error);
    return false;
  }
};

/**
 * Recherche un participant par son code SMS
 * Retourne les données complètes du participant avec ses paiements et accompagnants
 */
export const lookupBySmsCode = async (smsCode: string) => {
  try {
    const normalizedCode = smsCode.trim().toUpperCase();
    
    const { data, error } = await supabase
      .from('participants')
      .select(`
        *,
        manual_payments(*),
        guests(id, participant_id, payment_id, first_name, last_name, is_main_participant, check_in_status, check_in_timestamp, created_at)
      `)
      .eq('sms_code', normalizedCode)
      .maybeSingle();

    if (error) {
      console.error("Erreur recherche par code SMS:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Erreur lookupBySmsCode:", error);
    return null;
  }
};
