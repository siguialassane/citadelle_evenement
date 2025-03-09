
// Component displaying statistics for participants dashboard
import { type Participant } from "../../../../types/participant";

interface StatisticsSectionProps {
  participants: Participant[];
}

export const StatisticsSection = ({ participants }: StatisticsSectionProps) => {
  // Function to count confirmed payments
  const countConfirmedPayments = () => {
    let count = 0;
    
    participants.forEach(participant => {
      // Check standard payments first
      if (participant.payments && participant.payments.length > 0) {
        const standardPaymentConfirmed = participant.payments.some(
          payment => payment.status?.toUpperCase() === "SUCCESS" || 
                    payment.status?.toUpperCase() === "APPROVED"
        );
        
        if (standardPaymentConfirmed) {
          count++;
          return; // If a standard payment is confirmed, move to next participant
        }
      }
      
      // Then check manual payments
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
  );
};
