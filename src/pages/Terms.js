import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Shield, Users, Lock, CheckCircle, AlertCircle, AlertTriangle, Clock, BookOpen, Ban, DollarSign, Database, Globe, Scale, Mail, Building } from 'lucide-react';

const Terms = () => {
  const sections = [
    {
      id: 'eligibility',
      title: '1. Eligibility & Accounts',
      icon: Users,
      content: '',
      points: [
        'You must be 18 years or older and have legal authority to enter into these Terms.',
        'You agree to provide accurate, current information, and maintain the security of your account.',
        'You are fully responsible for all activity under your account.',
        'Sharing account access, credentials, or purchased data outside your organization/team is strictly prohibited.'
      ]
    },
    {
      id: 'nature',
      title: '2. Nature of the Services',
      icon: BookOpen,
      content: 'BioPing provides business development intelligence, including publicly available business contact information and other professional data. We do not provide personal, consumer, or private-use data. BioPing is a B2B professional-use platform.',
      subContent: 'BioPing does not guarantee:',
      subPoints: [
        'accuracy,',
        'completeness,',
        'timeliness,',
        'legality of your use of data.'
      ],
      footer: 'You are solely responsible for ensuring that your use complies with all applicable laws, including GDPR, UK GDPR, PECR, CAN-SPAM, CASL, and any jurisdiction-specific outreach regulations.'
    },
    {
      id: 'permitted',
      title: '3. Permitted Use',
      icon: CheckCircle,
      content: 'You may use the Services solely for:',
      points: [
        'identifying business-related prospects,',
        'professional outreach related to an individual\'s role, employer, or commercial activities,',
        'internal business research.'
      ],
      footer: 'Your use must comply with all applicable laws, these Terms, and BioPing guidelines and documentation.'
    },
    {
      id: 'prohibited',
      title: '4. Prohibited Use',
      icon: Ban,
      content: 'You must NOT:',
      points: [
        'use any data for personal, consumer, credit, tenant, insurance, or employment eligibility purposes (FCRA/consumer uses);',
        'use the Services for harassment, spam, abuse, illegal outreach, or personal marketing;',
        'copy, scrape, mine, mirror, harvest, or extract the platform or database;',
        'reverse engineer, reproduce, sell, sublicense, or create competitive products;',
        'use automated scripts, bots, crawlers, or similar tools without written permission;',
        'upload viruses, malware, harmful code, or interfere with the operation of the Services;',
        'violate privacy rights, IP rights, or breach data protection laws;',
        'use BioPing data in training, developing, or enhancing any AI, LLM, or ML model.'
      ],
      footer: 'BioPing may suspend or terminate your access for any violation, with or without notice.'
    },
    {
      id: 'billing',
      title: '5. Subscription, Billing & Refunds',
      icon: DollarSign,
      content: '',
      points: [
        'Paid plans must be prepaid.',
        'All fees are non-refundable, unless required by law.',
        'BioPing may modify pricing at renewal.',
        'Subscriptions do auto-renew unless explicitly stated.',
        'BioPing may suspend access for non-payment or suspicious activity.'
      ]
    },
    {
      id: 'responsibilities',
      title: '6. Data Accuracy, Legality & Your Responsibilities',
      icon: Database,
      content: 'You acknowledge and agree:',
      points: [
        'BioPing aggregates data from public, licensed, and third-party sources.',
        'BioPing does not guarantee accuracy, completeness, or legality of any data.',
        'You are solely responsible for:',
        '  - verifying information before use,',
        '  - honoring opt-out requests,',
        '  - complying with GDPR/UK GDPR lawful basis (usually "legitimate interest"),',
        '  - maintaining your own outreach compliance.'
      ],
      footer: 'BioPing does not advise, guarantee, or provide opinions on your compliance status.'
    },
    {
      id: 'intellectual',
      title: '7. Intellectual Property',
      icon: Lock,
      content: 'BioPing owns all rights in:',
      points: [
        'the platform,',
        'database structure,',
        'software,',
        'UI/UX,',
        'trademarks,',
        'proprietary content.'
      ],
      footer: 'Users receive only a limited, revocable, non-transferable, non-sublicensable license to access Services during their subscription. No reproduction, resale, scraping, exporting, or distribution is allowed without written consent.'
    },
    {
      id: 'privacy',
      title: '8. Privacy',
      icon: Shield,
      content: 'Our processing of data, including business contact data, is governed by our Privacy Policy.',
      footer: 'Users must independently ensure compliance with all applicable privacy laws in jurisdictions where they operate or target outreach.'
    },
    {
      id: 'termination',
      title: '9. Termination',
      icon: AlertCircle,
      content: 'BioPing may suspend or terminate access at any time, for any or no reason, including:',
      points: [
        'misuse,',
        'scraping,',
        'non-payment,',
        'legal risk,',
        'violation of Terms.'
      ],
      footer: 'Users must cease all use of data upon termination. No refunds will be provided.'
    },
    {
      id: 'disclaimers',
      title: '10. Disclaimers (Very Important)',
      icon: AlertTriangle,
      content: 'To the fullest extent permitted by law:',
      points: [
        'The Services are provided "AS IS" and "AS AVAILABLE".',
        'BioPing makes no warranties, express or implied, including fitness for a particular purpose, accuracy, reliability, or non-infringement.',
        'BioPing is not responsible for:',
        '  - third-party actions,',
        '  - email deliverability,',
        '  - damages from use or misuse,',
        '  - outages,',
        '  - data errors,',
        '  - regulatory penalties arising from your outreach.'
      ],
      footer: 'You acknowledge that you use BioPing at your sole risk.'
    },
    {
      id: 'liability',
      title: '11. Limitation of Liability',
      icon: Scale,
      content: 'To the maximum extent permitted by law:',
      points: [
        'BioPing\'s total liability for any claim is limited to the fees paid by you in the three (3) months prior to the claim.',
        'BioPing shall not be liable for:',
        '  - indirect,',
        '  - incidental,',
        '  - consequential,',
        '  - punitive,',
        '  - loss of business,',
        '  - loss of profits,',
        '  - loss of data,',
        '  - compliance penalties incurred by you.'
      ],
      footer: 'Some jurisdictions may not allow certain limitations. In such cases, BioPing\'s liability is limited to the maximum extent allowed by applicable law.'
    },
    {
      id: 'indemnification',
      title: '12. Indemnification',
      icon: Shield,
      content: 'You agree to defend, indemnify, and hold harmless BioPing and its officers, directors, employees, contractors, and affiliates from all claims, damages, losses, penalties, legal fees, and liabilities arising from:',
      points: [
        'your use of the Services,',
        'your outreach,',
        'your violation of laws (including GDPR/UK GDPR),',
        'your misuse of data,',
        'your breach of these Terms.'
      ],
      footer: 'This section survives termination.'
    },
    {
      id: 'international',
      title: '13. International Use (GDPR / UK GDPR / EU / Other Jurisdictions)',
      icon: Globe,
      content: 'BioPing processes only business contact data and relies on legitimate interest as a lawful basis where applicable.',
      subContent: 'You are solely responsible for:',
      subPoints: [
        'determining your lawful basis for outreach,',
        'handling data subject requests,',
        'compliance with EU/UK marketing laws (GDPR, UK GDPR, PECR).'
      ],
      footer: 'BioPing does not represent or warrant that your use will comply with all obligations in every jurisdiction.'
    },
    {
      id: 'arbitration',
      title: '14. Arbitration & Class Action Waiver (All Users)',
      icon: Scale,
      content: 'Except where prohibited by law:',
      points: [
        'All disputes will be resolved through binding, individual arbitration.',
        'You waive the right to:',
        '  - participate in a class action,',
        '  - a jury trial.'
      ]
    },
    {
      id: 'governing',
      title: '15. Governing Law',
      icon: Globe,
      content: 'For All users: California law, jurisdiction in San Diego County.'
    },
    {
      id: 'changes',
      title: '16. Changes to Terms',
      icon: FileText,
      content: 'BioPing may update these Terms at any time. Continued use constitutes acceptance.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <div className="flex items-center space-x-3">
              <img 
                src="/dfgjk.webp" 
                alt="BioPing Logo" 
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  console.log('Logo failed to load:', e.target.src);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container-custom py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-8"
          >
            <FileText className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center space-x-4 text-gray-600 mb-4"
          >
            <Clock className="w-5 h-5" />
            <span className="text-lg">Date: Nov, 2025</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
          >
            BioPing — Terms of Service (TOS)
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed space-y-4 mb-8"
          >
            <p>
              Welcome to BioPing, owned and operated by <strong>CD Services LLC</strong>, a California-based company ("BioPing", "we", "us", "our"). 
              These Terms of Service ("Terms") form a legally binding agreement between you ("you", "User") and BioPing.
            </p>
            <p>
              By accessing or using BioPing's website, platform, database, services, or content (collectively, the "Services"), 
              you agree to these Terms. If you do not agree to these Terms, do not access or use the Services.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Content Sections */}
      <div className="container-custom pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.05 }}
                className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{section.title}</h2>
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                  </div>
                </div>
                
                <div className="space-y-4 ml-16">
                  {section.content && (
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {section.content}
                    </p>
                  )}
                  
                  {section.subContent && (
                    <p className="text-gray-700 leading-relaxed text-lg font-semibold mt-4">
                      {section.subContent}
                    </p>
                  )}

                  {section.subPoints && (
                    <ul className="space-y-2 ml-4">
                      {section.subPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-blue-600 mr-2 font-bold">•</span>
                          <span className="text-gray-700 leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {section.points && (
                    <ul className="space-y-3">
                      {section.points.map((point, pointIndex) => (
                        <motion.li
                          key={pointIndex}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.8 + index * 0.05 + pointIndex * 0.03 }}
                          className="flex items-start space-x-3"
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-3 flex-shrink-0"></div>
                          <span className="text-gray-700 leading-relaxed">{point}</span>
                        </motion.li>
                      ))}
                    </ul>
                  )}

                  {section.footer && (
                    <p className="text-gray-700 leading-relaxed text-lg mt-4 pt-4 border-t border-gray-200">
                      {section.footer}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white"
          >
            <h3 className="text-2xl font-bold mb-6 text-center">17. Contact</h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center">
                <Building className="w-8 h-8 mb-3" />
                <h4 className="font-semibold mb-2">BioPing, Inc.</h4>
                <p className="text-blue-100 text-sm">California, USA</p>
              </div>
              <div className="flex flex-col items-center">
                <Mail className="w-8 h-8 mb-3" />
                <h4 className="font-semibold mb-2">Email</h4>
                <a href="mailto:support@thebioping.com" className="text-blue-100 text-sm hover:text-white transition-colors">
                  support@thebioping.com
                </a>
              </div>
              <div className="flex flex-col items-center">
                <Globe className="w-8 h-8 mb-3" />
                <h4 className="font-semibold mb-2">Website</h4>
                <a href="https://www.thebioping.com" target="_blank" rel="noopener noreferrer" className="text-blue-100 text-sm hover:text-white transition-colors">
                  www.thebioping.com
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Terms;