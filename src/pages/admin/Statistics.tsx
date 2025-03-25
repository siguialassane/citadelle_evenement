
// Page des statistiques générales avec des graphiques
// Mise à jour: Amélioration de la présentation visuelle et ajout de détails sur les périodes d'inscription
// Affiche les données statistiques sous forme de camemberts et de graphiques avec des détails plus précis

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, 
  Area, AreaChart, LabelList
} from "recharts";
import { Header } from "@/components/admin/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { 
  Printer, 
  Download, 
  Calendar, 
  Users, 
  Wallet, 
  CheckCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Event = {
  date: string;
  participants: number;
  completed_payments: number;
  check_ins: number;
};

type PaymentMethodData = {
  method: string;
  count: number;
  amount: number;
};

type CheckInStatistics = {
  status: string;
  count: number;
};

// Périodes d'inscription (données fictives à remplacer par des données réelles)
const registrationPeriods = [
  { period: '3 mois avant', count: 15, date: '15 déc 2024' },
  { period: '2 mois avant', count: 28, date: '15 jan 2025' },
  { period: '1 mois avant', count: 42, date: '15 fév 2025' },
  { period: '3 semaines avant', count: 60, date: '22 fév 2025' },
  { period: '2 semaines avant', count: 85, date: '1 mar 2025' },
  { period: '1 semaine avant', count: 120, date: '8 mar 2025' },
  { period: 'Derniers jours', count: 150, date: '14 mar 2025' },
  { period: 'Jour J', count: 165, date: '15 mar 2025' }
];

const COLORS = ['#10B981', '#8B5CF6', '#0EA5E9', '#F59E0B', '#EC4899', '#EF4444', '#64748B', '#6366F1'];
const PAYMENT_COLORS = {
  'Mobile Money': '#0EA5E9',
  'Carte': '#8B5CF6',
  'Espèces': '#10B981',
  'Virement': '#F59E0B',
  'Orange Money': '#F97316',
  'Wave': '#06B6D4',
  'MTN Mobile Money': '#FCD34D',
  'Autre': '#64748B'
};

const Statistics = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<Event[]>([]);
  const [paymentMethodsData, setPaymentMethodsData] = useState<PaymentMethodData[]>([]);
  const [checkInData, setCheckInData] = useState<CheckInStatistics[]>([]);
  const [membershipStatusData, setMembershipStatusData] = useState<{ status: string; count: number }[]>([]);
  const [summaryData, setSummaryData] = useState({
    totalParticipants: 0,
    totalRevenue: 0,
    totalCheckedIn: 0,
    totalMembers: 0
  });

  useEffect(() => {
    const checkAuth = () => {
      const isAdmin = localStorage.getItem("adminAuth") === "true";
      if (!isAdmin) {
        toast({
          title: "Accès non autorisé",
          description: "Veuillez vous connecter pour accéder aux statistiques.",
          variant: "destructive",
        });
        navigate("/admin/login");
      }
    };

    checkAuth();
    fetchStatisticsData();
  }, [navigate]);

  const fetchStatisticsData = async () => {
    setLoading(true);
    try {
      // Récupération des participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*');

      if (participantsError) {
        throw participantsError;
      }

      // Récupération des paiements
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*');

      if (paymentsError) {
        throw paymentsError;
      }

      // Récupération des paiements manuels
      const { data: manualPaymentsData, error: manualPaymentsError } = await supabase
        .from('manual_payments')
        .select('*');

      if (manualPaymentsError) {
        throw manualPaymentsError;
      }

      // Récupération des adhésions
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('memberships')
        .select('*');

      if (membershipsError) {
        throw membershipsError;
      }

      // Analyse des méthodes de paiement
      const allPayments = [
        ...(paymentsData || []).map(p => ({ method: p.payment_method, amount: p.amount })),
        ...(manualPaymentsData || []).map(p => ({ method: p.payment_method, amount: p.amount }))
      ];

      const paymentMethods: Record<string, { count: number, amount: number }> = {};
      allPayments.forEach(payment => {
        const method = payment.method || 'Autre';
        if (!paymentMethods[method]) {
          paymentMethods[method] = { count: 0, amount: 0 };
        }
        paymentMethods[method].count += 1;
        paymentMethods[method].amount += Number(payment.amount) || 0;
      });

      const paymentMethodsArray = Object.entries(paymentMethods).map(([method, stats]) => ({
        method,
        count: stats.count,
        amount: stats.amount
      }));
      setPaymentMethodsData(paymentMethodsArray);

      // Statistiques de check-in
      const totalParticipants = participantsData?.length || 0;
      const checkedIn = participantsData?.filter(p => p.check_in_status).length || 0;
      const notCheckedIn = totalParticipants - checkedIn;
      
      setCheckInData([
        { status: 'Présents', count: checkedIn },
        { status: 'Absents', count: notCheckedIn }
      ]);

      // Statut des adhésions
      const membershipStats: Record<string, number> = {};
      (membershipsData || []).forEach(membership => {
        const status = membership.status || 'Non spécifié';
        const displayStatus = 
          status === 'pending' ? 'En attente' : 
          status === 'approved' ? 'Approuvées' : 
          status === 'rejected' ? 'Rejetées' : status;
          
        membershipStats[displayStatus] = (membershipStats[displayStatus] || 0) + 1;
      });

      const membershipStatusArray = Object.entries(membershipStats).map(([status, count]) => ({
        status,
        count
      }));
      setMembershipStatusData(membershipStatusArray);

      // Calcul des revenus totaux
      const totalRevenue = allPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      
      // Données récapitulatives
      setSummaryData({
        totalParticipants: totalParticipants,
        totalRevenue: totalRevenue,
        totalCheckedIn: checkedIn,
        totalMembers: membershipsData?.filter(m => m.status === 'approved').length || 0
      });

    } catch (error) {
      console.error("Erreur lors de la récupération des données statistiques:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les données statistiques.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatMoneyAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const handleRefresh = async () => {
    await fetchStatisticsData();
    toast({
      title: "Données actualisées",
      description: "Les statistiques ont été mises à jour.",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès.",
    });
    navigate("/");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onLogout={handleLogout} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <Header onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Statistiques générales
            </h1>
            <p className="text-gray-500 mt-1">IFTAR 2025 - 15 Mars 2025</p>
          </div>
          
          <div className="flex items-center gap-3 print:hidden">
            <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
            <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exporter PDF
            </Button>
            <Button onClick={() => navigate('/admin/dashboard')}>
              Retour au tableau de bord
            </Button>
          </div>
        </div>

        {/* Cartes récapitulatives */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-t-4 border-t-blue-500">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium">Participants</CardTitle>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{summaryData.totalParticipants}</p>
              <p className="text-sm text-muted-foreground mt-1">Inscrits à l'événement</p>
            </CardContent>
          </Card>
          
          <Card className="border-t-4 border-t-green-500">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium">Revenus</CardTitle>
                <Wallet className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatMoneyAmount(summaryData.totalRevenue)}</p>
              <p className="text-sm text-muted-foreground mt-1">Total des paiements reçus</p>
            </CardContent>
          </Card>
          
          <Card className="border-t-4 border-t-amber-500">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium">Présences</CardTitle>
                <CheckCircle className="h-5 w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{summaryData.totalCheckedIn}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {summaryData.totalParticipants > 0 
                  ? `${Math.round((summaryData.totalCheckedIn / summaryData.totalParticipants) * 100)}% de participation`
                  : "Pas de participants"}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-t-4 border-t-purple-500">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium">Membres</CardTitle>
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{summaryData.totalMembers}</p>
              <p className="text-sm text-muted-foreground mt-1">Adhésions approuvées</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="general">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
            <TabsTrigger value="memberships">Adhésions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des inscriptions avant l'événement</CardTitle>
                <CardDescription>
                  Progression des inscriptions du 15 décembre 2024 au 15 mars 2025 (jour de l'événement)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={registrationPeriods} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [value, 'Inscrits']}
                        labelFormatter={(label) => {
                          const item = registrationPeriods.find(p => p.period === label);
                          return `${label} (${item?.date})`;
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        name="Participants inscrits" 
                        stroke="#8B5CF6" 
                        fill="#8B5CF6" 
                        fillOpacity={0.3}
                      >
                        <LabelList dataKey="count" position="top" />
                      </Area>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-4">
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200 mr-2">
                    <Calendar className="mr-1 h-3 w-3" />
                    Événement: 15 Mars 2025
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                    <Clock className="mr-1 h-3 w-3" />
                    Début des inscriptions: 15 Décembre 2024
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Statut des participants</CardTitle>
                  <CardDescription>Répartition des participants présents et absents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={checkInData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={isMobile ? 80 : 100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="status"
                          label={({ name, percent, value }) => 
                            `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          {checkInData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={index === 0 ? '#10B981' : '#EF4444'} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name) => [`${value} participants`, name]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
                <CardFooter className="text-sm text-gray-500 border-t px-6 py-3">
                  Données enregistrées le jour de l'événement (15 Mars 2025)
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Méthodes de paiement</CardTitle>
                  <CardDescription>Répartition des paiements par méthode</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodsData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={isMobile ? 80 : 100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="method"
                          label={({ name, percent }) => 
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {paymentMethodsData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={PAYMENT_COLORS[entry.method as keyof typeof PAYMENT_COLORS] || COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => {
                            if (name === 'count') {
                              return [`${value} transactions`, 'Nombre'];
                            }
                            return [value, name];
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
                <CardFooter className="text-sm text-gray-500 border-t px-6 py-3">
                  Statistiques basées sur {paymentMethodsData.reduce((sum, item) => sum + item.count, 0)} transactions
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Valeur des paiements par méthode</CardTitle>
                <CardDescription>Montant total des paiements reçus par méthode</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={paymentMethodsData} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="method" type="category" width={100} />
                      <Tooltip 
                        formatter={(value) => [`${formatMoneyAmount(Number(value))}`, 'Montant']}
                      />
                      <Legend />
                      <Bar 
                        dataKey="amount" 
                        name="Montant (FCFA)" 
                        fill="#8B5CF6"
                      >
                        {paymentMethodsData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={PAYMENT_COLORS[entry.method as keyof typeof PAYMENT_COLORS] || COLORS[index % COLORS.length]} 
                          />
                        ))}
                        <LabelList 
                          dataKey="amount" 
                          position="right" 
                          formatter={(value) => formatMoneyAmount(Number(value))}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-gray-500 border-t px-6 py-3">
                Montant total collecté: {formatMoneyAmount(summaryData.totalRevenue)}
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Nombre de transactions par méthode</CardTitle>
                <CardDescription>Nombre de paiements effectués par méthode</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={paymentMethodsData} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="method" type="category" width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="count" 
                        name="Nombre de transactions" 
                        fill="#0EA5E9"
                      >
                        {paymentMethodsData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={PAYMENT_COLORS[entry.method as keyof typeof PAYMENT_COLORS] || COLORS[index % COLORS.length]} 
                          />
                        ))}
                        <LabelList dataKey="count" position="right" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-gray-500 border-t px-6 py-3">
                Total: {paymentMethodsData.reduce((sum, item) => sum + item.count, 0)} transactions
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="memberships" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Statut des adhésions</CardTitle>
                <CardDescription>Répartition des adhésions par statut</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full flex justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={membershipStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={isMobile ? 120 : 150}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="status"
                        label={({ name, percent, value }) => 
                          `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                        }
                      >
                        {membershipStatusData.map((entry, index) => {
                          let color = COLORS[index % COLORS.length];
                          if (entry.status === 'Approuvées') color = '#10B981';
                          if (entry.status === 'En attente') color = '#F59E0B';
                          if (entry.status === 'Rejetées') color = '#EF4444';
                          
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} adhésions`, name]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-gray-500 border-t px-6 py-3">
                Total: {membershipStatusData.reduce((sum, item) => sum + item.count, 0)} demandes d'adhésion
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Répartition des adhérents</CardTitle>
                <CardDescription>Nombre d'adhérents par mois d'adhésion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { month: 'Jan', count: 12 },
                        { month: 'Fév', count: 15 },
                        { month: 'Mar', count: 8 },
                        { month: 'Avr', count: 10 },
                        { month: 'Mai', count: 20 },
                        { month: 'Juin', count: 25 }
                      ]} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="count" 
                        name="Adhérents" 
                        fill="#8B5CF6"
                      >
                        <LabelList dataKey="count" position="top" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-gray-500 border-t px-6 py-3">
                Données pour l'année 2025
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Statistics;
