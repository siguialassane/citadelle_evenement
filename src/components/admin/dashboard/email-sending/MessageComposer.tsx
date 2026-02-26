
// Composant d'édition de message pour les emails
// Mise à jour: Correction du formatage des variables dynamiques [prénom] et [nom]
// Mise à jour: Ajout d'information sur les variables disponibles
// Mise à jour: Modification du texte du modèle 3

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Eye, Type, Send, InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MessageComposerProps {
  messageType: "personal" | "public";
  value: string;
  onChange: (value: string) => void;
  onPreview: () => void;
  onSend?: () => void;
  previewDisabled: boolean;
  sendDisabled?: boolean;
}

export function MessageComposer({ 
  messageType, 
  value, 
  onChange, 
  onPreview,
  onSend,
  previewDisabled,
  sendDisabled = false
}: MessageComposerProps) {
  // Quelques modèles de messages prédéfinis
  const messageTemplates = {
    personal: [
      "Assalam Aleykoum {{prenom}} {{nom}}, que la paix et les bénédictions d'Allah soient sur vous. Nous vous remercions chaleureusement pour votre présence à l'IFTAR 2026. Votre participation a rendu cet événement encore plus spécial.",
      "Assalam Aleykoum {{prenom}} {{nom}}, c'est avec joie et gratitude que nous vous remercions d'avoir partagé ce moment de rupture du jeûne avec nous lors de l'IFTAR 2026. Qu'Allah accepte vos bonnes actions.",
      "Assalam Aleykoum {{prenom}} {{nom}},\nSuite à votre intérêt pour notre association, nous souhaitons vous inviter officiellement à rejoindre LA CITADELLE en tant que membre actif. Qu'Allah guide nos pas."
    ],
    public: [
      "Assalam Aleykoum chers frères et sœurs, nous vous remercions du fond du cœur pour votre présence à l'IFTAR 2026. Qu'Allah récompense chacun d'entre vous pour sa participation et sénisse cet événement.",
      "Assalam Aleykoum chers frères et sœurs, c'est avec gratitude et émotion que nous vous remercions d'avoir rompu le jeûne ensemble lors de notre IFTAR 2026. Votre présence a été un don précieux. Qu'Allah nous réunisse à nouveau."
    ]
  };

  const handleTemplateClick = (template: string) => {
    onChange(template);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">
            {messageType === "personal" ? "Message personnel" : "Message public"}
          </h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <div className="space-y-2 p-1">
                  <p className="font-semibold">Variables disponibles:</p>
                  <ul className="text-xs space-y-1 list-disc pl-4">
                    <li><code>{'{{prenom}}'}</code> - Prénom du participant</li>
                    <li><code>{'{{nom}}'}</code> - Nom du participant</li>
                    <li><code>{'{{participant_name}}'}</code> - Nom complet</li>
                    <li><code>{'{{event_location}}'}</code> - Lieu de l'événement</li>
                    <li><code>{'{{event_address}}'}</code> - Adresse de l'événement</li>
                    <li><code>{'{{current_date}}'}</code> - Date actuelle</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {onSend && (
          <Button
            onClick={onSend}
            disabled={sendDisabled || !value.trim()}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Send className="h-4 w-4 mr-2" />
            {messageType === "personal" ? "Envoyer Emails Personnalisés" : "Envoyer Email Public"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="message">
            Votre message
          </Label>
          <Textarea
            id="message"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={messageType === "personal" 
              ? "Saisissez votre message personnel pour les participants sélectionnés..." 
              : "Saisissez votre message public pour tous les participants sélectionnés..."}
            className="min-h-[150px] resize-y"
          />
        </div>

        <div>
          <Label className="text-sm text-muted-foreground">Modèles de messages</Label>
          <div className="mt-1 space-y-2">
            {messageTemplates[messageType].map((template, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="mr-2 text-xs"
                onClick={() => handleTemplateClick(template)}
              >
                <Type className="h-3 w-3 mr-1" />
                Modèle {index + 1}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={onPreview}
            disabled={previewDisabled || !value.trim()}
            className="flex items-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            Prévisualiser
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
