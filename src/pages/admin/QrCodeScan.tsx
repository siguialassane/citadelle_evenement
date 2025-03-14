
// Page de scan de QR code pour les administrateurs
// Utilise maintenant le composant QrScannerSimple basé sur react-qr-reader
// Mise à jour: Amélioration de la compatibilité mobile avec une solution plus simple

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QrScannerSimple } from "@/components/admin/qr-scan/QrScannerSimple";
import { fetchParticipantData } from "@/hooks/payment-validation/supabaseService";
import { ShortcutButton } from "@/components/admin/qr-scan/ShortcutButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function QrCodeScan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [participantDetails, setParticipantDetails] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("scanner");
  
  // Gérer le résultat du scan
  const handleScanSuccess = async (participantId: string) => {
    try {
      setLoading(true);
      console.log("Recherche du participant avec ID:", participantId);
      
      const participant = await fetchParticipantData(participantId);
      
      if (!participant) {
        toast({
          title: "Participant non trouvé",
          description: "Aucun participant trouvé avec ce QR code",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Participant trouvé:", participant);
      setParticipantDetails(participant);
      setSuccess(true);
      
      toast({
        title: "Participant vérifié",
        description: `${participant.first_name} ${participant.last_name} est bien enregistré!`,
      });
    } catch (error: any) {
      console.error("Erreur lors de la vérification:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la vérification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Gérer la redirection vers le tableau de bord
  const handleReturnToDashboard = () => {
    setParticipantDetails(null);
    setSuccess(false);
    navigate("/admin/dashboard");
  };
  
  // Réinitialiser pour un nouveau scan
  const handleScanAgain = () => {
    setParticipantDetails(null);
    setSuccess(false);
    setActiveTab("scanner");
  };

  return (
    <div className="container p-4 mx-auto">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">
            Vérification de participation
          </CardTitle>
          <CardDescription className="text-center">
            Scannez le QR code du participant pour vérifier son inscription
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!success ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="scanner">Scanner QR Code</TabsTrigger>
                <TabsTrigger value="manual">Saisie manuelle</TabsTrigger>
              </TabsList>
              
              <TabsContent value="scanner" className="pt-4">
                <QrScannerSimple onScanSuccess={handleScanSuccess} />
              </TabsContent>
              
              <TabsContent value="manual" className="pt-4">
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      Si le scan ne fonctionne pas, utilisez ces raccourcis pour les tests
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <ShortcutButton 
                      label="Participant 1" 
                      icon={<Check className="h-4 w-4" />}
                      onClick={() => handleScanSuccess("d290f1ee-6c54-4b01-90e6-d701748f0851")} 
                    />
                    <ShortcutButton 
                      label="Participant 2" 
                      icon={<Check className="h-4 w-4" />}
                      onClick={() => handleScanSuccess("04d0acbb-6c99-47cd-8e63-44850cb3899c")} 
                    />
                  </div>
                  
                  <Button 
                    variant="outline"
                    className="w-full mt-4"
                    onClick={handleReturnToDashboard}
                  >
                    Retour au tableau de bord
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold">Participant vérifié!</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Les informations du participant sont correctes
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Nom:</span>
                  <span className="text-sm">{participantDetails?.last_name}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Prénom:</span>
                  <span className="text-sm">{participantDetails?.first_name}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm overflow-ellipsis overflow-hidden">{participantDetails?.email}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Téléphone:</span>
                  <span className="text-sm">{participantDetails?.contact_number}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Membre:</span>
                  <span className="text-sm">{participantDetails?.is_member ? "Oui" : "Non"}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-sm font-medium">Paiement:</span>
                  <span className="text-sm font-semibold text-green-600">Validé</span>
                </div>
              </div>
              
              <div className="flex space-x-4 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleReturnToDashboard}
                >
                  Retour
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleScanAgain}
                >
                  Scanner un autre
                </Button>
              </div>
            </div>
          )}
          
          {loading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                <p className="mt-2 text-sm text-gray-600">Vérification en cours...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
