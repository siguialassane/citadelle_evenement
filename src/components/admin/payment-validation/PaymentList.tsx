
// Composant pour la liste des paiements sous forme de tableau
// Extrait pour une meilleure organisation du code

import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PaymentRow } from "./PaymentRow";
import { Payment } from "../../../types/payment";

interface PaymentListProps {
  payments: Payment[];
  isLoading: boolean;
  currentPaymentId?: string;
  isValidating: boolean;
  isRejecting: boolean;
  onViewDetails: (id: string) => void;
  onValidatePayment: (id: string) => void;
  onRejectPayment: (id: string) => void;
}

export const PaymentList = ({
  payments,
  isLoading,
  currentPaymentId,
  isValidating,
  isRejecting,
  onViewDetails,
  onValidatePayment,
  onRejectPayment,
}: PaymentListProps) => {
  if (payments.length === 0 && !isLoading) {
    return (
      <Alert variant="default">
        <AlertTitle>Aucun paiement trouvé</AlertTitle>
        <AlertDescription>
          Aucun paiement ne correspond à votre recherche.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead>Participant</TableHead>
            <TableHead>Méthode</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              currentPaymentId={currentPaymentId}
              isValidating={isValidating}
              isRejecting={isRejecting}
              onView={onViewDetails}
              onValidate={onValidatePayment}
              onReject={onRejectPayment}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
