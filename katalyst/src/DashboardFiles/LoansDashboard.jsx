import React, { useState, useMemo } from 'react';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, FileText, AlertCircle, CreditCard } from 'lucide-react';

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

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const LoansDashboard = ({ analyticsData }) => {
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

  const loansData = analyticsData?.loans || {};

  const totalLoanPortfolio = loansData?.overviewCards?.totalLoanPortfolio || 0;
  const activeLoansCount = loansData?.overviewCards?.activeLoansCount || 0;
  const loansDisbursedThisMonth = loansData?.overviewCards?.loansDisbursedThisMonth || { amount: 0, count: 0 };
  const loanApplicationsPending = loansData?.overviewCards?.loanApplicationsPending || 0;
  const repaymentRate = loansData?.loanPerformance?.repaymentRate || 0;
  const nonPerformingLoans = loansData?.loanPerformance?.nonPerformingLoans || 0;
  const defaultRate = loansData?.loanPerformance?.defaultRate || 0;
  const averageLoanSize = loansData?.loanPerformance?.averageLoanSize || 0;
  const loanTypeData = useMemo(() => {
    if (!loansData?.loanDistribution?.byType) return [];
    return Object.entries(loansData.loanDistribution.byType)
      .map(([type, count]) => ({ type, count: count || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [loansData]);
  const amountRangeData = useMemo(() => {
    if (!loansData?.loanDistribution?.byAmountRange) return [];
    const ranges = loansData.loanDistribution.byAmountRange;
    return [
      { range: 'Under 50K', count: ranges.under50K || 0 },
      { range: '50-100K', count: ranges['50-100K'] || 0 },
      { range: '100-500K', count: ranges['100-500K'] || 0 },
      { range: '500K+', count: ranges['500K+'] || 0 }
    ];
  }, [loansData]);

  const maturityData = useMemo(() => {
    if (!loansData?.loanDistribution?.byMaturity) return [];
    const maturity = loansData.loanDistribution.byMaturity;
    return [
      { maturity: 'Short Term', count: maturity.shortTerm || 0 },
      { maturity: 'Medium Term', count: maturity.mediumTerm || 0 },
      { maturity: 'Long Term', count: maturity.longTerm || 0 }
    ];
  }, [loansData]);
  const disbursementTrend = useMemo(() => {
    if (!loansData?.trends?.loanDisbursementTrend) return [];
    const data = loansData.trends.loanDisbursementTrend;
    return data.map((amount, index) => ({
      month: monthNames[index] || `Month ${index + 1}`,
      amount: amount || 0
    }));
  }, [loansData]);
  const nplTrend = useMemo(() => {
    if (!loansData?.trends?.nplTrend) return [];
    const data = loansData.trends.nplTrend;
    return data.map((npl, index) => ({
      month: monthNames[index] || `Month ${index + 1}`,
      npl: npl || 0
    }));
  }, [loansData]);

  const StatCard = ({ id, title, value, subtitle, icon: Icon, trend, trendValue, gradient }) => {
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
            <TrendingUp size={14} className="mr-1.5" />
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
          <p className="text-sm text-blue-600">{`${payload[0].name}: ${formatCurrency(payload[0].value)}`}</p>
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Loans</h1>
      </div>
      
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          id="card1"
          title="Total Loan Portfolio"
          value={formatCurrency(totalLoanPortfolio)}
          subtitle="Total outstanding loans"
          icon={DollarSign}
          trend={true}
          trendValue={`${activeLoansCount} active loans`}
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        />
        <StatCard
          id="card2"
          title="Active Loans"
          value={activeLoansCount.toLocaleString()}
          subtitle="Currently active"
          icon={CreditCard}
          trend={true}
          trendValue={`${loanApplicationsPending} pending`}
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        />
        <StatCard
          id="card3"
          title="This Month"
          value={loansDisbursedThisMonth.count.toLocaleString()}
          subtitle={formatCurrency(loansDisbursedThisMonth.amount)}
          icon={FileText}
          trend={true}
          trendValue="Loans disbursed"
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        />
        <StatCard
          id="card4"
          title="Pending Applications"
          value={loanApplicationsPending.toLocaleString()}
          subtitle="Awaiting approval"
          icon={AlertCircle}
          trend={true}
          trendValue="Applications"
          gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="space-y-6">
          <ChartCard title="Loan Disbursement Trend" badge="Last 12 Months">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={disbursementTrend.length > 0 ? disbursementTrend : [{ month: 'No Data', amount: 0 }]} margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '11px' }} />
                <YAxis 
                  stroke="#6b7280" 
                  style={{ fontSize: '11px' }}
                  width={75}
                  tickFormatter={(value) => formatNumber(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  dot={{ fill: '#667eea', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  fill="url(#colorLoans)"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Loans by Amount Range">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={amountRangeData.length > 0 ? amountRangeData : [{ range: 'No Data', count: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="range" stroke="#6b7280" style={{ fontSize: '11px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="#8b5cf6" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Loan Performance Metrics">
            <div className="space-y-5">
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors duration-300">Repayment Rate</span>
                  <span className="text-sm font-bold text-gray-900">{repaymentRate.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(repaymentRate, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-red-600 transition-colors duration-300">Non-Performing Loans</span>
                  <span className="text-sm font-bold text-red-600">{nonPerformingLoans.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min((nonPerformingLoans / activeLoansCount) * 100, 100) || 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-orange-600 transition-colors duration-300">Default Rate</span>
                  <span className="text-sm font-bold text-orange-600">{defaultRate.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(defaultRate, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-green-600 transition-colors duration-300">Average Loan Size</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(averageLoanSize)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: averageLoanSize > 0 ? '60%' : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
        <div className="space-y-6">
          <ChartCard title="Loans by Type">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={loanTypeData.length > 0 ? loanTypeData : [{ type: 'No Data', count: 0 }]} margin={{ left: 20, right: 20, top: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="type" 
                  stroke="#6b7280" 
                  style={{ fontSize: '9px' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#6b7280" 
                  style={{ fontSize: '11px' }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#06b6d4" 
                  strokeWidth={3}
                  dot={{ fill: '#06b6d4', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Loans by Maturity">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={maturityData.length > 0 ? maturityData : [{ maturity: 'No Data', count: 0 }]}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={({ maturity, percent }) => `${maturity} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="count"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {maturityData.map((entry, index) => {
                    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="NPL Trend" badge="Last 12 Months">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={nplTrend.length > 0 ? nplTrend : [{ month: 'No Data', npl: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '11px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="npl" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default LoansDashboard;

