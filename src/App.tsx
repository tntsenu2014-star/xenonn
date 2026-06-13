/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthGuard from './components/AuthGuard';
import NotificationListener from './components/NotificationListener';
import { Loader2 } from 'lucide-react';

import UserAuthGuard from './components/UserAuthGuard';

// Page Imports - Lazy Loaded
const HomePage = lazy(() => import('./pages/HomePage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const ConfirmationPage = lazy(() => import('./pages/ConfirmationPage'));
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ServicePage = lazy(() => import('./pages/ServicePage'));
const ServiceTemplatesPage = lazy(() => import('./pages/ServiceTemplatesPage'));
const ServiceCheckoutPage = lazy(() => import('./pages/ServiceCheckoutPage'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const AccountDetailPage = lazy(() => import('./pages/AccountDetailPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const DiamondStoreGenerator = lazy(() => import('./pages/DiamondStoreGenerator'));
const MembershipPostGenerator = lazy(() => import('./pages/MembershipPostGenerator'));
const FFProfileDPGenerator = lazy(() => import('./pages/FFProfileDPGenerator'));
const FreeFireAccountInfo = lazy(() => import('./pages/FreeFireAccountInfo'));
const PaymentDetailsPage = lazy(() => import('./pages/PaymentDetailsPage'));

// Admin Page Imports - Lazy Loaded
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminPackages = lazy(() => import('./pages/admin/AdminPackages'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));
const AdminServices = lazy(() => import('./pages/admin/AdminServices'));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents'));
const AdminServiceTemplates = lazy(() => import('./pages/admin/AdminServiceTemplates'));
const AdminAccounts = lazy(() => import('./pages/admin/AdminAccounts'));
const AdminAccountOrders = lazy(() => import('./pages/admin/AdminAccountOrders'));
const AdminServiceOrders = lazy(() => import('./pages/admin/AdminServiceOrders'));

import { Toaster } from 'sonner';

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
    </div>
  );
}

export default function App() {
  React.useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12
      if (e.key === 'F12') {
        e.preventDefault();
      }
      
      // Prevent Ctrl+U / Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
      }
      
      // Prevent Ctrl+Shift+I / Cmd+Option+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
      }

      // Prevent Ctrl+Shift+C / Cmd+Option+C (Element Inspector)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
      }

      // Prevent Ctrl+Shift+J / Cmd+Option+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
      }
      
      // Prevent Ctrl+S / Cmd+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <Router>
      <Toaster position="bottom-right" richColors />
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#070708] transition-colors duration-300">
        <Header />
        <main className="flex-grow">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<UserAuthGuard><HomePage /></UserAuthGuard>} />
              <Route path="/history" element={<UserAuthGuard><OrderHistoryPage /></UserAuthGuard>} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/service/:serviceId" element={<UserAuthGuard><ServicePage /></UserAuthGuard>} />
              <Route path="/service-templates/:serviceId" element={<UserAuthGuard><ServiceTemplatesPage /></UserAuthGuard>} />
              <Route path="/service-checkout/:serviceId/:templateId" element={<UserAuthGuard><ServiceCheckoutPage /></UserAuthGuard>} />
              <Route path="/order/:packageId?" element={<UserAuthGuard><OrderPage /></UserAuthGuard>} />
              <Route path="/confirmation/:orderId" element={<UserAuthGuard><ConfirmationPage /></UserAuthGuard>} />
              <Route path="/accounts" element={<UserAuthGuard><AccountsPage /></UserAuthGuard>} />
              <Route path="/account/:accountId" element={<UserAuthGuard><AccountDetailPage /></UserAuthGuard>} />
              <Route path="/post-designs/diamond-store-generator" element={<UserAuthGuard><DiamondStoreGenerator /></UserAuthGuard>} />
              <Route path="/post-designs/membership-post-generator" element={<UserAuthGuard><MembershipPostGenerator /></UserAuthGuard>} />
              <Route path="/post-designs/ff-profile-dp-generator" element={<UserAuthGuard><FFProfileDPGenerator /></UserAuthGuard>} />
              <Route path="/free-fire-info" element={<UserAuthGuard><FreeFireAccountInfo /></UserAuthGuard>} />
              <Route path="/payment-details" element={<UserAuthGuard><PaymentDetailsPage /></UserAuthGuard>} />
              <Route path="/terms" element={<TermsPage />} />
              
              <Route path="/admin/login" element={<AdminLogin />} />
              
              {/* Guarded Admin Routes */}
              <Route path="/admin" element={<AuthGuard><AdminDashboard /></AuthGuard>} />
              <Route path="/admin/packages" element={<AuthGuard><AdminPackages /></AuthGuard>} />
              <Route path="/admin/orders" element={<AuthGuard><AdminOrders /></AuthGuard>} />
              <Route path="/admin/settings" element={<AuthGuard><AdminSettings /></AuthGuard>} />
              <Route path="/admin/banners" element={<AuthGuard><AdminBanners /></AuthGuard>} />
              <Route path="/admin/services" element={<AuthGuard><AdminServices /></AuthGuard>} />
              <Route path="/admin/templates" element={<AuthGuard><AdminServiceTemplates /></AuthGuard>} />
              <Route path="/admin/events" element={<AuthGuard><AdminEvents /></AuthGuard>} />
              <Route path="/admin/accounts" element={<AuthGuard><AdminAccounts /></AuthGuard>} />
              <Route path="/admin/account-orders" element={<AuthGuard><AdminAccountOrders /></AuthGuard>} />
              <Route path="/admin/service-orders" element={<AuthGuard><AdminServiceOrders /></AuthGuard>} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
