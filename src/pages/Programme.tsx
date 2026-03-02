import React from "react";
import jsPDF from "jspdf";
import { Download } from "lucide-react";

interface ProgramItem {
  debut: string;
  fin: string;
  heure: string;
  duree: string;
  rubrique: string;
  highlight?: boolean;
}

const PROGRAMME: ProgramItem[] = [
  { debut: "16:15", fin: "16:20", heure: "16:15 - 16:20", duree: "5 min", rubrique: "Mot de bienvenue et dispositions pratiques", highlight: false },
  { debut: "16:30", fin: "18:00", heure: "16:30 - 18:00", duree: "1h 30min", rubrique: "Conférence — Imam Cheick Ahmad Tidiane DIABATE", highlight: true },
  { debut: "18:00", fin: "18:25", heure: "18:00 - 18:25", duree: "25 min", rubrique: "Séance de Zikr", highlight: false },
  { debut: "18:29", fin: "18:45", heure: "18:29 - 18:45", duree: "16 min", rubrique: "Iftar + Prière de Maghrib", highlight: true },
  { debut: "18:50", fin: "19:00", heure: "18:50 - 19:00", duree: "10 min", rubrique: "Démonstration de lecture coranique", highlight: false },
  { debut: "19:05", fin: "19:10", heure: "19:05 - 19:10", duree: "5 min", rubrique: "Discours du DEX", highlight: false },
  { debut: "19:11", fin: "19:18", heure: "19:11 - 19:18", duree: "7 min", rubrique: "Discours du PCA", highlight: false },
  { debut: "19:15", fin: "19:22", heure: "19:15 - 19:22", duree: "7 min", rubrique: "Discours du Parrain — Tidiane KABA DIAKITE", highlight: false },
  { debut: "19:23", fin: "19:28", heure: "19:23 - 19:28", duree: "5 min", rubrique: "Projection du film — Projet Parrainage", highlight: false },
  { debut: "19:30", fin: "19:40", heure: "19:30 - 19:40", duree: "10 min", rubrique: "Communication du Cheikoul", highlight: false },
  { debut: "19:40", fin: "20:20", heure: "19:40 - 20:20", duree: "40 min", rubrique: "Salat Ichai et Tarawih", highlight: true },
  { debut: "20:20", fin: "21:00", heure: "20:20 - 21:00", duree: "40 min", rubrique: "Dîner + Activité artistique ou culturelle", highlight: true },
  { debut: "20:40", fin: "20:40", heure: "20:40", duree: "-", rubrique: "Douah de clôture", highlight: false },
];

export default function Programme() {
  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = 210;
    const margin = 20;
    const contentW = pageW - margin * 2;
    let y = 0;

    // En-tête simple sans bloc plein
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Bismillahi Rahmani Rahim", pageW / 2, 20, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(7, 85, 59); // Vert Citadelle
    doc.text("PROGRAMME OFFICIEL - IFTAR 2026", pageW / 2, 30, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text("Dimanche 8 Mars 2026  |  NOOM Hotel Abidjan Plateau", pageW / 2, 38, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Parrain : Tidiane KABA DIAKITE", pageW / 2, 43, { align: "center" });
    doc.text("Directeur du Domaine, de la Conservation Fonciere, de l'Enregistrement et du Timbre - DGI", pageW / 2, 48, { align: "center", maxWidth: contentW });

    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(10);
    doc.setTextColor(7, 85, 59);
    doc.text(
      "« Le Coran : Parole increee, source de guidance divine et de repere pour l'humanite »",
      pageW / 2,
      58,
      { align: "center", maxWidth: contentW }
    );

    y = 70;
    
    // Ligne au-dessus du tableau
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentW, y);
    y += 8;

    // En-tête du tableau (Texte simple)
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("HORAIRES", margin + 2, y);
    doc.text("DURÉE", margin + 35, y);
    doc.text("RUBRIQUE", margin + 60, y);

    y += 4;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, margin + contentW, y);
    y += 8;

    // Lignes du tableau
    PROGRAMME.forEach((item) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }

      const isHighlight = item.highlight;
      
      // Fond très léger pour le highlight (Gris très clair, PAS NOIR)
      if (isHighlight) {
        doc.setFillColor(248, 248, 248);
        doc.rect(margin, y - 6, contentW, 10, "F");
      }

      // Toujours écrire en noir ou gris foncé
      doc.setTextColor(isHighlight ? 0 : 50, isHighlight ? 0 : 50, isHighlight ? 0 : 50);
      
      // Horaires
      doc.setFont("helvetica", isHighlight ? "bold" : "normal");
      doc.setFontSize(9);
      doc.text(item.heure, margin + 2, y);

      // Durée
      doc.setFont("helvetica", "normal");
      doc.text(item.duree, margin + 35, y);

      // Rubrique
      doc.setFont("helvetica", isHighlight ? "bold" : "normal");
      
      // Si c'est un item important, on le met en vert Citadelle
      if (isHighlight) {
        doc.setTextColor(7, 85, 59);
      }
      
      const lines = doc.splitTextToSize(item.rubrique, contentW - 60);
      doc.text(lines, margin + 60, y);

      y += (7 * lines.length);
      
      // Ligne de séparation très fine
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.1);
      doc.line(margin, y - 3, margin + contentW, y - 3);
      
      y += 3;
    });

    // Pied de page
    y += 10;
    doc.setFont("helvetica", "none");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Association LA CITADELLE — IFTAR 2026", pageW / 2, y, { align: "center" });

    doc.save("Programme-IFTAR-2026.pdf");
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] rounded-xl p-8 md:p-12 mb-10">
        
        {/* Entête */}
        <div className="text-center mb-10 pb-8 border-b border-gray-100">
          <p className="text-sm font-serif italic text-gray-500 mb-4">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          <h1 className="text-3xl font-bold text-[#07553B] uppercase tracking-wide mb-2">Programme Officiel — Iftar 2026</h1>
          <p className="text-gray-500 font-medium mb-6">Dimanche 8 Mars 2026 • NOOM Hôtel Abidjan Plateau</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-6 text-sm">
            <div className="text-left">
              <p className="text-gray-400 uppercase tracking-wider text-xs font-semibold mb-1">Conférencier</p>
              <p className="font-bold text-[#07553B]">Imam Cheick Ahmad Tidiane DIABATE</p>
            </div>
            <div className="hidden sm:block w-px bg-gray-200 self-stretch"></div>
            <div className="text-left">
              <p className="text-gray-400 uppercase tracking-wider text-xs font-semibold mb-1">Parrain</p>
              <p className="font-bold text-[#07553B]">Tidiane KABA DIAKITE</p>
              <p className="text-gray-500 text-xs max-w-xs">Directeur du Domaine, de la Conservation Foncière, de l'Enregistrement et du Timbre à la DGI</p>
            </div>
          </div>
          
          <div className="inline-block bg-gray-50 border border-gray-100 px-6 py-3 rounded-lg">
            <p className="text-[#07553B] font-semibold italic">
              « Le Coran : Parole incréée, source de guidance divine et de repère pour l'humanité »
            </p>
          </div>
        </div>

        {/* Bouton Télécharger */}
        <div className="flex justify-end mb-6">
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-[#07553B] hover:bg-[#06422d] text-white px-5 py-2 rounded font-medium transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Télécharger le programme (PDF)
          </button>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[140px]">Horaires</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[100px]">Durée</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rubrique</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PROGRAMME.map((item, index) => (
                <tr key={index} className={`transition-colors ${item.highlight ? 'bg-gray-50/80' : 'hover:bg-gray-50/50'}`}>
                  <td className="py-3.5 px-4">
                    <span className={`text-sm ${item.highlight ? 'font-bold text-[#07553B]' : 'text-gray-600'}`}>
                      {item.heure}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-gray-500">
                    {item.duree}
                  </td>
                  <td className={`py-3.5 px-4 text-sm md:text-base ${item.highlight ? 'font-bold text-[#07553B]' : 'text-gray-800'}`}>
                    {item.rubrique}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
