import React from 'react';
import { Check, X } from 'lucide-react';

const PasswordStrength = ({ password }) => {
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, requirements: [] };
    
    const requirements = [
      { text: 'At least 8 characters', met: password.length >= 8 },
      { text: 'Contains a number', met: /\d/.test(password) },
      { text: 'Contains a symbol', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
      { text: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
      { text: 'Contains lowercase letter', met: /[a-z]/.test(password) }
    ];
    
    const metRequirements = requirements.filter(req => req.met).length;
    const score = Math.round((metRequirements / requirements.length) * 100);
    
    return { score, requirements };
  };

  const { score, requirements } = getPasswordStrength(password);
  
  const getStrengthColor = (score) => {
    if (score < 40) return 'text-red-500';
    if (score < 70) return 'text-yellow-500';
    if (score < 90) return 'text-blue-500';
    return 'text-green-500';
  };

  const getStrengthText = (score) => {
    if (score < 40) return 'Weak';
    if (score < 70) return 'Fair';
    if (score < 90) return 'Good';
    return 'Strong';
  };

  const getBarColor = (score) => {
    if (score < 40) return 'bg-red-500';
    if (score < 70) return 'bg-yellow-500';
    if (score < 90) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Password strength bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getBarColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${getStrengthColor(score)}`}>
          {getStrengthText(score)}
        </span>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1">
        {requirements.map((requirement, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            {requirement.met ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <X className="w-4 h-4 text-gray-400" />
            )}
            <span className={requirement.met ? 'text-green-600' : 'text-gray-500'}>
              {requirement.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrength;
