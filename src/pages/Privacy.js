import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Eye, Database, Users, CheckCircle, Clock, Globe, Server, Key, Bell, FileText, Mail, Building, AlertCircle } from 'lucide-react';

const Privacy = () => {
  const sections = [
    {
      id: 'information-collection',
      title: '1. What Information We Collect',
      icon: Database,
      content: 'We collect information from the following categories:',
      subsections: [
        {
          title: '1.1 Information You Provide Directly',
          description: 'When you create an account, subscribe, or interact with us, we may collect:',
          points: [
            'Name, job title, company name',
            'Work email address, phone number',
            'Billing and payment information',
            'Messages, inquiries, customer support communications',
            'Account preferences and settings'
          ]
        },
        {
          title: '1.2 Information Collected Automatically',
          description: 'When you access our platform, we may collect:',
          points: [
            'IP address, device identifiers, browser information',
            'Usage data (logins, page views, searches)',
            'Cookies, pixels, tracking technologies (See our Cookie Policy for details.)'
          ]
        },
        {
          title: '1.3 Professional Publicly Available Information',
          description: 'BioPing collects and compiles professional business contact details from:',
          points: [
            'Public websites / corporate websites',
            'Regulatory filings',
            'Business directories',
            'Social media profiles',
            'Press releases, conference attendance lists',
            'Data providers and partners'
          ],
          additionalInfo: 'This may include: Name, company, job role; Work email, work phone; Work location; Industry specialization; Publicly available work history or education',
          footer: 'BioPing does not collect personal or consumer information unrelated to professional identity.'
        },
        {
          title: '1.4 Information from Customers or Partners',
          description: 'Customers may provide business contacts to enrich their CRM or support their BD processes.',
          footer: 'Customers are responsible for ensuring they have the right to share such information.'
        }
      ]
    },
    {
      id: 'how-we-use',
      title: '2. How We Use Information',
      icon: CheckCircle,
      content: 'We use personal and business information for the following purposes:',
      subsections: [
        {
          title: 'To Provide and Improve Our Services',
          points: [
            'Maintain and operate the BioPing platform',
            'Provide access to contact databases and BD tools',
            'Process subscriptions, billing, and invoicing',
            'Offer customer support and technical assistance'
          ]
        },
        {
          title: 'To Communicate with You',
          points: [
            'Service-related updates',
            'Administrative messages',
            'Marketing and promotional emails (opt-out available)'
          ]
        },
        {
          title: 'To Improve Data Quality',
          points: [
            'Verify, cleanse, and update business contact information',
            'Develop new features and platform capabilities'
          ]
        },
        {
          title: 'For Security and Compliance',
          points: [
            'Detect and prevent fraud, abuse, and cybersecurity threats',
            'Enforce our Terms of Use',
            'Comply with legal obligations'
          ]
        }
      ],
      footer: 'Legal Basis for Processing (GDPR): Legitimate interest; Performance of a contract with our customers; Consent (where required); Compliance with legal obligations'
    },
    {
      id: 'sharing',
      title: '3. How We Share Information',
      icon: Users,
      content: 'We may share information in the following limited circumstances:',
      subsections: [
        {
          title: '3.1 Customers and Users',
          description: 'BioPing provides professional business contact information to its paying subscribers for B2B outreach and networking purposes.'
        },
        {
          title: '3.2 Service Providers',
          description: 'We may share data with trusted vendors who support:',
          points: [
            'Hosting & cloud infrastructure',
            'Data storage',
            'Payment processing',
            'Analytics & security tools',
            'Customer support platforms'
          ],
          footer: 'All providers must maintain confidentiality and security.'
        },
        {
          title: '3.3 Business Transfers',
          description: 'If BioPing is involved in a merger, acquisition, financing, or asset sale, information may be transferred as part of the transaction.'
        },
        {
          title: '3.4 Legal and Regulatory',
          description: 'We may disclose information where required to:',
          points: [
            'Comply with the law',
            'Respond to legal requests or investigations',
            'Protect rights, property, and safety'
          ]
        }
      ],
      footer: 'We do not sell personal data in the traditional sense but may be considered to "share" data under California law if contacts appear in our database.'
    },
    {
      id: 'protection',
      title: '4. How We Protect Your Information',
      icon: Shield,
      content: 'We use industry-standard administrative, technical, and physical safeguards. These include:',
      points: [
        'Encrypted data at rest and in transit',
        'Access controls and authentication',
        'Logging and monitoring',
        'Vendor security reviews'
      ],
      footer: 'However, no internet-based service can be 100% secure.'
    },
    {
      id: 'rights',
      title: '5. Your Rights and Choices',
      icon: Key,
      content: 'Depending on your location, you may have the right to:',
      points: [
        'Access personal data we hold about you',
        'Correct inaccurate information',
        'Delete / Remove your profile',
        'Object to processing (including legitimate interest)',
        'Opt-out of professional contact visibility',
        'Withdraw consent where applicable'
      ],
      footer: 'To remove your professional profile from BioPing, submit a request at: privacy@thebioping.com We may require verification of identity before processing requests.'
    },
    {
      id: 'international',
      title: '6. International Data Transfers',
      icon: Globe,
      content: 'BioPing is based in the United States. We may transfer and store information in the U.S. and other countries where our service providers operate. We implement appropriate safeguards, including:',
      points: [
        'Standard Contractual Clauses (SCCs)',
        'Vendor due-diligence and data protection agreements'
      ]
    },
    {
      id: 'retention',
      title: '7. Data Retention',
      icon: Database,
      content: 'We retain professional and customer information only as long as necessary to:',
      points: [
        'Provide Services',
        'Comply with legal obligations',
        'Resolve disputes',
        'Maintain data accuracy'
      ],
      footer: 'We delete or anonymize data when it is no longer needed.'
    },
    {
      id: 'children',
      title: '8. Children\'s Privacy',
      icon: AlertCircle,
      content: '',
      points: [
        'Our Services are not intended for individuals under 18.',
        'We do not knowingly collect information from children.'
      ]
    },
    {
      id: 'third-party',
      title: '9. Third-Party Links',
      icon: Globe,
      content: '',
      points: [
        'BioPing may contain links to third-party websites.',
        'We are not responsible for their content or privacy practices.'
      ]
    },
    {
      id: 'changes',
      title: '10. Changes to This Policy',
      icon: FileText,
      content: '',
      points: [
        'We may update this Privacy Policy periodically.',
        'Material changes will be posted on our website with an updated "Effective Date."'
      ]
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
              className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors group"
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
            className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-8"
          >
            <Shield className="w-10 h-10 text-white" />
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
            BioPing — Privacy Policy
          </motion.h1>
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
                transition={{ duration: 0.6, delay: 0.5 + index * 0.05 }}
                className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{section.title}</h2>
                    <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                  </div>
                </div>
                
                <div className="space-y-4 ml-16">
                  {section.content && (
                    <p className="text-gray-700 leading-relaxed text-lg mb-4">
                      {section.content}
                    </p>
                  )}

                  {section.subsections && section.subsections.map((subsection, subIndex) => (
                    <div key={subIndex} className="mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{subsection.title}</h3>
                      {subsection.description && (
                        <p className="text-gray-700 leading-relaxed mb-3">{subsection.description}</p>
                      )}
                      {subsection.points && (
                        <ul className="space-y-2 ml-4">
                          {subsection.points.map((point, pointIndex) => (
                            <li key={pointIndex} className="flex items-start">
                              <span className="text-green-600 mr-2 font-bold">•</span>
                              <span className="text-gray-700 leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {subsection.additionalInfo && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-700 text-sm">{subsection.additionalInfo}</p>
                        </div>
                      )}
                      {subsection.footer && (
                        <p className="text-gray-700 leading-relaxed text-sm mt-3 italic">{subsection.footer}</p>
                      )}
                    </div>
                  ))}
                  
                  {section.points && !section.subsections && (
                    <ul className="space-y-3">
                      {section.points.map((point, pointIndex) => (
                        <motion.li
                          key={pointIndex}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.6 + index * 0.05 + pointIndex * 0.03 }}
                          className="flex items-start space-x-3"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-3 flex-shrink-0"></div>
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
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mt-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 text-white"
          >
            <h3 className="text-2xl font-bold mb-6 text-center">11. Contact Us</h3>
            <p className="text-center text-green-100 mb-6 text-lg">
              For privacy questions or data rights requests, contact:
            </p>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Building className="w-6 h-6" />
                <h4 className="font-semibold text-lg">BioPing – Privacy Office</h4>
              </div>
              <a
                href="mailto:privacy@thebioping.com"
                className="inline-flex items-center space-x-2 bg-white text-green-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-200 text-lg"
              >
                <Mail className="w-5 h-5" />
                <span>privacy@thebioping.com</span>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;