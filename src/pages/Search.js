import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search as SearchIcon, 
  Info
} from 'lucide-react';

const Search = () => {
  const [formData, setFormData] = useState({
    drugName: '',
    diseaseArea: '',
    stageOfDevelopment: '',
    modality: '',
    lookingFor: '',
    region: '',
    function: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Search form submitted:', formData);
  };

  const diseaseAreas = [
    'Oncology',
    'Cardiovascular',
    'Neurology',
    'Immunology',
    'Rare Diseases',
    'Infectious Diseases',
    'Metabolic Disorders'
  ];

  const developmentStages = [
    'Preclinical',
    'Phase I',
    'Phase II',
    'Phase III',
    'Approved',
    'Market'
  ];

  const modalities = [
    'Small Molecule',
    'Biologic',
    'Cell Therapy',
    'Gene Therapy',
    'Antibody',
    'Vaccine'
  ];

  const partnerTypes = [
    'Licensing Partner',
    'Co-development Partner',
    'Merger & Acquisition',
    'Investment Partner',
    'Manufacturing Partner',
    'Distribution Partner'
  ];

  const regions = [
    'North America',
    'Europe',
    'Asia-Pacific',
    'Latin America',
    'Middle East & Africa'
  ];

  const functions = [
    'Business Development',
    'R&D',
    'Clinical Development',
    'Regulatory Affairs',
    'Manufacturing',
    'Commercial',
    'Executive'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom CSS for clean select styling */}
      <style jsx>{`
        select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          padding-right: 2.5rem;
        }
        select:focus {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%233b82f6' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
        }
      `}</style>

      <div className="container-custom py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Top Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* Drug Name */}
                <div>
                  <label htmlFor="drugName" className="block text-sm font-semibold text-gray-900 mb-2">
                    Drug Name <span className="text-red-500">*</span>
                  </label>
              <input
                type="text"
                    id="drugName"
                    name="drugName"
                    value={formData.drugName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Drug Name"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">About Your Pipeline Drug</p>
            </div>

                {/* Disease Area */}
                <div>
                  <label htmlFor="diseaseArea" className="block text-sm font-semibold text-gray-900 mb-2">
                    Disease Area <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="diseaseArea"
                    name="diseaseArea"
                    value={formData.diseaseArea}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    required
            >
                    <option value="">Select Disease Area</option>
                    {diseaseAreas.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Max. 1 Selection Allowed.</p>
          </div>

                {/* Stage of Development */}
                <div>
                  <label htmlFor="stageOfDevelopment" className="block text-sm font-semibold text-gray-900 mb-2">
                    Stage of Development
                  </label>
                  <select
                    id="stageOfDevelopment"
                    name="stageOfDevelopment"
                    value={formData.stageOfDevelopment}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
            >
                    <option value="">Select Stage</option>
                    {developmentStages.map((stage) => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Optional</p>
                </div>

                {/* Modality */}
                <div>
                  <label htmlFor="modality" className="block text-sm font-semibold text-gray-900 mb-2">
                    Modality
                  </label>
                  <select
                    id="modality"
                    name="modality"
                    value={formData.modality}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                  >
                    <option value="">Select Modality</option>
                    {modalities.map((mod) => (
                      <option key={mod} value={mod}>{mod}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Optional</p>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Looking For */}
                <div>
                  <label htmlFor="lookingFor" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    Looking for <span className="text-red-500 ml-1">*</span>
                    <Info className="w-4 h-4 ml-2 text-gray-400" />
                  </label>
                  <select
                    id="lookingFor"
                    name="lookingFor"
                    value={formData.lookingFor}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    required
            >
                    <option value="">Select Partner Type</option>
                    {partnerTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Potential Partner Search Criterion</p>
                </div>

                {/* Region */}
                <div>
                  <label htmlFor="region" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    Region
                    <Info className="w-4 h-4 ml-2 text-gray-400" />
                  </label>
                  <select
                    id="region"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                  >
                    <option value="">Select Region</option>
                    {regions.map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">HQ Country of Partner</p>
                      </div>

                {/* Function */}
                <div>
                  <label htmlFor="function" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    Function
                    <Info className="w-4 h-4 ml-2 text-gray-400" />
                  </label>
                  <select
                    id="function"
                    name="function"
                    value={formData.function}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                  >
                    <option value="">Select Function</option>
                    {functions.map((func) => (
                      <option key={func} value={func}>{func}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Contact Person Function</p>
                </div>
        </div>

              {/* Search Button */}
              <div className="flex justify-end pt-4">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <SearchIcon className="w-5 h-5" />
                  <span>Search</span>
                </motion.button>
              </div>
            </form>
          </div>
          </motion.div>
      </div>
    </div>
  );
};

export default Search; 