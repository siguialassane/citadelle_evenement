
// Composant de détails d'adhésion
// Créé pour afficher les détails d'une adhésion et permettre l'exportation en PDF

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, FileText, Download, Trash } from 'lucide-react';
import { generateMembershipPDF } from '@/utils/exportUtils';
import { toast } from '@/hooks/use-toast';

interface MembershipDetailsProps {
  membership: any;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}

const MembershipDetails: React.FC<MembershipDetailsProps> = ({
  membership,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onDelete
}) => {
  const detailsRef = useRef<HTMLDivElement>(null);

  if (!membership) return null;

  const formatMembershipDetails = (membership: any) => {
    if (!membership) return [];
    
    return [
      { label: "Prénom", value: membership.first_name },
      { label: "Nom", value: membership.last_name },
      { label: "Email", value: membership.email },
      { label: "Téléphone", value: membership.contact_number },
      { label: "Profession", value: membership.profession },
      { label: "Adresse", value: membership.address || "Non spécifiée" },
      { label: "Montant de souscription", value: `${membership.subscription_amount.toLocaleString()} FCFA` },
      { label: "Mois de début", value: membership.subscription_start_month || "Non spécifié" },
      { label: "Mode de règlement", value: membership.payment_method },
      { label: "Périodicité", value: membership.payment_frequency },
      { label: "Domaines de compétence", value: membership.competence_domains || "Non spécifiés" },
      { label: "Attentes vis-à-vis du Club", value: membership.club_expectations ? membership.club_expectations.join(", ") : "Non spécifiées" },
      { label: "Autres attentes", value: membership.other_expectations || "Non spécifiées" },
      { label: "Date de demande", value: new Date(membership.requested_at).toLocaleDateString('fr-FR') }
    ];
  };

  const handleExportPDF = () => {
    const fileName = `adhesion_${membership.first_name.toLowerCase()}_${membership.last_name.toLowerCase()}`;
    const success = generateMembershipPDF(membership, fileName);
    
    if (success) {
      toast({
        title: "Exportation réussie",
        description: "Le fichier PDF a été généré et téléchargé.",
      });
    } else {
      toast({
        title: "Erreur d'exportation",
        description: "Impossible de générer le fichier PDF.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette adhésion ? Cette action est irréversible.")) {
      onDelete(membership.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails de l'adhésion</DialogTitle>
          <DialogDescription>
            Informations complètes sur la demande d'adhésion
          </DialogDescription>
        </DialogHeader>
        
        <div ref={detailsRef} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {formatMembershipDetails(membership).map((detail, index) => (
              <div key={index} className="space-y-1">
                <h4 className="text-sm font-medium text-gray-500">{detail.label}</h4>
                <p className="text-sm">{detail.value}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap justify-end mt-6 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="flex items-center gap-1"
          >
            <FileText className="h-4 w-4" />
            Exporter en PDF
          </Button>
          
          {membership.status === 'pending' && (
            <>
              <Button
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  onApprove(membership.id);
                  onClose();
                }}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approuver
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onReject(membership.id);
                  onClose();
                }}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Rejeter
              </Button>
            </>
          )}
          
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleDelete}
            className="flex items-center gap-1"
          >
            <Trash className="h-4 w-4" />
            Supprimer
          </Button>
          
          <DialogClose asChild>
            <Button variant="outline" size="sm">Fermer</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MembershipDetails;
