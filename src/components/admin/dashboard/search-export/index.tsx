
// Main SearchAndExport component that combines all subcomponents
import { SearchBar } from "./SearchBar";
import { ActionButtons } from "./ActionButtons";
import { StatisticsSection } from "./StatisticsSection";
import { exportToCSV, exportToPDF } from "./ExportFunctions";
import { type Participant } from "../../../../types/participant";
import { Button } from "../../../ui/button";

type PdfFilterType = 'all' | 'paid' | 'unpaid';
type PresenceFilter = 'all' | 'present' | 'absent';

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
  presenceFilter: PresenceFilter;
  onPresenceFilterChange: (filter: PresenceFilter) => void;
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
  onDeleteDialogOpen,
  presenceFilter,
  onPresenceFilterChange,
}: SearchAndExportProps) => {
  
  const handleExportCSV = () => {
    exportToCSV(participants);
  };

  const handleExportPDF = async (filterType: PdfFilterType = 'all') => {
    await exportToPDF(filteredParticipants, onPdfGenerated, filterType);
  };

  const presentCount = participants.filter(p => p.check_in_status === true).length;
  const absentCount = participants.filter(p => !p.check_in_status).length;

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 w-full">
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

      {/* Filtre par présence */}
      <div className="flex flex-wrap gap-2 mt-3">
        <Button
          variant={presenceFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPresenceFilterChange('all')}
        >
          Tous ({participants.length})
        </Button>
        <Button
          variant={presenceFilter === 'present' ? 'default' : 'outline'}
          size="sm"
          className={presenceFilter === 'present' ? 'bg-green-600 hover:bg-green-700' : 'text-green-600 border-green-600 hover:bg-green-50'}
          onClick={() => onPresenceFilterChange('present')}
        >
          Présents ({presentCount})
        </Button>
        <Button
          variant={presenceFilter === 'absent' ? 'default' : 'outline'}
          size="sm"
          className={presenceFilter === 'absent' ? 'bg-red-600 hover:bg-red-700' : 'text-red-600 border-red-600 hover:bg-red-50'}
          onClick={() => onPresenceFilterChange('absent')}
        >
          Absents ({absentCount})
        </Button>
      </div>
      
      <StatisticsSection participants={participants} />
    </div>
  );
};
