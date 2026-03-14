import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './i18n';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import Cursor from './components/Cursor';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import QuotePage from './pages/QuotePage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import AboutPage from './pages/AboutPage';
import ChatPage from './pages/ChatPage';

export default function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[#f3f3f3] text-[#020202] selection:bg-[#020202] selection:text-[#f3f3f3] select-none">
            <Cursor />
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/quote" element={<QuotePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/chat" element={<ChatPage />} />
            </Routes>
          </div>
        </BrowserRouter>
      </ToastProvider>
    </I18nProvider>
  );
}
