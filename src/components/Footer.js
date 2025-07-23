import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Mail, Phone, MapPin, Twitter, Linkedin, Github, ArrowRight, Send, Star, Zap, Users, Award, Globe, Sparkles, CheckCircle } from 'lucide-react';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  const footerLinks = {
    product: [
      { name: 'Features', href: '/product', icon: Zap },
      { name: 'Pricing', href: '/pricing', icon: Star },
      { name: 'Request Demo', href: '/request-demo', icon: Send },
      { name: 'How it Works', href: '/product', icon: Sparkles },
    ],
    company: [
      { name: 'About', href: '/about', icon: Users },
      { name: 'Our Value', href: '/our-value', icon: Award },
      { name: 'Contact Sales', href: '/contact-sales', icon: Phone },
      { name: 'Careers', href: '/about', icon: Globe },
    ],
    resources: [
      { name: 'Free Resources', href: '/resources', icon: Sparkles },
      { name: 'Blog', href: '/resources', icon: Send },
      { name: 'Help Center', href: '/contact-us', icon: Users },
      { name: 'API Documentation', href: '/product', icon: Zap },
    ],
  };

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: '#', color: 'hover:text-blue-400' },
    { name: 'LinkedIn', icon: Linkedin, href: '#', color: 'hover:text-blue-600' },
    { name: 'GitHub', icon: Github, href: '#', color: 'hover:text-gray-400' },
  ];

  const contactInfo = [
    { icon: Mail, text: 'hello@bioping.com', href: 'mailto:hello@bioping.com' },
    { icon: Phone, text: '+1 (555) 123-4567', href: 'tel:+15551234567' },
    { icon: MapPin, text: 'San Francisco, CA', href: '#' },
  ];

  const achievements = [
    { number: '500+', label: 'Biotech Companies', icon: Users },
    { number: '2500+', label: 'BD Contacts', icon: Award },
    { number: '15+', label: 'Years Experience', icon: Star },
  ];

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-r from-accent-500/20 to-primary-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      {/* Main Footer Content */}
      <div className="container-custom py-20 relative z-10">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          {/* Company Info & Newsletter */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-8">
              <div className="relative">
                <img 
                  src={require('../img/dfgjk.webp')} 
                  alt="BioPing Logo" 
                  className="h-12 w-auto object-contain"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <p className="text-gray-300 mb-8 leading-relaxed">
              Built to empower emerging biotechs with smarter BD solutions. 
              Connect with the right partners and accelerate your growth.
            </p>

            {/* Newsletter Signup */}
            <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 rounded-2xl p-6 border border-primary-500/20">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-primary-400" />
                Stay Updated
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Get the latest biotech BD insights and updates
              </p>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 p-2 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all duration-200"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
                {isSubscribed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-accent-400 text-sm flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Successfully subscribed!
                  </motion.div>
                )}
              </form>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Useful Links */}
              <div>
                <h3 className="text-orange-400 font-semibold text-lg mb-4">Useful Links</h3>
                <ul className="space-y-2">
                  <li><Link to="/" className="text-white hover:text-orange-400 transition-colors">Home</Link></li>
                  <li><Link to="/about" className="text-white hover:text-orange-400 transition-colors">Company</Link></li>
                  <li><Link to="/product" className="text-white hover:text-orange-400 transition-colors">Product</Link></li>
                  <li><Link to="/product" className="text-white hover:text-orange-400 transition-colors">How it works</Link></li>
                  <li><Link to="/our-value" className="text-white hover:text-orange-400 transition-colors">Our Value</Link></li>
                  <li><Link to="/privacy" className="text-white hover:text-orange-400 transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/terms" className="text-white hover:text-orange-400 transition-colors">Terms and Conditions</Link></li>
                </ul>
              </div>

              {/* Free Resources */}
              <div>
                <h3 className="text-orange-400 font-semibold text-lg mb-4">Free Resources</h3>
                <ul className="space-y-2">
                  <li className="text-white">BD Conference Planner - priorities, budgets, and timing</li>
                  <li className="text-white">BD News & Resource Toolkit</li>
                  <li className="text-white">BD Process Flow & Best Practices</li>
                  <li className="text-white">Big Pharma BD Playbook</li>
                  <li className="text-white">Deal Comps & Benchmarking Data</li>
                  <li className="text-white">Curated Investor List (200+ VCs)</li>
                  <li className="text-white">Winning BD Decks + Email & Template Toolkit</li>
                  <li className="text-white">Fresh content added from time to time</li>
                  </ul>
                </div>
            </div>
          </div>
        </div>



        {/* Contact & Social */}
        <div className="border-t border-gray-700 pt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Get in Touch</h3>
              <div className="space-y-4">
                {contactInfo.map((contact, index) => (
                  <motion.a
                    key={index}
                    href={contact.href}
                    className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors duration-200 group"
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
              <h3 className="text-lg font-semibold mb-6 text-white">Follow Us</h3>
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    className={`w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl flex items-center justify-center text-gray-400 ${social.color} hover:scale-110 transition-all duration-200 border border-gray-600`}
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
      <div className="border-t border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © {currentYear} BioPing. All Rights Reserved
            </div>

            {/* Legal Links */}
            <div className="flex items-center space-x-6 text-sm">
              <Link to="/legal" className="text-gray-400 hover:text-white transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link to="/legal" className="text-gray-400 hover:text-white transition-colors duration-200">
                Terms of Service
              </Link>
              <Link to="/legal" className="text-gray-400 hover:text-white transition-colors duration-200">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 