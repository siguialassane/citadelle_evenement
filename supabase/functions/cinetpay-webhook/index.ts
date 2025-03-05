
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CINETPAY_SITE_ID = Deno.env.get("CINETPAY_SITE_ID") || "105889251";

console.log("CinetPay Webhook Function Initialized");

serve(async (req) => {
  // Vérifier la méthode HTTP
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      headers: { "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    // Initialiser le client Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Récupérer les données du webhook
    const payload = await req.json();
    console.log("Webhook payload:", JSON.stringify(payload));

    // Vérifier les données obligatoires
    const transactionId = payload.cpm_trans_id;
    const siteId = payload.cpm_site_id;
    const status = payload.status;

    if (!transactionId || !siteId) {
      return new Response(JSON.stringify({ error: "Données incomplètes" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Vérifier que le site_id correspond à notre site_id
    if (siteId !== CINETPAY_SITE_ID) {
      return new Response(JSON.stringify({ error: "Site ID non reconnu" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Trouver le paiement correspondant dans la base de données
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('cinetpay_api_response_id', transactionId)
      .single();

    if (fetchError) {
      console.error("Erreur lors de la récupération du paiement:", fetchError);
      return new Response(JSON.stringify({ error: "Paiement non trouvé" }), {
        headers: { "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Mettre à jour le statut du paiement
    const newStatus = status === "ACCEPTED" ? "success" : 
                      status === "REFUSED" ? "failed" : "pending";

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        cinetpay_operator_id: payload.operator_id || null,
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error("Erreur lors de la mise à jour du paiement:", updateError);
      return new Response(JSON.stringify({ error: "Erreur lors de la mise à jour du paiement" }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Si le paiement est réussi, mettre à jour le participant avec un QR code
    if (newStatus === "success") {
      // Générer un identifiant unique pour le QR code
      const qrCodeId = `QR-${payment.participant_id}-${Date.now()}`;
      
      const { error: participantUpdateError } = await supabase
        .from('participants')
        .update({
          qr_code_id: qrCodeId
        })
        .eq('id', payment.participant_id);

      if (participantUpdateError) {
        console.error("Erreur lors de la mise à jour du participant:", participantUpdateError);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Erreur lors du traitement de la notification CinetPay:", error);
    return new Response(JSON.stringify({ error: "Erreur interne" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
