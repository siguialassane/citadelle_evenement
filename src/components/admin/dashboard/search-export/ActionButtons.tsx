
// Component for action buttons in the dashboard
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, FileText, Trash2 } from "lucide-react";

interface ActionButtonsProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  pdfDownloaded: boolean;
  onDeleteDialogOpen: () => void;
}

export const ActionButtons = ({
  isRefreshing,
  onRefresh,
  onExportCSV,
  onExportPDF,
  pdfDownloaded,
  onDeleteDialogOpen
}: ActionButtonsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
        onClick={onExportCSV}
      >
        <Download className="h-4 w-4" />
        CSV
      </Button>
      <Button 
        className="flex items-center gap-2"
        onClick={onExportPDF}
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
  );
};
