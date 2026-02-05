import React, { useState, useMemo } from 'react';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, UserPlus, DollarSign, Activity } from 'lucide-react';

const formatCurrency = (num) => {
  if (num === null || num === undefined) return 'KES 0';
  if (num >= 1000000000) return `KES ${(num / 1000000000).toFixed(2)}B`;
  if (num >= 1000000) return `KES ${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `KES ${(num / 1000).toFixed(2)}K`;
  return `KES ${num.toLocaleString()}`;
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MembershipDashboard = ({ analyticsData }) => {
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
  const monthlyTrend = useMemo(() => {
    if (!analyticsData?.membership?.trends?.monthlyRegistration) {
      return [];
    }
    const data = analyticsData.membership.trends.monthlyRegistration;
    return data.map((members, index) => ({
      month: monthNames[index] || `Month ${index + 1}`,
      members: members || 0
    }));
  }, [analyticsData]);

  const genderData = useMemo(() => {
    if (!analyticsData?.membership?.breakdown?.byGender) {
      return [
        { name: 'Male', value: 0, color: '#3b82f6' },
        { name: 'Female', value: 0, color: '#ec4899' }
      ];
    }
    const gender = analyticsData.membership.breakdown.byGender;
    return [
      { name: 'Male', value: gender.male || 0, color: '#3b82f6' },
      { name: 'Female', value: gender.female || 0, color: '#ec4899' }
    ];
  }, [analyticsData]);

  const ageGroupData = useMemo(() => {
    if (!analyticsData?.membership?.breakdown?.byAgeGroup) {
      return [];
    }
    const ageGroup = analyticsData.membership.breakdown.byAgeGroup;
    return [
      { age: '18-30', members: ageGroup['18-30'] || 0 },
      { age: '31-45', members: ageGroup['31-45'] || 0 },
      { age: '46-60', members: ageGroup['46-60'] || 0 },
      { age: '60+', members: ageGroup['60+'] || 0 }
    ];
  }, [analyticsData]);

  const branchData = useMemo(() => {
    if (!analyticsData?.membership?.breakdown?.geographicDistribution) {
      return [];
    }
    const geo = analyticsData.membership.breakdown.geographicDistribution;
    return Object.entries(geo)
      .map(([branch, members]) => ({
        branch: branch.replace(' BRANCH', ''),
        members: members || 0
      }))
      .sort((a, b) => b.members - a.members);
  }, [analyticsData]);
  const totalMembers = analyticsData?.membership?.overviewCards?.totalMembers || 0;
  const newMembersThisMonth = analyticsData?.membership?.overviewCards?.newMembersThisMonth || 0;
  const memberGrowthRate = analyticsData?.membership?.overviewCards?.memberGrowthRate || 0;
  const totalMemberDeposits = analyticsData?.membership?.overviewCards?.totalMemberDeposits || 0;
  const activeMembers = analyticsData?.membership?.breakdown?.activeVsInactive?.active || 0;
  const inactiveMembers = analyticsData?.membership?.breakdown?.activeVsInactive?.inactive || 0;
  const totalMemberBase = activeMembers + inactiveMembers;
  const activePercentage = totalMemberBase > 0 ? ((activeMembers / totalMemberBase) * 100).toFixed(1) : 0;
  const inactivePercentage = totalMemberBase > 0 ? ((inactiveMembers / totalMemberBase) * 100).toFixed(1) : 0;
  const totalSharesHeld = analyticsData?.membership?.financialSummary?.totalSharesHeld || 0;
  const averageDepositPerMember = analyticsData?.membership?.financialSummary?.averageDepositPerMember || 0;
  const membershipRetentionRate = analyticsData?.membership?.trends?.membershipRetentionRate || 0;

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
            <span className="text-xs font-semibold">{trendValue} from last month</span>
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
          <p className="text-sm text-blue-600">{`${payload[0].name}: ${payload[0].value}`}</p>
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Membership</h1>
      </div>
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          id="card1"
          title="Total Members"
          value={totalMembers.toLocaleString()}
          subtitle="Active member count"
          icon={Users}
          trend={true}
          trendValue={`${memberGrowthRate >= 0 ? '+' : ''}${memberGrowthRate}%`}
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        />
        <StatCard
          id="card2"
          title="New Members"
          value={newMembersThisMonth.toLocaleString()}
          subtitle="This month"
          icon={UserPlus}
          trend={true}
          trendValue={`${memberGrowthRate >= 0 ? '+' : ''}${memberGrowthRate}%`}
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        />
        <StatCard
          id="card3"
          title="Growth Rate"
          value={`${memberGrowthRate >= 0 ? '+' : ''}${memberGrowthRate}%`}
          subtitle="Monthly increase"
          icon={TrendingUp}
          trend={true}
          trendValue={`${memberGrowthRate >= 0 ? '+' : ''}${memberGrowthRate}%`}
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        />
        <StatCard
          id="card4"
          title="Total Deposits"
          value={formatCurrency(totalMemberDeposits)}
          subtitle="Member savings (KES)"
          icon={DollarSign}
          trend={true}
          trendValue={`${memberGrowthRate >= 0 ? '+' : ''}${memberGrowthRate}%`}
          gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="space-y-6">
          <ChartCard title="Monthly Registration Trend" badge="Last 12 Months">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyTrend.length > 0 ? monthlyTrend : [{ month: 'No Data', members: 0 }]}>
                <defs>
                  <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '11px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="members" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  dot={{ fill: '#667eea', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  fill="url(#colorMembers)"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Members by Age Group">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ageGroupData.length > 0 ? ageGroupData : [{ age: 'No Data', members: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="age" stroke="#6b7280" style={{ fontSize: '11px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="members" 
                  fill="#8b5cf6" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Financial Summary">
            <div className="space-y-5">
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors duration-300">Total Shares Held</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(totalSharesHeld)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: totalSharesHeld > 0 ? '75%' : '0%' }}
                  ></div>
                </div>
              </div>
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-purple-600 transition-colors duration-300">Average Deposit per Member</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(averageDepositPerMember)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: averageDepositPerMember > 0 ? '60%' : '0%' }}
                  ></div>
                </div>
              </div>
              <div className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 group-hover:text-green-600 transition-colors duration-300">Retention Rate</span>
                  <span className="text-sm font-bold text-green-600">{membershipRetentionRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(membershipRetentionRate, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
        <div className="space-y-6">
          <ChartCard title="Gender Distribution">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-3">
              <div className="flex items-center transition-transform duration-300 hover:scale-110">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-700 font-medium">Male: {genderData[0]?.value.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center transition-transform duration-300 hover:scale-110">
                <div className="w-3 h-3 bg-pink-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-700 font-medium">Female: {genderData[1]?.value.toLocaleString() || 0}</span>
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Geographic Distribution">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={branchData.length > 0 ? branchData : [{ branch: 'No Data', members: 0 }]} layout="vertical" margin={{ left: 100, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" style={{ fontSize: '11px' }} />
                <YAxis 
                  type="category" 
                  dataKey="branch" 
                  stroke="#6b7280" 
                  style={{ fontSize: '12px', fontWeight: '500' }}
                  width={90}
                  tick={{ fill: '#374151' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="members" 
                  fill="#06b6d4" 
                  radius={[0, 8, 8, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Membership Breakdown">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Members</p>
                    <p className="text-3xl font-bold text-green-600">{activeMembers.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold transition-transform duration-300 hover:scale-110">
                    {activePercentage}%
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-200 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Inactive Members</p>
                    <p className="text-3xl font-bold text-red-600">{inactiveMembers.toLocaleString()}</p>
                  </div>
                  <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold transition-transform duration-300 hover:scale-110">
                    {inactivePercentage}%
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
                <p className="text-sm text-gray-600 mb-1">Total Member Base</p>
                <p className="text-4xl font-bold text-blue-600 mb-1">{totalMemberBase.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Last updated: {new Date().toLocaleString()}</p>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default MembershipDashboard;