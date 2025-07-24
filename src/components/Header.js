import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, User, ArrowRight, Sparkles } from 'lucide-react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing stored user:', err);
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Product', path: '/product' },
    { name: 'Value', path: '/our-value' },
    { name: 'Company', path: '/about' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Resources', path: '/resources' },
    { name: 'Contact', path: '/contact-us' },
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-large border-b border-gray-100/50' 
          : 'bg-white/80 backdrop-blur-lg'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-3"
            >
              <div className="relative">
                <img 
                  src={require('../img/image.webp')} 
                  alt="BioPing Logo" 
                  className="h-16 w-auto object-contain"
                />
              </div>

            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <div key={item.name} className="relative group">
                <Link
                  to={item.path}
                  className={`px-4 py-2 text-gray-700 hover:text-primary-600 transition-all duration-300 rounded-xl font-medium relative group ${
                    location.pathname === item.path ? 'text-primary-600 bg-primary-50/80' : 'hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                  {item.submenu && (
                    <ChevronDown className="inline-block w-4 h-4 ml-1 group-hover:rotate-180 transition-transform duration-300" />
                  )}
                  
                  {/* Active indicator */}
                  {location.pathname === item.path && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>

                {/* Dropdown Menu */}
                {item.submenu && (
                  <div className="absolute top-full left-0 mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-large border border-gray-100/50 p-2">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.name}
                          to={subItem.path}
                          className="block px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50/50 rounded-xl transition-all duration-200"
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              // User is logged in - show ME button
              <div className="relative group">
                <Link 
                  to="/dashboard" 
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-xl transition-all duration-200 font-medium group"
                >
                  <User className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>ME</span>
                </Link>
              </div>
            ) : (
              // User is not logged in - show Login button
              <Link 
                to="/login" 
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-xl transition-all duration-200 font-medium group"
              >
                <User className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                <span>Login</span>
              </Link>
            )}
            <Link 
              to="/request-demo" 
              className="relative group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-medium shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10">Request Demo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200 relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-secondary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100/50 shadow-large"
          >
            <div className="container-custom py-6">
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <div key={item.name}>
                    <Link
                      to={item.path}
                      className={`block py-3 px-4 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-xl transition-all duration-200 font-medium ${
                        location.pathname === item.path ? 'text-primary-600 bg-primary-50/80' : ''
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                    
                    {/* Mobile Submenu */}
                    {item.submenu && (
                      <div className="ml-4 mt-2 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.name}
                            to={subItem.path}
                            className="block py-2 px-4 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-all duration-200 text-sm"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  {user ? (
                    // User is logged in - show ME button
                    <Link
                      to="/dashboard"
                      className="block py-3 px-4 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-xl transition-all duration-200 font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>ME</span>
                      </div>
                    </Link>
                  ) : (
                    // User is not logged in - show Login button
                    <Link
                      to="/login"
                      className="block py-3 px-4 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-xl transition-all duration-200 font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Login</span>
                      </div>
                    </Link>
                  )}
                  <Link
                    to="/request-demo"
                    className="block py-3 px-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl transition-all duration-200 font-medium shadow-soft"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Request Demo</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header; 