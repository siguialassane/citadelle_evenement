
// Fonctions d'exportation de données en PDF et CSV
// Mise à jour: Correction de la redéfinition de variable yPosition et amélioration de l'exportation PDF

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "@/hooks/use-toast";
import { type Participant } from "../../../../types/participant";

// Fonction utilitaire pour déterminer le statut de paiement global du participant
const getPaymentStatus = (participant: Participant): string => {
  // Vérifier d'abord les paiements standard
  if (participant.payments && participant.payments.length > 0) {
    const payment = participant.payments[0];
    const status = payment.status.toUpperCase();
    
    if (["APPROVED", "SUCCESS", "COMPLETED"].includes(status)) {
      return "Confirmé";
    } else if (status === "PENDING") {
      return "En cours";
    } else if (["FAILED", "CANCELLED", "REJECTED"].includes(status)) {
      return "Rejeté";
    } else {
      return payment.status;
    }
  }
  
  // Vérifier ensuite les paiements manuels
  if (participant.manual_payments && participant.manual_payments.length > 0) {
    const manualPayment = participant.manual_payments[0];
    const status = manualPayment.status.toLowerCase();
    
    if (status === "completed") {
      return "Confirmé";
    } else if (status === "pending") {
      return "En attente";
    } else if (status === "rejected") {
      return "Rejeté";
    } else {
      return manualPayment.status;
    }
  }
  
  // Aucun paiement trouvé
  return "Non payé";
};

// Fonction utilitaire pour obtenir le montant du paiement
const getPaymentAmount = (participant: Participant): string => {
  // Vérifier d'abord les paiements standard
  if (participant.payments && participant.payments.length > 0) {
    const payment = participant.payments[0];
    return `${payment.amount} ${payment.currency || 'XOF'}`;
  }
  
  // Vérifier ensuite les paiements manuels
  if (participant.manual_payments && participant.manual_payments.length > 0) {
    const manualPayment = participant.manual_payments[0];
    return `${manualPayment.amount} XOF`;
  }
  
  // Aucun paiement trouvé
  return "N/A";
};

// Fonction utilitaire pour obtenir la méthode de paiement
const getPaymentMethod = (participant: Participant): string => {
  if (participant.payments && participant.payments.length > 0) {
    return participant.payments[0].payment_method || "Standard";
  }
  
  if (participant.manual_payments && participant.manual_payments.length > 0) {
    return participant.manual_payments[0].payment_method || "Manuel";
  }
  
  return "N/A";
};

// Fonction utilitaire pour obtenir la date de paiement
const getPaymentDate = (participant: Participant): string => {
  if (participant.payments && participant.payments.length > 0) {
    const date = new Date(participant.payments[0].payment_date);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString('fr-FR');
  }
  
  if (participant.manual_payments && participant.manual_payments.length > 0) {
    const date = new Date(participant.manual_payments[0].created_at);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString('fr-FR');
  }
  
  return "N/A";
};

// Fonction utilitaire pour échapper les champs CSV
const escapeCSV = (field: string | number | boolean | null): string => {
  if (field === null || field === undefined) return '""';
  const fieldStr = String(field);
  // Échapper les guillemets en les doublant et entourer de guillemets
  return `"${fieldStr.replace(/"/g, '""')}"`;
};

// Fonction pour formater le numéro de téléphone correctement - Améliorée pour texte brut
const formatPhoneNumber = (phone: string): string => {
  if (!phone) return "";
  
  // Si c'est déjà un format attendu (exactement 10 chiffres commençant par 0), le retourner tel quel
  if (/^0\d{9}$/.test(phone)) {
    return phone;
  }
  
  // Traiter la notation scientifique (2.25E+12)
  if (phone.includes('E+') || phone.includes('e+')) {
    try {
      const num = Number(phone);
      if (!isNaN(num)) {
        const fullNumber = String(num);
        
        // Si c'est un numéro ivoirien avec préfixe 225
        if (fullNumber.startsWith('225')) {
          // Extraire sans le préfixe 225
          const localNumber = fullNumber.substring(3);
          // Ajouter le 0 si nécessaire
          return localNumber.startsWith('0') ? localNumber : `0${localNumber}`;
        }
        
        // Pour les autres cas, formater comme numéro à 10 chiffres
        const lastDigits = fullNumber.slice(-10);
        return lastDigits.startsWith('0') ? lastDigits : `0${lastDigits.slice(-9)}`;
      }
    } catch (error) {
      console.error("Erreur dans le formatage du numéro scientifique:", error);
    }
  }
  
  // Extraire seulement les chiffres
  const digits = phone.replace(/\D/g, '');
  
  // Cas 1: Préfixe 225 présent (format international ivoirien)
  if (digits.startsWith('225')) {
    const localPart = digits.substring(3);
    return localPart.startsWith('0') ? localPart : `0${localPart}`;
  }
  
  // Cas 2: Sans préfixe mais sans 0 initial (format africain 9 chiffres)
  if (digits.length === 9) {
    return `0${digits}`;
  }
  
  // Cas 3: Format avec 0 initial et 10 chiffres (format ivoirien standard)
  if (digits.length === 10 && digits.startsWith('0')) {
    return digits;
  }
  
  // Cas 4: Pour tout autre format, prendre les derniers chiffres et ajouter 0 si nécessaire
  // S'assurer d'avoir exactement 10 chiffres
  if (digits.length > 9) {
    // Prendre les 10 derniers ou les 9 derniers + ajouter 0
    if (digits.slice(-10).startsWith('0')) {
      return digits.slice(-10);
    } else {
      return `0${digits.slice(-9)}`;
    }
  }
  
  // Si tout échoue, ajouter simplement un 0 devant
  return `0${digits}`;
};

// Fonction utilitaire pour formater une date en format français
const formatFrenchDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Date invalide";
  return date.toLocaleDateString('fr-FR');
};

// Fonction utilitaire pour formater une date et heure en format français
const formatFrenchDateTime = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Date invalide";
  return date.toLocaleDateString('fr-FR');
};

// Fonction améliorée pour exporter au format CSV
export const exportToCSV = (participants: Participant[]) => {
  // Headers avec espacement pour une meilleure lisibilité
  const headers = [
    "Nom", 
    "Prénom", 
    "Email", 
    "Téléphone", 
    "Membre", 
    "Présent", 
    "Code SMS",
    "Nb de places",
    "Accompagnants",
    "Présence accompagnants",
    "Date d'inscription", 
    "Statut du paiement", 
    "Montant",
    "Méthode de paiement",
    "Date de paiement",
    "Date d'enregistrement"
  ];
  
  const rows = participants.map(participant => {
    const companions = participant.guests?.filter(g => !g.is_main_participant) || [];
    const totalPlaces = companions.length > 0 ? companions.length + 1 : 1;
    const companionNames = companions.map(g => `${g.first_name} ${g.last_name}`).join(" | ");
    const companionPresence = companions.map(g => `${g.first_name} ${g.last_name}: ${g.check_in_status ? 'Présent' : 'Absent'}`).join(" | ");
    
    return [
      escapeCSV(participant.last_name || ""),
      escapeCSV(participant.first_name || ""),
      escapeCSV(participant.email || ""),
      escapeCSV(formatPhoneNumber(participant.contact_number || "")),
      escapeCSV(participant.is_member ? "Oui" : "Non"),
      escapeCSV(participant.check_in_status ? "Oui" : "Non"),
      escapeCSV(participant.sms_code || "-"),
      escapeCSV(totalPlaces),
      escapeCSV(companionNames || "-"),
      escapeCSV(companionPresence || "-"),
      escapeCSV(formatFrenchDate(participant.created_at)),
      escapeCSV(getPaymentStatus(participant)),
      escapeCSV(getPaymentAmount(participant)),
      escapeCSV(getPaymentMethod(participant)),
      escapeCSV(getPaymentDate(participant)),
      escapeCSV(participant.check_in_timestamp ? 
        formatFrenchDate(participant.check_in_timestamp) : "Non enregistré")
    ];
  });
  
  // Ajouter le BOM (Byte Order Mark) pour que Excel reconnaisse l'UTF-8
  const BOM = "\uFEFF";
  
  // Utiliser des points-virgules comme séparateurs (standard pour Excel en français)
  const csvContent = BOM + [
    headers.join(";"),
    ...rows.map(row => row.join(";"))
  ].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `participants-${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast({
    title: "Exportation réussie",
    description: `${participants.length} participants ont été exportés au format CSV.`,
  });
};

export const exportToPDF = async (
  filteredParticipants: Participant[], 
  onPdfGenerated: () => void,
  filterType: 'all' | 'paid' | 'unpaid' = 'all'
) => {
  // Appliquer le filtre par statut de paiement
  const participantsList = filterType === 'paid'
    ? filteredParticipants.filter(p => {
        const s = getPaymentStatus(p);
        return s === 'Confirmé' || s === 'En cours';
      })
    : filterType === 'unpaid'
    ? filteredParticipants.filter(p => {
        const s = getPaymentStatus(p);
        return s === 'Non payé' || s === 'En attente' || s === 'Rejeté';
      })
    : filteredParticipants;

  const filterLabels: Record<string, string> = {
    all: 'LISTE COMPLÈTE DES PARTICIPANTS',
    paid: 'PARTICIPANTS — PAIEMENTS CONFIRMÉS',
    unpaid: 'PARTICIPANTS — PAIEMENTS EN ATTENTE / NON PAYÉS',
  };

  if (participantsList.length === 0) {
    toast({
      title: "Aucun participant",
      description: "Aucun participant ne correspond à ce filtre.",
      variant: "destructive",
    });
    return;
  }

  toast({
    title: "Génération du PDF",
    description: "Veuillez patienter pendant la création du PDF...",
  });

  try {
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const usableWidth = pageWidth - (margin * 2);
    const lineHeight = 8;
    const headerHeight = 45; // Espace réservé pour l'en-tête
    const footerHeight = 15; // Espace réservé pour le pied de page

    // Remplacer la référence à filteredParticipants par participantsList
    // (on redéfinit la variable locale pour le reste du code)
    const filteredParticipants = participantsList;
    
    // --- Statistiques globales ---
    const presentCount = filteredParticipants.filter(p => p.check_in_status).length;
    const memberCount = filteredParticipants.filter(p => p.is_member).length;
    const totalCompanions = filteredParticipants.reduce((acc, p) => acc + (p.guests?.filter(g => !g.is_main_participant).length || 0), 0);
    const presentCompanions = filteredParticipants.reduce((acc, p) => acc + (p.guests?.filter(g => !g.is_main_participant && g.check_in_status).length || 0), 0);
    const totalPersons = filteredParticipants.length + totalCompanions;
    const totalPresent = presentCount + presentCompanions;
    const confirmedPayments = filteredParticipants.filter(p => getPaymentStatus(p) === 'Confirmé').length;
    
    // --- Colonnes du tableau ---
    const columns = ["N°", "Nom complet", "Téléphone", "Membre", "Paiement", "Présence", "Places"];
    
    const columnWidths = {
      0: usableWidth * 0.05,  // N°
      1: usableWidth * 0.32,  // Nom complet
      2: usableWidth * 0.17,  // Téléphone
      3: usableWidth * 0.10,  // Membre
      4: usableWidth * 0.14,  // Paiement
      5: usableWidth * 0.14,  // Présence
      6: usableWidth * 0.08,  // Places
    };
    
    // --- Fonctions utilitaires de dessin ---
    const drawPageHeader = (pageNum: number) => {
      // Titre principal
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(30, 30, 30);
      pdf.text('LISTE DES PARTICIPANTS - IFTAR 2026', pageWidth / 2, margin + 8, { align: 'center' });
      
      // Sous-titre avec date
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, margin + 15, { align: 'center' });
      
      // Bandeau récapitulatif sur la première page uniquement
      if (pageNum === 1) {
        const bannerY = margin + 20;
        const bannerH = 14;
        const boxW = usableWidth / 4;
        
        // Fond du bandeau
        pdf.setFillColor(245, 245, 245);
        pdf.setDrawColor(220, 220, 220);
        pdf.roundedRect(margin, bannerY, usableWidth, bannerH, 2, 2, 'FD');
        
        // 4 blocs de stats
        const stats = [
          { label: 'Participants', value: String(filteredParticipants.length) },
          { label: 'Total personnes', value: `${totalPersons} (dont ${totalCompanions} acc.)` },
          { label: 'Paiements confirmés', value: `${confirmedPayments} / ${filteredParticipants.length}` },
          { label: 'Présents', value: `${totalPresent} / ${totalPersons}` },
        ];
        
        stats.forEach((stat, i) => {
          const x = margin + (boxW * i);
          // Séparateur vertical
          if (i > 0) {
            pdf.setDrawColor(200, 200, 200);
            pdf.line(x, bannerY + 2, x, bannerY + bannerH - 2);
          }
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10);
          pdf.setTextColor(30, 30, 30);
          pdf.text(stat.value, x + boxW / 2, bannerY + 6, { align: 'center' });
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(7);
          pdf.setTextColor(120, 120, 120);
          pdf.text(stat.label, x + boxW / 2, bannerY + 11, { align: 'center' });
        });
      }
    };
    
    const drawTableHeader = (y: number) => {
      // Fond de l'en-tête de tableau
      pdf.setFillColor(50, 50, 50);
      pdf.rect(margin, y, usableWidth, lineHeight, 'F');
      
      let xPosition = margin;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
      
      columns.forEach((column, index) => {
        const colW = columnWidths[index as keyof typeof columnWidths];
        // Centrer les petites colonnes
        if (index === 0 || index >= 3) {
          pdf.text(column, xPosition + colW / 2, y + 5.5, { align: 'center' });
        } else {
          pdf.text(column, xPosition + 3, y + 5.5);
        }
        xPosition += colW;
      });
      
      pdf.setTextColor(0, 0, 0);
      return y + lineHeight;
    };
    
    const drawPageFooter = (pageNum: number, totalPages: number) => {
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`LA CITADELLE - Document confidentiel`, margin, pageHeight - 6);
      pdf.text(`Page ${pageNum} / ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
      // Ligne de séparation
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    };
    
    // --- Préparer les données du tableau ---
    type PdfRow = { 
      num: string; name: string; phone: string; membre: string; 
      payment: string; presence: string; places: string; 
      isCompanion: boolean; paymentColor: [number, number, number]; 
      presenceColor: [number, number, number];
    };
    const pdfRows: PdfRow[] = [];
    let participantNum = 0;
    
    filteredParticipants.forEach(participant => {
      participantNum++;
      const companions = participant.guests?.filter(g => !g.is_main_participant) || [];
      const totalPlaces = companions.length > 0 ? companions.length + 1 : 1;
      const paymentStatus = getPaymentStatus(participant);
      
      // Couleur du paiement
      let paymentColor: [number, number, number] = [100, 100, 100];
      if (paymentStatus === 'Confirmé') paymentColor = [22, 163, 74];
      else if (paymentStatus === 'En attente') paymentColor = [202, 138, 4];
      else if (paymentStatus === 'Non payé') paymentColor = [220, 38, 38];
      
      // Couleur de la présence
      const presenceColor: [number, number, number] = participant.check_in_status 
        ? [22, 163, 74] : [220, 38, 38];
      
      pdfRows.push({
        num: String(participantNum),
        name: `${participant.last_name} ${participant.first_name}`,
        phone: participant.contact_number || '',
        membre: participant.is_member ? "Oui" : "Non",
        payment: paymentStatus,
        presence: participant.check_in_status ? "Présent" : "Absent",
        places: String(totalPlaces),
        isCompanion: false,
        paymentColor,
        presenceColor,
      });
      
      companions.forEach(guest => {
        const gPresenceColor: [number, number, number] = guest.check_in_status 
          ? [22, 163, 74] : [220, 38, 38];
        pdfRows.push({
          num: '',
          name: `    ↳ ${guest.first_name} ${guest.last_name}`,
          phone: '',
          membre: '',
          payment: '',
          presence: guest.check_in_status ? "Présent" : "Absent",
          places: '',
          isCompanion: true,
          paymentColor: [100, 100, 100],
          presenceColor: gPresenceColor,
        });
      });
    });
    
    // --- Calcul de la pagination ---
    const firstPageTableStart = headerHeight;
    const nextPageTableStart = margin + 20;
    const maxContentHeight = pageHeight - footerHeight;
    
    const rowsFirstPage = Math.floor((maxContentHeight - firstPageTableStart - lineHeight) / lineHeight);
    const rowsNextPage = Math.floor((maxContentHeight - nextPageTableStart - lineHeight) / lineHeight);
    
    let totalPages = 1;
    let remainingRows = pdfRows.length - rowsFirstPage;
    if (remainingRows > 0) {
      totalPages += Math.ceil(remainingRows / rowsNextPage);
    }
    
    // --- Rendu page par page ---
    let rowIndex = 0;
    let currentPage = 1;
    let participantRowCount = 0; // Pour alterner les couleurs par participant
    
    while (rowIndex < pdfRows.length) {
      if (currentPage > 1) {
        pdf.addPage();
      }
      
      drawPageHeader(currentPage);
      
      const tableStartY = currentPage === 1 ? firstPageTableStart : nextPageTableStart;
      let yPos = drawTableHeader(tableStartY);
      const maxRowsThisPage = currentPage === 1 ? rowsFirstPage : rowsNextPage;
      let rowsDrawn = 0;
      
      while (rowIndex < pdfRows.length && rowsDrawn < maxRowsThisPage) {
        const row = pdfRows[rowIndex];
        
        // Fond alterné (par groupe de participant, pas par ligne)
        if (!row.isCompanion) {
          participantRowCount++;
        }
        
        if (row.isCompanion) {
          pdf.setFillColor(240, 247, 255); // Bleu très léger pour accompagnants
          pdf.rect(margin, yPos, usableWidth, lineHeight, 'F');
        } else if (participantRowCount % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(margin, yPos, usableWidth, lineHeight, 'F');
        }
        
        // Ligne de séparation
        pdf.setDrawColor(230, 230, 230);
        pdf.line(margin, yPos + lineHeight, margin + usableWidth, yPos + lineHeight);
        
        let xPos = margin;
        
        // N°
        const colW0 = columnWidths[0];
        pdf.setFont("helvetica", row.isCompanion ? "italic" : "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(row.num, xPos + colW0 / 2, yPos + 5.5, { align: 'center' });
        xPos += colW0;
        
        // Nom
        const colW1 = columnWidths[1];
        if (row.isCompanion) {
          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(7.5);
          pdf.setTextColor(80, 120, 200);
        } else {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8.5);
          pdf.setTextColor(30, 30, 30);
        }
        pdf.text(row.name.substring(0, 40), xPos + 3, yPos + 5.5);
        xPos += colW1;
        
        // Téléphone
        const colW2 = columnWidths[2];
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(60, 60, 60);
        pdf.text(row.phone, xPos + 3, yPos + 5.5);
        xPos += colW2;
        
        // Membre
        const colW3 = columnWidths[3];
        if (row.membre === "Oui") {
          pdf.setTextColor(22, 163, 74);
          pdf.setFont("helvetica", "bold");
        } else {
          pdf.setTextColor(150, 150, 150);
          pdf.setFont("helvetica", "normal");
        }
        pdf.setFontSize(8);
        pdf.text(row.membre, xPos + colW3 / 2, yPos + 5.5, { align: 'center' });
        xPos += colW3;
        
        // Paiement
        const colW4 = columnWidths[4];
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(...row.paymentColor);
        pdf.text(row.payment, xPos + colW4 / 2, yPos + 5.5, { align: 'center' });
        xPos += colW4;
        
        // Présence
        const colW5 = columnWidths[5];
        pdf.setFont("helvetica", row.presence === "Présent" ? "bold" : "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...row.presenceColor);
        pdf.text(row.presence, xPos + colW5 / 2, yPos + 5.5, { align: 'center' });
        xPos += colW5;
        
        // Places
        const colW6 = columnWidths[6];
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(60, 60, 60);
        pdf.text(row.places, xPos + colW6 / 2, yPos + 5.5, { align: 'center' });
        
        yPos += lineHeight;
        rowIndex++;
        rowsDrawn++;
      }
      
      // Bordure extérieure du tableau
      pdf.setDrawColor(180, 180, 180);
      pdf.rect(margin, tableStartY, usableWidth, (rowsDrawn + 1) * lineHeight, 'D');
      
      // Lignes verticales de séparation des colonnes
      let colX = margin;
      for (let c = 0; c < columns.length - 1; c++) {
        colX += columnWidths[c as keyof typeof columnWidths];
        pdf.setDrawColor(230, 230, 230);
        pdf.line(colX, tableStartY + lineHeight, colX, tableStartY + (rowsDrawn + 1) * lineHeight);
      }
      
      currentPage++;
    }
    
    // --- Page de statistiques récapitulatives ---
    pdf.addPage();
    const statsPage = pdf.getNumberOfPages();
    
    const sp = { x: margin, y: margin + 8 };
    
    // Titre de la page stats
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.setTextColor(30, 30, 30);
    pdf.text('RÉCAPITULATIF STATISTIQUE', pageWidth / 2, sp.y, { align: 'center' });
    sp.y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Données au ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, sp.y, { align: 'center' });
    sp.y += 10;
    
    // Calcul des statistiques détaillées
    const totalParticipants = filteredParticipants.length;
    const totalAccompagnants = filteredParticipants.reduce((acc, p) => acc + (p.guests?.filter(g => !g.is_main_participant).length || 0), 0);
    const totalPersonnes = totalParticipants + totalAccompagnants;
    
    const presentParticipants = filteredParticipants.filter(p => p.check_in_status).length;
    const presentAccompagnants = filteredParticipants.reduce((acc, p) => acc + (p.guests?.filter(g => !g.is_main_participant && g.check_in_status).length || 0), 0);
    const totalPresents = presentParticipants + presentAccompagnants;
    const totalAbsents = totalPersonnes - totalPresents;
    
    const totalMembres = filteredParticipants.filter(p => p.is_member).length;
    const totalNonMembres = totalParticipants - totalMembres;
    
    const payConfirme = filteredParticipants.filter(p => getPaymentStatus(p) === 'Confirmé').length;
    const payEnAttente = filteredParticipants.filter(p => getPaymentStatus(p) === 'En attente' || getPaymentStatus(p) === 'En cours').length;
    const payNonPaye = filteredParticipants.filter(p => getPaymentStatus(p) === 'Non payé').length;
    const payRejete = filteredParticipants.filter(p => getPaymentStatus(p) === 'Rejeté').length;
    
    // Fonction helper pour dessiner un tableau de stats
    const drawStatsTable = (
      title: string,
      rows: Array<{ label: string; value: string | number; pct?: string; color?: [number,number,number] }>,
      startX: number,
      startY: number,
      colWidthLabel: number,
      colWidthValue: number,
      colWidthPct?: number
    ): number => {
      const rowH = 8;
      const headerH = 7;
      let y = startY;
      
      // En-tête du tableau
      pdf.setFillColor(50, 50, 50);
      const totalW = colWidthLabel + colWidthValue + (colWidthPct || 0);
      pdf.rect(startX, y, totalW, headerH, 'F');
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text(title, startX + totalW / 2, y + 5, { align: 'center' });
      y += headerH;
      
      rows.forEach((row, idx) => {
        // Fond alterné
        if (idx % 2 === 1) {
          pdf.setFillColor(248, 248, 248);
          pdf.rect(startX, y, totalW, rowH, 'F');
        }
        // Ligne séparatrice
        pdf.setDrawColor(220, 220, 220);
        pdf.line(startX, y + rowH, startX + totalW, y + rowH);
        
        // Label
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        pdf.setTextColor(50, 50, 50);
        pdf.text(row.label, startX + 4, y + 5.5);
        
        // Valeur
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        if (row.color) {
          pdf.setTextColor(...row.color);
        } else {
          pdf.setTextColor(30, 30, 30);
        }
        pdf.text(String(row.value), startX + colWidthLabel + colWidthValue - 4, y + 5.5, { align: 'right' });
        
        // Pourcentage (colonne optionnelle)
        if (colWidthPct && row.pct !== undefined) {
          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(7.5);
          pdf.setTextColor(150, 150, 150);
          pdf.text(row.pct, startX + colWidthLabel + colWidthValue + colWidthPct - 4, y + 5.5, { align: 'right' });
        }
        
        y += rowH;
      });
      
      // Bordure extérieure
      pdf.setDrawColor(180, 180, 180);
      pdf.rect(startX, startY + headerH, totalW, rows.length * rowH, 'D');
      
      return y + 4; // retourne la position Y après le tableau
    };
    
    const pct = (n: number, total: number) => total > 0 ? `${Math.round((n / total) * 100)}%` : '0%';
    const colL = 80; const colV = 30; const colP = 25;
    
    // Ligne 1 : 3 tableaux côte à côte
    const tableY = sp.y;
    const spacing = 8;
    const tableW = colL + colV + colP;
    const col2X = margin + tableW + spacing;
    const col3X = col2X + tableW + spacing;
    
    // Tableau 1 : Présence
    drawStatsTable(
      'PRÉSENCE',
      [
        { label: 'Présents',      value: totalPresents,  pct: pct(totalPresents, totalPersonnes), color: [22, 163, 74] },
        { label: 'Absents',       value: totalAbsents,   pct: pct(totalAbsents, totalPersonnes),  color: [220, 38, 38] },
        { label: 'Total personnes', value: totalPersonnes, pct: '100%' },
        { label: '↳ dont participants', value: totalParticipants,   pct: pct(totalParticipants, totalPersonnes) },
        { label: '↳ dont accompagnants', value: totalAccompagnants, pct: pct(totalAccompagnants, totalPersonnes) },
      ],
      margin, tableY, colL, colV, colP
    );
    
    // Tableau 2 : Paiements
    drawStatsTable(
      'PAIEMENTS',
      [
        { label: 'Confirmés',   value: payConfirme,   pct: pct(payConfirme, totalParticipants),   color: [22, 163, 74] },
        { label: 'En attente',  value: payEnAttente,  pct: pct(payEnAttente, totalParticipants),  color: [202, 138, 4] },
        { label: 'Non payés',   value: payNonPaye,    pct: pct(payNonPaye, totalParticipants),    color: [220, 38, 38] },
        { label: 'Rejetés',     value: payRejete,     pct: pct(payRejete, totalParticipants),    color: [153, 27, 27] },
        { label: 'Total inscrits', value: totalParticipants, pct: '100%' },
      ],
      col2X, tableY, colL, colV, colP
    );
    
    // Tableau 3 : Membres
    drawStatsTable(
      'MEMBRES / NON-MEMBRES',
      [
        { label: 'Membres',             value: totalMembres,    pct: pct(totalMembres, totalParticipants),    color: [147, 51, 234] },
        { label: 'Non-membres',         value: totalNonMembres, pct: pct(totalNonMembres, totalParticipants), color: [100, 100, 100] },
        { label: 'Total inscrits',      value: totalParticipants, pct: '100%' },
      ],
      col3X, tableY, colL, colV, colP
    );
    
    // --- Pied de page sur toutes les pages ---
    const numPages = pdf.getNumberOfPages();
    for (let i = 1; i <= numPages; i++) {
      pdf.setPage(i);
      drawPageFooter(i, numPages);
    }
    
    pdf.save(`participants-iftar-${new Date().toISOString().slice(0,10)}.pdf`);
    
    onPdfGenerated();
    
    toast({
      title: "PDF généré",
      description: "Le fichier PDF a été téléchargé avec succès.",
    });
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    toast({
      title: "Erreur",
      description: "Impossible de générer le PDF. Veuillez réessayer.",
      variant: "destructive",
    });
  }
};
