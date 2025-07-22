import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import Header from './components/Header';
import Footer from './components/Footer';
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
import RequestDemo from './pages/RequestDemo';
import ContactSales from './pages/ContactSales';
import AdminPanel from './pages/AdminPanel';
import AdminUsers from './pages/AdminUsers';
import AdminLogin from './pages/AdminLogin';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import BDTrackerPage from './pages/BDTrackerPage';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import './App.css';

function App() {
  return (
    <MantineProvider>
      <Router>
        <div className="App min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            <>
              <Header />
              <main className="pt-20">
                <Home />
              </main>
              <Footer />
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
            </>
          } />
          <Route path="/pricing" element={
            <>
              <Header />
              <main className="pt-20">
                <Pricing />
              </main>
              <Footer />
            </>
          } />
          <Route path="/contact-us" element={
            <>
              <Header />
              <main className="pt-20">
                <ContactUs />
              </main>
              <Footer />
            </>
          } />
          <Route path="/product" element={
            <>
              <Header />
              <main className="pt-20">
                <Product />
              </main>
              <Footer />
            </>
          } />
          <Route path="/our-value" element={
            <>
              <Header />
              <main className="pt-20">
                <OurValue />
              </main>
              <Footer />
            </>
          } />
          <Route path="/resources" element={
            <>
              <Header />
              <main className="pt-20">
                <Resources />
              </main>
              <Footer />
            </>
          } />
          <Route path="/request-demo" element={
            <>
              <Header />
              <main className="pt-20">
                <RequestDemo />
              </main>
              <Footer />
            </>
          } />
          <Route path="/contact-sales" element={
            <>
              <Header />
              <main className="pt-20">
                <ContactSales />
              </main>
              <Footer />
            </>
          } />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Dashboard Routes - Protected */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/search" element={<Dashboard />} />
          <Route path="/dashboard/saved-searches" element={<Dashboard />} />
          <Route path="/dashboard/resources/definitions" element={<Dashboard />} />
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
          
          {/* Test route to check if React is working */}
          <Route path="/test" element={
            <div className="p-8">
              <h1>React is working!</h1>
              <p>If you can see this, React routing is working.</p>
            </div>
          } />
        </Routes>
      </div>
    </Router>
    </MantineProvider>
  );
}

export default App; 