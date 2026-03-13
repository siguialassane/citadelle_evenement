import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Send, RefreshCw, Mail, CheckCircle, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/admin/dashboard/Header";
import { sendEvaluationEmailBatch } from "@/components/manual-payment/services/emails/evaluationEmailService";

interface ParticipantEmail {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  evaluation_email_sent_at: string | null;
}

export default function EvaluationEmailDashboard() {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<ParticipantEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState({ sent: 0, failed: 0, current: 0, total: 0, lastError: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    const isAdmin = localStorage.getItem("adminAuth") === "true";
    if (!isAdmin) {
      toast({ title: "Accès non autorisé", variant: "destructive" });
      navigate("/admin/login");
      return;
    }
    fetchParticipants();
  }, [navigate]);

  const fetchParticipants = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase.from as any)('participants')
        .select('id, first_name, last_name, email, evaluation_email_sent_at')
        .not('email', 'is', null)
        .neq('email', '')
        .order('evaluation_email_sent_at', { ascending: true, nullsFirst: true })
        .order('last_name', { ascending: true });

      if (error) throw error;
      setParticipants(data || []);
    } catch {
      toast({ title: "Erreur", description: "Impossible de récupérer les participants.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const notSent = participants.filter(p => !p.evaluation_email_sent_at);
  const alreadySent = participants.filter(p => p.evaluation_email_sent_at);

  const filterBySearch = (list: ParticipantEmail[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(p =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  };

  const filteredNotSent = filterBySearch(notSent);
  const filteredAlreadySent = filterBySearch(alreadySent);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (list: ParticipantEmail[]) => {
    const allSelected = list.every(p => selectedIds.has(p.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        list.forEach(p => next.delete(p.id));
      } else {
        list.forEach(p => next.add(p.id));
      }
      return next;
    });
  };

  const handleSend = async () => {
    const toSend = participants.filter(p => selectedIds.has(p.id));
    if (toSend.length === 0) {
      toast({ title: "Aucun participant sélectionné", variant: "destructive" });
      return;
    }

    setIsSending(true);
    setProgress({ sent: 0, failed: 0, current: 0, total: toSend.length, lastError: "" });

    const result = await sendEvaluationEmailBatch(toSend, (sent, failed, current, lastError) => {
      setProgress({ sent, failed, current, total: toSend.length, lastError: lastError || "" });
    });

    setIsSending(false);
    setSelectedIds(new Set());

    const description = result.failed > 0
      ? `${result.sent} envoyé(s), ${result.failed} échec(s). ${result.lastError ? `Erreur : ${result.lastError}` : ""}`
      : `${result.sent} envoyé(s) avec succès.`;

    toast({
      title: "Envoi terminé",
      description,
      variant: result.failed > 0 ? "destructive" : "default",
    });

    fetchParticipants();
  };

  const ParticipantRow = ({ p, showSentDate = false }: { p: ParticipantEmail; showSentDate?: boolean }) => (
    <div
      key={p.id}
      className={`flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-gray-50 transition-colors ${selectedIds.has(p.id) ? "bg-green-50" : ""}`}
    >
      <Checkbox
        checked={selectedIds.has(p.id)}
        onCheckedChange={() => toggleSelect(p.id)}
        disabled={isSending}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {p.first_name} {p.last_name}
        </p>
        <p className="text-xs text-gray-500 truncate">{p.email}</p>
      </div>
      {showSentDate && p.evaluation_email_sent_at && (
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {new Date(p.evaluation_email_sent_at).toLocaleDateString("fr-FR")}
        </span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={() => { localStorage.removeItem("adminAuth"); navigate("/admin/login"); }} />

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Entête */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/dashboard")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Envoi email évaluation</h1>
            <p className="text-sm text-gray-500 mt-0.5">Envoyez le lien d'évaluation aux participants par groupes de 5</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchParticipants} disabled={isLoading || isSending} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        {/* Progression pendant l'envoi */}
        {isSending && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 mb-3">
                <Send className="h-5 w-5 text-green-600 animate-pulse" />
                <span className="text-sm font-medium text-green-700">
                  Envoi en cours... {progress.current}/{progress.total}
                </span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-600">
                <span className="text-green-700">{progress.sent} envoyé(s)</span>
                {progress.failed > 0 && <span className="text-red-600">{progress.failed} échec(s)</span>}
              </div>
              {progress.lastError && (
                <p className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                  Dernière erreur : {progress.lastError}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Barre de recherche */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            disabled={isSending}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Liste — pas encore envoyé */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  En attente d'envoi
                  <Badge className="bg-orange-100 text-orange-700 border border-orange-200 font-normal">
                    {search ? `${filteredNotSent.length}/${notSent.length}` : notSent.length}
                  </Badge>
                </CardTitle>
                {filteredNotSent.length > 0 && (
                  <button
                    onClick={() => toggleSelectAll(filteredNotSent)}
                    className="text-xs text-green-600 hover:underline"
                    disabled={isSending}
                  >
                    {filteredNotSent.every(p => selectedIds.has(p.id)) ? "Tout déselectionner" : "Tout sélectionner"}
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="text-center py-10 text-gray-400 text-sm">Chargement...</p>
              ) : notSent.length === 0 ? (
                <p className="text-center py-10 text-gray-400 text-sm">Tous les participants ont été contactés.</p>
              ) : filteredNotSent.length === 0 ? (
                <p className="text-center py-10 text-gray-400 text-sm">Aucun résultat pour « {search} ».</p>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {filteredNotSent.map(p => <ParticipantRow key={p.id} p={p} />)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Liste — déjà envoyé */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Email déjà envoyé
                  <Badge className="bg-green-100 text-green-700 border border-green-200 font-normal">
                    {search ? `${filteredAlreadySent.length}/${alreadySent.length}` : alreadySent.length}
                  </Badge>
                </CardTitle>
                {filteredAlreadySent.length > 0 && (
                  <button
                    onClick={() => toggleSelectAll(filteredAlreadySent)}
                    className="text-xs text-green-600 hover:underline"
                    disabled={isSending}
                  >
                    {filteredAlreadySent.every(p => selectedIds.has(p.id)) ? "Tout déselectionner" : "Re-sélectionner tout"}
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="text-center py-10 text-gray-400 text-sm">Chargement...</p>
              ) : alreadySent.length === 0 ? (
                <p className="text-center py-10 text-gray-400 text-sm">Aucun email envoyé pour l'instant.</p>
              ) : filteredAlreadySent.length === 0 ? (
                <p className="text-center py-10 text-gray-400 text-sm">Aucun résultat pour « {search} ».</p>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {filteredAlreadySent.map(p => <ParticipantRow key={p.id} p={p} showSentDate />)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bouton d'envoi flottant en bas */}
        {selectedIds.size > 0 && !isSending && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <Button
              onClick={handleSend}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 shadow-lg px-6 py-3 text-base"
            >
              <Mail className="h-5 w-5" />
              Envoyer à {selectedIds.size} participant{selectedIds.size > 1 ? "s" : ""}
              <span className="ml-1 text-xs bg-white/20 rounded px-1.5 py-0.5">par groupes de 5</span>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
