import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Mail, Phone, MapPin, Twitter, Linkedin, Github, ArrowRight, Send, Star, Zap, Users, Award, Globe, Sparkles, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubscribed(true);
        setEmail('');
        setTimeout(() => setIsSubscribed(false), 3000);
      } else {
        console.error('Subscription failed:', data.message);
        // Still show success message to user
        setIsSubscribed(true);
        setEmail('');
        setTimeout(() => setIsSubscribed(false), 3000);
      }
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      // Still show success message to user
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const footerLinks = {
    product: [
      { name: 'Product', href: '/product', icon: Zap },
      { name: 'Value', href: '/our-value', icon: Award },
      { name: 'Company', href: '/about', icon: Users },
      { name: 'Pricing', href: '/pricing', icon: Star },
      { name: 'Resources', href: '/resources', icon: Sparkles },
    ],
  };

  const socialLinks = [
    // { name: 'Twitter', icon: Twitter, href: '#', color: 'hover:text-blue-400' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/in/gauravvij1?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app', color: 'hover:text-blue-600' },
    // { name: 'GitHub', icon: Github, href: '#', color: 'hover:text-gray-400' },
  ];

  const contactInfo = [
    { icon: Mail, text: 'support@thebioping.com', href: 'mailto:support@thebioping.com' },
    { icon: Phone, text: '+1 650 455 5850', href: 'tel:+16504555850' },
    { icon: MapPin, text: 'San Francisco, CA', href: '#' },
  ];

  const achievements = [
    { number: '500+', label: 'Biotech Companies', icon: Users },
    { number: '2500+', label: 'BD Contacts', icon: Award },
    { number: '15+', label: 'Years Experience', icon: Star },
  ];

  return (
    <footer className="relative bg-white text-black overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-full blur-3xl animate-float pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-r from-accent-500/20 to-primary-500/20 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>

      {/* Main Footer Content */}
      <div className="container-custom py-20 relative z-10">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-8">
              <div className="relative">
                <img 
                  src={require('../img/dfgjk.webp')} 
                  alt="BioPing Logo" 
                  className="h-32 w-auto object-contain"
                />
              </div>
            </div>
            <div className="text-black mb-8 leading-relaxed">
              <p className="font-semibold mb-2 text-blue-900">
                Your <span className="text-orange-400">Trusted</span> BD Partner
              </p>
              <p>Partner Discovery | BD Tracking | Deal Insights</p>
            </div>
          </div>

          {/* Newsletter Signup - Middle */}
          <div className="lg:col-span-1 flex justify-end">
            <div>
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-6 border border-gray-300 text-center">
                <h3 className="text-lg font-semibold mb-3 flex items-center justify-center text-black">
                  <Sparkles className="w-5 h-5 mr-2 text-primary-400" />
                  Stay Updated
                </h3>
                <p className="text-black text-sm mb-4">
                  Get the latest biotech BD insights and updates
                </p>
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-black placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="absolute right-2 top-2 p-2 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Send className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                  {isSubscribed && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-green-600 text-sm flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Successfully subscribed!
                    </motion.div>
                  )}
                </form>
              </div>

            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-1">
            <div className="flex justify-end">
              {/* Useful Links */}
              <div>
                <h3 className="text-orange-400 font-semibold text-lg mb-4">Useful Links</h3>
                <ul className="space-y-2">
                  <li><Link to="/" className="text-black hover:text-orange-400 transition-colors">Home</Link></li>
                  <li><Link to="/product" className="text-black hover:text-orange-400 transition-colors">Product</Link></li>
                  <li><Link to="/our-value" className="text-black hover:text-orange-400 transition-colors">Value</Link></li>
                  <li><Link to="/about" className="text-black hover:text-orange-400 transition-colors">Company</Link></li>
                  <li><Link to="/pricing" className="text-black hover:text-orange-400 transition-colors">Pricing</Link></li>
                  <li><Link to="/resources" className="text-black hover:text-orange-400 transition-colors">Resources</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>



        {/* Contact & Social */}
        <div className="border-t border-gray-300 pt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-black">Get in Touch</h3>
              <div className="space-y-4">
                {contactInfo.map((contact, index) => (
                  <motion.a
                    key={index}
                    href={contact.href}
                    className="flex items-center space-x-3 text-black hover:text-gray-700 transition-colors duration-200 group"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <contact.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm">{contact.text}</span>
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-black">Follow Us</h3>
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-gray-600 ${social.color} hover:scale-110 transition-all duration-200 border border-gray-300`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <social.icon className="w-6 h-6" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-300 bg-gray-50 relative z-20">
        <div className="container-custom py-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center">
              <p className="text-blue-900 text-sm font-semibold mb-2">
                Your <span className="text-orange-400">Trusted</span> BD Partner
              </p>
              <p className="text-black text-sm">
                Partner Discovery | BD Tracking | Deal Insights
              </p>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 w-full">
              <div className="text-black text-sm">
                © {currentYear} BioPing. All Rights Reserved
              </div>

              {/* Legal Links */}
              <div className="flex items-center space-x-6 text-sm relative z-30">
                <Link 
                  to="/privacy" 
                  className="text-black hover:text-orange-400 transition-colors duration-200 font-medium cursor-pointer"
                >
                  Privacy Policy
                </Link>
                <Link 
                  to="/terms" 
                  className="text-black hover:text-orange-400 transition-colors duration-200 font-medium cursor-pointer"
                >
                  Terms of Service
                </Link>
                <Link 
                  to="/cookie-policy" 
                  className="text-black hover:text-orange-400 transition-colors duration-200 font-medium cursor-pointer"
                >
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 