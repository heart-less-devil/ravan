import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Target, TrendingUp, CheckCircle, ArrowRight, Award, Heart, Globe, Zap, Star, Calendar, MapPin, Phone, Mail, ChevronLeft, ChevronRight, Play, Download, FileText, Sparkles } from 'lucide-react';

const About = () => {
  const [activeTimeline, setActiveTimeline] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

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

  const teamStats = [
    { number: "15+", label: "Years Experience", icon: Award },
    { number: "500+", label: "Companies Served", icon: Building2 },
    { number: "2500+", label: "Connections Made", icon: Users },
    { number: "100%", label: "Client Satisfaction", icon: Heart },
  ];

  const timeline = [
    {
      year: "2009",
      title: "Industry Entry",
      description: "Our founder began their journey in biotech BD at a major pharmaceutical company",
      icon: Building2
    },
    {
      year: "2015",
      title: "Network Building",
      description: "Established connections with 500+ biotech companies and industry leaders",
      icon: Users
    },
    {
      year: "2020",
      title: "Platform Vision",
      description: "Recognized the need for better BD tools and started developing BioPing",
      icon: Target
    },
    {
      year: "2024",
      title: "BioPing Launch",
      description: "Officially launched the platform to help emerging biotechs succeed",
      icon: Sparkles
    }
  ];

  const teamMembers = [
    {
      name: "John Smith",
      role: "Founder & CEO",
      experience: "15+ years in biotech BD",
      avatar: "JS",
      bio: "Former BD Director at major pharma, passionate about helping emerging biotechs succeed."
    },
    {
      name: "Dr. Sarah Chen",
      role: "Chief Scientific Officer",
      experience: "12+ years in drug development",
      avatar: "SC",
      bio: "PhD in Molecular Biology, led multiple successful drug development programs."
    },
    {
      name: "Michael Rodriguez",
      role: "Head of Partnerships",
      experience: "10+ years in strategic partnerships",
      avatar: "MR",
      bio: "Expert in building strategic alliances and partnership development."
    }
  ];

  const achievements = [
    { number: '500+', label: 'Biotech Companies', icon: Users },
    { number: '2500+', label: 'BD Contacts', icon: Award },
    { number: '15+', label: 'Years Experience', icon: Star },
  ];

  const nextTimeline = () => {
    setActiveTimeline((prev) => (prev + 1) % timeline.length);
  };

  const prevTimeline = () => {
    setActiveTimeline((prev) => (prev - 1 + timeline.length) % timeline.length);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="section bg-gradient-to-br from-gray-50 to-primary-50/20">
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
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We are a leading business development and strategic partnership company, 
              dedicated to helping biotech businesses grow and succeed in today's competitive market.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section bg-white py-16">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {teamStats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <stat.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</h3>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="section bg-gradient-to-br from-gray-50 to-primary-50/20 py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From industry insiders to platform creators - see how we've evolved to serve the biotech community
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            <motion.div
              key={activeTimeline}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl p-8 shadow-large border border-gray-100"
            >
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-full flex items-center justify-center">
                  {React.createElement(timeline[activeTimeline].icon, { className: "w-8 h-8 text-white" })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="text-3xl font-bold text-primary-600">
                      {timeline[activeTimeline].year}
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {timeline[activeTimeline].title}
                    </span>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {timeline[activeTimeline].description}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Navigation */}
            <div className="flex justify-center space-x-4 mt-8">
              <button
                onClick={prevTimeline}
                className="w-12 h-12 bg-white rounded-full shadow-soft flex items-center justify-center hover:shadow-medium transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex space-x-2">
                {timeline.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTimeline(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === activeTimeline ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={nextTimeline}
                className="w-12 h-12 bg-white rounded-full shadow-soft flex items-center justify-center hover:shadow-medium transition-all duration-200"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section bg-white py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Industry experts with deep experience in biotech business development
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-6 border border-primary-100 hover:shadow-medium transition-all duration-300 group"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                  {member.avatar}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                  {member.name}
                </h3>
                <p className="text-primary-600 font-medium text-center mb-2">
                  {member.role}
                </p>
                <p className="text-gray-600 text-center mb-4">
                  {member.experience}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {member.bio}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder's Message */}
      <section className="section bg-gradient-to-br from-gray-50 to-primary-50/20">
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
                  to help biotech businesses connect, grow, and succeed in an increasingly complex and 
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
                  comprehensive solutions that address the unique challenges faced by modern biotech businesses. 
                  We believe in the power of collaboration and the potential for growth that exists 
                  in every business relationship.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-accent-500" />
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
              <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-3xl p-1 shadow-large">
                <div className="bg-white rounded-3xl p-8">
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
                      <div className="w-6 h-6 bg-gradient-to-br from-accent-500 to-primary-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700 font-medium">15+ Years Experience</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-accent-500 to-primary-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700 font-medium">Strategic Partnerships</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-accent-500 to-primary-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700 font-medium">Business Development</span>
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
                className="card p-6 text-center hover:shadow-large hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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
      <section className="section bg-gradient-to-br from-gray-50 to-primary-50/20">
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
                    className="flex items-center space-x-3"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-accent-500 to-primary-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">{value}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-3xl p-8 text-white shadow-large"
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
      <section className="section bg-gradient-to-r from-primary-600 to-secondary-600 py-20">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Work with Us?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Let's discuss how we can help accelerate your biotech's growth and connect you with the right partners.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-soft hover:shadow-medium transition-all duration-300 flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-300"
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