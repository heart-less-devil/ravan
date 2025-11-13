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
  const [dateRange, setDateRange] = useState('7'); // days
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedDeals, setScrapedDeals] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [lastRunMeta, setLastRunMeta] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    therapeuticArea: '',
    dealStage: '',
    minValue: '',
    maxValue: ''
  });
  const selectedSources = ['openai_web_search'];

  const presetQueries = [
    'Oncology licensing deal',
    'Cell therapy partnership',
    'Rare disease acquisition',
    'mRNA collaboration',
    'Biotech M&A'
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
    // Reset filters when new results arrive
    setFilteredDeals(scrapedDeals);
  }, [scrapedDeals]);

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
          dateRange: parseInt(dateRange),
          userEmail: user.email
        })
      });

      if (!response.ok) {
        throw new Error(`Scraping failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const incomingDeals = Array.isArray(result.data?.deals) ? result.data.deals : [];

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

  const totalDeals = filteredDeals.length;
  const hasResults = totalDeals > 0;
  const domainsSeen = lastRunMeta?.domains ?? (hasResults ? Array.from(new Set(filteredDeals.map(deal => deal.sourceId))) : []);
  const displaySourceCount = Math.max(1, domainsSeen.length);
  const lastRunTime = lastRunMeta ? formatDateTime(lastRunMeta.fetchedAt) : null;
  const topTherapeuticAreas = Array.from(
    new Set(filteredDeals.map(deal => deal.therapeuticArea).filter(Boolean))
  ).slice(0, 3);
  const sourceDetails = Array.isArray(lastRunMeta?.sourceDetails) ? lastRunMeta.sourceDetails : [];
  const aiInsights = (lastRunMeta?.insights || '').trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 space-y-10">
        {/* Hero & Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_40px_120px_-40px_rgba(59,130,246,0.35)]"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-40 -right-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          </div>

          <div className="relative z-10 grid lg:grid-cols-[1.6fr,1fr] gap-12">
              <div>
              <div className="flex items-center gap-3 text-sm font-medium text-indigo-200/80">
                <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1">
                  <Sparkles className="w-4 h-4 text-indigo-200" /> Live Beta
                </span>
                <span className="hidden sm:block text-indigo-200/70">Real-time biotech licensing & deal radar</span>
              </div>

              <h1 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                Discover fresh <span className="text-indigo-300">biotech deals</span> the moment they break
                </h1>
              <p className="mt-5 max-w-2xl text-lg text-slate-200/80">
                We monitor premium newsrooms, industry blogs, and filings to highlight who is buying, partnering, and financing.
                Focus on qualified opportunities—not manual research.
              </p>

              <div className="mt-8 grid sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-indigo-200/70">Latest Refresh</span>
                    <Clock className="w-4 h-4 text-indigo-200/80" />
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-white">{lastRunTime || 'Awaiting first run'}</div>
                  <p className="mt-1 text-xs text-slate-300/70">Use the discovery panel to trigger live aggregation.</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-blue-200/70">Curated Briefs</span>
                    <Activity className="w-4 h-4 text-blue-200/80" />
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-white">{hasResults ? totalDeals : 0}</div>
                  <p className="mt-1 text-xs text-slate-300/70">
                    {lastRunMeta?.totalFound ? `${lastRunMeta.totalFound} headlines analyzed` : 'Automatic dedupe removes syndicated repeats'}
                </p>
              </div>

                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-emerald-200/70">Credits Remaining</span>
                    <TrendingUp className="w-4 h-4 text-emerald-200/80" />
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-white">{userCredits}</div>
                  <p className="mt-1 text-xs text-slate-300/70">1 credit per discovery. Auto-logged to BD Tracker.</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl bg-white/5 border border-white/10 p-6 shadow-[0_25px_45px_-20px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between text-sm text-slate-200/80">
                  <span className="font-semibold">Jumpstart Queries</span>
                  <Radar className="w-4 h-4 text-indigo-200/80" />
                </div>
                <p className="mt-2 text-xs text-slate-300/70">
                  Launch with curated prompts. We enrich hits with deal terms, financing, and stage.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {presetQueries.map((query) => (
                    <button
                      key={query}
                      type="button"
                      onClick={() => handlePresetClick(query)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-100 hover:border-indigo-300/60 hover:bg-indigo-500/20 transition-colors duration-200"
                    >
                      {query}
                    </button>
                  ))}
                </div>
                <div className="mt-6 space-y-3 text-xs text-slate-300/70">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-300/80" />
                    AI summaries highlight buyer, seller, and dollars on every hit.
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-300/80" />
                    AI web search scans leading biotech and pharma sources worldwide.
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-300/80" />
                    Export or sync to BD Tracker to launch outreach instantly.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

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

                <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-indigo-200/80">
                  Published within
                  </label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 text-base text-white focus:border-indigo-300/60 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                  >
                    <option value="1">Last 24 hours</option>
                    <option value="3">Last 3 days</option>
                    <option value="7">Last 7 days</option>
                    <option value="14">Last 14 days</option>
                    <option value="30">Last 30 days</option>
                  </select>
              </div>

              <div className="flex flex-col justify-end gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowFilters((prev) => !prev)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition-all duration-200 hover:border-indigo-300/60 hover:bg-indigo-500/20"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? 'Hide Filters' : 'Advanced Filters'}
                </button>
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

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8"
            >
            <div className="grid gap-6 md:grid-cols-4">
                <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-indigo-200/80">
                    Therapeutic Area
                  </label>
                  <select
                    value={activeFilters.therapeuticArea}
                    onChange={(e) => handleFilterChange('therapeuticArea', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-indigo-300/60 focus:outline-none focus:ring-2 focus:ring-indigo-300/40"
                  >
                    <option value="">All Areas</option>
                  {therapeuticAreas.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-indigo-200/80">
                    Deal Stage
                  </label>
                  <select
                    value={activeFilters.dealStage}
                    onChange={(e) => handleFilterChange('dealStage', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-indigo-300/60 focus:outline-none focus:ring-2 focus:ring-indigo-300/40"
                  >
                    <option value="">All Stages</option>
                  {dealStages.map((stage) => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>

                <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-indigo-200/80">
                    Min Value ($M)
                  </label>
                  <input
                    type="number"
                    value={activeFilters.minValue}
                    onChange={(e) => handleFilterChange('minValue', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-indigo-300/60 focus:outline-none focus:ring-2 focus:ring-indigo-300/40"
                    placeholder="0"
                  />
                </div>

                <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-indigo-200/80">
                    Max Value ($M)
                  </label>
                  <input
                    type="number"
                    value={activeFilters.maxValue}
                    onChange={(e) => handleFilterChange('maxValue', e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-indigo-300/60 focus:outline-none focus:ring-2 focus:ring-indigo-300/40"
                  placeholder="Any"
                  />
                </div>
              </div>
            <div className="mt-6 flex justify-end">
                <button
                type="button"
                  onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-100 hover:border-indigo-300/60 hover:bg-indigo-500/20 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}

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
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {totalDeals} curated deal brief{totalDeals !== 1 ? 's' : ''}
                    </h2>
                    <p className="text-sm text-slate-300/70">
                      Covering {displaySourceCount} tracked sources · Updated {lastRunTime || 'just now'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {topTherapeuticAreas.map((area) => (
                      <span key={area} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-indigo-100">
                        <Pill className="w-3.5 h-3.5 text-indigo-200" />
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {domainsSeen.length > 0 ? domainsSeen.map((domain) => (
                    <span key={domain} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-200/80">
                      <Globe className="w-3.5 h-3.5" />
                      {domain}
                    </span>
                  )) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-200/60">
                      <Globe className="w-3.5 h-3.5" />
                      AI web search
                    </span>
                  )}
                  {hasResults && (
                    <button
                      onClick={exportDeals}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs font-semibold text-emerald-100 hover:border-emerald-300/60 hover:bg-emerald-500/10 transition-colors duration-200"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export CSV
                    </button>
                  )}
                </div>

                {(aiInsights || sourceDetails.length > 0) && (
                  <div className="rounded-3xl border border-indigo-400/20 bg-indigo-500/5 p-5 text-sm text-indigo-100 shadow-[0_20px_45px_-30px_rgba(79,70,229,0.6)]">
                    {aiInsights && (
                      <p className="font-medium leading-relaxed text-indigo-100/90">
                        {aiInsights}
                      </p>
                    )}
                    {sourceDetails.length > 0 && (
                      <div className="mt-4 grid gap-2 md:grid-cols-2">
                        {sourceDetails.map((detail, idx) => (
                          <div key={`${detail.kind || 'source'}-${detail.name || idx}`} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-100/80">
                            <div className="font-semibold text-slate-100">
                              {detail.name || 'Referenced source'}
                            </div>
                            <div className="mt-1 text-slate-300/70">
                              {detail.note || 'Verified via AI web search'}
                            </div>
                            {detail.url && (
                              <a
                                href={detail.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-indigo-200/90 hover:text-indigo-100"
                              >
                                Visit source <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                  {filteredDeals.map((deal, idx) => (
            <motion.div
                      key={`${deal.sourceUrl || deal.title || idx}`}
                      initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_60px_-35px_rgba(56,189,248,0.55)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300/40 hover:bg-white/10"
                    >
                      <div className="absolute inset-x-0 -top-40 h-72 bg-gradient-to-br from-indigo-500/15 via-cyan-400/10 to-transparent blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="relative z-10 flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100">
                              <Building2 className="w-3.5 h-3.5" />
                              {deal.buyer || 'Buyer not disclosed'}
                            </span>
                            <ArrowUpRight className="w-4 h-4 text-indigo-200/70" />
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100/90">
                              <Globe className="w-3.5 h-3.5" />
                              {deal.seller || 'Counterparty pending'}
                            </span>
                  </div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-300/70">
                            {deal.dealDate || 'Date tbc'}
                          </span>
                </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {deal.title || `${deal.buyer || 'Unknown Buyer'} · ${deal.drugName || 'Transaction'}`}
                          </h3>
                          <p className="mt-2 text-sm text-slate-200/80">
                            {deal.summary || 'AI summary coming soon. Open the source to review the full transaction.'}
                          </p>
              </div>

                        <div className="flex flex-wrap gap-2">
                          {deal.therapeuticArea && (
                            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-100">
                              <Pill className="w-3.5 h-3.5" />
                              {deal.therapeuticArea}
                            </span>
                          )}
                          {deal.stage && (
                            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-100">
                              <Activity className="w-3.5 h-3.5" />
                              {deal.stage}
                            </span>
                          )}
                          {deal.financials && (
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
                              <DollarSign className="w-3.5 h-3.5" />
                              {deal.financials}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-200/80">
                            <Globe className="w-3.5 h-3.5" />
                            {deal.source || 'Source'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="text-xs text-slate-300/60 line-clamp-1">
                            {deal.drugName || 'Asset undisclosed'}
                          </div>
                          {deal.sourceUrl && (
                            <a
                              href={deal.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100 transition-all duration-200 hover:border-indigo-300/60 hover:bg-indigo-500/20"
                            >
                              View Source <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
              </div>
            </motion.div>
                  ))}
                </div>
              </>
            ) : lastRunMeta ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-200">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">No matching deals yet</h3>
                <p className="mt-2 text-sm text-slate-300/70">
                  Try broadening your keywords, selecting a longer date window, or refining later with filters.
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
