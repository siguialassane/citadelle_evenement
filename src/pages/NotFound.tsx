
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Vérifier si l'URL contient des variables non-remplacées comme {{participant_id}}
    const path = location.pathname;
    if (path.includes("{{") && path.includes("}}")) {
      console.error("URL with unreplaced variables detected:", path);
    }
  }, [location.pathname]);

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
