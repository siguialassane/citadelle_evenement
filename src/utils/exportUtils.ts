
// Utilitaires d'exportation pour PDF et CSV
// Créé pour permettre l'exportation des données d'adhésion

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

/**
 * Convertit un élément DOM en PDF et lance le téléchargement
 */
export const exportToPDF = async (element: HTMLElement, fileName: string) => {
  try {
    // Créer une instance de jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Capturer l'élément DOM comme une image
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });
    
    // Dimensions du PDF A4
    const imgWidth = 210; // mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Ajouter l'image au PDF
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Télécharger le PDF
    doc.save(`${fileName}.pdf`);
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'exportation en PDF:", error);
    return false;
  }
};

/**
 * Format les données pour un export PDF facile à lire
 */
export const formatMembershipForPDF = (membership: any) => {
  if (!membership) return {};
  
  return {
    "Informations personnelles": {
      "Nom": membership.last_name,
      "Prénom": membership.first_name,
      "Email": membership.email,
      "Téléphone": membership.contact_number,
      "Profession": membership.profession,
      "Adresse": membership.address || "Non spécifiée"
    },
    "Informations d'adhésion": {
      "Montant de souscription": `${membership.subscription_amount.toLocaleString()} FCFA`,
      "Mois de début": membership.subscription_start_month || "Non spécifié",
      "Mode de règlement": membership.payment_method,
      "Périodicité": membership.payment_frequency,
      "Date de demande": new Date(membership.requested_at).toLocaleDateString('fr-FR'),
      "Statut": membership.status === 'approved' ? 'Approuvé' : membership.status === 'pending' ? 'En attente' : 'Rejeté'
    },
    "Compétences et attentes": {
      "Domaines de compétence": membership.competence_domains || "Non spécifiés",
      "Attentes vis-à-vis du Club": membership.club_expectations ? membership.club_expectations.join(", ") : "Non spécifiées",
      "Autres attentes": membership.other_expectations || "Non spécifiées"
    }
  };
};

/**
 * Exporte les données au format CSV
 */
export const exportToCSV = (data: any[], fileName: string) => {
  try {
    // Reformater les données pour le CSV
    const formattedData = data.map(item => ({
      "Nom": item.last_name,
      "Prénom": item.first_name,
      "Email": item.email,
      "Téléphone": item.contact_number,
      "Profession": item.profession,
      "Adresse": item.address || "Non spécifiée",
      "Montant de souscription": `${item.subscription_amount} FCFA`,
      "Mois de début": item.subscription_start_month || "Non spécifié",
      "Mode de règlement": item.payment_method,
      "Périodicité": item.payment_frequency,
      "Domaines de compétence": item.competence_domains || "Non spécifiés",
      "Attentes": item.club_expectations ? item.club_expectations.join(", ") : "Non spécifiées",
      "Autres attentes": item.other_expectations || "Non spécifiées",
      "Date de demande": new Date(item.requested_at).toLocaleDateString('fr-FR'),
      "Statut": item.status === 'approved' ? 'Approuvé' : item.status === 'pending' ? 'En attente' : 'Rejeté',
      "Date d'approbation": item.approved_at ? new Date(item.approved_at).toLocaleDateString('fr-FR') : "N/A",
      "Approuvé par": item.approved_by || "N/A"
    }));
    
    // Créer un workbook
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Adhésions");
    
    // Générer le fichier et télécharger
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'exportation en CSV:", error);
    return false;
  }
};

/**
 * Génère un PDF pour un membre individuel
 */
export const generateMembershipPDF = (membership: any, fileName: string) => {
  try {
    const doc = new jsPDF();
    const formattedData = formatMembershipForPDF(membership);
    
    // Ajouter le titre
    doc.setFontSize(18);
    doc.text("Fiche d'adhésion - LA CITADELLE", 105, 15, { align: 'center' });
    
    // Ligne séparatrice
    doc.line(20, 20, 190, 20);
    
    let yPosition = 30;
    
    // Parcourir les sections
    Object.entries(formattedData).forEach(([sectionTitle, sectionData], sectionIndex) => {
      // Titre de section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(sectionTitle, 20, yPosition);
      yPosition += 8;
      
      // Contenu de la section
      doc.setFontSize(11);
      Object.entries(sectionData as Record<string, string>).forEach(([key, value], index) => {
        if (yPosition > 270) {
          // Ajouter une nouvelle page si on arrive en bas
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setTextColor(100, 100, 100);
        doc.text(`${key}: `, 25, yPosition);
        const valueStart = doc.getTextWidth(`${key}: `) + 25;
        doc.setTextColor(0, 0, 0);
        doc.text(value, valueStart, yPosition);
        yPosition += 7;
      });
      
      yPosition += 10;
    });
    
    // Pied de page
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, 105, 285, { align: 'center' });
    
    // Télécharger le PDF
    doc.save(`${fileName}.pdf`);
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    return false;
  }
};
