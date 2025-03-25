
// Page des statistiques générales avec des graphiques
// Affiche les données statistiques sous forme de camemberts et de graphiques

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line 
} from "recharts";
import { Header } from "@/components/admin/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";

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

const COLORS = ['#8B5CF6', '#EC4899', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444'];

const Statistics = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<Event[]>([]);
  const [paymentMethodsData, setPaymentMethodsData] = useState<PaymentMethodData[]>([]);
  const [checkInData, setCheckInData] = useState<CheckInStatistics[]>([]);
  const [membershipStatusData, setMembershipStatusData] = useState<{ status: string; count: number }[]>([]);

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

      // Données fictives pour démonstration (à remplacer par des données réelles)
      const mockEventData: Event[] = [
        { date: 'Jan 2023', participants: 45, completed_payments: 40, check_ins: 35 },
        { date: 'Fév 2023', participants: 52, completed_payments: 48, check_ins: 42 },
        { date: 'Mar 2023', participants: 38, completed_payments: 32, check_ins: 30 },
        { date: 'Avr 2023', participants: 65, completed_payments: 60, check_ins: 55 },
        { date: 'Mai 2023', participants: 80, completed_payments: 72, check_ins: 68 },
        { date: 'Juin 2023', participants: 95, completed_payments: 85, check_ins: 80 }
      ];
      setEventData(mockEventData);

      // Analyse des méthodes de paiement
      const allPayments = [
        ...(paymentsData || []).map(p => ({ method: p.payment_method, amount: p.amount })),
        ...(manualPaymentsData || []).map(p => ({ method: p.payment_method, amount: p.amount }))
      ];

      const paymentMethods: Record<string, { count: number, amount: number }> = {};
      allPayments.forEach(payment => {
        const method = payment.method || 'Non spécifié';
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
        membershipStats[status] = (membershipStats[status] || 0) + 1;
      });

      const membershipStatusArray = Object.entries(membershipStats).map(([status, count]) => ({
        status,
        count
      }));
      setMembershipStatusData(membershipStatusArray);

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
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Statistiques générales
          </h1>
          
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/admin/dashboard')}>
              Retour au tableau de bord
            </Button>
            <Button onClick={handleRefresh} variant="outline">
              Actualiser les données
            </Button>
          </div>
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
                <CardTitle>Évolution des participants</CardTitle>
                <CardDescription>Nombre de participants, paiements complétés et présences par mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={eventData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="participants" stroke="#8B5CF6" name="Participants" />
                      <Line type="monotone" dataKey="completed_payments" stroke="#10B981" name="Paiements complétés" />
                      <Line type="monotone" dataKey="check_ins" stroke="#0EA5E9" name="Présences" />
                    </LineChart>
                  </ResponsiveContainer>
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
                    <ChartContainer
                      config={{
                        checkedIn: { 
                          color: "#10B981",
                          label: "Présents" 
                        },
                        notCheckedIn: { 
                          color: "#EF4444",
                          label: "Absents" 
                        }
                      }}
                    >
                      <PieChart>
                        <Pie
                          data={checkInData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={isMobile ? 80 : 100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="status"
                          label={({ name, percent }) => 
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {checkInData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          content={
                            <ChartTooltipContent labelKey="status" />
                          } 
                        />
                      </PieChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Méthodes de paiement</CardTitle>
                  <CardDescription>Répartition des paiements par méthode</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full flex justify-center">
                    <ChartContainer
                      config={{
                        mobMoney: { 
                          color: "#0EA5E9",
                          label: "Mobile Money" 
                        },
                        card: { 
                          color: "#8B5CF6",
                          label: "Carte" 
                        },
                        cash: { 
                          color: "#10B981",
                          label: "Espèces" 
                        },
                        bank: { 
                          color: "#F59E0B",
                          label: "Virement" 
                        }
                      }}
                    >
                      <PieChart>
                        <Pie
                          data={paymentMethodsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={isMobile ? 80 : 100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="method"
                          label={({ name, percent }) => 
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {paymentMethodsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          content={
                            <ChartTooltipContent labelKey="method" />
                          } 
                        />
                      </PieChart>
                    </ChartContainer>
                  </div>
                </CardContent>
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
                    <BarChart data={paymentMethodsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="method" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value.toLocaleString()} XOF`} />
                      <Legend />
                      <Bar dataKey="amount" name="Montant (XOF)" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Nombre de transactions par méthode</CardTitle>
                <CardDescription>Nombre de paiements effectués par méthode</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentMethodsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="method" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Nombre de transactions" fill="#0EA5E9" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
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
                  <ChartContainer
                    config={{
                      pending: { 
                        color: "#F59E0B",
                        label: "En attente" 
                      },
                      approved: { 
                        color: "#10B981",
                        label: "Approuvées" 
                      },
                      rejected: { 
                        color: "#EF4444",
                        label: "Rejetées" 
                      }
                    }}
                  >
                    <PieChart>
                      <Pie
                        data={membershipStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={isMobile ? 120 : 150}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="status"
                        label={({ name, percent }) => 
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {membershipStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip 
                        content={
                          <ChartTooltipContent labelKey="status" />
                        } 
                      />
                    </PieChart>
                  </ChartContainer>
                </div>
              </CardContent>
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
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Adhérents" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Statistics;
