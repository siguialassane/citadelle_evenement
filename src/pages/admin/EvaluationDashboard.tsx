import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Star, MessageSquare, RefreshCw, ThumbsUp, Users, Download } from "lucide-react";
import { Header } from "@/components/admin/dashboard/Header";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface Evaluation {
  id: string;
  created_at: string;
  note_globale: string | null;
  note_lieu: string | null;
  commentaire_lieu: string | null;
  note_contenu: string | null;
  commentaire_contenu: string | null;
  note_animateurs: string | null;
  commentaire_animateurs: string | null;
  note_timing: string | null;
  commentaire_timing: string | null;
  moment_apprecie: string | null;
  ce_qui_a_manque: string | null;
  animateur_apprecie: string | null;
  autres_remarques: string | null;
  renouveler: boolean | null;
  frequence: string | null;
}

// Mapping string → valeur numérique pour les calculs
const NOTE_TO_NUM: Record<string, number> = {
  mauvais: 1,
  passable: 2,
  bon: 3,
  excellent: 4,
};

const NOTE_STYLES: Record<string, { label: string; color: string }> = {
  mauvais:  { label: "Mauvais",    color: "bg-red-100 text-red-700 border-red-200" },
  passable: { label: "Passable",   color: "bg-amber-100 text-amber-700 border-amber-200" },
  bon:      { label: "Bon",        color: "bg-green-100 text-green-700 border-green-200" },
  excellent:{ label: "Excellent",  color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

const NoteBadge = ({ note }: { note: string | null }) => {
  if (!note) return <span className="text-gray-400 text-sm">—</span>;
  const style = NOTE_STYLES[note.toLowerCase()] || { label: note, color: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style.color}`}>
      {style.label}
    </span>
  );
};

// Calcule la moyenne numérique et retourne un label textuel
const avgLabel = (values: (string | null)[]): string => {
  const valid = values.filter((v): v is string => v !== null && v in NOTE_TO_NUM);
  if (!valid.length) return "—";
  const sum = valid.reduce((a, b) => a + NOTE_TO_NUM[b], 0);
  const mean = sum / valid.length;
  if (mean >= 3.5) return "Excellent";
  if (mean >= 2.5) return "Bon";
  if (mean >= 1.5) return "Passable";
  return "Mauvais";
};

// Calcule le score moyen sur 4
const avgScore = (values: (string | null)[]): string => {
  const valid = values.filter((v): v is string => v !== null && v in NOTE_TO_NUM);
  if (!valid.length) return "—";
  const sum = valid.reduce((a, b) => a + NOTE_TO_NUM[b], 0);
  return (sum / valid.length).toFixed(1);
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
  const moyenneGlobale = avgLabel(evaluations.map(e => e.note_globale));
  const scoreGlobale = avgScore(evaluations.map(e => e.note_globale));
  const moyenneLieu = avgLabel(evaluations.map(e => e.note_lieu));
  const scoreLieu = avgScore(evaluations.map(e => e.note_lieu));
  const moyenneContenu = avgLabel(evaluations.map(e => e.note_contenu));
  const scoreContenu = avgScore(evaluations.map(e => e.note_contenu));
  const moyenneAnimateurs = avgLabel(evaluations.map(e => e.note_animateurs));
  const scoreAnimateurs = avgScore(evaluations.map(e => e.note_animateurs));
  const moyenneTiming = avgLabel(evaluations.map(e => e.note_timing));
  const scoreTiming = avgScore(evaluations.map(e => e.note_timing));

  const exportPDF = () => {
    const doc = new jsPDF();
    const dateExport = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    // En-tête
    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Rapport des Évaluations", 14, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Généré le ${dateExport} — ${evaluations.length} réponse(s)`, 14, 21);

    // Statistiques globales
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Statistiques globales", 14, 38);

    autoTable(doc, {
      startY: 42,
      head: [["Critère", "Note moyenne", "Score /4", "Souhaitent renouveler"]],
      body: [
        ["Note globale",   moyenneGlobale,   scoreGlobale,   `${evaluations.length > 0 ? Math.round((renouvelerOui / evaluations.length) * 100) : 0}% (${renouvelerOui}/${evaluations.length})`],
        ["Lieu",           moyenneLieu,       scoreLieu,      ""],
        ["Contenu",        moyenneContenu,    scoreContenu,   ""],
        ["Animateurs",     moyenneAnimateurs, scoreAnimateurs,""],
        ["Timing",         moyenneTiming,     scoreTiming,    ""],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [13, 148, 136], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 253, 250] },
      columnStyles: { 3: { cellWidth: 55 } },
    });

    // Tableau des évaluations
    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Détail des évaluations", 14, finalY + 10);

    autoTable(doc, {
      startY: finalY + 14,
      head: [["Date", "Globale", "Lieu", "Contenu", "Animateurs", "Timing", "Renouveler", "Fréquence"]],
      body: evaluations.map(ev => [
        new Date(ev.created_at).toLocaleDateString("fr-FR"),
        ev.note_globale || "—",
        ev.note_lieu || "—",
        ev.note_contenu || "—",
        ev.note_animateurs || "—",
        ev.note_timing || "—",
        ev.renouveler === null ? "—" : ev.renouveler ? "Oui" : "Non",
        ev.frequence || "—",
      ]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [13, 148, 136], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    // Commentaires & remarques
    const evalAvecRemarques = evaluations.filter(ev =>
      ev.moment_apprecie || ev.ce_qui_a_manque || ev.animateur_apprecie || ev.autres_remarques
    );
    if (evalAvecRemarques.length > 0) {
      const y2 = (doc as any).lastAutoTable?.finalY || 180;
      doc.addPage();
      doc.setFillColor(13, 148, 136);
      doc.rect(0, 0, 210, 16, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Commentaires & Remarques", 14, 11);
      doc.setTextColor(30, 30, 30);

      autoTable(doc, {
        startY: 22,
        head: [["Date", "Moment apprécié", "Ce qui a manqué", "Animateur apprécié", "Autres remarques"]],
        body: evalAvecRemarques.map(ev => [
          new Date(ev.created_at).toLocaleDateString("fr-FR"),
          ev.moment_apprecie || "—",
          ev.ce_qui_a_manque || "—",
          ev.animateur_apprecie || "—",
          ev.autres_remarques || "—",
        ]),
        styles: { fontSize: 7.5, cellPadding: 2.5, overflow: "linebreak" },
        headStyles: { fillColor: [13, 148, 136], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          1: { cellWidth: 38 }, 2: { cellWidth: 38 },
          3: { cellWidth: 38 }, 4: { cellWidth: 45 },
        },
      });
    }

    doc.save(`evaluations-${new Date().toISOString().split("T")[0]}.pdf`);
    toast({ title: "PDF exporté avec succès !" });
  };

  const exportExcel = () => {
    const dateExport = new Date().toISOString().split("T")[0];

    // Feuille 1 : données complètes
    const wsData = evaluations.map(ev => ({
      "Date": new Date(ev.created_at).toLocaleDateString("fr-FR"),
      "Note globale": ev.note_globale || "",
      "Note lieu": ev.note_lieu || "",
      "Commentaire lieu": ev.commentaire_lieu || "",
      "Note contenu": ev.note_contenu || "",
      "Commentaire contenu": ev.commentaire_contenu || "",
      "Note animateurs": ev.note_animateurs || "",
      "Commentaire animateurs": ev.commentaire_animateurs || "",
      "Note timing": ev.note_timing || "",
      "Commentaire timing": ev.commentaire_timing || "",
      "Moment apprécié": ev.moment_apprecie || "",
      "Ce qui a manqué": ev.ce_qui_a_manque || "",
      "Animateur apprécié": ev.animateur_apprecie || "",
      "Autres remarques": ev.autres_remarques || "",
      "Renouveler": ev.renouveler === null ? "" : ev.renouveler ? "Oui" : "Non",
      "Fréquence": ev.frequence || "",
    }));

    // Feuille 2 : statistiques
    const wsStats = [
      { "Critère": "Note globale",   "Moyenne": moyenneGlobale,   "Score /4": scoreGlobale },
      { "Critère": "Lieu",           "Moyenne": moyenneLieu,       "Score /4": scoreLieu },
      { "Critère": "Contenu",        "Moyenne": moyenneContenu,    "Score /4": scoreContenu },
      { "Critère": "Animateurs",     "Moyenne": moyenneAnimateurs, "Score /4": scoreAnimateurs },
      { "Critère": "Timing",         "Moyenne": moyenneTiming,     "Score /4": scoreTiming },
      {},
      { "Critère": "Total réponses",  "Moyenne": String(evaluations.length) },
      { "Critère": "Souhaitent renouveler", "Moyenne": `${evaluations.length > 0 ? Math.round((renouvelerOui / evaluations.length) * 100) : 0}% (${renouvelerOui}/${evaluations.length})` },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wsData), "Évaluations");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wsStats), "Statistiques");

    XLSX.writeFile(wb, `evaluations-${dateExport}.xlsx`);
    toast({ title: "Excel exporté avec succès !" });
  };

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
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={fetchEvaluations} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
            <Button size="sm" onClick={exportPDF} disabled={evaluations.length === 0} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white">
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button size="sm" onClick={exportExcel} disabled={evaluations.length === 0} variant="outline" className="flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50">
              <Download className="h-4 w-4" />
              Excel
            </Button>
          </div>
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
              <p className="text-lg font-bold text-yellow-600">{moyenneGlobale}</p>
              <p className="text-xs text-gray-400">{scoreGlobale}/4</p>
              <p className="text-xs text-gray-500 mt-1">Note globale</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-lg font-bold text-blue-600">{moyenneLieu}</p>
              <p className="text-xs text-gray-400">{scoreLieu}/4</p>
              <p className="text-xs text-gray-500 mt-1">Lieu</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-lg font-bold text-purple-600">{moyenneContenu}</p>
              <p className="text-xs text-gray-400">{scoreContenu}/4</p>
              <p className="text-xs text-gray-500 mt-1">Contenu</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-lg font-bold text-indigo-600">{moyenneAnimateurs}</p>
              <p className="text-xs text-gray-400">{scoreAnimateurs}/4</p>
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
