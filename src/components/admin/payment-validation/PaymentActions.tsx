
// Composant pour les actions sur un paiement (visualiser, valider, rejeter)
// Extrait pour faciliter la maintenance et améliorer la lisibilité du code

import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Eye, XCircle } from "lucide-react";

interface PaymentActionsProps {
  paymentId: string;
  status: string;
  currentPaymentId?: string;
  isValidating: boolean;
  isRejecting: boolean;
  onView: (id: string) => void;
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
}

export const PaymentActions = ({
  paymentId,
  status,
  currentPaymentId,
  isValidating,
  isRejecting,
  onView,
  onValidate,
  onReject,
}: PaymentActionsProps) => {
  return (
    <div className="flex justify-end space-x-2">
      <Button variant="ghost" size="icon" onClick={() => onView(paymentId)}>
        <Eye className="h-4 w-4" />
      </Button>

      {status === "pending" && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onReject(paymentId)}
            disabled={isRejecting || isValidating}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isRejecting && paymentId === currentPaymentId ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onValidate(paymentId)}
            disabled={isValidating || isRejecting}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            {isValidating && paymentId === currentPaymentId ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
          </Button>
        </>
      )}
    </div>
  );
};
