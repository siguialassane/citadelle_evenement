
import { RegisterForm } from "@/components/RegisterForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* En-tête de la page */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Bienvenue à notre</span>
            <span className="block text-indigo-600">Événement Exclusif</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Rejoignez-nous pour une expérience inoubliable. Complétez le formulaire ci-dessous pour réserver votre place.
          </p>
        </div>

        {/* Alerte d'information */}
        <Alert className="bg-indigo-50 border-indigo-200">
          <Info className="h-4 w-4 text-indigo-500" />
          <AlertTitle>Information importante</AlertTitle>
          <AlertDescription>
            Tous les champs du formulaire sont obligatoires. Après votre inscription, vous serez dirigé vers la page de paiement.
          </AlertDescription>
        </Alert>

        {/* Formulaire d'inscription */}
        <RegisterForm />
        
        {/* Bouton d'accès admin */}
        <div className="fixed bottom-5 right-5">
          <Button 
            onClick={() => navigate("/admin/login")}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            Accès Admin
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
