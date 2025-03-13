
// Nouveau composant QR Scanner basé sur react-qr-reader
// Ce composant est plus simple et plus fiable pour la lecture des QR codes sur mobile

import React, { useState } from "react";
import { QrReader } from "react-qr-reader";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { extractParticipantIdFromQR } from "@/utils/cameraUtils";
import { CircleAlert, CheckCircle2 } from "lucide-react";

type QrScannerSimpleProps = {
  onScanSuccess: (participantId: string) => void;
};

export function QrScannerSimple({ onScanSuccess }: QrScannerSimpleProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleScan = (result: any) => {
    if (result && result.text) {
      console.log("QR code détecté :", result.text);
      setScanning(false);
      setResult(result.text);
      
      // Extraire l'ID du participant du QR code
      const participantId = extractParticipantIdFromQR(result.text);
      
      if (participantId) {
        console.log("ID participant extrait :", participantId);
        onScanSuccess(participantId);
      } else {
        setError("Format de QR code invalide. Veuillez scanner un QR code valide.");
      }
    }
  };

  const handleError = (err: any) => {
    console.error("Erreur de scan QR :", err);
    setError("Erreur lors de l'accès à la caméra. Veuillez vérifier les permissions.");
  };

  const resetScanner = () => {
    setError(null);
    setResult(null);
    setScanning(true);
  };

  return (
    <div className="flex flex-col items-center w-full">
      {scanning ? (
        <>
          <div className="w-full max-w-sm mb-4 overflow-hidden rounded-lg">
            <QrReader
              constraints={{ facingMode: "environment" }}
              onResult={handleScan}
              videoStyle={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover' 
              }}
              videoContainerStyle={{
                width: '100%',
                paddingTop: '100%', // Aspect ratio 1:1
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '0.5rem',
                border: '2px solid #e2e8f0'
              }}
              videoId="qr-video"
              scanDelay={300}
            />
          </div>
          <p className="text-sm text-center text-gray-500 mb-4">
            Positionnez le QR code dans le cadre pour le scanner
          </p>
        </>
      ) : result && !error ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4 flex items-start gap-3 w-full max-w-sm">
          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <p className="font-medium text-green-800">QR code scanné avec succès!</p>
            <p className="text-sm text-green-600 break-all">{result}</p>
          </div>
        </div>
      ) : null}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4 flex items-start gap-3 w-full max-w-sm">
          <CircleAlert className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Erreur de scan</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3 w-full max-w-sm">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => navigate("/admin/dashboard")}
        >
          Retour
        </Button>
        {!scanning && (
          <Button 
            className="flex-1"
            onClick={resetScanner}
          >
            Scanner à nouveau
          </Button>
        )}
      </div>
    </div>
  );
}
