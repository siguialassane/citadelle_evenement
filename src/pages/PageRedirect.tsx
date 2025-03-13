
// Ce fichier sert à rediriger des URL alternatives vers les bonnes pages
// Utile pour les liens dans les emails qui peuvent utiliser des URL spéciales

import { useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const PageRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { type, id } = useParams();
  
  useEffect(() => {
    // Extraire les paramètres de l'URL
    const queryParams = new URLSearchParams(location.search);
    
    console.log("PageRedirect: Redirection demandée", {
      type,
      id,
      queryParams: Object.fromEntries(queryParams.entries()),
      pathname: location.pathname
    });
    
    // En fonction du type, rediriger vers la page appropriée
    if (type === "pending") {
      if (id) {
        toast({
          title: "Redirection...",
          description: "Vous êtes redirigé vers la page de suivi de paiement",
        });
        navigate(`/payment-pending/${id}`);
      } else {
        toast({
          title: "Erreur de redirection",
          description: "Identifiant de participant manquant",
          variant: "destructive",
        });
        navigate("/");
      }
    } else if (type === "receipt") {
      if (id) {
        navigate(`/receipt/${id}`);
      } else {
        navigate("/");
      }
    } else {
      // Si le type n'est pas reconnu, rediriger vers la page d'accueil
      console.error("Type de redirection non reconnu:", type);
      navigate("/");
    }
  }, [navigate, type, id, location]);

  // Afficher un message de chargement pendant la redirection
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
