
// Composant de raccourci vers le dashboard principal
// Modifié pour servir de lien de redirection direct vers le dashboard principal
// Simplifié pour représenter un bouton de raccourci sans dialogue

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface DashboardCommunicationProps {
  variant?: "default" | "outline";
}

export const DashboardCommunication = ({ variant = "default" }: DashboardCommunicationProps) => {
  const navigate = useNavigate();

  const handleRedirectToDashboard = () => {
    // Redirection vers le dashboard principal
    navigate("/admin/dashboard");
  };

  return (
    <Button 
      variant={variant === "outline" ? "outline" : "dashboard"} 
      className="gap-2"
      onClick={handleRedirectToDashboard}
    >
      <MessageSquare className="h-4 w-4" />
      Dashboard Principal
    </Button>
  );
};
