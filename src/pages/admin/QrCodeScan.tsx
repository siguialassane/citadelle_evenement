
// Page de scan de QR code pour les administrateurs - Compatible avec iOS et Android
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Header } from "@/components/admin/dashboard/Header";
import { ArrowLeft, QrCode, Camera, Upload, ExternalLink, Link2, Settings2 } from "lucide-react";
import { ShortcutButton } from "@/components/admin/qr-scan/ShortcutButton";
import { Html5Qrcode } from "html5-qrcode";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const QrCodeScan = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  const [lastScannedName, setLastScannedName] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerContainerId = "qr-reader";

  useEffect(() => {
    const checkAuth = async () => {
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
        if (!hasVideoInput) {
          setCameraError("Aucune caméra détectée sur cet appareil");
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de la caméra:", error);
        setHasCamera(false);
        setCameraError("Impossible d'accéder à la caméra. Vérifiez vos permissions.");
      }
    };

    checkAuth();
    checkCamera();

    // Nettoyage à la sortie
    return () => {
      stopScanner();
    };
  }, [navigate]);

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(console.error);
    }
  };

  const handleStartScan = () => {
    setIsScanning(true);
    setCameraError(null);
    
    const html5QrCode = new Html5Qrcode(scannerContainerId);
    scannerRef.current = html5QrCode;
    
    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      aspectRatio: window.innerWidth < 768 ? 1.0 : 1.33,
      formatsToSupport: [0], // 0 corresponds to QR_CODE
    };
    
    // Tentative avec la caméra arrière d'abord
    html5QrCode.start(
      { facingMode: "environment" },
      config,
      onScanSuccess,
      onScanFailure
    ).catch(err => {
      console.log("Erreur avec la caméra arrière, tentative avec la caméra avant:", err);
      
      // Si la caméra arrière échoue, essayons la caméra avant
      html5QrCode.start(
        { facingMode: "user" },
        config,
        onScanSuccess,
        onScanFailure
      ).catch(frontErr => {
        console.error("Erreur au démarrage du scanner (avant et arrière):", frontErr);
        setCameraError("Impossible d'activer la caméra. Vérifiez vos permissions dans les paramètres du navigateur.");
        setIsScanning(false);
        stopScanner();
      });
    });
  };

  const handleStopScan = () => {
    stopScanner();
    setIsScanning(false);
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processUploadedFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a new instance for file scanning
    const html5QrCode = new Html5Qrcode("qr-reader-hidden");
    
    html5QrCode.scanFile(file, true)
      .then(decodedText => {
        // Process the result
        console.log("QR Code détecté depuis l'image:", decodedText);
        processScannedResult(decodedText);
      })
      .catch(err => {
        console.error("Erreur de décodage du QR code:", err);
        toast({
          title: "Aucun QR code détecté",
          description: "L'image ne contient pas de QR code valide ou lisible.",
          variant: "destructive",
        });
      })
      .finally(() => {
        // Clean up file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      });
  };

  const onScanSuccess = (decodedText: string) => {
    console.log("QR Code détecté en temps réel:", decodedText);
    processScannedResult(decodedText);
  };

  const processScannedResult = async (decodedText: string) => {
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
              Scanner le code QR
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
                Utilisez la caméra ou téléchargez une image pour scanner les QR codes des participants
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Tabs defaultValue="camera" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="camera">
                    <Camera className="h-4 w-4 mr-2" />
                    Caméra
                  </TabsTrigger>
                  <TabsTrigger value="upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Télécharger
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="camera" className="w-full">
                  {isScanning ? (
                    <div className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                      <div id={scannerContainerId} className="w-full h-full">
                        {/* La caméra sera insérée ici par la bibliothèque */}
                      </div>
                      
                      {/* Cadre de scan */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="w-64 h-64 border-2 border-white border-dashed rounded-lg"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4">
                      <div className="text-center text-gray-500 p-4">
                        <QrCode className="h-8 w-8 mx-auto mb-2" />
                        <p>Appuyez sur "Commencer le scan" pour activer la caméra</p>
                        {cameraError && (
                          <p className="text-red-500 mt-2 text-sm">{cameraError}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={isScanning ? handleStopScan : handleStartScan}
                    className={`w-full ${isScanning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                    size="lg"
                    disabled={cameraError === "Aucune caméra détectée sur cet appareil"}
                  >
                    {isScanning ? "Arrêter le scan" : "Commencer le scan"}
                  </Button>
                </TabsContent>
                
                <TabsContent value="upload" className="w-full">
                  <div className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center text-gray-500 p-4">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <p>Téléchargez une photo contenant un QR code</p>
                      <p className="text-sm mt-2">Formats supportés: JPG, PNG</p>
                    </div>
                  </div>
                  
                  <Input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/*" 
                    className="hidden"
                    onChange={processUploadedFile}
                  />
                  
                  <Button
                    onClick={handleFileUpload}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Sélectionner une image
                  </Button>
                  
                  {/* Hidden element for file scanning */}
                  <div id="qr-reader-hidden" className="hidden"></div>
                </TabsContent>
              </Tabs>
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
                  <li>Utilisez la caméra ou téléchargez une image du QR code</li>
                  <li>Attendez la confirmation avant de passer au participant suivant</li>
                  <li>En cas d'échec, essayez avec l'option de téléchargement</li>
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
