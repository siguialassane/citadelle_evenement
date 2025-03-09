// Composant pour la recherche et l'export des participants
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Download, FileText, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { type Participant } from "../../../types/participant";

interface SearchAndExportProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  participants: Participant[];
  filteredParticipants: Participant[];
  isRefreshing: boolean;
  onRefresh: () => void;
  pdfDownloaded: boolean;
  onPdfGenerated: () => void;
  onDeleteDialogOpen: () => void;
}

export const SearchAndExport = ({
  searchTerm,
  onSearchChange,
  participants,
  filteredParticipants,
  isRefreshing,
  onRefresh,
  pdfDownloaded,
  onPdfGenerated,
  onDeleteDialogOpen
}: SearchAndExportProps) => {
  
  const handleExportCSV = () => {
    const headers = [
      "Nom", 
      "Prénom", 
      "Email", 
      "Téléphone", 
      "Membre", 
      "Présent", 
      "Date d'inscription", 
      "Statut du paiement", 
      "Montant"
    ];
    
    const rows = participants.map(participant => [
      participant.last_name,
      participant.first_name,
      participant.email,
      participant.contact_number,
      participant.is_member ? "Oui" : "Non",
      participant.check_in_status ? "Oui" : "Non",
      new Date(participant.created_at).toLocaleDateString(),
      participant.payments?.[0]?.status || "Non payé",
      participant.payments?.[0]?.amount ? `${participant.payments[0].amount} ${participant.payments[0].currency || 'XOF'}` : "N/A"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `participants-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
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
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text('Liste des participants', margin, margin + 10);
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`Extrait le: ${new Date().toLocaleDateString('fr-FR')}`, margin, margin + 20);
      
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
        
        const paymentStatus = participant.payments?.[0]?.status?.toUpperCase() || "NON PAYÉ";
        pdf.text(
          paymentStatus === "SUCCESS" || paymentStatus === "APPROVED" 
            ? "Confirmé" 
            : paymentStatus === "PENDING" 
              ? "En cours" 
              : "Non payé", 
          xPosition + 2, 
          yPosition + 5
        );
        
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

  // Fonction pour compter les paiements confirmés
  const countConfirmedPayments = () => {
    let count = 0;
    
    participants.forEach(participant => {
      // Vérifier d'abord les paiements standards
      if (participant.payments && participant.payments.length > 0) {
        const standardPaymentConfirmed = participant.payments.some(
          payment => payment.status?.toUpperCase() === "SUCCESS" || 
                    payment.status?.toUpperCase() === "APPROVED"
        );
        
        if (standardPaymentConfirmed) {
          count++;
          return; // Si un paiement standard est confirmé, on passe au participant suivant
        }
      }
      
      // Vérifier ensuite les paiements manuels
      if (participant.manual_payments && participant.manual_payments.length > 0) {
        const manualPaymentConfirmed = participant.manual_payments.some(
          payment => payment.status?.toLowerCase() === "completed"
        );
        
        if (manualPaymentConfirmed) {
          count++;
        }
      }
    });
    
    return count;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            className="pl-10"
            placeholder="Rechercher un participant..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button 
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={handleExportPDF}
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          
          {pdfDownloaded && (
            <Button 
              variant="destructive"
              className="flex items-center gap-2 ml-2"
              onClick={onDeleteDialogOpen}
            >
              <Trash2 className="h-4 w-4" />
              Vider
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-indigo-50 p-4 rounded-lg">
          <p className="text-indigo-800 font-medium">Total des participants</p>
          <p className="text-2xl font-bold">{participants.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-green-800 font-medium">Paiements confirmés</p>
          <p className="text-2xl font-bold">
            {countConfirmedPayments()}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-800 font-medium">Participants enregistrés</p>
          <p className="text-2xl font-bold">
            {participants.filter(p => p.check_in_status).length}
          </p>
        </div>
      </div>
    </div>
  );
};
