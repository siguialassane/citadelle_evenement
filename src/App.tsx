
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Payment from "./pages/Payment";
import PaymentPending from "./pages/PaymentPending";
import Confirmation from "./pages/Confirmation";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import PaymentValidation from "./pages/admin/PaymentValidation";
import EmailDashboard from "./pages/admin/EmailDashboard";
import { AdminRoute } from "./components/admin/AdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/payment/:participantId" element={<Payment />} />
          <Route path="/payment-pending/:participantId" element={<PaymentPending />} />
          {/* Routes de confirmation avec support des paramètres supplémentaires */}
          <Route path="/confirmation/:participantId" element={<Confirmation />} />
          <Route path="/receipt/:participantId" element={<Confirmation />} />
          
          {/* Routes administrateur */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/payment-validation" 
            element={
              <AdminRoute>
                <PaymentValidation />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/payment-validation/:paymentId" 
            element={
              <AdminRoute>
                <PaymentValidation />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/email-dashboard" 
            element={
              <AdminRoute>
                <EmailDashboard />
              </AdminRoute>
            } 
          />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
