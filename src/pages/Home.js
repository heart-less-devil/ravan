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
      number: "500+",
      label: "Biotech Companies",
      description: "Leading biotech and pharma companies"
    },
    {
      icon: HeartHandshake,
      number: "2500+",
      label: "BD Contacts",
      description: "Validated business development contacts"
    },
    {
      icon: Heart,
      number: "200+",
      label: "Investors",
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
    "Detailed list of potential partners by tier",
    "Clear plan on who and where to contact",
    "Start business development outreach process",
    "Connect with the right partners",
    "Create focused strategies that get deals done"
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

        <div className="container-custom text-center relative z-10">
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
              <div className="flex justify-center mb-4">
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
              <h1 className="text-5xl md:text-6xl font-bold text-blue-900 mb-6">
                Your <span className="text-orange-400">Trusted</span> BD Partner
              </h1>
              <p className="text-xl text-black max-w-4xl mx-auto leading-relaxed">
                Our Mission - To empower the life sciences industry achieve <span className="font-bold">smarter outreach, better partners, and faster deals</span> - through validated BD and investor contacts that drive real results.
              </p>
            </motion.div>
            
            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
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

            {/* Trust Indicators */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap justify-center items-center gap-8 text-gray-500"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-accent-500" />
                <span className="text-sm font-medium">15+ Years Industry Experience</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-accent-500" />
                <span className="text-sm font-medium">500+ Biotech Companies</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-accent-500" />
                <span className="text-sm font-medium">2500+ Validated Contacts</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section bg-white py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
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
                With 15+ years in pharma and biotech, we know the challenges of breaking through. The BioPing platform offers more than just BD contacts — it's a mix of paid tools and free resources, built to support, guide, and empower emerging biotech's.
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

      {/* Testimonials Section */}
      <section className="section bg-gradient-to-br from-gray-50 to-primary-50/20 py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join hundreds of biotech companies who trust BioPing for their business development needs
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            <motion.div
              key={activeTestimonial}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl p-8 shadow-large border border-gray-100"
            >
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {testimonials[activeTestimonial].avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-lg text-gray-700 mb-6 leading-relaxed">
                    "{testimonials[activeTestimonial].content}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonials[activeTestimonial].name}
                    </div>
                    <div className="text-gray-600">
                      {testimonials[activeTestimonial].role}
                    </div>
                    <div className="text-primary-600 font-medium">
                      {testimonials[activeTestimonial].company}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Navigation */}
            <div className="flex justify-center space-x-4 mt-8">
              <button
                onClick={prevTestimonial}
                className="w-12 h-12 bg-white rounded-full shadow-soft flex items-center justify-center hover:shadow-medium transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === activeTestimonial ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={nextTestimonial}
                className="w-12 h-12 bg-white rounded-full shadow-soft flex items-center justify-center hover:shadow-medium transition-all duration-200"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </section>





      {/* Benefits Section */}
      <section className="section bg-white py-20">
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
                      <p className="text-gray-600">Connect with verified BD contacts</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent-600 to-primary-600 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Industry Expertise</h3>
                      <p className="text-gray-600"></p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-secondary-600 to-accent-600 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Fast Results</h3>
                      <p className="text-gray-600">Accelerate your BD process</p>
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