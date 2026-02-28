
// Composant pour l'affichage détaillé d'un paiement
// Extrait pour améliorer la lisibilité et la maintenance

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { PaymentStatus } from "./PaymentStatus";
import { Payment } from "../../../types/payment";

interface PaymentDetailCardProps {
  payment: Payment;
  isValidating: boolean;
  isRejecting: boolean;
  onBack: () => void;
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
}

export const PaymentDetailCard = ({
  payment,
  isValidating,
  isRejecting,
  onBack,
  onValidate,
  onReject,
}: PaymentDetailCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Détails du paiement de {payment.participant_name}
        </CardTitle>
        <CardDescription>
          {payment.participant_email} • {payment.participant_phone}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Méthode de paiement
              </p>
              <p>{payment.payment_method}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Montant</p>
              <p>{payment.amount} XOF</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Numéro de téléphone
              </p>
              <p>{payment.phone_number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Date de création
              </p>
              <p>
                {payment.formatted_date} à {payment.formatted_time}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Nombre de places
              </p>
              <p className="font-semibold">{payment.number_of_places || 1}</p>
            </div>
          </div>

          <Separator />

          {/* Liste des invités si multi-places */}
          {payment.guests && payment.guests.length > 1 && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Participants ({payment.guests.length})</p>
                <div className="space-y-2">
                  {payment.guests.map((guest: any, index: number) => (
                    <div key={guest.id || index} className={`flex items-center gap-2 p-2 rounded ${guest.is_main_participant ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <span className="text-sm font-medium text-gray-500 w-8">#{index + 1}</span>
                      <span className="text-sm">{guest.first_name} {guest.last_name}</span>
                      {guest.is_main_participant && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Principal</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          <div>
            <p className="text-sm font-medium text-gray-500">Commentaires</p>
            <p>{payment.comments || "Aucun commentaire"}</p>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium text-gray-500">Statut actuel</p>
            <PaymentStatus status={payment.status} />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row sm:justify-end gap-3">
        <Button variant="outline" onClick={onBack}>
          Retour
        </Button>

        {payment.status === "pending" && (
          <>
            <Button
              variant="outline"
              onClick={() => onReject(payment.id)}
              disabled={isRejecting || isValidating}
              className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
            >
              {isRejecting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Rejet en cours...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Rejeter
                </>
              )}
            </Button>

            <Button
              onClick={() => onValidate(payment.id)}
              disabled={isValidating || isRejecting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isValidating ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Validation...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Valider
                </>
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};
