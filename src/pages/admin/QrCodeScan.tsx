
// Page de scan de QR code pour les administrateurs - Compatible avec iOS et Android
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Header } from "@/components/admin/dashboard/Header";
import { ArrowLeft, QrCode, Scan, Link2, ExternalLink, Settings2 } from "lucide-react";
import { ShortcutButton } from "@/components/admin/qr-scan/ShortcutButton";
import { Html5Qrcode } from "html5-qrcode";

const QrCodeScan = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  const [lastScannedName, setLastScannedName] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader";

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

    // Nettoyage à la sortie
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, [navigate]);

  const handleStartScan = () => {
    if (!hasCamera) return;
    
    setIsScanning(true);
    
    const html5QrCode = new Html5Qrcode(scannerContainerId);
    scannerRef.current = html5QrCode;
    
    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      formatsToSupport: [0], // 0 corresponds to QR_CODE
    };
    
    html5QrCode.start(
      { facingMode: "environment" }, // Pour utiliser la caméra arrière
      config,
      onScanSuccess,
      onScanFailure
    ).catch(err => {
      console.error("Erreur au démarrage du scanner:", err);
      toast({
        title: "Erreur",
        description: "Impossible d'activer la caméra. Vérifiez vos permissions et réessayez.",
        variant: "destructive",
      });
      setIsScanning(false);
    });
  };

  const handleStopScan = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        setIsScanning(false);
      }).catch(err => {
        console.error("Erreur à l'arrêt du scanner:", err);
        setIsScanning(false);
      });
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    console.log("QR Code détecté:", decodedText);
    try {
      // Mise en pause temporaire du scan pour éviter les lectures multiples
      if (scannerRef.current) {
        scannerRef.current.pause();
      }
      
      // Extraction de l'ID du participant depuis le QR code
      let participantId = decodedText;
      
      // Si le QR contient un URL, on extrait l'ID
      if (decodedText.includes('/')) {
        const parts = decodedText.split('/');
        participantId = parts[parts.length - 1];
      }
      
      // Vérifier si l'ID est valide (format UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(participantId)) {
        toast({
          title: "QR code invalide",
          description: "Ce code QR ne contient pas d'identifiant valide.",
          variant: "destructive",
        });
        
        if (scannerRef.current) {
          scannerRef.current.resume();
        }
        return;
      }
      
      // Recherche du participant dans la base de données
      const { data: participant, error: fetchError } = await supabase
        .from('participants')
        .select('*')
        .eq('id', participantId)
        .single();
        
      if (fetchError || !participant) {
        toast({
          title: "Participant non trouvé",
          description: "Aucun participant trouvé avec cet identifiant.",
          variant: "destructive",
        });
        
        if (scannerRef.current) {
          scannerRef.current.resume();
        }
        return;
      }
      
      // Mise à jour du statut de check-in
      const { error } = await supabase
        .from('participants')
        .update({ 
          check_in_status: true,
          check_in_timestamp: new Date().toISOString()
        })
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
      setLastScannedName(`${participant.first_name} ${participant.last_name}`);
      
      toast({
        title: "Présence confirmée",
        description: `${participant.first_name} ${participant.last_name} a été marqué comme présent.`,
        variant: "default",
      });
      
      // Reprendre le scan après un délai
      setTimeout(() => {
        if (scannerRef.current) {
          scannerRef.current.resume();
        }
      }, 2000);
      
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la présence:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la présence.",
        variant: "destructive",
      });
      
      if (scannerRef.current) {
        scannerRef.current.resume();
      }
    }
  };

  const onScanFailure = (error: string) => {
    // Nous ne faisons rien pour les erreurs de scan, c'est normal quand aucun QR n'est détecté
    // console.log("Pas de QR code détecté:", error);
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
                <div className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                  <div id={scannerContainerId} className="w-full h-full">
                    {/* La caméra sera insérée ici par la bibliothèque */}
                  </div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="w-64 h-64 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                      <Scan className="h-8 w-8 text-white" />
                    </div>
                  </div>
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
                  <p className="font-medium text-gray-800">{lastScannedName}</p>
                  <p className="text-sm text-gray-600">ID: {lastScannedId}</p>
                  <p className="text-green-600 font-medium mt-2">Présence confirmée</p>
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
