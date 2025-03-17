
// Composant de raccourci vers le dashboard principal
// Modifié pour servir de lien de redirection vers plusieurs tableaux de bord
// Paramétrable pour rediriger vers le tableau de bord souhaité

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users } from "lucide-react";

interface DashboardCommunicationProps {
  variant?: "default" | "outline";
  targetDashboard?: "main" | "membership";
  className?: string;
}

export const DashboardCommunication = ({ 
  variant = "default", 
  targetDashboard = "main",
  className
}: DashboardCommunicationProps) => {
  const navigate = useNavigate();

  const handleRedirectToDashboard = () => {
    // Redirection vers le tableau de bord spécifié
    if (targetDashboard === "membership") {
      navigate("/admin/membership");
    } else {
      navigate("/admin/dashboard");
    }
  };

  // Définir l'icône et le texte en fonction de la cible
  const getIcon = () => {
    if (targetDashboard === "membership") {
      return <Users className="h-4 w-4" />;
    }
    return <MessageSquare className="h-4 w-4" />;
  };

  const getText = () => {
    if (targetDashboard === "membership") {
      return "Gestion des adhésions";
    }
    return "Dashboard Principal";
  };

  return (
    <Button 
      variant={variant === "outline" ? "outline" : "default"} 
      className={`gap-2 ${className}`}
      onClick={handleRedirectToDashboard}
    >
      {getIcon()}
      {getText()}
    </Button>
  );
};
