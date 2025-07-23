import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  CreditCard, 
  Bell, 
  Globe, 
  Save,
  ArrowLeft,
  Camera,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const CustomerProfile = ({ user, onBack }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Arman Singh',
    email: user?.email || 'amankk0007@gmail.com',
    phone: '+1 (555) 123-4567',
    company: 'BioTech Solutions',
    position: 'Business Development Manager',
    location: 'San Francisco, CA',
    timezone: 'Pacific Time (PT)',
    notifications: {
      email: true,
      push: false,
      sms: true
    },
    privacy: {
      profileVisibility: 'public',
      searchHistory: 'private',
      contactSharing: 'restricted'
    }
  });

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
    console.log('Profile saved:', profileData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original data
    setProfileData({
      name: user?.name || 'Arman Singh',
      email: user?.email || 'amankk0007@gmail.com',
      phone: '+1 (555) 123-4567',
      company: 'BioTech Solutions',
      position: 'Business Development Manager',
      location: 'San Francisco, CA',
      timezone: 'Pacific Time (PT)',
      notifications: {
        email: true,
        push: false,
        sms: true
      },
      privacy: {
        profileVisibility: 'public',
        searchHistory: 'private',
        contactSharing: 'restricted'
      }
    });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>
            {isEditing && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="space-y-4">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border p-8"
            >
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <Edit className="w-4 h-4" />
                      <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                    </button>
                  </div>

                  {/* Profile Picture */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-3xl">
                          {profileData.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      {isEditing && (
                        <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors duration-200">
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{profileData.name}</h3>
                      <p className="text-gray-600">{profileData.position}</p>
                      <p className="text-sm text-gray-500">{profileData.company}</p>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                      <input
                        type="text"
                        value={profileData.company}
                        onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                      <input
                        type="text"
                        value={profileData.position}
                        onChange={(e) => setProfileData({...profileData, position: e.target.value})}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">Email Notifications</h3>
                          <p className="text-sm text-gray-600">Receive updates via email</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profileData.notifications.email}
                          onChange={(e) => setProfileData({
                            ...profileData,
                            notifications: { ...profileData.notifications, email: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Bell className="w-5 h-5 text-gray-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">Push Notifications</h3>
                          <p className="text-sm text-gray-600">Receive browser notifications</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profileData.notifications.push}
                          onChange={(e) => setProfileData({
                            ...profileData,
                            notifications: { ...profileData.notifications, push: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">SMS Notifications</h3>
                          <p className="text-sm text-gray-600">Receive updates via SMS</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profileData.notifications.sms}
                          onChange={(e) => setProfileData({
                            ...profileData,
                            notifications: { ...profileData.notifications, sms: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900">Privacy Settings</h2>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-medium text-gray-900 mb-3">Profile Visibility</h3>
                      <select
                        value={profileData.privacy.profileVisibility}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          privacy: { ...profileData.privacy, profileVisibility: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="contacts">Contacts Only</option>
                      </select>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-medium text-gray-900 mb-3">Search History</h3>
                      <select
                        value={profileData.privacy.searchHistory}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          privacy: { ...profileData.privacy, searchHistory: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="anonymous">Anonymous</option>
                      </select>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-medium text-gray-900 mb-3">Contact Sharing</h3>
                      <select
                        value={profileData.privacy.contactSharing}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          privacy: { ...profileData.privacy, contactSharing: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      >
                        <option value="public">Public</option>
                        <option value="restricted">Restricted</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900">Billing & Subscription</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
                        <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">Pro</span>
                      </div>
                      <p className="text-gray-600 mb-4">You're currently on the Pro plan with unlimited searches and advanced features.</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Next billing: July 23, 2025</span>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-2xl">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Searches Used</span>
                          <span className="font-medium">1,247 / Unlimited</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Contacts Saved</span>
                          <span className="font-medium">89 / Unlimited</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">API Calls</span>
                          <span className="font-medium">2,456 / 10,000</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-200">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-1" />
                      <div>
                        <h3 className="font-medium text-yellow-900">Payment Method Expiring</h3>
                        <p className="text-yellow-700 text-sm mt-1">Your payment method will expire soon. Please update your billing information to avoid service interruption.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile; 