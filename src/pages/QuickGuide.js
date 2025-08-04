import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, CheckCircle, AlertCircle, Info } from 'lucide-react';

const QuickGuide = () => {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Quick Guide</h1>
            <p className="text-blue-100">Essential tips and strategies for successful business development</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Section 1: Getting Started */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              Getting Started with BD
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🔍 Search Strategy</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Use Company Name search for broad results</li>
                  <li>• Use Contact Name for specific individuals</li>
                  <li>• Try partial names for better matches</li>
                  <li>• Example: Search "UCB" to see available companies</li>
                </ul>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Understanding Results</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Company tier indicates size and focus</li>
                  <li>• Modality shows therapeutic approach</li>
                  <li>• Region indicates geographic focus</li>
                  <li>• Contact function shows decision-making role</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: Best Practices */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              Best Practices
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 Targeting</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Focus on companies with matching modalities</li>
                  <li>• Consider company tier for partnership fit</li>
                  <li>• Research contact's function and background</li>
                  <li>• Align with your development stage</li>
                </ul>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📞 Outreach</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Personalize your approach</li>
                  <li>• Highlight mutual benefits</li>
                  <li>• Follow up professionally</li>
                  <li>• Track all interactions</li>
                </ul>
              </div>
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🤝 Relationship Building</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Build long-term relationships</li>
                  <li>• Provide value beyond transactions</li>
                  <li>• Attend industry conferences</li>
                  <li>• Stay updated on industry trends</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3: Common Mistakes */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              Common Mistakes to Avoid
            </h2>
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">❌ What Not to Do</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Generic mass emails</li>
                    <li>• Ignoring company research</li>
                    <li>• Pushing too hard for quick deals</li>
                    <li>• Not following up properly</li>
                    <li>• Ignoring cultural differences</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">✅ What to Do Instead</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Personalized, targeted outreach</li>
                    <li>• Thorough company and contact research</li>
                    <li>• Building relationships over time</li>
                    <li>• Consistent, professional follow-up</li>
                    <li>• Understanding cultural nuances</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Success Metrics */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">4</span>
              </div>
              Measuring Success
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📈 Key Metrics</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Response rate to outreach</li>
                  <li>• Meeting conversion rate</li>
                  <li>• Partnership discussions initiated</li>
                  <li>• Long-term relationship development</li>
                </ul>
              </div>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 Goals</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Build a strong network</li>
                  <li>• Create strategic partnerships</li>
                  <li>• Increase deal flow</li>
                  <li>• Establish thought leadership</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Ready to Get Started?</h3>
            <p className="text-gray-600 mb-4">Use our search tools to find potential partners and start building your BD strategy today.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default QuickGuide; 