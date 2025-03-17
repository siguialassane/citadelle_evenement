
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import EmailDashboard from './pages/admin/EmailDashboard';
import PaymentValidation from './pages/admin/PaymentValidation';
import Confirmation from './pages/Confirmation';
import PaymentPending from './pages/PaymentPending';
import Index from './pages/Index';
import Payment from './pages/Payment';
import PageRedirect from './components/redirection/PageRedirect';
import QrCodeScan from './pages/admin/QrCodeScan';
import ExcelAnalyzer from './pages/ExcelAnalyzer';
import MembershipDashboard from './pages/admin/MembershipDashboard';
import MembershipForm from './pages/Membership';

function App() {
  return (
    <Router>
      <Routes>
        {/* Page principale d'inscription */}
        <Route path="/" element={<Index />} />
        
        {/* Route de paiement après inscription */}
        <Route path="/payment/:participantId" element={<Payment />} />
        
        {/* Nouvelle route pour l'analyseur Excel */}
        <Route path="/excel-analyzer" element={<ExcelAnalyzer />} />
        
        {/* Routes administrateur */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/email-dashboard" element={<EmailDashboard />} />
        <Route path="/admin/payment-validation" element={<PaymentValidation />} />
        <Route path="/admin/payment-validation/:paymentId" element={<PaymentValidation />} />
        <Route path="/admin/qr-scan" element={<QrCodeScan />} />
        <Route path="/admin/membership" element={<MembershipDashboard />} />
        
        {/* Routes pour les participants */}
        <Route path="/confirmation/:participantId" element={<Confirmation />} />
        <Route path="/payment-pending/:participantId" element={<PaymentPending />} />
        <Route path="/membership" element={<MembershipForm />} />
        
        {/* Routes de redirection explicites pour les liens d'email */}
        <Route path="/redirect/payment-pending/:participantId" 
               element={<PageRedirect targetType="payment-pending" />} />
        <Route path="/redirect/payment-validation/:participantId" 
               element={<PageRedirect targetType="payment-validation" />} />
        <Route path="/redirect/confirmation/:participantId" 
               element={<PageRedirect targetType="confirmation" />} />
        <Route path="/redirect/payment/:participantId" 
               element={<PageRedirect targetType="payment" />} />
        
        {/* Redirection pour toute route inconnue vers la page d'accueil */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
