import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Target, TrendingUp, Users, CheckCircle, Building2, HeartHandshake, Zap } from 'lucide-react';

const OurValue = () => {
  const valuePropositions = [
    {
      icon: Target,
      title: "Strategic Focus",
      description: "We focus on what matters most - connecting you with the right partners for successful dealmaking."
    },
    {
      icon: TrendingUp,
      title: "Proven Results",
      description: "Our track record speaks for itself with successful partnerships and deals across the industry."
    },
    {
      icon: Users,
      title: "Network Access",
      description: "Access to a curated network of industry professionals, investors, and decision-makers."
    },
    {
      icon: Building2,
      title: "Industry Expertise",
      description: "Deep understanding of biotech and pharma business development challenges and opportunities."
    }
  ];

  const benefits = [
    "Accelerate your business development efforts",
    "Connect with validated industry contacts",
    "Access strategic insights and market intelligence",
    "Reduce time to market for partnerships",
    "Increase deal success rates",
    "Build lasting industry relationships"
  ];

  const testimonials = [
    {
      quote: "BioPing has transformed our business development approach. The quality of contacts and insights provided are unmatched.",
      author: "Sarah Johnson",
      role: "BD Director, TechBio Inc."
    },
    {
      quote: "The platform's comprehensive database and strategic guidance have been instrumental in our growth.",
      author: "Michael Chen",
      role: "CEO, PharmaStart"
    },
    {
      quote: "Finally, a platform that understands the unique challenges of biotech dealmaking.",
      author: "Dr. Emily Rodriguez",
      role: "CSO, LifeSciences Co."
    }
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
              Our <span className="gradient-text">Value</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We deliver exceptional value through our comprehensive platform, 
              industry expertise, and proven track record of successful partnerships.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="section bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="section-title">
              Why Choose BioPing?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our unique combination of technology, expertise, and network access 
              provides unmatched value for your business development needs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {valuePropositions.map((proposition, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card p-6 text-center hover:shadow-large transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <proposition.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {proposition.title}
                </h3>
                <p className="text-gray-600">
                  {proposition.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="section-title">
                Comprehensive Benefits
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our platform provides everything you need to succeed in the competitive 
                biotech and pharma landscape.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
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
                Value Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">3x</span>
                  </div>
                  <span>Faster deal closure</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">85%</span>
                  </div>
                  <span>Success rate improvement</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">50%</span>
                  </div>
                  <span>Reduced outreach time</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">200+</span>
                  </div>
                  <span>Validated contacts</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="section-title">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it. Here's what industry leaders say about BioPing.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card p-6"
              >
                <div className="mb-4">
                  <div className="flex text-yellow-400 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="section bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="section-title">
              Return on Investment
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See measurable results from your investment in BioPing's platform and services.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                metric: "3-6 months",
                title: "Time to Value",
                description: "Start seeing results within the first quarter of implementation"
              },
              {
                metric: "300%",
                title: "ROI Average",
                description: "Typical return on investment for our enterprise clients"
              },
              {
                metric: "90%",
                title: "Client Retention",
                description: "Long-term partnerships built on proven results"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card p-6 text-center"
              >
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {item.metric}
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
              Ready to Experience Our Value?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join the growing number of companies that have transformed their 
              business development with BioPing's comprehensive platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-secondary"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-white"
              >
                Schedule Demo
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default OurValue; 