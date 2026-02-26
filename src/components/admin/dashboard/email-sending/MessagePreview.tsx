
// Composant de prévisualisation de message pour les emails
// Mise à jour: Correction du formatage des variables dynamiques {{prenom}} et {{nom}}
// Mise à jour: Uniformisation du formatage entre la prévisualisation et l'envoi réel

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

/**
 * Formate les variables dynamiques dans un message
 */
const formatMessage = (message: string, participant: Participant): string => {
  if (!message) return "";
  
  return message
    .replace(/\{\{prenom\}\}/g, participant.first_name)
    .replace(/\{\{nom\}\}/g, participant.last_name)
    .replace(/\{\{participant_name\}\}/g, `${participant.first_name} ${participant.last_name}`)
    .replace(/\{\{event_location\}\}/g, "NOOM HOTEL ABIDJAN PLATEAU")
    .replace(/\{\{event_address\}\}/g, "8XFG+9H3, Boulevard de Gaulle, BP 7393, Abidjan")
    .replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString('fr-FR'));
};

export function MessagePreview({ 
  messageType, 
  message, 
  participant,
  onBack 
}: MessagePreviewProps) {
  // Remplacer {{prenom}} et {{nom}} par les valeurs du participant
  const formattedMessage = formatMessage(message, participant);

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
            Assalam Aleykoum — IFTAR 2026
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
            <p>Qu'Allah accepte nos prières et nos actes d'adoration. Ramadan Moubarak 🌙</p>
            <p className="mt-2">Assalam Aleykoum wa rahmatoullahi wa barakatouhou,<br />L'équipe organisatrice de l'IFTAR 2026 — Association LA CITADELLE</p>
          </div>
        </CardFooter>
      </Card>

      <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-sm">
        <p className="text-amber-800">
          <span className="font-medium">Note:</span> Ceci est une prévisualisation simplifiée. 
          Le rendu final de l'email suit le format HTML demandé et peut légèrement différer selon le client mail du destinataire.
        </p>
      </div>
    </div>
  );
}
