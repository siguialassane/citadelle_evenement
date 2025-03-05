
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white p-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="bg-indigo-600 p-6 text-center">
          <h1 className="text-6xl font-extrabold text-white">404</h1>
        </div>
        <div className="p-6 text-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Page non trouvée</h2>
          <p className="text-gray-600">
            Désolé, mais la page que vous recherchez n'existe pas, a été supprimée, 
            a changé de nom ou est temporairement indisponible.
          </p>
          <div className="flex justify-center">
            <Button 
              asChild
              className="flex items-center gap-2"
            >
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
