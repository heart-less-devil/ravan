import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import Header from './components/Header';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Login from './pages/Login';
import Signup from './pages/Signup';
import About from './pages/About';
import Pricing from './pages/Pricing';
import ContactUs from './pages/ContactUs';
import Product from './pages/Product';
import OurValue from './pages/OurValue';
import Resources from './pages/Resources';
import HowItWorks from './pages/HowItWorks';
import RequestDemo from './pages/RequestDemo';
import ContactSales from './pages/ContactSales';
import AdminPanel from './pages/AdminPanel';
import AdminUsers from './pages/AdminUsers';
import AdminLogin from './pages/AdminLogin';
import PDFManagement from './pages/PDFManagement';
import PricingManagement from './pages/PricingManagement';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import BDTrackerPage from './pages/BDTrackerPage';
import QuickGuide from './pages/QuickGuide';
import BDInsights from './pages/BDInsights';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import CookiePolicy from './pages/CookiePolicy';
import ScrollToTop from './components/ScrollToTop';
import './App.css';
import KeepAlive from './components/KeepAlive';

// Optimized cache busting component - only for development
const CacheBuster = ({ children }) => {
  const location = useLocation();
  
  useEffect(() => {
    // Only add cache busting in development
    if (process.env.NODE_ENV === 'development') {
      const currentTime = Date.now();
      const version = `v=${currentTime}`;
      
      // Add version to URL if not present
      if (!window.location.search.includes('v=')) {
        const separator = window.location.search ? '&' : '?';
        window.history.replaceState(
          null, 
          '', 
          `${window.location.pathname}${window.location.search}${separator}${version}`
        );
      }
    }
  }, [location]);

  return children;
};

function App() {
  return (
    <MantineProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <CacheBuster>
          <div className="App min-h-screen bg-gray-50">
            <KeepAlive />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                <>
                  <Header />
                  <main className="pt-20">
                    <Home />
                  </main>
                  <Footer />
                  <CookieConsent />
                </>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/about" element={
                <>
                  <Header />
                  <main className="pt-20">
                    <About />
                  </main>
                  <Footer />
                  <CookieConsent />
                </>
              } />
              <Route path="/pricing" element={
                <>
                  <Header />
                  <main className="pt-20">
                    <Pricing />
                  </main>
                  <Footer />
                  <CookieConsent />
                </>
              } />
              <Route path="/contact-us" element={
                <>
                  <Header />
                  <main className="pt-20">
                    <ContactUs />
                  </main>
                  <Footer />
                  <CookieConsent />
                </>
              } />
              <Route path="/product" element={
                <>
                  <Header />
                  <main className="pt-20">
                    <Product />
                  </main>
                  <Footer />
                  <CookieConsent />
                </>
              } />
              <Route path="/our-value" element={
                <>
                  <Header />
                  <main className="pt-20">
                    <OurValue />
                  </main>
                  <Footer />
                  <CookieConsent />
                </>
              } />
              <Route path="/resources" element={
                <>
                  <Header />
                  <main className="pt-20">
                    <Resources />
                  </main>
                  <Footer />
                  <CookieConsent />
                </>
              } />
              <Route path="/how-it-works" element={
                <>
                  <Header />
                  <main className="pt-20">
                    <HowItWorks />
                  </main>
                  <Footer />
                  <CookieConsent />
                </>
              } />
              <Route path="/request-demo" element={
                <>
                  <Header />
                  <main className="pt-20">
                    <RequestDemo />
                  </main>
                  <Footer />
                  <CookieConsent />
                </>
              } />
              <Route path="/contact-sales" element={
                <>
                  <Header />
                  <main className="pt-20">
                    <ContactSales />
                  </main>
                  <Footer />
                  <CookieConsent />
                </>
              } />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />

              {/* Dashboard Routes - Protected */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/search" element={<Dashboard />} />
              <Route path="/dashboard/saved-searches" element={<Dashboard />} />
              <Route path="/dashboard/resources/definitions" element={<Dashboard />} />
              <Route path="/dashboard/resources/quick-guide" element={<QuickGuide />} />
              <Route path="/dashboard/resources/bd-insights" element={<Dashboard />} />
              <Route path="/dashboard/resources/coaching-tips" element={<Dashboard />} />
              <Route path="/dashboard/resources/free-content" element={<Dashboard />} />
              <Route path="/dashboard/legal" element={<Dashboard />} />
              <Route path="/dashboard/contact" element={<Dashboard />} />
              <Route path="/dashboard/pricing" element={<Dashboard />} />
              <Route path="/dashboard/bd-tracker" element={<BDTrackerPage />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/panel" element={
                <ProtectedAdminRoute>
                  <AdminPanel />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedAdminRoute>
                  <AdminUsers />
                </ProtectedAdminRoute>
              } />
              
              {/* Dashboard Admin Routes */}
              <Route path="/dashboard/admin-login" element={<AdminLogin />} />
              <Route path="/dashboard/admin-panel" element={
                <ProtectedAdminRoute>
                  <AdminPanel />
                </ProtectedAdminRoute>
              } />
                        <Route path="/dashboard/pdf-management" element={
            <ProtectedAdminRoute>
              <PDFManagement />
            </ProtectedAdminRoute>
          } />
          
          <Route path="/dashboard/pricing-management" element={
            <ProtectedAdminRoute>
              <PricingManagement />
            </ProtectedAdminRoute>
          } />
              <Route path="/dashboard/admin-users" element={
                <ProtectedAdminRoute>
                  <AdminUsers />
                </ProtectedAdminRoute>
              } />
              
              {/* Test route to check if React is working */}
              <Route path="/test" element={
                <div className="p-8">
                  <h1>React is working!</h1>
                  <p>If you can see this, React routing is working.</p>
                </div>
              } />
              
              {/* Test QuickGuide route */}
              <Route path="/test-quick-guide" element={<QuickGuide />} />
              
              {/* Catch-all route for dashboard - redirect to main dashboard */}
              <Route path="/dashboard/*" element={<Dashboard />} />
            </Routes>
          </div>
        </CacheBuster>
      </Router>
    </MantineProvider>
  );
}

export default App; 