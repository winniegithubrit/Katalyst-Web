import React, { useState, useMemo } from 'react';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Activity, AlertCircle, ArrowUpDown } from 'lucide-react';

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return num.toLocaleString();
};

const TransactionsDashboard = ({ analyticsData, currency = 'EUR' }) => {
  const [selectedCard, setSelectedCard] = useState(null);

  const formatCurrency = (num) => {
    if (num === null || num === undefined) return `${currency} 0`;
    if (num >= 1000000000) return `${currency} ${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${currency} ${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${currency} ${(num / 1000).toFixed(2)}K`;
    return `${currency} ${num.toLocaleString()}`;
  };

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const transactionsData = analyticsData?.transactions || {};
  const todaysTransactions = transactionsData?.overviewCards?.todaysTransactions || { count: 0, value: 0 };
  const thisMonthsTransactions = transactionsData?.overviewCards?.thisMonthsTransactions || { count: 0, value: 0 };
  const averageTransactionSize = transactionsData?.overviewCards?.averageTransactionSize || 0;
  const transactionGrowth = transactionsData?.overviewCards?.transactionGrowth || 0;
  const deposits = transactionsData?.transactionTypes?.deposits || { count: 0, amount: 0 };
  const withdrawals = transactionsData?.transactionTypes?.withdrawals || { count: 0, amount: 0 };
  const transfers = transactionsData?.transactionTypes?.transfers || { count: 0, amount: 0 };
  const failedTransactions = transactionsData?.performanceMetrics?.failedTransactions || { count: 0, reasons: [] };
  const transactionFeesCollected = transactionsData?.revenue?.transactionFeesCollected || 0;
  const dailyTransactionVolume = useMemo(() => {
    if (!transactionsData?.trends?.dailyTransactionVolume) return [];
    const data = transactionsData.trends.dailyTransactionVolume;
    return data.map((value, index) => ({
      day: index + 1,
      volume: value || 0
    })).slice(-30);
  }, [transactionsData]);
  const transactionTypeData = useMemo(() => {
    const distribution = transactionsData?.trends?.transactionTypeDistribution || {};
    return [
      { name: 'Deposits', value: distribution.deposits || 0, color: '#3b82f6' },
      { name: 'Withdrawals', value: distribution.withdrawals || 0, color: '#ef4444' },
      { name: 'Transfers', value: distribution.transfers || 0, color: '#10b981' }
    ];
  }, [transactionsData]);
  const transactionBreakdown = useMemo(() => {
    return [
      { type: 'Deposits', count: deposits.count || 0, amount: deposits.amount || 0 },
      { type: 'Withdrawals', count: withdrawals.count || 0, amount: withdrawals.amount || 0 },
      { type: 'Transfers', count: transfers.count || 0, amount: transfers.amount || 0 }
    ];
  }, [deposits, withdrawals, transfers]);

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
          <p className="text-sm font-semibold text-gray-800">Day {label}</p>
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Transactions</h1>
      </div>
      
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          id="card1"
          title="Today's Transactions"
          value={todaysTransactions.count.toLocaleString()}
          subtitle={formatCurrency(todaysTransactions.value)}
          icon={Activity}
          trend={true}
          trendValue={`${transactionGrowth >= 0 ? '+' : ''}${transactionGrowth}% growth`}
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        />
        <StatCard
          id="card2"
          title="This Month"
          value={thisMonthsTransactions.count.toLocaleString()}
          subtitle={formatCurrency(thisMonthsTransactions.value)}
          icon={DollarSign}
          trend={true}
          trendValue="Total transactions"
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        />
        <StatCard
          id="card3"
          title="Average Size"
          value={formatCurrency(averageTransactionSize)}
          subtitle="Per transaction"
          icon={TrendingUp}
          trend={true}
          trendValue="Average"
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        />
        <StatCard
          id="card4"
          title="Failed Transactions"
          value={failedTransactions.count.toLocaleString()}
          subtitle="Transaction errors"
          icon={AlertCircle}
          trend={true}
          trendValue={formatCurrency(transactionFeesCollected)}
          gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="space-y-6">
          <ChartCard title="Daily Transaction Volume" badge="Last 30 Days">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyTransactionVolume.length > 0 ? dailyTransactionVolume : [{ day: 0, volume: 0 }]} margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="day" 
                  stroke="#6b7280" 
                  style={{ fontSize: '10px' }}
                  label={{ value: 'Day', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '11px' } }}
                />
                <YAxis 
                  stroke="#6b7280" 
                  style={{ fontSize: '11px' }}
                  width={75}
                  tickFormatter={(value) => formatNumber(value)}
                  label={{ value: currency, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '11px'} }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  dot={{ fill: '#667eea', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  fill="url(#colorVolume)"
                  name={`Volume (${currency})`}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>


          <ChartCard title="Transaction Breakdown">
            <div className="space-y-4">
              {transactionBreakdown.map((item, index) => (
                <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{item.type}</p>
                      <p className="text-2xl font-bold text-blue-600">{item.count.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(item.amount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
        <div className="space-y-6">
          <ChartCard title="Transaction Type Distribution">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={transactionBreakdown.length > 0 ? transactionBreakdown : [{ type: 'No Data', count: 0, amount: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="type" stroke="#6b7280" style={{ fontSize: '11px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="count" 
                  fill="#3b82f6" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                  name="Count"
                />
                <Bar 
                  dataKey="amount" 
                  fill="#8b5cf6" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                  name="Amount"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Transaction Performance">
            <div className="space-y-5">
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors duration-300">Total Deposits</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(deposits.amount)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: deposits.amount > 0 ? '75%' : '0%' }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{deposits.count.toLocaleString()} transactions</p>
              </div>
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-red-600 transition-colors duration-300">Total Withdrawals</span>
                  <span className="text-sm font-bold text-red-600">{formatCurrency(withdrawals.amount)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: withdrawals.amount > 0 ? '60%' : '0%' }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{withdrawals.count.toLocaleString()} transactions</p>
              </div>
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-green-600 transition-colors duration-300">Total Transfers</span>
                  <span className="text-sm font-bold text-green-600">{formatCurrency(transfers.amount)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: transfers.amount > 0 ? '45%' : '0%' }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{transfers.count.toLocaleString()} transactions</p>
              </div>
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-purple-600 transition-colors duration-300">Transaction Fees</span>
                  <span className="text-sm font-bold text-purple-600">{formatCurrency(transactionFeesCollected)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: transactionFeesCollected > 0 ? '30%' : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
          </ChartCard>

          {failedTransactions.reasons && failedTransactions.reasons.length > 0 && (
            <ChartCard title="Failed Transaction Reasons">
              <div className="space-y-3">
                {failedTransactions.reasons.map((reason, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{reason}</p>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsDashboard;

