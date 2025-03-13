
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import QrCodeScan from './pages/admin/QrCodeScan';
import EmailDashboard from './pages/admin/EmailDashboard';
import PaymentValidation from './pages/admin/PaymentValidation';
import Confirmation from './pages/Confirmation';
import PaymentPending from './pages/PaymentPending';
import Index from './pages/Index';

function App() {
  return (
    <Router>
      <Routes>
        {/* Page principale d'inscription */}
        <Route path="/" element={<Index />} />
        
        {/* Routes administrateur */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/qr-scan" element={<QrCodeScan />} />
        <Route path="/admin/email-dashboard" element={<EmailDashboard />} />
        <Route path="/admin/payment-validation" element={<PaymentValidation />} />
        
        {/* Routes pour les participants */}
        <Route path="/confirmation/:participantId" element={<Confirmation />} />
        <Route path="/payment-pending/:participantId" element={<PaymentPending />} />
        
        {/* Redirection pour toute route inconnue vers la page d'accueil */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
