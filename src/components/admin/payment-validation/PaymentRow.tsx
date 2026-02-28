
// Composant pour une ligne de paiement dans le tableau
// Extrait pour améliorer la lisibilité et faciliter la maintenance

import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { PaymentStatus } from "./PaymentStatus";
import { PaymentActions } from "./PaymentActions";
import { Payment } from "../../../types/payment";

interface PaymentRowProps {
  payment: Payment;
  currentPaymentId?: string;
  isValidating: boolean;
  isRejecting: boolean;
  onView: (id: string) => void;
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
}

export const PaymentRow = ({
  payment,
  currentPaymentId,
  isValidating,
  isRejecting,
  onView,
  onValidate,
  onReject,
}: PaymentRowProps) => {
  return (
    <TableRow key={payment.id}>
      <TableCell className="font-medium">
        <div>{payment.formatted_date}</div>
        <div className="text-xs text-gray-500">{payment.formatted_time}</div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{payment.participant_name}</div>
        <div className="text-xs text-gray-500">{payment.participant_email}</div>
        {(payment.number_of_places || 1) > 1 && (
          <div className="text-xs text-green-600 font-medium mt-0.5">{payment.number_of_places} places</div>
        )}
      </TableCell>
      <TableCell>
        <div>{payment.payment_method}</div>
        <div className="text-xs text-gray-500">{payment.phone_number}</div>
      </TableCell>
      <TableCell>{payment.amount} XOF</TableCell>
      <TableCell>
        <PaymentStatus status={payment.status} />
      </TableCell>
      <TableCell className="text-right">
        <PaymentActions
          paymentId={payment.id}
          status={payment.status}
          currentPaymentId={currentPaymentId}
          isValidating={isValidating}
          isRejecting={isRejecting}
          onView={onView}
          onValidate={onValidate}
          onReject={onReject}
        />
      </TableCell>
    </TableRow>
  );
};
