import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const usefulLinks = [
    { name: 'Home', path: '/' },
    { name: 'Company', path: '/about' },
    { name: 'Product', path: '/product' },
    { name: 'How it works', path: '/product/how-it-works' },
    { name: 'Our Value', path: '/our-value' },
    { name: 'Privacy Policy', path: '/privacy-policy' },
    { name: 'Terms and Conditions', path: '/terms-of-use' },
  ];

  const freeResources = [
    'BD Conference Planner - priorities, budgets, and timing',
    'BD News & Resource Toolkit',
    'BD Process Flow & Best Practices',
    'Big Pharma BD Playbook',
    'Deal Comps & Benchmarking Data',
    'Curated Investor List (200+ VCs)',
    'Winning BD Decks + Email & Template Toolkit',
    'Fresh content added from time to time',
  ];

  return (
    <footer className="bg-blue-900 text-white pt-12 pb-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Useful Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h6 className="text-xl font-semibold text-orange-500 mb-4">
              Useful Links
            </h6>
            <ul className="space-y-2">
              {usefulLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-white hover:text-gray-300 transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Free Resources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h6 className="text-xl font-semibold text-orange-500 mb-4">
              Free Resources
            </h6>
            <ul className="space-y-2">
              {freeResources.map((resource, index) => (
                <li key={index} className="text-white text-sm">
                  {resource}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full h-px bg-white/20 my-8"
        />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-white text-sm">
              © {currentYear} BioPing. All Rights Reserved
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Link
              to="/terms-of-use"
              className="text-white hover:text-gray-300 transition-colors duration-200 text-sm"
            >
              Terms and Conditions
            </Link>
            <Link
              to="/privacy-policy"
              className="text-white hover:text-gray-300 transition-colors duration-200 text-sm"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 