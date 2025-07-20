import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Target, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';

const About = () => {
  const businessModelHighlights = [
    {
      icon: Building2,
      title: "Strategic Partnerships",
      description: "We forge strategic partnerships with leading companies to create mutually beneficial opportunities."
    },
    {
      icon: Users,
      title: "Network Building",
      description: "Building strong networks of professionals, investors, and industry leaders."
    },
    {
      icon: Target,
      title: "Focused Approach",
      description: "Targeted approach to identify and connect with the right stakeholders for your business."
    },
    {
      icon: TrendingUp,
      title: "Growth Strategy",
      description: "Comprehensive growth strategies tailored to your specific business needs and market conditions."
    }
  ];

  const values = [
    "Integrity and transparency in all business dealings",
    "Innovation and adaptability to market changes",
    "Client success as our primary measure of success",
    "Continuous learning and industry expertise"
  ];

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
              About <span className="gradient-text">BioPing</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We are a leading business development and strategic partnership company, 
              dedicated to helping businesses grow and succeed in today's competitive market.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Founder's Message */}
      <section className="section bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h2 className="section-title">
                A Message from Our Founder
              </h2>
              <div className="prose prose-lg text-gray-600 space-y-4">
                <p>
                  Welcome to BioPing. I founded this company with a simple yet powerful vision: 
                  to help businesses connect, grow, and succeed in an increasingly complex and 
                  competitive marketplace.
                </p>
                <p>
                  With over 15 years of experience in business development and strategic partnerships, 
                  I've seen firsthand how the right connections and strategies can transform a business. 
                  That's why we've built BioPing on the foundation of genuine relationships, 
                  strategic thinking, and proven results.
                </p>
                <p>
                  Our team brings together expertise from various industries, allowing us to provide 
                  comprehensive solutions that address the unique challenges faced by modern businesses. 
                  We believe in the power of collaboration and the potential for growth that exists 
                  in every business relationship.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-gray-900">John Smith</span>
                </div>
                <span className="text-gray-500">|</span>
                <span className="text-gray-600">Founder & CEO</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-primary-600 to-secondary-500 rounded-2xl p-1">
                <div className="bg-white rounded-2xl p-8">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-primary-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
                    John Smith
                  </h3>
                  <p className="text-gray-600 text-center mb-6">
                    Founder & Chief Executive Officer
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-primary-600" />
                      <span className="text-gray-700">15+ Years Experience</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-primary-600" />
                      <span className="text-gray-700">Strategic Partnerships</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-primary-600" />
                      <span className="text-gray-700">Business Development</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Business Model */}
      <section className="section bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="section-title">
              Our Business Model
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We operate on a comprehensive business model that focuses on creating value 
              for our clients through strategic partnerships and innovative solutions.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {businessModelHighlights.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card p-6 text-center hover:shadow-large transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <item.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="section-title">
                Our Values
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                These core values guide everything we do and shape the relationships 
                we build with our clients and partners.
              </p>
              <div className="space-y-4">
                {values.map((value, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{value}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-br from-primary-600 to-secondary-500 rounded-2xl p-8 text-white"
            >
              <h3 className="text-2xl font-bold mb-6">
                Why Choose BioPing?
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <span>Proven track record of success</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <span>Comprehensive business solutions</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <span>Dedicated team of experts</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">4</span>
                  </div>
                  <span>Long-term partnership approach</span>
                </div>
              </div>
            </motion.div>
          </div>
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
              Ready to Grow Your Business?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Let's discuss how BioPing can help you achieve your business goals 
              and create lasting partnerships that drive success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-secondary"
              >
                Get Started Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-white"
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About; 