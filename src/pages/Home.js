import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, HeartHandshake, Heart, ArrowRight, CheckCircle, Globe, Target, Shield, TrendingUp, Sparkles, Users, Award, Zap, Star, Quote, Play, Download, Calendar, Clock, MapPin, Phone, Mail, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

const Home = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const navigate = useNavigate();

  const stats = [
    {
      icon: Building2,
      number: "1500+",
      label: "Pharma & Biotech's",
      description: "Across all TA's and Modalities"
    },
    {
      icon: HeartHandshake,
      number: "5000+",
      label: "CEO, CFO, BD & Other Contacts",
      description: "Validated contacts from 1:1 mtgs"
    },
    {
      icon: Heart,
      number: "320+",
      label: "Investors, VCs, PE & Corporate Ventures",
      description: "Active investors in life sciences"
    }
  ];

  const features = [
    {
      icon: Target,
      title: "Industry Insider Access",
      description: "Built with 15+ years of pharma and biotech experience"
    },
    {
      icon: Shield,
      title: "Validated Contacts",
      description: "Direct access to decision-makers with verified contact information"
    },
    {
      icon: Globe,
      title: "Global Network",
      description: "Connect with partners across Americas, Europe, and Asia-Pacific regions"
    },
    {
      icon: TrendingUp,
      title: "Proven Results",
      description: "Accelerate your BD process with insider knowledge and streamlined workflows"
    }
  ];

  const benefits = [
    "Create focused strategies that get deals done",
    "See a detailed list of potential partners, ranked by tier",
    "Get a clear plan on who and where to contact",
    "Access validated contact details to start outreach",
    "Connect with the right partners and move deals forward"
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "CEO, NeuroTech Therapeutics",
      company: "Series B Biotech",
      content: "BioPing transformed our BD strategy. We connected with 3 major pharma partners within 6 months. The insider knowledge is invaluable.",
      avatar: "SC",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Business Development Director",
      company: "OncoGen Solutions",
      content: "The platform's validated contacts and strategic insights helped us accelerate our partnership pipeline by 300%. Highly recommended!",
      avatar: "MR",
      rating: 5
    },
    {
      name: "Dr. Emily Watson",
      role: "Founder & CSO",
      company: "ImmunoVax",
      content: "As a startup, we needed credible BD contacts fast. BioPing delivered exactly what we needed with their insider network.",
      avatar: "EW",
      rating: 5
    }
  ];

  const upcomingEvents = [
    {
      title: "Biotech BD Summit 2024",
      date: "March 15-17",
      location: "San Francisco, CA",
      attendees: "500+",
      type: "Conference"
    },
    {
      title: "Partner Matching Workshop",
      date: "March 25",
      location: "Virtual",
      attendees: "200+",
      type: "Workshop"
    },
    {
      title: "Investor Connect",
      date: "April 5",
      location: "Boston, MA",
      attendees: "150+",
      type: "Networking"
    }
  ];

  const resources = [
    {
      title: "BD Strategy Playbook",
      description: "Complete guide to biotech business development",
      icon: Download,
      downloads: "2.5k+",
      type: "Guide"
    },
    {
      title: "Partner Contact Database",
      description: "Curated list of 500+ BD contacts",
      icon: Users,
      downloads: "1.8k+",
      type: "Database"
    },
    {
      title: "Deal Structure Templates",
      description: "Ready-to-use partnership templates",
      icon: FileText,
      downloads: "3.2k+",
      type: "Templates"
    }
  ];

  const currentYear = new Date().getFullYear();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };



  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50/30 overflow-hidden">

        
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/20 to-secondary-50/20 opacity-40"></div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-24 h-24 bg-gradient-to-r from-primary-200 to-secondary-200 rounded-full opacity-20 animate-float blur-sm"></div>
        <div className="absolute top-40 right-20 w-20 h-20 bg-gradient-to-r from-secondary-200 to-accent-200 rounded-full opacity-20 animate-float blur-sm" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-20 w-16 h-16 bg-gradient-to-r from-accent-200 to-primary-200 rounded-full opacity-20 animate-float blur-sm" style={{ animationDelay: '4s' }}></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="container-custom text-center relative z-10 -mt-56 ">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-6xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              variants={itemVariants}
              className="mb-0"
            >
              <div className="flex justify-center mb-0">
                <img 
                  src="/image.png" 
                  alt="BioPing Logo" 
                  className="w-96 h-96 object-contain"
                  onError={(e) => {
                    console.log('Logo failed to load');
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-blue-900 mb-2 -mt-16">
                Your <span className="text-orange-400">Trusted</span> BD Partner
              </h1>
              <p className="text-xl text-black max-w-4xl mx-auto leading-relaxed mb-4">
                Partner Discovery | BD Tracking | Deal Insights
              </p>
              <p className="text-xl text-black max-w-4xl mx-auto leading-relaxed mb-12">
                BioPing is the all-in-one biotech business development platform — helping leaders find the right partners, track every outreach, and access curated insights to close smarter deals.
              </p>
            </motion.div>
            
            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-6 "
            >
              <Link to="/request-demo">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-soft hover:shadow-medium transition-all duration-300 flex items-center space-x-2 overflow-hidden"
                >
                  <span className="relative z-10">Request Demo</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-secondary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.button>
              </Link>
              
              <Link to="/product">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-primary-200 text-primary-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-50 hover:border-primary-300 transition-all duration-300"
                >
                  Learn More
                </motion.button>
              </Link>
            </motion.div>


          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section bg-white py-2 -mt-12">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-8 bg-gradient-to-br from-gray-50 to-primary-50/30 rounded-2xl border border-gray-100 hover:shadow-medium transition-all duration-300 group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</h3>
                <p className="text-lg font-semibold text-gray-700 mb-2">{stat.label}</p>
                <p className="text-gray-600">{stat.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-gradient-to-br from-gray-50 to-primary-50/20 py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="max-w-4xl mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <Sparkles className="w-10 h-10 text-white" />
                </div>
              <h2 className="text-5xl font-bold text-gray-900 mb-8 leading-tight">
                Built by a <span className="text-orange-400 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Biotech Insider</span>. 
                <br />
                Designed to Give Back.
              </h2>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                With 15+ years in business development across Amgen, Shire, Gilead, and leadership roles at biotech's, we know the real hurdles emerging companies face. That's why BioPing goes beyond a list of contacts. It starts with strategy — identifying the right pharma partners for your asset — then enables execution with verified emails and outreach tools and backs it all up with curated insights to help biotech's close smarter deals.
              </p>
              </div>
            </motion.div>

            <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-28"
            >
            <h3 className="text-3xl font-bold mb-4" style={{color: 'rgb(30 58 138 / var(--tw-text-opacity, 1))'}}>
              The most comprehensive, reliable contact database for biotech, pharma - business development and fund-raising outreach.
                  </h3>
            <p className="text-lg text-gray-900">
              Validated through direct meetings and regularly updated for accuracy
            </p>
            </motion.div>
        </div>
      </section>







      {/* Benefits Section */}
      <section className="section bg-white py-12">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Accelerate Your Business Development
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Get the insider knowledge and tools you need to connect with the right partners and accelerate your biotech's growth.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-accent-500 to-primary-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl p-8 shadow-soft">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Network Access</h3>
                      <p className="text-gray-600">Connect with verified BD, R&D and other contacts</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent-600 to-primary-600 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Deal Smarter</h3>
                      <p className="text-gray-600">Expert BD Tools, Tips & Strategy That Actually Work</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-secondary-600 to-accent-600 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">BD at Speed</h3>
                      <p className="text-gray-600">Precision strategy and high-value contacts to move fast</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-teal-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Track Outreach, Close Faster</h3>
                      <p className="text-gray-600">Log BD outreach, track and follow-up – all in one file</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">1:1 BD Support from Deal Pro</h3>
                      <p className="text-gray-600">BD expert shares tips – 15+ years & $20B+ in deals</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


    </div>
  );
};

export default Home; 