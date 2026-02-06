import React, { useState, useEffect } from 'react';
import MembershipDashboard from './MembershipDashboard';
import LoansDashboard from './LoansDashboard';
import TransactionsDashboard from './TransactionsDashboard';
import CombinedDashboard from './CombinedDashboard';
import useSecureApi from '../Hooks/useSecureApi';
import { toast } from 'react-toastify';
import { CircularProgress } from '@mui/material';
import { Users, CreditCard, ArrowLeftRight, LayoutDashboard } from 'lucide-react';

const Dashboard = () => {
  const { callApi, loading } = useSecureApi();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('combined');
  const [currency, setCurrency] = useState('EUR');

  useEffect(() => {
    localStorage.removeItem('currency');
    sessionStorage.removeItem('currency');
    const loginData = JSON.parse(localStorage.getItem('loginResponse') || '{}');
    let currencyId = loginData?.bank?.currencyId;
    if (!currencyId) {
      currencyId = loginData?.currencyId;
    }
    if (!currencyId) {
      currencyId = 'EUR';
    }
    setCurrency(currencyId);
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        
        const result = await callApi({
          endpoint: '/Dashboard/API/Analytics',
          method: 'GET',
          requiresAuth: true,
        });
        if (result) {
          if (result.dashboard) {
            setAnalyticsData(result.dashboard);
            setError(null);
          } 
          else if (result.membership || result.loans || result.transactions) {
            setAnalyticsData(result);
            setError(null);
          }
          else if (result.data && result.data.dashboard) {
            setAnalyticsData(result.data.dashboard);
            setError(null);
          }
          else {
            setError('Invalid data format received from API');
            toast.error('Invalid data format received');
          }
        } else {
          setError('No data received from API');
          toast.error('Failed to load dashboard analytics');
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err.message || 'Failed to fetch dashboard data');
        toast.error(err.message || 'Failed to load dashboard analytics');
      }
    };

    fetchAnalytics();
  }, []); 

  const tabs = [
    { id: 'combined', label: 'Combined Overview', icon: LayoutDashboard },
    { id: 'membership', label: 'Membership', icon: Users },
    { id: 'loans', label: 'Loans', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  ];

    const renderDashboard = () => {
    if (loading) {
        return (
        <div className="flex justify-center items-center h-96">
            <div className="text-center">
            <CircularProgress />
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
            </div>
        </div>
        );
    }

    if (error) {
        return (
        <div className="flex justify-center items-center h-96">
            <div className="text-center">
            <p className="text-red-600 text-lg font-semibold mb-2">Error Loading Dashboard</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                Retry
            </button>
            </div>
        </div>
        );
    }

    if (!analyticsData) {
        return (
        <div className="flex justify-center items-center h-96">
            <div className="text-center">
            <p className="text-gray-600 text-lg mb-4">No dashboard data available</p>
            <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                Refresh
            </button>
            </div>
        </div>
        );
    }

    switch (activeTab) {
      case 'membership':
      return <MembershipDashboard analyticsData={analyticsData} currency={currency} />;
      case 'loans':
      return <LoansDashboard analyticsData={analyticsData} currency={currency} />;
      case 'transactions':
      return <TransactionsDashboard analyticsData={analyticsData} currency={currency} />;
      case 'combined':
      default:
      return <CombinedDashboard analyticsData={analyticsData} currency={currency} />;
  }
    };

  return (
    <div>
      <div className="bg-white shadow-sm mb-6 rounded-lg">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm 
                  transition-all duration-200 whitespace-nowrap
                  ${isActive 
                    ? 'border-blue-600 text-blue-600 bg-blue-50' 
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="dashboard-content">
        {renderDashboard()}
      </div>
    </div>
  );
};

export default Dashboard;