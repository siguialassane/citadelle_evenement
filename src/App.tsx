import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import QrCodeScan from './pages/admin/QrCodeScan';
import EmailDashboard from './pages/admin/EmailDashboard';
import PaymentValidation from './pages/admin/PaymentValidation';
import ConfirmationPage from './pages/ConfirmationPage';
import PaymentPendingPage from './pages/PaymentPendingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/qr-scan" element={<QrCodeScan />} />
        <Route path="/admin/email-dashboard" element={<EmailDashboard />} />
        <Route path="/admin/payment-validation" element={<PaymentValidation />} />
        <Route path="/confirmation/:participantId" element={<ConfirmationPage />} />
        <Route path="/payment-pending/:participantId" element={<PaymentPendingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
