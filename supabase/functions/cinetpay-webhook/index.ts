
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CINETPAY_SITE_ID = Deno.env.get("CINETPAY_SITE_ID") || "105889251";

console.log("CinetPay Webhook Function Initialized");
console.log("SUPABASE_URL defined:", !!SUPABASE_URL);
console.log("SUPABASE_SERVICE_ROLE_KEY defined:", !!SUPABASE_SERVICE_ROLE_KEY);
console.log("CINETPAY_SITE_ID:", CINETPAY_SITE_ID);

serve(async (req) => {
  // ID de trace unique pour suivre une requête spécifique à travers les logs
  const requestId = Math.random().toString(36).substring(2, 10);
  
  console.log(`[${requestId}] CinetPay Webhook: Nouvelle requête reçue à ${new Date().toISOString()}`);
  console.log(`[${requestId}] CinetPay Webhook: Méthode:`, req.method);
  console.log(`[${requestId}] CinetPay Webhook: URL:`, req.url);
  console.log(`[${requestId}] CinetPay Webhook: Headers:`, JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] CinetPay Webhook: Réponse à la requête CORS OPTIONS`);
    return new Response(null, { headers: corsHeaders });
  }

  // Vérifier la méthode HTTP - accepter à la fois POST et GET pour les tests
  if (req.method !== "POST" && req.method !== "GET") {
    console.error(`[${requestId}] CinetPay Webhook: Méthode non autorisée:`, req.method);
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  // Analyser les paramètres d'URL pour les requêtes GET (utile pour les tests)
  let urlParams = {};
  if (req.method === "GET") {
    const url = new URL(req.url);
    urlParams = Object.fromEntries(url.searchParams.entries());
    console.log(`[${requestId}] CinetPay Webhook: Paramètres GET:`, urlParams);
  }

  let reqBody;
  try {
    // Tenter de récupérer le body brut pour la journalisation
    const clonedReq = req.clone();
    reqBody = await clonedReq.text();
    console.log(`[${requestId}] CinetPay Webhook: Body brut reçu:`, reqBody);
    
    // Tester si le body est un JSON valide
    try {
      JSON.parse(reqBody);
      console.log(`[${requestId}] CinetPay Webhook: Le body est un JSON valide`);
    } catch (jsonTestError) {
      console.error(`[${requestId}] CinetPay Webhook: Le body n'est PAS un JSON valide:`, jsonTestError.message);
      console.log(`[${requestId}] CinetPay Webhook: Tentative de traitement comme formulaire`);
      
      // Essayer de parser comme application/x-www-form-urlencoded
      try {
        const formParams = new URLSearchParams(reqBody);
        console.log(`[${requestId}] CinetPay Webhook: Paramètres du formulaire:`, 
          Object.fromEntries(formParams.entries()));
      } catch (formError) {
        console.error(`[${requestId}] CinetPay Webhook: Échec du parsing comme formulaire:`, formError.message);
      }
    }
  } catch (bodyError) {
    console.error(`[${requestId}] CinetPay Webhook: Erreur lors de la lecture du body brut:`, bodyError);
  }

  try {
    // Initialiser le client Supabase
    console.log(`[${requestId}] CinetPay Webhook: Initialisation du client Supabase`);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Vérifier la connexion Supabase
    try {
      const { data: testData, error: testError } = await supabase.from('payments').select('count').limit(1);
      console.log(`[${requestId}] CinetPay Webhook: Test de connexion Supabase - ${testError ? 'ÉCHEC' : 'SUCCÈS'}`);
      if (testError) {
        console.error(`[${requestId}] CinetPay Webhook: Erreur de connexion Supabase:`, testError);
      }
    } catch (testConnError) {
      console.error(`[${requestId}] CinetPay Webhook: Exception lors du test de connexion Supabase:`, testConnError);
    }

    // Récupérer les données du webhook (selon la méthode)
    let payload;
    try {
      if (req.method === "POST") {
        try {
          payload = await req.json();
        } catch (jsonError) {
          console.error(`[${requestId}] CinetPay Webhook: Erreur JSON, essai de parsing de formulaire`);
          const formData = await req.formData();
          payload = Object.fromEntries(formData.entries());
        }
      } else {
        // Pour les requêtes GET, utiliser les paramètres d'URL
        payload = urlParams;
      }
      
      console.log(`[${requestId}] CinetPay Webhook: Payload traité:`, JSON.stringify(payload, null, 2));
      
      // Pour les requêtes GET (uniquement pour les tests), on peut répondre immédiatement 
      if (req.method === "GET" && Object.keys(payload).length === 0) {
        return new Response(JSON.stringify({ 
          status: "ok", 
          message: "Test de webhook réussi", 
          timestamp: new Date().toISOString(),
          request_id: requestId
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } catch (parseError) {
      console.error(`[${requestId}] CinetPay Webhook: Erreur lors du parsing des données:`, parseError);
      return new Response(JSON.stringify({ 
        error: "Format de données invalide",
        raw_body: reqBody,
        error_details: parseError.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Vérifier les données obligatoires - utiliser différentes clés possibles selon les formats
    const transactionId = payload.cpm_trans_id || payload.transaction_id || payload.token;
    const siteId = payload.cpm_site_id || payload.site_id;
    const status = payload.status;
    const apiResponseId = payload.api_response_id || "";

    console.log(`[${requestId}] CinetPay Webhook: Données extraites:`, {
      transactionId,
      siteId,
      status,
      apiResponseId,
      paymentMethod: payload.payment_method,
      paymentStatus: status,
      additionalData: payload
    });

    if (!transactionId) {
      console.error(`[${requestId}] CinetPay Webhook: Transaction ID manquant`);
      return new Response(JSON.stringify({ error: "Transaction ID manquant", received: payload }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Vérifier que le site_id correspond à notre site_id (si fourni)
    if (siteId && siteId !== CINETPAY_SITE_ID) {
      console.error(`[${requestId}] CinetPay Webhook: Site ID non reconnu - Reçu: ${siteId}, Attendu: ${CINETPAY_SITE_ID}`);
      return new Response(JSON.stringify({ error: "Site ID non reconnu", received: siteId, expected: CINETPAY_SITE_ID }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Recherche du paiement - méthodes multiples et plus précises
    console.log(`[${requestId}] CinetPay Webhook: Début de la recherche du paiement`);
    let payment = null;
    
    // 1. D'abord, recherche exacte par transaction_id
    console.log(`[${requestId}] CinetPay Webhook: Recherche par transaction_id:`, transactionId);
    
    // Supprimer les éventuels espaces ou caractères non imprimables
    const cleanTransactionId = transactionId.trim();
    
    let { data: paymentResult, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .ilike('transaction_id', cleanTransactionId)
      .maybeSingle();

    // 2. Si non trouvé, essayer avec cinetpay_api_response_id
    if (!fetchError && paymentResult) {
      payment = paymentResult;
      console.log(`[${requestId}] CinetPay Webhook: Paiement trouvé par transaction_id:`, payment.id);
    } else {
      console.log(`[${requestId}] CinetPay Webhook: Paiement non trouvé par transaction_id, erreur:`, fetchError);
      console.log(`[${requestId}] CinetPay Webhook: Tentative avec cinetpay_api_response_id:`, apiResponseId || transactionId);
      
      if (apiResponseId) {
        const { data: paymentAlt, error: fetchAltError } = await supabase
          .from('payments')
          .select('*')
          .ilike('cinetpay_api_response_id', apiResponseId)
          .maybeSingle();
          
        if (!fetchAltError && paymentAlt) {
          console.log(`[${requestId}] CinetPay Webhook: Paiement trouvé avec cinetpay_api_response_id:`, paymentAlt.id);
          payment = paymentAlt;
        } else {
          console.log(`[${requestId}] CinetPay Webhook: Paiement non trouvé avec cinetpay_api_response_id, erreur:`, fetchAltError);
        }
      }
      
      // 3. Si toujours pas trouvé, essayer avec cinetpay_token
      if (!payment) {
        console.log(`[${requestId}] CinetPay Webhook: Tentative avec cinetpay_token:`, transactionId);
        
        const { data: paymentToken, error: fetchTokenError } = await supabase
          .from('payments')
          .select('*')
          .ilike('cinetpay_token', cleanTransactionId)
          .maybeSingle();
          
        if (!fetchTokenError && paymentToken) {
          console.log(`[${requestId}] CinetPay Webhook: Paiement trouvé avec cinetpay_token:`, paymentToken.id);
          payment = paymentToken;
        } else {
          console.log(`[${requestId}] CinetPay Webhook: Paiement non trouvé avec cinetpay_token, erreur:`, fetchTokenError);
        }
      }
      
      // 4. Recherche générale
      if (!payment) {
        console.log(`[${requestId}] CinetPay Webhook: Recherche complète nécessaire`);
        
        // Obtenir tous les paiements récents
        const { data: allPayments, error: fetchAllError } = await supabase
          .from('payments')
          .select('*')
          .order('payment_date', { ascending: false })
          .limit(50);
          
        if (!fetchAllError && allPayments) {
          console.log(`[${requestId}] CinetPay Webhook: ${allPayments.length} paiements récents récupérés`);
          
          // Fonction pour vérifier si deux chaînes ont une partie commune
          const haveCommonSubstring = (str1: string, str2: string): boolean => {
            if (!str1 || !str2) return false;
            
            // Si l'une est contenue dans l'autre
            if (str1.includes(str2) || str2.includes(str1)) {
              console.log(`[${requestId}] Match partiel trouvé: '${str1}' et '${str2}'`);
              return true;
            }
            
            // Vérifier des segments communs d'au moins 8 caractères
            const minLength = 8;
            for (let i = 0; i <= str1.length - minLength; i++) {
              const segment = str1.substring(i, i + minLength);
              if (str2.includes(segment)) {
                console.log(`[${requestId}] Match par segment commun trouvé: '${segment}' entre '${str1}' et '${str2}'`);
                return true;
              }
            }
            
            return false;
          };
          
          // Rechercher un paiement avec un ID qui partage une partie commune
          const matchingPayment = allPayments.find(p => {
            if (!p.transaction_id) return false;
            
            const matchTrans = haveCommonSubstring(p.transaction_id || "", cleanTransactionId);
            const matchToken = haveCommonSubstring(p.cinetpay_token || "", cleanTransactionId);
            const matchApi = apiResponseId ? 
              haveCommonSubstring(p.cinetpay_api_response_id || "", apiResponseId) : false;
            
            return matchTrans || matchToken || matchApi;
          });
          
          if (matchingPayment) {
            console.log(`[${requestId}] CinetPay Webhook: Paiement trouvé par correspondance partielle:`, matchingPayment.id);
            payment = matchingPayment;
          } else {
            console.error(`[${requestId}] CinetPay Webhook: Aucun paiement correspondant trouvé après recherche approfondie`);
            
            // Tenter une dernière recherche par participant_id s'il est disponible
            if (payload.metadata && typeof payload.metadata === 'string' && payload.metadata.includes('PARTICIPANT:')) {
              const participantId = payload.metadata.split('PARTICIPANT:')[1].trim();
              console.log(`[${requestId}] CinetPay Webhook: Tentative de recherche par participant_id:`, participantId);
              
              if (participantId) {
                const { data: participantPayments, error: participantError } = await supabase
                  .from('payments')
                  .select('*')
                  .eq('participant_id', participantId)
                  .order('payment_date', { ascending: false })
                  .limit(1);
                
                if (!participantError && participantPayments && participantPayments.length > 0) {
                  console.log(`[${requestId}] CinetPay Webhook: Paiement trouvé par participant_id:`, participantPayments[0].id);
                  payment = participantPayments[0];
                }
              }
            }
            
            if (!payment) {
              // Dans le cas où on ne trouve toujours pas de correspondance mais qu'on a assez d'informations,
              // on pourrait créer un nouveau paiement (à utiliser avec précaution)
              console.error(`[${requestId}] CinetPay Webhook: Impossible de trouver un paiement correspondant`);
              
              // Log tous les IDs pour débogage
              console.log(`[${requestId}] Liste des transaction_id dans la base (10 derniers):`);
              allPayments.slice(0, 10).forEach(p => console.log(`[${requestId}] ID: ${p.id}, transaction_id: ${p.transaction_id}, token: ${p.cinetpay_token}`));
              
              // Pour l'instant, retourner une erreur
              return new Response(JSON.stringify({ 
                error: "Paiement non trouvé malgré la recherche approfondie", 
                transaction_id: transactionId,
                status: status || 'unknown'
              }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 404,
              });
            }
          }
        } else {
          console.error(`[${requestId}] CinetPay Webhook: Erreur lors de la récupération de tous les paiements:`, fetchAllError);
        }
      }
    }

    // Si aucun paiement n'a été trouvé après toutes les tentatives
    if (!payment) {
      console.error(`[${requestId}] CinetPay Webhook: Aucun paiement trouvé après toutes les tentatives de recherche`);
      return new Response(JSON.stringify({ 
        error: "Paiement introuvable",
        transaction_id: transactionId,
        api_response_id: apiResponseId,
        all_data: payload
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Mettre à jour le statut du paiement
    const newStatus = status === "ACCEPTED" || status === "SUCCESS" ? "success" : 
                     status === "REFUSED" || status === "FAILED" ? "failed" : "pending";

    console.log(`[${requestId}] CinetPay Webhook: Mise à jour du statut du paiement ${payment.id} vers '${newStatus}' (ancien statut: '${payment.status}')`);

    // Mettre à jour avec le plus d'informations possible
    const updateData: any = {
      status: newStatus,
    };
    
    // Ajouter l'identifiant de l'opérateur s'il existe
    if (payload.operator_id) {
      updateData.cinetpay_operator_id = payload.operator_id;
      console.log(`[${requestId}] CinetPay Webhook: Ajout de l'opérateur ID: ${payload.operator_id}`);
    }
    
    // Ajouter l'identifiant de réponse API s'il existe
    if (apiResponseId) {
      updateData.cinetpay_api_response_id = apiResponseId;
      console.log(`[${requestId}] CinetPay Webhook: Ajout de l'API response ID: ${apiResponseId}`);
    }

    console.log(`[${requestId}] CinetPay Webhook: Données de mise à jour:`, updateData);

    const { error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', payment.id);

    if (updateError) {
      console.error(`[${requestId}] CinetPay Webhook: Erreur lors de la mise à jour du paiement:`, updateError);
      return new Response(JSON.stringify({ error: "Erreur lors de la mise à jour du paiement", details: updateError }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log(`[${requestId}] CinetPay Webhook: Statut du paiement mis à jour avec succès`);

    // Si le paiement est réussi, mettre à jour le participant avec un QR code
    if (newStatus === "success") {
      // Générer un identifiant unique pour le QR code
      const qrCodeId = `QR-${payment.participant_id}-${Date.now()}`;
      console.log(`[${requestId}] CinetPay Webhook: Paiement réussi - Génération du QR code ${qrCodeId} pour le participant ${payment.participant_id}`);
      
      const { error: participantUpdateError } = await supabase
        .from('participants')
        .update({
          qr_code_id: qrCodeId
        })
        .eq('id', payment.participant_id);

      if (participantUpdateError) {
        console.error(`[${requestId}] CinetPay Webhook: Erreur lors de la mise à jour du participant:`, participantUpdateError);
      } else {
        console.log(`[${requestId}] CinetPay Webhook: QR code généré et participant mis à jour avec succès`);
      }
    }

    console.log(`[${requestId}] CinetPay Webhook: Traitement terminé avec succès`);
    return new Response(JSON.stringify({ 
      success: true,
      transaction_id: transactionId,
      payment_id: payment.id,
      new_status: newStatus,
      message: "Notification traitée avec succès"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error(`[${requestId}] CinetPay Webhook: Erreur lors du traitement de la notification CinetPay:`, error);
    console.error(`[${requestId}] CinetPay Webhook: Stack trace:`, error.stack);
    return new Response(JSON.stringify({ 
      error: "Erreur interne", 
      details: error.message,
      raw_body: reqBody 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
