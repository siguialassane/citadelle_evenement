
// Main SearchAndExport component that combines all subcomponents
import { SearchBar } from "./SearchBar";
import { ActionButtons } from "./ActionButtons";
import { StatisticsSection } from "./StatisticsSection";
import { exportToCSV, exportToPDF } from "./ExportFunctions";
import { type Participant } from "../../../../types/participant";

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
    exportToCSV(participants);
  };

  const handleExportPDF = async () => {
    await exportToPDF(filteredParticipants, onPdfGenerated);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <SearchBar 
          searchTerm={searchTerm} 
          onSearchChange={onSearchChange} 
        />
        <ActionButtons 
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          pdfDownloaded={pdfDownloaded}
          onDeleteDialogOpen={onDeleteDialogOpen}
        />
      </div>
      
      <StatisticsSection participants={participants} />
    </div>
  );
};
