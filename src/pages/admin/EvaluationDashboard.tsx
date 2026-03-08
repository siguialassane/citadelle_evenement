import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Star, MessageSquare, RefreshCw, ThumbsUp, Users } from "lucide-react";
import { Header } from "@/components/admin/dashboard/Header";

interface Evaluation {
  id: string;
  created_at: string;
  note_globale: number;
  note_lieu: number | null;
  commentaire_lieu: string | null;
  note_contenu: number | null;
  commentaire_contenu: string | null;
  note_animateurs: number | null;
  commentaire_animateurs: string | null;
  note_timing: number | null;
  commentaire_timing: string | null;
  moment_apprecie: string | null;
  ce_qui_a_manque: string | null;
  animateur_apprecie: string | null;
  autres_remarques: string | null;
  renouveler: boolean | null;
  frequence: string | null;
}

const NOTE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Insuffisant", color: "bg-red-100 text-red-700 border-red-200" },
  2: { label: "Passable",    color: "bg-amber-100 text-amber-700 border-amber-200" },
  3: { label: "Bien",        color: "bg-green-100 text-green-700 border-green-200" },
  4: { label: "Excellent",   color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

const NoteBadge = ({ note }: { note: number | null }) => {
  if (!note) return <span className="text-gray-400 text-sm">—</span>;
  const { label, color } = NOTE_LABELS[note] || { label: String(note), color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {label}
    </span>
  );
};

const avg = (values: (number | null)[]): string => {
  const valid = values.filter((v): v is number => v !== null);
  if (!valid.length) return "—";
  return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);
};

export default function EvaluationDashboard() {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Evaluation | null>(null);

  useEffect(() => {
    const isAdmin = localStorage.getItem("adminAuth") === "true";
    if (!isAdmin) {
      toast({ title: "Accès non autorisé", variant: "destructive" });
      navigate("/admin/login");
      return;
    }
    fetchEvaluations();
  }, [navigate]);

  const fetchEvaluations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase.from as any)("evaluations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setEvaluations(data || []);
    } catch (error) {
      toast({ title: "Erreur de chargement", description: "Impossible de charger les évaluations.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    navigate("/admin/login");
  };

  const renouvelerOui = evaluations.filter(e => e.renouveler === true).length;
  const moyenneGlobale = avg(evaluations.map(e => e.note_globale));
  const moyenneLieu = avg(evaluations.map(e => e.note_lieu));
  const moyenneContenu = avg(evaluations.map(e => e.note_contenu));
  const moyenneAnimateurs = avg(evaluations.map(e => e.note_animateurs));
  const moyenneTiming = avg(evaluations.map(e => e.note_timing));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={handleLogout} />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Titre + bouton retour */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/dashboard")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Évaluations</h1>
          <Button variant="outline" size="sm" onClick={fetchEvaluations} className="flex items-center gap-2 ml-auto">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3 text-center">
              <div className="flex justify-center mb-1">
                <MessageSquare className="h-5 w-5 text-teal-600" />
              </div>
              <p className="text-2xl font-bold text-teal-700">{evaluations.length}</p>
              <p className="text-xs text-gray-500 mt-1">Réponses</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3 text-center">
              <div className="flex justify-center mb-1">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">{moyenneGlobale}</p>
              <p className="text-xs text-gray-500 mt-1">Note globale</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{moyenneLieu}</p>
              <p className="text-xs text-gray-500 mt-1">Lieu</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{moyenneContenu}</p>
              <p className="text-xs text-gray-500 mt-1">Contenu</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-indigo-600">{moyenneAnimateurs}</p>
              <p className="text-xs text-gray-500 mt-1">Animateurs</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3 text-center">
              <div className="flex justify-center mb-1">
                <ThumbsUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                {evaluations.length > 0 ? Math.round((renouvelerOui / evaluations.length) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Souhaitent renouveler</p>
            </CardContent>
          </Card>
        </div>

        {/* Tableau */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" />
              Liste des évaluations ({evaluations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">Chargement...</div>
            ) : evaluations.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Aucune évaluation reçue pour le moment.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Globale</TableHead>
                      <TableHead className="text-xs">Lieu</TableHead>
                      <TableHead className="text-xs">Contenu</TableHead>
                      <TableHead className="text-xs">Animateurs</TableHead>
                      <TableHead className="text-xs">Timing</TableHead>
                      <TableHead className="text-xs">Renouveler</TableHead>
                      <TableHead className="text-xs">Fréquence</TableHead>
                      <TableHead className="text-xs text-right">Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluations.map((ev) => (
                      <TableRow key={ev.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(ev)}>
                        <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(ev.created_at).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell><NoteBadge note={ev.note_globale} /></TableCell>
                        <TableCell><NoteBadge note={ev.note_lieu} /></TableCell>
                        <TableCell><NoteBadge note={ev.note_contenu} /></TableCell>
                        <TableCell><NoteBadge note={ev.note_animateurs} /></TableCell>
                        <TableCell><NoteBadge note={ev.note_timing} /></TableCell>
                        <TableCell>
                          {ev.renouveler === null ? (
                            <span className="text-gray-400 text-xs">—</span>
                          ) : ev.renouveler ? (
                            <Badge className="bg-green-100 text-green-700 border border-green-200 text-xs font-normal">Oui</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border border-red-200 text-xs font-normal">Non</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">{ev.frequence || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={(e) => { e.stopPropagation(); setSelected(ev); }}>
                            Voir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal détails */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-teal-700">
              Détail de l'évaluation du {selected ? new Date(selected.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : ""}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-5 pt-2">
              {/* Notes */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Notes</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Note globale",  value: selected.note_globale },
                    { label: "Lieu",          value: selected.note_lieu },
                    { label: "Contenu",       value: selected.note_contenu },
                    { label: "Animateurs",    value: selected.note_animateurs },
                    { label: "Timing",        value: selected.note_timing },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-600">{label}</span>
                      <NoteBadge note={value} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Commentaires */}
              {[
                { label: "Commentaire lieu",       value: selected.commentaire_lieu },
                { label: "Commentaire contenu",    value: selected.commentaire_contenu },
                { label: "Commentaire animateurs", value: selected.commentaire_animateurs },
                { label: "Commentaire timing",     value: selected.commentaire_timing },
              ].some(c => c.value) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Commentaires</h3>
                  <div className="space-y-2">
                    {[
                      { label: "Lieu",       value: selected.commentaire_lieu },
                      { label: "Contenu",    value: selected.commentaire_contenu },
                      { label: "Animateurs", value: selected.commentaire_animateurs },
                      { label: "Timing",     value: selected.commentaire_timing },
                    ].filter(c => c.value).map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
                        <p className="text-sm text-gray-800">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observations libres */}
              {[
                { label: "Moment le plus apprécié",   value: selected.moment_apprecie },
                { label: "Ce qui a manqué",            value: selected.ce_qui_a_manque },
                { label: "Animateur apprécié",         value: selected.animateur_apprecie },
                { label: "Autres remarques",           value: selected.autres_remarques },
              ].some(o => o.value) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Observations</h3>
                  <div className="space-y-2">
                    {[
                      { label: "Moment le plus apprécié",   value: selected.moment_apprecie },
                      { label: "Ce qui a manqué",            value: selected.ce_qui_a_manque },
                      { label: "Animateur apprécié",         value: selected.animateur_apprecie },
                      { label: "Autres remarques",           value: selected.autres_remarques },
                    ].filter(o => o.value).map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
                        <p className="text-sm text-gray-800">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Renouveler */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-600 font-medium">Souhaite renouveler l'événement</span>
                {selected.renouveler === null ? (
                  <span className="text-gray-400 text-sm">—</span>
                ) : selected.renouveler ? (
                  <Badge className="bg-green-100 text-green-700 border border-green-200">Oui</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 border border-red-200">Non</Badge>
                )}
              </div>

              {selected.frequence && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-600 font-medium">Fréquence souhaitée</span>
                  <span className="text-sm font-semibold text-teal-700">{selected.frequence}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
