import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, DollarSign, Building2, TrendingDown, Activity } from 'lucide-react';

const formatCurrency = (num) => {
  if (num === null || num === undefined) return 'KES 0';
  if (num >= 1000000000) return `KES ${(num / 1000000000).toFixed(2)}B`;
  if (num >= 1000000) return `KES ${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `KES ${(num / 1000).toFixed(2)}K`;
  return `KES ${num.toLocaleString()}`;
};

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return num.toLocaleString();
};

const CombinedDashboard = ({ analyticsData }) => {
  const [selectedCard, setSelectedCard] = useState(null);

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const combinedData = analyticsData?.combinedOverview || {};
  const organizationData = analyticsData?.organizationPortfolio || {};
  const topKPIs = combinedData?.topKPIs || {};
  const totalMembers = topKPIs.totalMembers || 0;
  const totalAssets = topKPIs.totalAssets || 0;
  const loanPortfolio = topKPIs.loanPortfolio || 0;
  const nplRatio = topKPIs.nplRatio || 0;
  const quickStats = combinedData?.quickStatsGrid || [];
  const financialOverview = organizationData?.financialOverview || {};
  const totalAssetsOrg = financialOverview.totalAssets || 0;
  const totalLiabilities = financialOverview.totalLiabilities || 0;
  const netWorth = financialOverview.netWorth || 0;
  const totalRevenueThisYear = financialOverview.totalRevenueThisYear || 0;

  const profitabilityMetrics = organizationData?.profitabilityMetrics || {};
  const netProfitOrg = profitabilityMetrics.netProfit || 0;
  const netProfitMargin = profitabilityMetrics.netProfitMargin || 0;
  const returnOnAssets = profitabilityMetrics.returnOnAssets || 0;
  const interestIncome = profitabilityMetrics.interestIncome || 0;

  const StatCard = ({ id, title, value, subtitle, icon: Icon, trend, trendValue, gradient, isNegative }) => {
    const isSelected = selectedCard === id;
    
    return (
      <div 
        className="rounded-2xl p-5 text-white shadow-lg cursor-pointer transform transition-all duration-500 ease-out"
        style={{ 
          background: gradient,
          transform: isSelected ? 'scale(1.05) translateY(-8px)' : 'scale(1)',
          boxShadow: isSelected 
            ? '0 20px 40px rgba(0,0,0,0.25), 0 0 0 4px rgba(255,255,255,0.3)' 
            : '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: isSelected ? 10 : 1
        }}
        onMouseEnter={() => setSelectedCard(id)}
        onMouseLeave={() => setSelectedCard(null)}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <p className="text-xs font-medium opacity-90 mb-1.5">{title}</p>
            <h3 
              className="font-bold mb-0.5 transition-all duration-300"
              style={{ fontSize: isSelected ? '2rem' : '1.75rem' }}
            >{value}</h3>
            <p className="text-xs opacity-85">{subtitle}</p>
          </div>
          <div 
            className="rounded-full p-3 transition-all duration-300"
            style={{
              backgroundColor: isSelected ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.20)',
              transform: isSelected ? 'rotate(15deg) scale(1.1)' : 'rotate(0deg) scale(1)'
            }}
          >
            <Icon size={24} />
          </div>
        </div>
        {trend && (
          <div 
            className="flex items-center mt-3 pt-3 border-t border-white transition-all duration-300"
            style={{ 
              borderOpacity: 0.2,
              opacity: isSelected ? 1 : 0.9
            }}
          >
            {isNegative ? <TrendingDown size={14} className="mr-1.5" /> : <TrendingUp size={14} className="mr-1.5" />}
            <span className="text-xs font-semibold">{trendValue}</span>
          </div>
        )}
      </div>
    );
  };

  const ChartCard = ({ title, children, badge }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div 
        className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 cursor-pointer"
        style={{
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: isHovered 
            ? '0 12px 24px rgba(0,0,0,0.15)' 
            : '0 4px 6px rgba(0,0,0,0.07)'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 
            className="text-xl font-bold text-gray-800 transition-colors duration-300"
            style={{ color: isHovered ? '#667eea' : '#1f2937' }}
          >
            {title}
          </h3>
          {badge && (
            <span 
              className="px-3 py-1 text-xs font-semibold rounded-full transition-all duration-300"
              style={{
                backgroundColor: isHovered ? '#667eea' : '#dbeafe',
                color: isHovered ? 'white' : '#2563eb'
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {children}
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 animate-fadeIn">
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-blue-600">{`${entry.name}: ${formatCurrency(entry.value)}`}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-8">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Combined Overview</h1>
      </div>
      
      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard
          id="card1"
          title="Total Members"
          value={totalMembers.toLocaleString()}
          subtitle="Active members"
          icon={Users}
          trend={true}
          trendValue="Members"
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        />
        <StatCard
          id="card2"
          title="Total Assets"
          value={formatCurrency(totalAssets)}
          subtitle="Organization assets"
          icon={Building2}
          trend={true}
          trendValue="Assets"
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        />
        <StatCard
          id="card3"
          title="Loan Portfolio"
          value={formatCurrency(loanPortfolio)}
          subtitle="Outstanding loans"
          icon={DollarSign}
          trend={true}
          trendValue={`NPL: ${nplRatio.toFixed(2)}%`}
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        />
        <StatCard
          id="card4"
          title="Net Profit"
          value={formatCurrency(netProfitOrg)}
          subtitle="Profit margin"
          icon={netProfitOrg >= 0 ? TrendingUp : TrendingDown}
          trend={true}
          trendValue={`${netProfitMargin >= 0 ? '+' : ''}${netProfitMargin.toFixed(2)}%`}
          gradient={netProfitOrg >= 0 ? "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"}
          isNegative={netProfitOrg < 0}
        />
        <StatCard
          id="card5"
          title="Net Worth"
          value={formatCurrency(netWorth)}
          subtitle="Total equity"
          icon={Activity}
          trend={true}
          trendValue="Equity"
          gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
        />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
            <p className="text-sm text-gray-600 mb-2">{stat.metric}</p>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.thisMonth.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">This Month</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{stat.lastMonth.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Last Month</p>
                <p className={`text-xs font-semibold mt-1 ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change >= 0 ? '+' : ''}{stat.change}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="space-y-6">
          <ChartCard title="Financial Overview">
            <div className="space-y-5">
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors duration-300">Total Assets</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(totalAssetsOrg)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-red-600 transition-colors duration-300">Total Liabilities</span>
                  <span className="text-sm font-bold text-red-600">{formatCurrency(totalLiabilities)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${((totalLiabilities / totalAssetsOrg) * 100) || 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-green-600 transition-colors duration-300">Net Worth</span>
                  <span className="text-sm font-bold text-green-600">{formatCurrency(netWorth)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${((netWorth / totalAssetsOrg) * 100) || 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-purple-600 transition-colors duration-300">Total Revenue (This Year)</span>
                  <span className="text-sm font-bold text-purple-600">{formatCurrency(totalRevenueThisYear)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${((totalRevenueThisYear / totalAssetsOrg) * 100) || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Profitability Metrics">
            <div className="space-y-5">
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors duration-300">Net Profit</span>
                  <span className={`text-sm font-bold ${netProfitOrg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(netProfitOrg)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${netProfitOrg >= 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}
                    style={{ width: `${Math.min(Math.abs(netProfitOrg / totalAssetsOrg) * 100, 100) || 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-purple-600 transition-colors duration-300">Net Profit Margin</span>
                  <span className={`text-sm font-bold ${netProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {netProfitMargin.toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${netProfitMargin >= 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}
                    style={{ width: `${Math.min(Math.abs(netProfitMargin), 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-orange-600 transition-colors duration-300">Return on Assets</span>
                  <span className={`text-sm font-bold ${returnOnAssets >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {returnOnAssets.toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${returnOnAssets >= 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}
                    style={{ width: `${Math.min(Math.abs(returnOnAssets), 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors duration-300">Interest Income</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(interestIncome)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: interestIncome > 0 ? '50%' : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
        <div className="space-y-6">
          <ChartCard title="Key Performance Indicators">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Total Members</p>
                <p className="text-2xl font-bold text-blue-600">{totalMembers.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <p className="text-xs text-gray-600 mb-1">Total Assets</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalAssets)}</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <p className="text-xs text-gray-600 mb-1">Loan Portfolio</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(loanPortfolio)}</p>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                <p className="text-xs text-gray-600 mb-1">NPL Ratio</p>
                <p className="text-2xl font-bold text-orange-600">{nplRatio.toFixed(2)}%</p>
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Assets vs Liabilities">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={[
                  { name: 'Assets', value: totalAssetsOrg },
                  { name: 'Liabilities', value: totalLiabilities },
                  { name: 'Net Worth', value: netWorth }
                ]}
                margin={{ left: 80, right: 20, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '11px' }} />
                <YAxis 
                  stroke="#6b7280" 
                  style={{ fontSize: '11px' }}
                  width={75}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  fill="#667eea" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default CombinedDashboard;

