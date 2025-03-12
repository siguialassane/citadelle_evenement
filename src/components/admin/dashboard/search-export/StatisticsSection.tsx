
import { type Participant } from "../../../../types/participant";

interface StatisticsSectionProps {
  participants: Participant[];
}

export const StatisticsSection = ({ participants }: StatisticsSectionProps) => {
  // Calculate statistics
  const totalParticipants = participants.length;
  
  const confirmedPayments = participants.filter(p => 
    (p.payments && p.payments.length > 0 && p.payments[0].status.toLowerCase() === 'completed') ||
    (p.manual_payments && p.manual_payments.length > 0 && p.manual_payments[0].status.toLowerCase() === 'completed')
  ).length;
  
  const checkedInCount = participants.filter(p => p.check_in_status).length;

  const confirmedPaymentsPercentage = totalParticipants > 0 ? Math.round((confirmedPayments / totalParticipants) * 100) : 0;
  const checkedInPercentage = totalParticipants > 0 ? Math.round((checkedInCount / totalParticipants) * 100) : 0;

  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
        <div className="bg-blue-100 p-3 rounded-full">
          <svg className="h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-blue-700">Total Participants</p>
          <p className="text-2xl font-bold text-blue-900">{totalParticipants}</p>
        </div>
      </div>
      
      <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
        <div className="bg-green-100 p-3 rounded-full">
          <svg className="h-5 w-5 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-green-700">Paiements confirmés</p>
          <p className="text-2xl font-bold text-green-900">
            {confirmedPayments} <span className="text-sm font-normal">({confirmedPaymentsPercentage}%)</span>
          </p>
        </div>
      </div>
      
      <div className="bg-amber-50 rounded-lg p-4 flex items-center gap-3">
        <div className="bg-amber-100 p-3 rounded-full">
          <svg className="h-5 w-5 text-amber-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-amber-700">Participants enregistrés</p>
          <p className="text-2xl font-bold text-amber-900">
            {checkedInCount} <span className="text-sm font-normal">({checkedInPercentage}%)</span>
          </p>
        </div>
      </div>
    </div>
  );
};
