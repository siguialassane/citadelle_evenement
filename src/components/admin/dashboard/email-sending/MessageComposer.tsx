
// Composant d'édition de message pour les emails
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Type } from "lucide-react";

interface MessageComposerProps {
  messageType: "personal" | "public";
  value: string;
  onChange: (value: string) => void;
  onPreview: () => void;
  previewDisabled: boolean;
}

export function MessageComposer({ 
  messageType, 
  value, 
  onChange, 
  onPreview,
  previewDisabled
}: MessageComposerProps) {
  // Quelques modèles de messages prédéfinis
  const messageTemplates = {
    personal: [
      "Cher(e) [nom] [prénom], nous tenons à vous remercier personnellement pour votre participation à l'IFTAR 2025. Votre présence a contribué au succès de cet événement.",
      "Cher(e) [nom] [prénom], c'est avec une grande joie que nous avons pu vous accueillir à l'IFTAR 2025. Merci pour votre participation qui a rendu cet événement spécial."
    ],
    public: [
      "Chers participants, nous tenons à vous remercier chaleureusement pour votre présence à l'IFTAR 2025. Cet événement a été un succès grâce à vous tous.",
      "Chers frères et sœurs, c'est avec gratitude que nous vous remercions d'avoir participé à notre IFTAR 2025. Votre présence a fait de cet événement un moment mémorable."
    ]
  };

  const handleTemplateClick = (template: string) => {
    onChange(template);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="message">
            {messageType === "personal" ? "Message personnel" : "Message public"}
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
