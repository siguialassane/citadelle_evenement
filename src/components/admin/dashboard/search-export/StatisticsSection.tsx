
// Section des statistiques avec bouton d'envoi d'emails
import { useState } from "react";
import { Participant } from "../../../../types/participant";
import { Users, UserCheck, UserX, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailSendingDialog } from "../email-sending/EmailSendingDialog";

interface StatisticsSectionProps {
  participants: Participant[];
}

export const StatisticsSection = ({ participants }: StatisticsSectionProps) => {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  
  // Calcul des statistiques
  const totalParticipants = participants.length;
  const checkedInParticipants = participants.filter(p => p.check_in_status).length;
  const checkedInPercentage = totalParticipants > 0 
    ? Math.round((checkedInParticipants / totalParticipants) * 100) 
    : 0;
  
  const memberParticipants = participants.filter(p => p.is_member).length;
  const memberPercentage = totalParticipants > 0 
    ? Math.round((memberParticipants / totalParticipants) * 100) 
    : 0;

  return (
    <div className="mt-4">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Statistiques</h2>
        <Button 
          onClick={() => setEmailDialogOpen(true)} 
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 mt-2 sm:mt-0"
        >
          <Mail className="h-4 w-4" />
          Envoi Email
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-full">
            <Users className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <p className="text-sm text-blue-700">Total Participants</p>
            <p className="text-2xl font-bold text-blue-900">{totalParticipants}</p>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
          <div className="bg-green-100 p-3 rounded-full">
            <UserCheck className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <p className="text-sm text-green-700">Enregistrés</p>
            <p className="text-2xl font-bold text-green-900">
              {checkedInParticipants} <span className="text-sm font-normal">({checkedInPercentage}%)</span>
            </p>
          </div>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-4 flex items-center gap-3">
          <div className="bg-amber-100 p-3 rounded-full">
            <UserX className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <p className="text-sm text-amber-700">Membres</p>
            <p className="text-2xl font-bold text-amber-900">
              {memberParticipants} <span className="text-sm font-normal">({memberPercentage}%)</span>
            </p>
          </div>
        </div>
      </div>
      
      <EmailSendingDialog 
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        participants={participants}
      />
    </div>
  );
};
