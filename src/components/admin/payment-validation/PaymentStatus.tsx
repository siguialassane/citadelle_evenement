
// Composant pour afficher le statut de paiement avec une couleur appropriée
// Extrait pour rendre le code plus modulaire et réutilisable

import React from "react";

interface PaymentStatusProps {
  status: string;
}

export const PaymentStatus = ({ status }: PaymentStatusProps) => {
  return (
    <div
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        status === "completed"
          ? "bg-green-100 text-green-800"
          : status === "rejected"
          ? "bg-red-100 text-red-800"
          : "bg-yellow-100 text-yellow-800"
      }`}
    >
      {status === "completed"
        ? "Validé"
        : status === "rejected"
        ? "Rejeté"
        : "En attente"}
    </div>
  );
};
