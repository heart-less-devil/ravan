import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';
import { 
  Search, 
  Globe, 
  DollarSign, 
  Building2, 
  Pill, 
  TrendingUp,
  Download,
  RefreshCw,
  Filter,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  Activity,
  Radar
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const AIDealScraper = ({ user, userCredits, setUserCredits }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedDeals, setScrapedDeals] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [error, setError] = useState(null);
  const [lastRunMeta, setLastRunMeta] = useState(null);
  const selectedSources = ['openai_web_search'];

  const presetQueries = [
    'Oncology licensing deal',
    'Cell therapy partnership',
    'Rare disease acquisition',
    'mRNA collaboration',
    'Biotech M&A'
  ];

  useEffect(() => {
    // Set filtered deals same as scraped deals (no filtering)
    setFilteredDeals(scrapedDeals);
  }, [scrapedDeals]);

  const handlePresetClick = (term) => {
    setSearchQuery(term);
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return isoString;
    }
  };

  const handleScrapeDeals = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsScraping(true);
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
          dateRange: 90, // Fixed to 3 months (90 days)
          userEmail: user.email
        })
      });

      if (!response.ok) {
        throw new Error(`Scraping failed: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('📦 API Response:', {
        success: result.success,
        dealsCount: result.data?.deals?.length || 0,
        totalFound: result.data?.totalFound,
        message: result.message,
        isFallback: result.data?.isFallback
      });
      
      if (result.success) {
        const incomingDeals = Array.isArray(result.data?.deals) ? result.data.deals : [];
        
        console.log('✅ Setting deals:', incomingDeals.length, 'items');
        if (incomingDeals.length === 0) {
          console.warn('⚠️ No deals received from API. Check backend logs.');
        }

        setScrapedDeals(incomingDeals);
        setFilteredDeals(incomingDeals);
        setLastRunMeta({
          fetchedAt: new Date().toISOString(),
          totalFound: result.data?.totalFound ?? incomingDeals.length,
          returned: incomingDeals.length,
          sources: result.data?.sources ?? ['openai_web_search'],
          domains: result.data?.domains ?? [],
          sourceDetails: Array.isArray(result.data?.sourceDetails) ? result.data.sourceDetails : [],
          insights: result.data?.insights || ''
        });
        
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
    }
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

  const totalDeals = filteredDeals.length;
  const hasResults = totalDeals > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 space-y-10">

        {/* Discovery form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-[0_25px_60px_-30px_rgba(37,99,235,0.4)]"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleScrapeDeals(); }} className="space-y-6">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_auto_auto] gap-4">
              <div className="relative">
                <label className="text-xs font-semibold uppercase tracking-wide text-indigo-200/80">
                  Search any therapeutic area, modality, or company
                  </label>
                <div className="mt-2 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-4 pr-12 text-base text-white placeholder:text-slate-400 focus:border-indigo-300/60 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    placeholder="Ex: oncology licensing, CAR-T partnership, Alzheimer’s acquisition"
                  />
                  <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                </div>
                </div>


              <div className="flex flex-col justify-end gap-3 sm:flex-row">
                  <button
                  type="submit"
                  disabled={isScraping}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_45px_-25px_rgba(79,70,229,0.7)] transition-all duration-200 hover:shadow-[0_20px_60px_-25px_rgba(56,189,248,0.65)] disabled:from-slate-500 disabled:via-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed"
                  >
                    {isScraping ? (
                      <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Scraping…
                      </>
                    ) : (
                      <>
                      <Globe className="w-4 h-4" />
                      Run Deal Discovery
                      </>
                    )}
                  </button>
              </div>
                </div>

            {error && (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4" />
                  {error}
              </div>
            </div>
            )}
          </form>
        </motion.div>


        <div className="relative">
          {isScraping && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-3xl border border-indigo-400/20 bg-slate-950/80 backdrop-blur">
              <LoadingSpinner size="large" color="cyber" />
              <p className="mt-4 text-sm text-slate-200/80">
                Scanning premium biotech outlets and filings…
              </p>
            </div>
          )}

          <div className={`${isScraping ? 'opacity-20 pointer-events-none' : 'opacity-100'} space-y-6`}>
            {hasResults ? (
              <>
                <div className="flex justify-end">
                  <button
                    onClick={exportDeals}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:border-indigo-300/60 hover:bg-indigo-500/20 transition-colors duration-200"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">Announce Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">Buyer / Licensee</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">Seller / Licensor</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">Asset / Drug</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">Indication</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">Headline Economics</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDeals.map((deal, idx) => (
                        <tr 
                          key={`${deal.sourceUrl || deal.title || idx}`}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-slate-200">
                            {deal.dealDate ? new Date(deal.dealDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-white font-medium">
                            {deal.buyer || 'Not disclosed'}
                          </td>
                          <td className="px-4 py-3 text-sm text-white font-medium">
                            {deal.seller || 'Not disclosed'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-200">
                            <div>
                              <div className="font-medium text-white">{deal.drugName || 'Undisclosed'}</div>
                              {deal.stage && (
                                <div className="text-xs text-slate-400 mt-1">{deal.stage}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-200">
                            {deal.therapeuticArea || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-200">
                            {deal.financials || 'Not disclosed'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {deal.sourceUrl ? (
                              <a
                                href={deal.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1"
                              >
                                {deal.source || 'View'} <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-slate-400">{deal.source || 'N/A'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : lastRunMeta ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-200">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">No matching drug deals found</h3>
                <p className="mt-2 text-sm text-slate-300/70">
                  Try broadening your search keywords or refining with filters.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {presetQueries.slice(0, 3).map((query) => (
                    <button
                      key={query}
                      onClick={() => handlePresetClick(query)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-100 hover:border-indigo-300/60 hover:bg-indigo-500/20 transition-colors duration-200"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center text-slate-300/80">
                <h3 className="text-xl font-semibold text-white">Run your first discovery</h3>
                <p className="mt-2 text-sm">
                  Enter a topic like “oncology licensing” or “CAR-T partnership” to see live deal coverage.
              </p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDealScraper;
