
// Ce composant gère la redirection explicite vers les pages appropriées
// Il valide les paramètres et les ID avant la redirection

import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageRedirectProps {
  targetType?: 'payment-pending' | 'payment-validation' | 'confirmation' | 'payment';
  fallbackPath?: string;
}

const PageRedirect = ({ targetType, fallbackPath = '/' }: PageRedirectProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { participantId } = useParams<{ participantId: string }>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const redirectToTargetPage = () => {
      console.log("PageRedirect - Démarrage de la redirection...");
      console.log("PageRedirect - Type cible:", targetType);
      console.log("PageRedirect - ID du participant:", participantId);
      console.log("PageRedirect - URL actuelle:", location.pathname);
      console.log("PageRedirect - Paramètres d'URL:", location.search);

      // Vérification de l'ID du participant
      if (!participantId) {
        console.error("PageRedirect - Erreur: ID du participant manquant");
        setError("Identifiant de participant manquant dans l'URL");
        setIsLoading(false);
        return;
      }

      // Vérification que l'ID a le bon format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(participantId)) {
        console.error("PageRedirect - Erreur: Format d'ID invalide:", participantId);
        setError("Format d'identifiant invalide");
        setIsLoading(false);
        return;
      }

      // Construction de l'URL cible en fonction du type
      let targetUrl = fallbackPath;
      
      switch (targetType) {
        case 'payment-pending':
          targetUrl = `/payment-pending/${participantId}`;
          break;
        case 'payment-validation':
          targetUrl = `/admin/payment-validation/${participantId}`;
          break;
        case 'confirmation':
          targetUrl = `/confirmation/${participantId}`;
          break;
        case 'payment':
          targetUrl = `/payment/${participantId}`;
          break;
        default:
          // Utiliser le chemin de secours si aucun type n'est spécifié
          console.warn("PageRedirect - Aucun type cible spécifié, utilisation du fallback:", fallbackPath);
      }

      console.log("PageRedirect - Redirection vers:", targetUrl);
      
      // Effectuer la redirection après un court délai
      setTimeout(() => {
        navigate(targetUrl);
      }, 100);
    };

    redirectToTargetPage();
  }, [participantId, targetType, navigate, location, fallbackPath]);

  // Afficher un message d'erreur si nécessaire
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de redirection</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={() => navigate(fallbackPath)}
          className="mt-4"
        >
          Retour à la page d'accueil
        </Button>
      </div>
    );
  }

  // Afficher un message de chargement pendant la redirection
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
      <p className="text-center text-gray-600">Redirection en cours...</p>
    </div>
  );
};

export default PageRedirect;
