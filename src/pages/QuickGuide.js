import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, CheckCircle, AlertCircle, Info } from 'lucide-react';

const QuickGuide = () => {
  const guideSections = [
    {
      title: "Getting Started",
      icon: CheckCircle,
      color: "blue",
      items: [
        "Complete your profile with accurate information",
        "Set up your BD tracking preferences",
        "Familiarize yourself with the search functionality",
        "Review the definitions section for industry terms"
      ]
    },
    {
      title: "Search Best Practices",
      icon: Info,
      color: "green",
      items: [
        "Use specific company names for better results",
        "Try different contact name variations",
        "Filter by disease area for targeted searches",
        "Save important searches for quick access"
      ]
    },
    {
      title: "BD Tracker Tips",
      icon: AlertCircle,
      color: "orange",
      items: [
        "Set project names for organized tracking",
        "Use priority levels to manage follow-ups",
        "Update feedback regularly for better insights",
        "Export data regularly for backup"
      ]
    },
    {
      title: "Pro Features",
      icon: ArrowRight,
      color: "purple",
      items: [
        "Access unlimited contact details",
        "Download comprehensive reports",
        "Get priority customer support",
        "Access exclusive BD insights content"
      ]
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 bg-blue-50 text-blue-700',
      green: 'from-green-500 to-green-600 bg-green-50 text-green-700',
      orange: 'from-orange-500 to-orange-600 bg-orange-50 text-orange-700',
      purple: 'from-purple-500 to-purple-600 bg-purple-50 text-purple-700'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Quick Guide</h1>
                  <p className="text-sm text-gray-500">Essential tips and best practices</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guideSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className={`bg-gradient-to-r ${getColorClasses(section.color)} p-6`}>
                <div className="flex items-center space-x-3">
                  <section.icon className="w-6 h-6" />
                  <h3 className="text-lg font-bold">{section.title}</h3>
                </div>
              </div>
              
              <div className="p-6">
                <ul className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Pro Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Search Efficiency</h4>
              <p className="text-blue-700 text-sm">
                Use partial company names and try different spellings to find more results.
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Data Management</h4>
              <p className="text-green-700 text-sm">
                Regularly export your BD tracker data to maintain backups of your progress.
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2">Follow-up Strategy</h4>
              <p className="text-orange-700 text-sm">
                Set reminders and use priority levels to ensure timely follow-ups.
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">Premium Features</h4>
              <p className="text-purple-700 text-sm">
                Upgrade to access unlimited contacts and exclusive BD insights content.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default QuickGuide; 