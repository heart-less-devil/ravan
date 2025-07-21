import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Download, FileText, Users, TrendingUp, Building2, CheckCircle, Calendar, BookOpen } from 'lucide-react';

const Resources = () => {
  const resources = [
    {
      icon: Calendar,
      title: "BD Conference Planner",
      description: "Priorities, budgets, and timing for business development conferences",
      category: "Planning"
    },
    {
      icon: FileText,
      title: "BD News & Resource Toolkit",
      description: "Comprehensive toolkit for staying updated with industry news and resources",
      category: "Information"
    },
    {
      icon: TrendingUp,
      title: "BD Process Flow & Best Practices",
      description: "Step-by-step process flows and proven best practices for BD success",
      category: "Process"
    },
    {
      icon: Building2,
      title: "Big Pharma BD Playbook",
      description: "Strategic playbook for engaging with big pharma companies",
      category: "Strategy"
    },
    {
      icon: TrendingUp,
      title: "Deal Comps & Benchmarking Data",
      description: "Comprehensive deal comparisons and industry benchmarking data",
      category: "Data"
    },
    {
      icon: Users,
      title: "Curated Investor List (200+ VCs)",
      description: "Carefully curated list of 200+ venture capital firms in life sciences",
      category: "Investors"
    },
    {
      icon: FileText,
      title: "Winning BD Decks + Email & Template Toolkit",
      description: "Templates and examples of successful business development presentations",
      category: "Templates"
    },
    {
      icon: BookOpen,
      title: "Fresh Content Added Regularly",
      description: "New resources and content added from time to time to keep you updated",
      category: "Updates"
    }
  ];

  // Categories available for filtering (unused for now)
  // const categories = [
  //   "All",
  //   "Planning",
  //   "Information", 
  //   "Process",
  //   "Strategy",
  //   "Data",
  //   "Investors",
  //   "Templates",
  //   "Updates"
  // ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="hero-title mb-6">
              Free <span className="gradient-text">Resources</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Access our comprehensive collection of free resources designed to help you 
              succeed in biotech and pharma business development.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="section bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="section-title">
              Comprehensive Resource Library
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to accelerate your business development efforts, 
              from planning tools to strategic insights.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.map((resource, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card p-6 hover:shadow-large transition-all duration-300"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <resource.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                        {resource.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {resource.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {resource.description}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn btn-outline btn-sm w-full"
                    >
                      Download Free
                      <Download className="w-4 h-4 ml-2" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Resource */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h2 className="section-title">
                Featured Resource: BD Conference Planner
              </h2>
              <p className="text-lg text-gray-600">
                Our most popular resource helps you plan and prioritize your business 
                development conference strategy. Includes budget planning, timing recommendations, 
                and ROI optimization strategies.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary-600" />
                  <span className="text-gray-700">Conference prioritization framework</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary-600" />
                  <span className="text-gray-700">Budget allocation strategies</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary-600" />
                  <span className="text-gray-700">Timing optimization guide</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-primary-600" />
                  <span className="text-gray-700">ROI tracking templates</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-primary"
              >
                Download Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-br from-primary-600 to-secondary-500 rounded-2xl p-8 text-white"
            >
              <h3 className="text-2xl font-bold mb-6">
                Why These Resources?
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <span>Proven strategies from industry experts</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <span>Ready-to-use templates and tools</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <span>Updated regularly with fresh content</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">4</span>
                  </div>
                  <span>Completely free for the community</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="section bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="section-title">
              Stay Updated
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Get notified when we add new resources and industry insights to our library.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <input
                type="email"
                placeholder="Enter your email address"
                className="input-field flex-1 max-w-md"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-primary"
              >
                Subscribe
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-primary-900 text-white">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Access All Resources?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of professionals who use our free resources to accelerate 
              their business development success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-secondary"
              >
                Download All Resources
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.button>
              <Link to="/contact-sales">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-white"
              >
                Contact Us
              </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Resources; 