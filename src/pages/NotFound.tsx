
// Mise à jour: Amélioration de la gestion des URL avec variables non remplacées
// Mise à jour: Ajout d'une fonction pour extraire et corriger les paramètres
// Mise à jour: Ajout d'une redirection automatique vers la page appropriée

import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [redirectInfo, setRedirectInfo] = useState<{
    canRedirect: boolean;
    destination: string;
    message: string;
  } | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Analyser l'URL pour détecter les variables non-remplacées
    const path = location.pathname;
    
    // Cas spécifique: URL contenant des variables non-remplacées comme {{participant_id}}
    if (path.includes("{{") && path.includes("}}")) {
      console.error("URL with unreplaced variables detected:", path);
      
      // Essayer de récupérer le type et l'ID réel si possible à partir de l'URL ou des paramètres
      const urlParts = path.split('/');
      const possibleRedirect = determineRedirectFromTemplate(path);
      
      if (possibleRedirect.canRedirect) {
        setRedirectInfo(possibleRedirect);
        
        // Démarrer un compte à rebours pour la redirection automatique
        const countdownInterval = setInterval(() => {
          setRedirectCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              navigate(possibleRedirect.destination);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(countdownInterval);
      }
    }
  }, [location.pathname, navigate]);

  // Fonction pour déterminer où rediriger en cas de variables non remplacées
  const determineRedirectFromTemplate = (path: string) => {
    // Cas pour les liens de paiement en attente
    if (path.includes('/payment-pending/{{participant_id}}')) {
      return {
        canRedirect: true,
        destination: '/',
        message: "Le lien que vous avez suivi contient des variables non remplacées. Vous allez être redirigé vers la page d'accueil où vous pourrez vous connecter."
      };
    }
    
    // Cas pour les liens de confirmation
    if (path.includes('/confirmation/{{participant_id}}')) {
      return {
        canRedirect: true,
        destination: '/',
        message: "Le lien de confirmation contient des variables non remplacées. Vous allez être redirigé vers la page d'accueil."
      };
    }
    
    // Cas pour les liens de reçu
    if (path.includes('/receipt/{{participant_id}}')) {
      return {
        canRedirect: true,
        destination: '/',
        message: "Le lien de reçu contient des variables non remplacées. Vous allez être redirigé vers la page d'accueil."
      };
    }
    
    // Par défaut, pas de redirection automatique
    return {
      canRedirect: false,
      destination: '/',
      message: ""
    };
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white p-4">
      <div className="text-center max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
        <p className="text-xl text-gray-700 mb-6">Oops! Page non trouvée</p>
        <p className="text-gray-600 mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        
        {redirectInfo && redirectInfo.canRedirect && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-700">Problème de lien détecté</AlertTitle>
            <AlertDescription className="text-yellow-600">
              {redirectInfo.message}
              <div className="mt-2 flex items-center justify-center text-sm">
                <Loader2 className="h-4 w-4 mr-2 animate-spin text-orange-500" />
                Redirection dans {redirectCountdown} secondes...
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <Button 
          onClick={handleBackToHome}
          className="flex items-center justify-center mx-auto gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
