
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    // Vérifier si l'admin est connecté
    const adminAuth = localStorage.getItem('adminAuth') === 'true';
    setIsAdmin(adminAuth);

    if (!adminAuth) {
      toast({
        title: "Accès refusé",
        description: "Vous devez être connecté en tant qu'administrateur pour accéder à cette page.",
        variant: "destructive",
      });
    }
  }, []);

  // Afficher un état de chargement pendant la vérification
  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700"></div>
      </div>
    );
  }

  // Rediriger vers la page de connexion si non connecté
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  // Sinon, afficher le contenu protégé
  return <>{children}</>;
};
