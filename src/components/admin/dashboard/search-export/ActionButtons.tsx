
// Component for action buttons in the dashboard
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefreshCw, Download, FileText, Trash2, ChevronDown, CheckCircle2, XCircle, Users } from "lucide-react";

type PdfFilterType = 'all' | 'paid' | 'unpaid';

interface ActionButtonsProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  onExportCSV: () => void;
  onExportPDF: (filterType: PdfFilterType) => void;
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

      {/* Dropdown PDF avec filtres par statut de paiement */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900">
            <FileText className="h-4 w-4" />
            PDF
            <ChevronDown className="h-3 w-3 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs text-gray-500">Exporter en PDF</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onExportPDF('all')} className="cursor-pointer gap-2">
            <Users className="h-4 w-4 text-gray-600" />
            <div>
              <div className="font-medium">Tous les participants</div>
              <div className="text-xs text-gray-400">Liste complète</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExportPDF('paid')} className="cursor-pointer gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <div>
              <div className="font-medium text-green-700">Paiements confirmés</div>
              <div className="text-xs text-gray-400">Participants ayant payé</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExportPDF('unpaid')} className="cursor-pointer gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <div>
              <div className="font-medium text-red-600">Non payés</div>
              <div className="text-xs text-gray-400">Paiement en attente / absent</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
