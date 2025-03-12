
// Composant affichant la progression de l'envoi des emails
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface SendingProgressProps {
  total: number;
  sent: number;
  failed: number;
}

export function SendingProgress({ total, sent, failed }: SendingProgressProps) {
  const progress = total > 0 ? Math.round(((sent + failed) / total) * 100) : 0;
  
  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col items-center justify-center text-center space-y-2">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h3 className="text-xl font-medium mt-2">Envoi des emails en cours</h3>
        <p className="text-muted-foreground">
          Veuillez patienter pendant l'envoi des emails...
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{sent + failed} sur {total} emails traités</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-2 rounded bg-blue-50 border border-blue-100">
          <div className="text-2xl font-bold text-blue-700">{total}</div>
          <div className="text-xs text-blue-800">Total</div>
        </div>
        <div className="p-2 rounded bg-green-50 border border-green-100">
          <div className="text-2xl font-bold text-green-600">{sent}</div>
          <div className="text-xs text-green-700">Envoyés</div>
        </div>
        <div className="p-2 rounded bg-red-50 border border-red-100">
          <div className="text-2xl font-bold text-red-600">{failed}</div>
          <div className="text-xs text-red-700">Échoués</div>
        </div>
      </div>

      {failed > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-amber-800 text-sm">
            Certains emails n'ont pas pu être envoyés. Vous pourrez réessayer ultérieurement.
          </p>
        </div>
      )}

      {progress === 100 && (
        <div className="p-3 bg-green-50 border border-green-100 rounded-md">
          <p className="text-green-800 text-sm font-medium text-center">
            Traitement terminé ! {sent} email(s) envoyé(s) avec succès.
          </p>
        </div>
      )}
    </div>
  );
}
