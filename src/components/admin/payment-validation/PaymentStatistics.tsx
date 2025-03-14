
// Composant pour afficher les statistiques de paiement
// Créé: Ajout des statistiques financières à la page de validation des paiements

import { CreditCard, Clock, CheckCircle, XCircle, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Payment } from "@/types/payment";
import { cn } from "@/lib/utils";

interface PaymentStatisticsProps {
  payments: Payment[];
}

export const PaymentStatistics = ({ payments }: PaymentStatisticsProps) => {
  // Calcul des statistiques
  const totalPayments = payments.length;
  const completedPayments = payments.filter(p => p.status === 'completed').length;
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const rejectedPayments = payments.filter(p => p.status === 'rejected').length;
  
  // Calcul des montants
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedAmount = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const rejectedAmount = payments
    .filter(p => p.status === 'rejected')
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Fonction pour formater les montants en FCFA
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  // Calcul du taux de conversion
  const conversionRate = totalPayments > 0 
    ? Math.round((completedPayments / totalPayments) * 100) 
    : 0;

  const cards = [
    {
      title: "Montant Total",
      value: formatAmount(totalAmount),
      description: `${totalPayments} paiements au total`,
      icon: CreditCard,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      title: "Montant Validé",
      value: formatAmount(completedAmount),
      description: `${completedPayments} paiements validés`,
      icon: CheckCircle,
      iconColor: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      title: "Montant En Attente",
      value: formatAmount(pendingAmount),
      description: `${pendingPayments} paiements en attente`,
      icon: Clock,
      iconColor: "text-orange-500",
      bgColor: "bg-orange-50"
    },
    {
      title: "Montant Rejeté",
      value: formatAmount(rejectedAmount),
      description: `${rejectedPayments} paiements rejetés`,
      icon: XCircle,
      iconColor: "text-red-500",
      bgColor: "bg-red-50"
    },
    {
      title: "Taux de Conversion",
      value: `${conversionRate}%`,
      description: `${completedPayments} validés sur ${totalPayments}`,
      icon: BarChart3,
      iconColor: "text-purple-500",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Statistiques Financières</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, index) => (
          <Card key={index} className="border-t-4 border-t-primary">
            <CardHeader className={cn("pb-2", card.bgColor)}>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={cn("h-4 w-4", card.iconColor)} />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
