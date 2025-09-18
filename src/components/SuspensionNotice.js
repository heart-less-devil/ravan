import React from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';

const SuspensionNotice = ({ suspension, onClose }) => {
  if (!suspension) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-red-600 bg-opacity-90 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-8 border-2 border-red-300 w-full max-w-md shadow-2xl rounded-xl bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <h3 className="text-2xl font-bold text-red-800">🚫 ACCOUNT SUSPENDED</h3>
          </div>
          {/* Remove close button to prevent users from dismissing suspension notice */}
        </div>
        
        <div className="space-y-6">
          <div className="bg-red-100 border-2 border-red-300 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="w-6 h-6 text-red-600" />
              <span className="text-lg font-bold text-red-800">Suspension Details</span>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <p className="text-base text-red-800">
                  <span className="font-bold">Reason:</span><br/>
                  <span className="text-red-700">{suspension.reason}</span>
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <p className="text-base text-red-800">
                  <span className="font-bold">Suspended Until:</span><br/>
                  <span className="text-red-700">{formatDate(suspension.suspendedUntil)}</span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-base text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="font-medium">Your account has been suspended by an administrator.</p>
            <p className="mt-2 text-gray-600">
              If you believe this is an error or have questions, please contact support immediately.
            </p>
          </div>
          
          <div className="pt-4">
            <button
              onClick={() => window.location.href = '/contact'}
              className="w-full px-6 py-3 text-lg font-bold text-white bg-red-600 border-2 border-red-700 rounded-xl hover:bg-red-700 hover:scale-105 transition-all duration-200 shadow-lg"
            >
              🆘 Contact Support Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuspensionNotice;
