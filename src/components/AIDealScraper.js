import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';
import { 
  Search, 
  Globe, 
  Calendar, 
  DollarSign, 
  Building2, 
  Pill, 
  TrendingUp,
  Download,
  RefreshCw,
  Filter,
  Eye,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const AIDealScraper = ({ user, userCredits, setUserCredits }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState([]);
  const [dateRange, setDateRange] = useState('7'); // days
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState(0);
  const [scrapedDeals, setScrapedDeals] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    therapeuticArea: '',
    dealStage: '',
    minValue: '',
    maxValue: ''
  });

  // Available news sources for scraping
  const newsSources = [
    { id: 'biospace', name: 'BioSpace', url: 'https://www.biospace.com', enabled: true },
    { id: 'fiercebiotech', name: 'Fierce Biotech', url: 'https://www.fiercebiotech.com', enabled: true },
    { id: 'biotechnetworks', name: 'Biotech Networks', url: 'https://biotechnetworks.org', enabled: true },
    { id: 'biocom', name: 'Biocom California', url: 'https://www.biocom.org', enabled: true },
    { id: 'lifescivc', name: 'LifeSci VC', url: 'https://lifescivc.com', enabled: true },
    { id: 'sdbn', name: 'San Diego Biotech', url: 'https://sdbn.org', enabled: true },
    { id: 'cellandgene', name: 'Cell & Gene', url: 'https://www.cellandgene.com', enabled: true },
    { id: 'emjreviews', name: 'EU Medical Journal', url: 'https://www.emjreviews.com', enabled: true },
    { id: 'biocentury', name: 'Biocentury', url: 'https://www.biocentury.com/home', enabled: true },
    { id: 'bioxconomy', name: 'Bio Xconomy', url: 'https://www.bioxconomy.com', enabled: true },
    { id: 'pullanconsulting', name: 'Pullan Consulting', url: 'https://www.pullanconsulting.com', enabled: true },
    { id: 'prnewswire', name: 'PR Newswire', url: 'https://www.prnewswire.com', enabled: true }
  ];

  // Therapeutic areas for filtering
  const therapeuticAreas = [
    'Oncology', 'Cardiovascular', 'Neuroscience', 'Immunology', 'Infectious Diseases',
    'Respiratory', 'Endocrinology', 'Rare/Orphan', 'Hematology', 'Gastroenterology',
    'Dermatology', 'Ophthalmology', 'Renal', 'MSK Disease', 'Women\'s Health', 'Pain', 'Urology'
  ];

  // Deal stages
  const dealStages = ['Pre-clinical', 'Phase I', 'Phase II', 'Phase III', 'Marketed'];

  useEffect(() => {
    // Set default sources
    setSelectedSources(newsSources.filter(source => source.enabled).map(source => source.id));
  }, []);

  useEffect(() => {
    // Apply filters to scraped deals
    let filtered = scrapedDeals;

    if (activeFilters.therapeuticArea) {
      filtered = filtered.filter(deal => 
        deal.therapeuticArea?.toLowerCase().includes(activeFilters.therapeuticArea.toLowerCase())
      );
    }

    if (activeFilters.dealStage) {
      filtered = filtered.filter(deal => 
        deal.stage?.toLowerCase().includes(activeFilters.dealStage.toLowerCase())
      );
    }

    if (activeFilters.minValue) {
      filtered = filtered.filter(deal => {
        const totalValue = parseFloat(deal.totalValue?.replace(/[^0-9.]/g, '') || 0);
        return totalValue >= parseFloat(activeFilters.minValue);
      });
    }

    if (activeFilters.maxValue) {
      filtered = filtered.filter(deal => {
        const totalValue = parseFloat(deal.totalValue?.replace(/[^0-9.]/g, '') || 0);
        return totalValue <= parseFloat(activeFilters.maxValue);
      });
    }

    setFilteredDeals(filtered);
  }, [scrapedDeals, activeFilters]);

  const handleSourceToggle = (sourceId) => {
    setSelectedSources(prev => 
      prev.includes(sourceId) 
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleScrapeDeals = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    if (selectedSources.length === 0) {
      setError('Please select at least one news source');
      return;
    }

    setIsScraping(true);
    setScrapingProgress(0);
    setError(null);

    try {
      const token = sessionStorage.getItem('token');
      
      console.log('🔍 AI Deal Scraper API Call:');
      console.log('  - API_BASE_URL:', API_BASE_URL);
      console.log('  - Full URL:', `${API_BASE_URL}/api/ai-deal-scraper`);
      console.log('  - Search Query:', searchQuery);
      console.log('  - Sources:', selectedSources);
      
      const response = await fetch(`${API_BASE_URL}/api/ai-deal-scraper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          searchQuery: searchQuery.trim(),
          sources: selectedSources,
          dateRange: parseInt(dateRange),
          userEmail: user.email
        })
      });

      if (!response.ok) {
        throw new Error(`Scraping failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setScrapedDeals(result.data.deals || []);
        setFilteredDeals(result.data.deals || []);
        
        // Update user credits if consumed
        if (result.creditsUsed) {
          setUserCredits(prev => Math.max(0, prev - result.creditsUsed));
        }
      } else {
        setError(result.message || 'Scraping failed');
      }
    } catch (error) {
      console.error('Scraping error:', error);
      setError('Failed to scrape deals. Please try again.');
    } finally {
      setIsScraping(false);
      setScrapingProgress(0);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setActiveFilters({
      therapeuticArea: '',
      dealStage: '',
      minValue: '',
      maxValue: ''
    });
  };

  const exportDeals = () => {
    const csvContent = [
      ['Deal Date', 'Buyer/Licensor', 'Seller/Licensee', 'Drug Name', 'Disease/Therapeutic Area', 'Stage', 'Financials'],
      ...filteredDeals.map(deal => [
        deal.dealDate || '',
        deal.buyer || '',
        deal.seller || '',
        deal.drugName || '',
        deal.therapeuticArea || '',
        deal.stage || '',
        deal.financials || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biotech-deals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Sparkles className="w-8 h-8 text-blue-600 mr-3" />
                  AI Deal Scraper
                </h1>
                <p className="text-gray-600 mt-2">
                  Automatically scrape and analyze drug licensing and acquisition deals from biotech news sources
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Credits Available</div>
                <div className="text-2xl font-bold text-blue-600">{userCredits}</div>
              </div>
            </div>

            {/* Search Form */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Search Query <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., oncology deals, cardiovascular partnerships, drug licensing"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Date Range (Days)
                  </label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1">Last 24 hours</option>
                    <option value="3">Last 3 days</option>
                    <option value="7">Last 7 days</option>
                    <option value="14">Last 14 days</option>
                    <option value="30">Last 30 days</option>
                  </select>
                </div>
              </div>

              {/* News Sources Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  News Sources <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {newsSources.map((source) => (
                    <label key={source.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(source.id)}
                        onChange={() => handleSourceToggle(source.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{source.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleScrapeDeals}
                    disabled={isScraping || !searchQuery.trim() || selectedSources.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2"
                  >
                    {isScraping ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Scraping...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        <span>Scrape Deals</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
                  >
                    <Filter className="w-5 h-5" />
                    <span>Filters</span>
                  </button>
                </div>

                {scrapedDeals.length > 0 && (
                  <button
                    onClick={exportDeals}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Export CSV</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Therapeutic Area
                  </label>
                  <select
                    value={activeFilters.therapeuticArea}
                    onChange={(e) => handleFilterChange('therapeuticArea', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Areas</option>
                    {therapeuticAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Deal Stage
                  </label>
                  <select
                    value={activeFilters.dealStage}
                    onChange={(e) => handleFilterChange('dealStage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Stages</option>
                    {dealStages.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Min Value ($M)
                  </label>
                  <input
                    type="number"
                    value={activeFilters.minValue}
                    onChange={(e) => handleFilterChange('minValue', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Max Value ($M)
                  </label>
                  <input
                    type="number"
                    value={activeFilters.maxValue}
                    onChange={(e) => handleFilterChange('maxValue', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={clearFilters}
                  className="text-gray-600 hover:text-gray-800 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isScraping && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
              <div className="text-center">
                <LoadingSpinner
                  size="large"
                  message="AI SCRAPING IN PROGRESS..."
                  subMessage="Analyzing biotech news sources and extracting deal information"
                  color="cyber"
                />
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${scrapingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{scrapingProgress}% Complete</p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {scrapedDeals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    Scraped Deals ({filteredDeals.length})
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>AI Analysis Complete</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deal Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Buyer/Licensor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seller/Licensee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Drug Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Disease/Therapeutic Area
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Financials
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDeals.map((deal, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {deal.dealDate || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {deal.buyer || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {deal.seller || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {deal.drugName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {deal.therapeuticArea || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {deal.stage || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {deal.financials || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {deal.sourceUrl && (
                            <a
                              href={deal.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                            >
                              <span>View</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* No Results */}
          {!isScraping && scrapedDeals.length === 0 && searchQuery && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Deals Found</h3>
              <p className="text-gray-600">
                Try adjusting your search query or date range to find more deals.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AIDealScraper;
