
// Page de scan de QR code pour les administrateurs
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Header } from "@/components/admin/dashboard/Header";
import { ArrowLeft, QrCode, Scan, Link2, ExternalLink, Settings2 } from "lucide-react";
import { ShortcutButton } from "@/components/admin/qr-scan/ShortcutButton";

const QrCodeScan = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const isAdmin = localStorage.getItem("adminAuth") === "true";
      if (!isAdmin) {
        toast({
          title: "Accès non autorisé",
          description: "Veuillez vous connecter pour accéder au scanner.",
          variant: "destructive",
        });
        navigate("/admin/login");
      }
    };
    
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoInput = devices.some(device => device.kind === 'videoinput');
        setHasCamera(hasVideoInput);
      } catch (error) {
        console.error("Erreur lors de la vérification de la caméra:", error);
        setHasCamera(false);
      }
    };

    checkAuth();
    checkCamera();
  }, [navigate]);

  const handleStartScan = () => {
    setIsScanning(true);
    // La logique de scan sera implémentée ultérieurement
  };

  const handleStopScan = () => {
    setIsScanning(false);
  };

  const handleCheckIn = async (participantId: string) => {
    try {
      // Mise à jour du statut de check-in dans la base de données
      const { error } = await supabase
        .from('participants')
        .update({ check_in_status: true })
        .eq('id', participantId);

      if (error) throw error;

      // Enregistrement du check-in
      const { error: checkInError } = await supabase
        .from('check_ins')
        .insert([
          { 
            participant_id: participantId,
            checked_in_at: new Date().toISOString(),
            checked_in_by: 'admin', // À remplacer par l'ID de l'admin
            method: 'qr_scan'
          }
        ]);

      if (checkInError) throw checkInError;

      setLastScannedId(participantId);
      
      toast({
        title: "Présence confirmée",
        description: "Le participant a été marqué comme présent.",
        variant: "default",
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la présence:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la présence.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={() => {
        localStorage.removeItem("adminAuth");
        navigate("/");
      }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/admin/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour au tableau de bord
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Scanner QR Code
            </h1>
          </div>
          
          {/* Section des raccourcis */}
          <div className="flex gap-2">
            <ShortcutButton 
              icon={<ExternalLink className="h-4 w-4" />}
              label="Dashboard"
              onClick={() => navigate("/admin/dashboard")}
            />
            <ShortcutButton 
              icon={<Link2 className="h-4 w-4" />}
              label="Emails"
              onClick={() => navigate("/admin/email-dashboard")}
            />
            <ShortcutButton 
              icon={<Settings2 className="h-4 w-4" />}
              label="Paiements"
              onClick={() => navigate("/admin/payment-validation")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Scanner un QR Code</CardTitle>
              <CardDescription>
                Utilisez la caméra pour scanner les QR codes des participants
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {isScanning ? (
                <div className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4 bg-black">
                  <div className="text-center text-white">
                    <Scan className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                    <p>Scannez un QR code...</p>
                  </div>
                  {/* Le composant de scan de QR sera intégré ici */}
                </div>
              ) : (
                <div className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center text-gray-500">
                    <QrCode className="h-8 w-8 mx-auto mb-2" />
                    <p>Appuyez sur "Commencer le scan" pour activer la caméra</p>
                  </div>
                </div>
              )}

              {hasCamera ? (
                <Button
                  onClick={isScanning ? handleStopScan : handleStartScan}
                  className={isScanning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                  size="lg"
                >
                  {isScanning ? "Arrêter le scan" : "Commencer le scan"}
                </Button>
              ) : (
                <div className="text-center text-red-500 p-4 bg-red-50 rounded-md">
                  <p className="font-medium">Aucune caméra détectée</p>
                  <p className="text-sm">Veuillez vous assurer que votre appareil dispose d'une caméra et que vous avez accordé les permissions nécessaires.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dernière vérification</CardTitle>
              <CardDescription>
                Détails du dernier participant enregistré
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lastScannedId ? (
                <div className="p-4 border rounded-md">
                  <p>ID du participant: {lastScannedId}</p>
                  <p className="text-green-600 font-medium">Présence confirmée</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate(`/admin/dashboard?highlight=${lastScannedId}`)}
                  >
                    Voir dans le tableau de bord
                  </Button>
                </div>
              ) : (
                <div className="p-4 border border-dashed rounded-md text-center text-gray-500">
                  <p>Aucun scan récent</p>
                  <p className="text-sm">Les détails du dernier participant scanné apparaîtront ici</p>
                </div>
              )}
              
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <h3 className="font-medium text-blue-800 mb-2">Instructions</h3>
                <ol className="list-decimal pl-5 text-sm space-y-1">
                  <li>Demandez au participant de présenter son QR code</li>
                  <li>Alignez le QR code avec la caméra</li>
                  <li>Attendez la confirmation avant de passer au participant suivant</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default QrCodeScan;
