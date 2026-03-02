import React, { useRef } from "react";
import jsPDF from "jspdf";

interface ProgramItem {
  debut: string;
  fin: string;
  duree: string;
  rubrique: string;
  icon: string;
  color: string;
  highlight?: boolean;
}

const PROGRAMME: ProgramItem[] = [
  {
    debut: "16:15",
    fin: "16:20",
    duree: "5 min",
    rubrique: "Mot de bienvenue et dispositions pratiques",
    icon: "🤝",
    color: "bg-emerald-50 border-emerald-300",
  },
  {
    debut: "16:30",
    fin: "18:00",
    duree: "1h 30min",
    rubrique: "Conférence — Imam Cheick Ahmad Tidiane DIABATE",
    icon: "🎤",
    color: "bg-green-50 border-green-400",
    highlight: true,
  },
  {
    debut: "18:00",
    fin: "18:25",
    duree: "25 min",
    rubrique: "Séance de Zikr",
    icon: "⭐",
    color: "bg-emerald-50 border-emerald-300",
  },
  {
    debut: "18:29",
    fin: "18:45",
    duree: "16 min",
    rubrique: "Iftar + Prière de Maghrib",
    icon: "🌙",
    color: "bg-amber-50 border-amber-400",
    highlight: true,
  },
  {
    debut: "18:50",
    fin: "19:00",
    duree: "10 min",
    rubrique: "Démonstration de lecture coranique",
    icon: "📖",
    color: "bg-emerald-50 border-emerald-300",
  },
  {
    debut: "19:05",
    fin: "19:10",
    duree: "5 min",
    rubrique: "Discours du DEX",
    icon: "🎙️",
    color: "bg-emerald-50 border-emerald-300",
  },
  {
    debut: "19:11",
    fin: "19:18",
    duree: "7 min",
    rubrique: "Discours du PCA",
    icon: "🎙️",
    color: "bg-emerald-50 border-emerald-300",
  },
  {
    debut: "19:15",
    fin: "19:22",
    duree: "7 min",
    rubrique: "Discours du Parrain",
    icon: "🎙️",
    color: "bg-emerald-50 border-emerald-300",
  },
  {
    debut: "19:23",
    fin: "19:28",
    duree: "5 min",
    rubrique: "Projection du film — Projet Parrainage",
    icon: "🎬",
    color: "bg-emerald-50 border-emerald-300",
  },
  {
    debut: "19:30",
    fin: "19:40",
    duree: "10 min",
    rubrique: "Communication du Cheikoul",
    icon: "📢",
    color: "bg-emerald-50 border-emerald-300",
  },
  {
    debut: "19:40",
    fin: "20:20",
    duree: "40 min",
    rubrique: "Salat Ichai et Tarawih",
    icon: "🙏",
    color: "bg-green-50 border-green-400",
    highlight: true,
  },
  {
    debut: "20:20",
    fin: "21:00",
    duree: "40 min",
    rubrique: "Dîner + Activité artistique ou culturelle",
    icon: "🍽️",
    color: "bg-amber-50 border-amber-400",
    highlight: true,
  },
  {
    debut: "20:40",
    fin: "20:40",
    duree: "",
    rubrique: "Douah de clôture",
    icon: "🤲",
    color: "bg-emerald-50 border-emerald-300",
  },
];

export default function Programme() {
  const programmeRef = useRef<HTMLDivElement>(null);

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = 210;
    const margin = 15;
    const contentW = pageW - margin * 2;
    let y = 0;

    // ---- Background header ----
    doc.setFillColor(7, 85, 59); // #07553B
    doc.rect(0, 0, pageW, 50, "F");

    // Arabic
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("Bismillahi Rahmani Rahim", pageW / 2, 10, { align: "center" });

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("IFTAR 2026 — 15e Edition", pageW / 2, 22, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Programme officiel de la soiree", pageW / 2, 30, { align: "center" });

    // Date / lieu
    doc.setFontSize(10);
    doc.text("Dimanche 8 Mars 2026  |  NOOM Hotel Abidjan Plateau  |  16h00 - 21h00", pageW / 2, 40, { align: "center" });

    // Theme box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, 54, contentW, 14, 3, 3, "F");
    doc.setTextColor(7, 85, 59);
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(9);
    doc.text(
      "\"Le Coran : Parole increee, source de guidance divine et de repere pour l'humanite\"",
      pageW / 2,
      63,
      { align: "center", maxWidth: contentW - 6 }
    );

    y = 76;

    // Column headers
    doc.setFillColor(7, 85, 59);
    doc.rect(margin, y, contentW, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("HORAIRE", margin + 2, y + 5);
    doc.text("DUREE", margin + 36, y + 5);
    doc.text("RUBRIQUE", margin + 58, y + 5);

    y += 9;

    // Table rows
    PROGRAMME.forEach((item, i) => {
      if (y > 270) {
        doc.addPage();
        y = 15;
      }

      const rowH = 9;
      // Alternating background
      if (i % 2 === 0) {
        doc.setFillColor(240, 249, 244); // light green
      } else {
        doc.setFillColor(255, 255, 255);
      }

      // Highlight rows
      if (item.highlight) {
        doc.setFillColor(7, 85, 59, 0.08); // subtle green tint
        doc.setFillColor(220, 242, 232);
      }

      doc.rect(margin, y, contentW, rowH, "F");

      // Border bottom
      doc.setDrawColor(200, 230, 215);
      doc.line(margin, y + rowH, margin + contentW, y + rowH);

      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", item.highlight ? "bold" : "normal");
      doc.setFontSize(8.5);

      const timeStr = item.debut === item.fin ? item.debut : `${item.debut} - ${item.fin}`;
      doc.text(timeStr, margin + 2, y + 6);
      doc.text(item.duree, margin + 36, y + 6);

      // Rubrique (may wrap)
      const lines = doc.splitTextToSize(item.rubrique, contentW - 58);
      doc.text(lines, margin + 58, y + 6);

      y += rowH * lines.length;
    });

    // Footer
    y += 8;
    doc.setDrawColor(7, 85, 59);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentW, y);
    y += 5;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text("Ramadan Moubarak — Association LA CITADELLE — IFTAR 2026 © Tous droits reservés", pageW / 2, y, {
      align: "center",
    });

    doc.save("Programme-IFTAR-2026.pdf");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07553B] via-[#0a6b4a] to-[#f4f9f6]">
      {/* Hero header */}
      <div className="bg-[#07553B] text-white py-10 px-4 text-center shadow-lg">
        <p className="text-xl font-serif italic text-emerald-200 mb-2">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
        <div className="text-5xl mb-3">🌙</div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-wide">IFTAR 2026</h1>
        <p className="text-emerald-200 text-lg mt-1">15<sup>e</sup> Édition — Programme officiel de la soirée</p>

        <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm">
          <span className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
            📅 Dimanche 8 Mars 2026
          </span>
          <span className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
            📍 NOOM Hôtel Abidjan Plateau
          </span>
          <span className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
            ⏰ 16h00 – 21h00
          </span>
        </div>

        <div className="mt-5 max-w-2xl mx-auto bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3 text-sm italic text-emerald-100">
          « Le Coran : Parole incréée, source de guidance divine et de repère pour l'humanité »
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Download button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-[#07553B] hover:bg-[#054d35] text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Télécharger en PDF
          </button>
        </div>

        {/* Programme card */}
        <div ref={programmeRef} className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Card header */}
          <div className="bg-gradient-to-r from-[#07553B] to-[#0a6b4a] px-6 py-4 text-white">
            <h2 className="text-xl font-bold">📋 Déroulement de la soirée</h2>
            <p className="text-emerald-200 text-sm mt-0.5">Durée totale : 4h 45min</p>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[90px_70px_1fr] bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider px-4 py-2">
            <span>Horaire</span>
            <span>Durée</span>
            <span>Rubrique</span>
          </div>

          {/* Programme items */}
          <div className="divide-y divide-emerald-100">
            {PROGRAMME.map((item, index) => (
              <div
                key={index}
                className={`grid grid-cols-[90px_70px_1fr] items-center px-4 py-3 gap-2 transition-colors hover:bg-emerald-50
                  ${item.highlight ? "bg-emerald-50" : index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
              >
                {/* Horaire */}
                <div className="text-center">
                  <span className={`inline-block text-xs font-mono font-bold px-2 py-1 rounded-md
                    ${item.highlight ? "bg-[#07553B] text-white" : "bg-emerald-100 text-emerald-800"}`}>
                    {item.debut === item.fin ? item.debut : `${item.debut}`}
                  </span>
                  {item.debut !== item.fin && (
                    <div className="text-[10px] text-gray-400 mt-0.5">{item.fin}</div>
                  )}
                </div>

                {/* Durée */}
                <div className="text-center">
                  {item.duree && (
                    <span className="text-xs text-gray-500 font-medium">{item.duree}</span>
                  )}
                </div>

                {/* Rubrique */}
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none flex-shrink-0">{item.icon}</span>
                  <span className={`text-sm leading-snug ${item.highlight ? "font-semibold text-[#07553B]" : "text-gray-700"}`}>
                    {item.rubrique}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Total row */}
          <div className="grid grid-cols-[90px_70px_1fr] items-center bg-[#07553B] text-white px-4 py-3 gap-2 font-bold text-sm">
            <span className="text-center font-mono text-xs">16:15–21:00</span>
            <span className="text-center text-xs">4h 45min</span>
            <span className="flex items-center gap-2">
              <span>🌟</span>
              <span>Fin de l'IFTAR 2026</span>
            </span>
          </div>
        </div>

        {/* Conférencier card */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border-l-4 border-[#07553B]">
          <h3 className="text-lg font-bold text-[#07553B] mb-3">🎤 Conférencier principal</h3>
          <p className="text-gray-800 font-semibold text-base">Imam Cheick Ahmad Tidiane DIABATE</p>
          <p className="text-sm text-gray-600 mt-2 italic">
            « Le Coran : Parole incréée, source de guidance divine et de repère pour l'humanité »
          </p>
        </div>

        {/* Hadith */}
        <div className="mt-6 bg-amber-50 rounded-2xl shadow-md p-6 border-l-4 border-amber-400">
          <p className="text-gray-700 italic text-sm leading-relaxed">
            « Celui qui nourrit un jeûneur recevra la même récompense que lui, sans que cela ne diminue
            en rien la récompense du jeûneur. »
          </p>
          <p className="text-amber-700 text-xs mt-2 font-medium">(Hadith rapporté par At-Tirmidhi)</p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-white/80 pb-8">
          <p>Ramadan Moubarak 🌙</p>
          <p className="mt-1">Association LA CITADELLE — IFTAR 2026 © Tous droits réservés</p>
        </div>
      </div>
    </div>
  );
}
