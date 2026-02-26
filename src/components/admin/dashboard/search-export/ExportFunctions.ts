
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
    "Date d'inscription", 
    "Statut du paiement", 
    "Montant",
    "Méthode de paiement",
    "Date de paiement",
    "Date d'enregistrement"
  ];
  
  const rows = participants.map(participant => [
    escapeCSV(participant.last_name || ""),
    escapeCSV(participant.first_name || ""),
    escapeCSV(participant.email || ""),
    escapeCSV(formatPhoneNumber(participant.contact_number || "")),
    escapeCSV(participant.is_member ? "Oui" : "Non"),
    escapeCSV(participant.check_in_status ? "Oui" : "Non"),
    escapeCSV(formatFrenchDate(participant.created_at)),
    escapeCSV(getPaymentStatus(participant)),
    escapeCSV(getPaymentAmount(participant)),
    escapeCSV(getPaymentMethod(participant)),
    escapeCSV(getPaymentDate(participant)),
    escapeCSV(participant.check_in_timestamp ? 
      formatFrenchDate(participant.check_in_timestamp) : "Non enregistré")
  ]);
  
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
  onPdfGenerated: () => void
) => {
  toast({
    title: "Génération du PDF",
    description: "Veuillez patienter pendant la création du PDF...",
  });

  try {
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pageWidth - (margin * 2);
    
    // En-tête amélioré
    pdf.setFontSize(18);
    pdf.text('Liste complète des participants', pageWidth / 2, margin + 10, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.text(`Extrait le: ${new Date().toLocaleDateString('fr-FR')} - IFTAR 2026`, pageWidth / 2, margin + 20, { align: 'center' });
    
    const columns = [
      "Nom", 
      "Email", 
      "Téléphone", 
      "Membre", 
      "Date d'inscription", 
      "Paiement"
    ];
    
    const columnWidths = {
      0: usableWidth * 0.20, // Nom
      1: usableWidth * 0.30, // Email
      2: usableWidth * 0.15, // Téléphone
      3: usableWidth * 0.10, // Membre
      4: usableWidth * 0.15, // Date
      5: usableWidth * 0.10, // Paiement
    };
    
    let yPosition = margin + 30;
    let currentPage = 1;
    const lineHeight = 7;
    const maxRowsPerPage = Math.floor((pageHeight - yPosition - margin) / lineHeight);
    
    const drawHeader = () => {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPosition, usableWidth, lineHeight, 'F');
      
      let xPosition = margin;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      
      columns.forEach((column, index) => {
        pdf.text(column, xPosition + 2, yPosition + 5);
        xPosition += columnWidths[index as keyof typeof columnWidths];
      });
      
      yPosition += lineHeight;
    };
    
    const drawRowLines = (y: number) => {
      let xPosition = margin;
      
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, margin + usableWidth, y);
      
      columns.forEach((_, index) => {
        xPosition += columnWidths[index as keyof typeof columnWidths];
        pdf.line(xPosition, y - lineHeight, xPosition, y);
      });
    };
    
    drawHeader();
    
    filteredParticipants.forEach((participant, index) => {
      if (index > 0 && index % maxRowsPerPage === 0) {
        pdf.addPage();
        currentPage++;
        yPosition = margin + 15;
        
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text(`Liste des participants (page ${currentPage})`, margin, margin + 5);
        
        yPosition += 10;
        drawHeader();
      }
      
      if (index % 2 === 1) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(margin, yPosition, usableWidth, lineHeight, 'F');
      }
      
      let xPosition = margin;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      
      pdf.text(`${participant.last_name} ${participant.first_name}`.substring(0, 25), xPosition + 2, yPosition + 5);
      xPosition += columnWidths[0];
      
      pdf.text(participant.email.substring(0, 35), xPosition + 2, yPosition + 5);
      xPosition += columnWidths[1];
      
      pdf.text(participant.contact_number, xPosition + 2, yPosition + 5);
      xPosition += columnWidths[2];
      
      pdf.text(participant.is_member ? "Oui" : "Non", xPosition + 2, yPosition + 5);
      xPosition += columnWidths[3];
      
      pdf.text(new Date(participant.created_at).toLocaleDateString('fr-FR'), xPosition + 2, yPosition + 5);
      xPosition += columnWidths[4];
      
      // Utilisation de la fonction utilitaire pour obtenir le statut de paiement formaté
      const paymentStatus = getPaymentStatus(participant);
      pdf.text(paymentStatus, xPosition + 2, yPosition + 5);
      
      drawRowLines(yPosition + lineHeight);
      
      yPosition += lineHeight;
    });
    
    pdf.setDrawColor(100, 100, 100);
    pdf.rect(margin, margin + 30, usableWidth, Math.min(filteredParticipants.length, maxRowsPerPage) * lineHeight, 'D');
    
    const totalPages = Math.ceil(filteredParticipants.length / maxRowsPerPage);
    
    for (let i = 0; i < totalPages; i++) {
      pdf.setPage(i + 1);
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Page ${i + 1}/${totalPages}`, pageWidth - 25, pageHeight - 10);
    }
    
    // Ajouter des informations récapitulatives supplémentaires
    // Correction : renommé yPosition en recapYPosition pour éviter la redéfinition
    let recapYPosition = pageHeight - 30;
    pdf.setFontSize(11);
    pdf.text("Récapitulatif:", margin, recapYPosition);
    recapYPosition += 6;
    
    const presentCount = filteredParticipants.filter(p => p.check_in_status).length;
    const memberCount = filteredParticipants.filter(p => p.is_member).length;
    
    pdf.setFontSize(9);
    pdf.text(`• Total des participants: ${filteredParticipants.length}`, margin + 5, recapYPosition);
    recapYPosition += 4;
    pdf.text(`• Participants enregistrés: ${presentCount} (${Math.round((presentCount / filteredParticipants.length) * 100) || 0}%)`, margin + 5, recapYPosition);
    recapYPosition += 4;
    pdf.text(`• Membres de la communauté: ${memberCount} (${Math.round((memberCount / filteredParticipants.length) * 100) || 0}%)`, margin + 5, recapYPosition);
    
    // Pied de page amélioré avec date et numéro de page
    for (let i = 0; i < pdf.getNumberOfPages(); i++) {
      pdf.setPage(i + 1);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`LA CITADELLE - Rapport généré le ${new Date().toLocaleDateString('fr-FR')}`, margin, pageHeight - 5);
      pdf.text(`Page ${i + 1} / ${pdf.getNumberOfPages()}`, pageWidth - margin - 20, pageHeight - 5);
    }
    
    pdf.save(`participants-${new Date().toISOString().slice(0,10)}.pdf`);
    
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
