
// Page de scan de QR code pour les administrateurs - Compatible avec iOS et Android
// Modifications:
// - Amélioration de la compatibilité mobile avec détection automatique de la caméra
// - Utilisation de stratégies multiples pour accéder à la caméra (avant/arrière)
// - Ajout de logs détaillés pour le debugging
// - Amélioration de l'UX avec indicateurs visuels de statut
// - Optimisation de la gestion des erreurs

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Header } from "@/components/admin/dashboard/Header";
import { ArrowLeft, QrCode, Camera, Upload, ExternalLink, Link2, Settings2, AlertCircle, CheckCircle2, Users } from "lucide-react";
import { ShortcutButton } from "@/components/admin/qr-scan/ShortcutButton";
import { Html5Qrcode } from "html5-qrcode";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  checkCameraAvailability, 
  tryMultipleCameraConfigurations, 
  extractParticipantIdFromQR 
} from "@/utils/cameraUtils";
import { Progress } from "@/components/ui/progress";

const QrCodeScan = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  const [lastScannedName, setLastScannedName] = useState<string | null>(null);
  const [lastScannedGuests, setLastScannedGuests] = useState<any[]>([]);
  const [scanInProgress, setScanInProgress] = useState(false);
  const [cameraStartProgress, setCameraStartProgress] = useState(0);
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
    
    const initCamera = async () => {
      console.log("Initialisation de la caméra...");
      const { hasCamera: deviceHasCamera, errorMessage } = await checkCameraAvailability();
      setHasCamera(deviceHasCamera);
      if (!deviceHasCamera && errorMessage) {
        setCameraError(errorMessage);
        console.error("Erreur de caméra:", errorMessage);
      } else if (deviceHasCamera) {
        console.log("Caméra détectée et disponible");
      }
    };

    checkAuth();
    initCamera();

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

  const startScanner = async (cameraConstraints: any): Promise<boolean> => {
    if (!scannerRef.current) {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;
    }
    
    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      aspectRatio: window.innerWidth < 768 ? 1.0 : 1.33,
      formatsToSupport: [0], // 0 corresponds to QR_CODE
    };
    
    try {
      await scannerRef.current.start(
        cameraConstraints,
        config,
        onScanSuccess,
        onScanFailure
      );
      console.log("Scanner démarré avec succès avec les contraintes:", cameraConstraints);
      return true;
    } catch (error) {
      console.error("Échec du démarrage du scanner avec les contraintes:", cameraConstraints, error);
      return false;
    }
  };

  const handleStartScan = async () => {
    try {
      console.log("Démarrage du scanner...");
      setIsScanning(true);
      setCameraError(null);
      setScanInProgress(true);
      
      // Simulation de progression
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 5;
        if (progress > 95) {
          clearInterval(progressInterval);
        }
        setCameraStartProgress(progress);
      }, 100);
      
      const success = await tryMultipleCameraConfigurations(startScanner);
      
      clearInterval(progressInterval);
      setCameraStartProgress(100);
      
      if (!success) {
        console.error("Impossible de démarrer la caméra après plusieurs tentatives");
        setCameraError("Impossible d'accéder à la caméra après plusieurs tentatives. Vérifiez vos paramètres ou utilisez l'option de téléchargement d'image.");
        setIsScanning(false);
      } else {
        console.log("Scanner démarré avec succès");
      }
    } catch (error) {
      console.error("Erreur inattendue lors du démarrage du scanner:", error);
      setCameraError("Une erreur inattendue s'est produite. Veuillez réessayer.");
      setIsScanning(false);
    } finally {
      setScanInProgress(false);
    }
  };

  const handleStopScan = () => {
    console.log("Arrêt du scanner...");
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

    console.log("Traitement du fichier uploadé:", file.name);
    setScanInProgress(true);
    
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
        setScanInProgress(false);
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
      
      setScanInProgress(true);
      
      // Extraction de l'ID du participant depuis le QR code
      const participantId = extractParticipantIdFromQR(decodedText);
      
      console.log("ID extrait du QR code:", participantId);
      
      if (!participantId) {
        toast({
          title: "QR code invalide",
          description: "Ce code QR ne contient pas d'identifiant valide.",
          variant: "destructive",
        });
        
        if (scannerRef.current) {
          scannerRef.current.resume();
        }
        setScanInProgress(false);
        return;
      }
      
      // Recherche du participant dans la base de données
      console.log("Recherche du participant avec ID:", participantId);
      const { data: participant, error: fetchError } = await supabase
        .from('participants')
        .select('*')
        .eq('id', participantId)
        .single();
        
      if (fetchError || !participant) {
        console.error("Participant non trouvé:", fetchError);
        toast({
          title: "Participant non trouvé",
          description: "Aucun participant trouvé avec cet identifiant.",
          variant: "destructive",
        });
        
        if (scannerRef.current) {
          scannerRef.current.resume();
        }
        setScanInProgress(false);
        return;
      }
      
      console.log("Participant trouvé:", participant);
      
      // Vérifier si le participant est déjà enregistré
      if (participant.check_in_status) {
        console.log("Participant déjà enregistré");
        setLastScannedId(participantId);
        setLastScannedName(`${participant.first_name} ${participant.last_name}`);
        
        // Récupérer les invités pour affichage même si déjà enregistré
        const { data: existingGuests } = await supabase
          .from('guests')
          .select('*')
          .eq('participant_id', participantId)
          .order('is_main_participant', { ascending: false });
        setLastScannedGuests(existingGuests || []);
        
        toast({
          title: "Déjà enregistré",
          description: `${participant.first_name} ${participant.last_name} a déjà été marqué comme présent.`,
          variant: "default",
        });
        
        // Reprendre le scan après un délai
        setTimeout(() => {
          if (scannerRef.current) {
            scannerRef.current.resume();
          }
          setScanInProgress(false);
        }, 2000);
        
        return;
      }
      
      // Mise à jour du statut de check-in
      console.log("Mise à jour du statut du participant");
      const { error } = await supabase
        .from('participants')
        .update({ 
          check_in_status: true,
          check_in_timestamp: new Date().toISOString()
        })
        .eq('id', participantId);

      if (error) {
        console.error("Erreur lors de la mise à jour du statut:", error);
        throw error;
      }

      // Enregistrement du check-in
      console.log("Enregistrement du check-in");
      const { error: checkInError } = await supabase
        .from('check_ins')
        .insert([
          { 
            participant_id: participantId,
            checked_in_at: new Date().toISOString(),
            checked_in_by: 'admin',
            method: 'qr_scan'
          }
        ]);

      if (checkInError) {
        console.error("Erreur lors de l'enregistrement du check-in:", checkInError);
        throw checkInError;
      }

      // Récupérer et enregistrer les invités
      const { data: guestsData } = await supabase
        .from('guests')
        .select('*')
        .eq('participant_id', participantId)
        .order('is_main_participant', { ascending: false });
      
      const fetchedGuests = guestsData || [];
      
      // Check-in automatique de tous les invités du groupe
      if (fetchedGuests.length > 0) {
        const now = new Date().toISOString();
        const { error: guestCheckInError } = await supabase
          .from('guests')
          .update({ check_in_status: true, check_in_timestamp: now })
          .eq('participant_id', participantId);
        
        if (guestCheckInError) {
          console.error("Erreur lors du check-in des invités:", guestCheckInError);
        } else {
          // Mettre à jour localement les invités
          fetchedGuests.forEach(g => {
            g.check_in_status = true;
            g.check_in_timestamp = now;
          });
        }
      }
      
      setLastScannedGuests(fetchedGuests);

      console.log("Check-in réussi pour:", `${participant.first_name} ${participant.last_name}`);
      setLastScannedId(participantId);
      setLastScannedName(`${participant.first_name} ${participant.last_name}`);
      
      toast({
        title: "Présence confirmée",
        description: fetchedGuests.length > 1 
          ? `${participant.first_name} ${participant.last_name} et ${fetchedGuests.length - 1} invité(s) ont été marqués comme présents.`
          : `${participant.first_name} ${participant.last_name} a été marqué comme présent.`,
        variant: "default",
      });
      
      // Reprendre le scan après un délai
      setTimeout(() => {
        if (scannerRef.current) {
          scannerRef.current.resume();
        }
        setScanInProgress(false);
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
      setScanInProgress(false);
    }
  };

  const handleToggleGuestCheckIn = async (guestId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const now = newStatus ? new Date().toISOString() : null;
      
      const { error } = await supabase
        .from('guests')
        .update({ check_in_status: newStatus, check_in_timestamp: now })
        .eq('id', guestId);
      
      if (error) {
        console.error("Erreur lors de la mise à jour du statut de l'invité:", error);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le statut de l'invité.",
          variant: "destructive",
        });
        return;
      }
      
      // Mettre à jour localement
      setLastScannedGuests(prev => prev.map(g => 
        g.id === guestId ? { ...g, check_in_status: newStatus, check_in_timestamp: now } : g
      ));
      
      const guest = lastScannedGuests.find(g => g.id === guestId);
      toast({
        title: newStatus ? "Invité enregistré" : "Enregistrement annulé",
        description: `${guest?.first_name} ${guest?.last_name} - ${newStatus ? 'présence confirmée' : 'enregistrement annulé'}.`,
        variant: "default",
      });
    } catch (err) {
      console.error("Erreur:", err);
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
          <div className="flex flex-wrap gap-2">
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
                      
                      {/* Indicateur de scan en cours */}
                      {scanInProgress && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10">
                          <div className="bg-white p-4 rounded-lg text-center max-w-xs">
                            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto animate-pulse mb-2" />
                            <p className="text-gray-800 font-medium">Traitement en cours...</p>
                          </div>
                        </div>
                      )}
                      
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
                          <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                            <p className="text-sm">{cameraError}</p>
                          </div>
                        )}
                        {scanInProgress && (
                          <div className="mt-4 w-full">
                            <p className="text-sm mb-2">Initialisation de la caméra...</p>
                            <Progress value={cameraStartProgress} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={isScanning ? handleStopScan : handleStartScan}
                    className={`w-full ${isScanning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                    size="lg"
                    disabled={scanInProgress || cameraError === "Aucune caméra détectée sur cet appareil"}
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
                      
                      {scanInProgress && (
                        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700 mr-2"></div>
                            <p>Analyse de l'image en cours...</p>
                          </div>
                        </div>
                      )}
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
                    disabled={scanInProgress}
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
                  
                  {/* Affichage des invités pour les réservations multi-places */}
                  {lastScannedGuests.length > 1 && (
                    <div className="mt-3 border-t pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-medium text-blue-800">
                          Groupe de {lastScannedGuests.length} personnes
                        </p>
                      </div>
                      <ul className="space-y-2">
                        {lastScannedGuests.map((guest) => (
                          <li key={guest.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-md px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className={guest.check_in_status ? "text-green-700" : "text-gray-600"}>
                                {guest.first_name} {guest.last_name}
                              </span>
                              {guest.is_main_participant && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                  Principal
                                </span>
                              )}
                            </div>
                            <Button
                              variant={guest.check_in_status ? "outline" : "default"}
                              size="sm"
                              className={guest.check_in_status 
                                ? "h-7 text-xs border-green-200 text-green-700" 
                                : "h-7 text-xs bg-green-600 hover:bg-green-700"}
                              onClick={() => handleToggleGuestCheckIn(guest.id, guest.check_in_status)}
                            >
                              {guest.check_in_status ? "✓ Présent" : "Check-in"}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
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
              
              <div className="mt-4 p-4 bg-green-50 rounded-md">
                <h3 className="font-medium text-green-800 mb-2">Compatibilité</h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>iOS: fonctionne avec Safari sur iPhone et iPad</li>
                  <li>Android: compatible avec Chrome, Samsung Internet</li>
                  <li>Si la caméra arrière ne s'active pas automatiquement, utilisez l'option de téléchargement</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default QrCodeScan;
