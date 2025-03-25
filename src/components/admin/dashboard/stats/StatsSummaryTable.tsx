
// Tableau récapitulatif des statistiques avec données détaillées 
// Créé pour afficher toutes les statistiques importantes dans un format tabulaire pour impression et export

import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface StatsSummaryTableProps {
  summaryData: {
    totalParticipants: number;
    totalRevenue: number;
    totalCheckedIn: number;
    totalMembers: number;
  };
  paymentMethodsData: {
    method: string;
    count: number;
    amount: number;
  }[];
  membershipStatusData: {
    status: string;
    count: number;
  }[];
  checkInData: {
    status: string;
    count: number;
  }[];
  className?: string;
}

export const StatsSummaryTable = ({ 
  summaryData, 
  paymentMethodsData, 
  membershipStatusData,
  checkInData,
  className 
}: StatsSummaryTableProps) => {
  const formatMoneyAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return "0%";
    return `${Math.round((value / total) * 100)}%`;
  };

  const currentDate = format(new Date(), 'PPP', { locale: fr });
  
  // Calculer les totaux
  const totalPayments = paymentMethodsData.reduce((sum, item) => sum + item.count, 0);
  const totalRevenue = paymentMethodsData.reduce((sum, item) => sum + item.amount, 0);
  const totalMemberships = membershipStatusData.reduce((sum, item) => sum + item.count, 0);
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className || ''}`}>
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Tableau récapitulatif des statistiques</h2>
        <p className="text-sm text-gray-500">Rapport généré le {currentDate} - IFTAR 2025</p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableCaption>Statistiques complètes de l'événement au {currentDate}</TableCaption>
          
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead colSpan={3} className="text-center font-bold">Récapitulatif Général</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            <TableRow className="border-b">
              <TableCell className="font-medium">Total des participants inscrits</TableCell>
              <TableCell className="text-right">{summaryData.totalParticipants}</TableCell>
              <TableCell className="text-right">100%</TableCell>
            </TableRow>
            <TableRow className="border-b">
              <TableCell className="font-medium">Participants présents (enregistrés)</TableCell>
              <TableCell className="text-right">{summaryData.totalCheckedIn}</TableCell>
              <TableCell className="text-right">{calculatePercentage(summaryData.totalCheckedIn, summaryData.totalParticipants)}</TableCell>
            </TableRow>
            <TableRow className="border-b">
              <TableCell className="font-medium">Participants absents (non-enregistrés)</TableCell>
              <TableCell className="text-right">{summaryData.totalParticipants - summaryData.totalCheckedIn}</TableCell>
              <TableCell className="text-right">{calculatePercentage(summaryData.totalParticipants - summaryData.totalCheckedIn, summaryData.totalParticipants)}</TableCell>
            </TableRow>
            <TableRow className="border-b">
              <TableCell className="font-medium">Total des revenus collectés</TableCell>
              <TableCell className="text-right" colSpan={2}>{formatMoneyAmount(summaryData.totalRevenue)}</TableCell>
            </TableRow>
          </TableBody>
          
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead colSpan={3} className="text-center font-bold">Détails des Paiements</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {paymentMethodsData.map((method, index) => (
              <TableRow key={index} className="border-b">
                <TableCell className="font-medium">{method.method}</TableCell>
                <TableCell className="text-right">{method.count} transaction(s) ({calculatePercentage(method.count, totalPayments)})</TableCell>
                <TableCell className="text-right">{formatMoneyAmount(method.amount)} ({calculatePercentage(method.amount, totalRevenue)})</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/20">
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="text-right font-bold">{totalPayments} transaction(s)</TableCell>
              <TableCell className="text-right font-bold">{formatMoneyAmount(totalRevenue)}</TableCell>
            </TableRow>
          </TableBody>
          
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead colSpan={3} className="text-center font-bold">Statut des Participants</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {checkInData.map((status, index) => (
              <TableRow key={index} className="border-b">
                <TableCell className="font-medium">{status.status}</TableCell>
                <TableCell className="text-right">{status.count}</TableCell>
                <TableCell className="text-right">{calculatePercentage(status.count, summaryData.totalParticipants)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead colSpan={3} className="text-center font-bold">Adhésions</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {membershipStatusData.map((status, index) => (
              <TableRow key={index} className="border-b">
                <TableCell className="font-medium">{status.status}</TableCell>
                <TableCell className="text-right">{status.count}</TableCell>
                <TableCell className="text-right">{calculatePercentage(status.count, totalMemberships)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/20">
              <TableCell className="font-medium">Total des demandes d'adhésion</TableCell>
              <TableCell className="text-right font-bold">{totalMemberships}</TableCell>
              <TableCell className="text-right">-</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Ratio adhésions/participants</TableCell>
              <TableCell className="text-right" colSpan={2}>{calculatePercentage(totalMemberships, summaryData.totalParticipants)} des participants ont demandé une adhésion</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
