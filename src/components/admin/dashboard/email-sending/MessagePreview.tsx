
// Composant de prévisualisation de message pour les emails
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { type Participant } from "@/types/participant";

interface MessagePreviewProps {
  messageType: "personal" | "public";
  message: string;
  participant: Participant;
  onBack: () => void;
}

export function MessagePreview({ 
  messageType, 
  message, 
  participant,
  onBack 
}: MessagePreviewProps) {
  // Remplacer [prénom] par le prénom du participant
  const formattedMessage = message.replace(/\[prénom\]/g, participant.first_name);

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Button variant="outline" size="sm" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h3 className="text-lg font-medium">
          Prévisualisation du message {messageType === "personal" ? "personnel" : "public"}
        </h3>
      </div>

      <Card className="border-dashed">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-center text-xl">
            Merci pour votre participation à l'IFTAR 2025
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 prose-sm max-w-none">
          <div className="mb-4">
            <p className="font-medium">Cher(e) {participant.first_name} {participant.last_name},</p>
          </div>
          
          {messageType === "personal" ? (
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
              <h4 className="text-blue-800 font-medium mb-2">Message personnel</h4>
              <div className="whitespace-pre-wrap">{formattedMessage}</div>
            </div>
          ) : (
            <div className="bg-green-50 p-3 rounded-md border border-green-100 mb-4">
              <h4 className="text-green-800 font-medium mb-2">Message à tous les participants</h4>
              <div className="whitespace-pre-wrap">{formattedMessage}</div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/30 px-6 py-4">
          <div className="text-sm text-center w-full">
            <p>Que Allah accepte nos prières et nos actes d'adoration.</p>
            <p className="mt-2">Cordialement,<br />L'équipe organisatrice de l'IFTAR 2025</p>
          </div>
        </CardFooter>
      </Card>

      <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-sm">
        <p className="text-amber-800">
          <span className="font-medium">Note:</span> Ceci est une prévisualisation simplifié. 
          Le rendu final de l'email peut légèrement différer selon le client mail du destinataire.
        </p>
      </div>
    </div>
  );
}
