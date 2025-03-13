
// Ce fichier sert à rediriger des URL alternatives vers les bonnes pages
// Utile pour les liens dans les emails qui peuvent utiliser des URL spéciales
// Mise à jour: Amélioration de la gestion des paramètres et des redirections
// Mise à jour: Ajout de plus de logs pour le débogage
// Mise à jour: Gestion des cas où les ID sont manquants ou malformés

import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PageRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { type, id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Fonction pour vérifier si un ID existe dans la table participants
    const checkParticipantExists = async (participantId: string) => {
      try {
        console.log("Vérification de l'existence du participant:", participantId);
        const { data, error } = await supabase
          .from('participants')
          .select('id')
          .eq('id', participantId)
          .single();
          
        if (error) {
          console.error("Erreur lors de la vérification du participant:", error);
          return false;
        }
        
        return !!data;
      } catch (err) {
        console.error("Exception lors de la vérification du participant:", err);
        return false;
      }
    };
  
    const handleRedirection = async () => {
      try {
        setIsLoading(true);
        
        // Extraire les paramètres de l'URL
        const queryParams = new URLSearchParams(location.search);
        
        console.log("PageRedirect: Redirection demandée", {
          type,
          id,
          queryParams: Object.fromEntries(queryParams.entries()),
          pathname: location.pathname,
          fullUrl: window.location.href
        });
        
        // Si l'ID est manquant, essayer de le récupérer des query params
        let effectiveId = id;
        if (!effectiveId && queryParams.has('id')) {
          effectiveId = queryParams.get('id');
          console.log("ID récupéré des query params:", effectiveId);
        }
        
        // Vérifier si l'ID contient des caractères de template non substitués
        const containsTemplateVariables = 
          effectiveId && (
            effectiveId.includes('{{') || 
            effectiveId.includes('}}') || 
            effectiveId === 'undefined' || 
            effectiveId === 'null'
          );
        
        if (containsTemplateVariables) {
          console.error("L'ID contient des variables de template non substituées:", effectiveId);
          setError("Ce lien contient des variables non substituées. Veuillez contacter l'administrateur.");
          toast({
            title: "Erreur de lien",
            description: "Ce lien contient des variables non substituées. Veuillez contacter l'administrateur.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        // Si aucun ID valide n'est trouvé
        if (!effectiveId) {
          console.error("ID manquant pour la redirection de type:", type);
          setError("Identifiant de participant manquant. Veuillez contacter l'administrateur.");
          toast({
            title: "Erreur de redirection",
            description: "Identifiant de participant manquant",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        // Vérifier que le participant existe réellement
        const participantExists = await checkParticipantExists(effectiveId);
        if (!participantExists) {
          console.error("Participant introuvable pour l'ID:", effectiveId);
          setError("Participant introuvable. Veuillez contacter l'administrateur.");
          toast({
            title: "Erreur de redirection",
            description: "Participant introuvable avec cet identifiant",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        // En fonction du type, rediriger vers la page appropriée
        switch(type) {
          case "pending":
            toast({
              title: "Redirection...",
              description: "Vous êtes redirigé vers la page de suivi de paiement",
            });
            console.log(`Redirection vers /payment-pending/${effectiveId}`);
            navigate(`/payment-pending/${effectiveId}`);
            break;
            
          case "receipt":
            console.log(`Redirection vers /receipt/${effectiveId}`);
            navigate(`/receipt/${effectiveId}`);
            break;
            
          case "confirmation":
            console.log(`Redirection vers /confirmation/${effectiveId}`);
            navigate(`/confirmation/${effectiveId}`);
            break;
            
          default:
            // Si le type n'est pas reconnu, rediriger vers la page d'accueil
            console.error("Type de redirection non reconnu:", type);
            setError(`Type de redirection non reconnu: ${type}`);
            navigate("/");
        }
      } catch (err: any) {
        console.error("Erreur lors de la redirection:", err);
        setError(err.message || "Une erreur est survenue lors de la redirection");
        toast({
          title: "Erreur de redirection",
          description: "Une erreur est survenue lors de la redirection",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    
    handleRedirection();
  }, [navigate, type, id, location]);

  // Afficher un message de chargement pendant la redirection
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-700">Redirection en cours...</p>
        </div>
      </div>
    );
  }
  
  // Afficher un message d'erreur si la redirection a échoué
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Erreur de redirection</h1>
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Par défaut, afficher un message de chargement
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-green-700">Redirection en cours...</p>
      </div>
    </div>
  );
};

export default PageRedirect;
