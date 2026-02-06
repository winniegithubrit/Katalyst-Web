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
  const [currency, setCurrency] = useState('EUR');
  const allTabs = [
    { id: 'dashboard', label: 'Dashboard', path: 'dashboard', icon: LayoutDashboard, isLabel: true },
    { id: 'combined', label: 'Combined Overview', path: 'combined', icon: LayoutDashboard },
    { id: 'membership', label: 'Membership', path: 'membership', icon: Users },
    { id: 'loans', label: 'Loans', path: 'loans', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', path: 'transactions', icon: ArrowLeftRight },
  ];
  const [activeTab, setActiveTab] = useState('combined');

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
        return <CombinedDashboard analyticsData={analyticsData} currency={currency} />;
      default:
        return <CombinedDashboard analyticsData={analyticsData} currency={currency} />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="w-full overflow-x-auto whitespace-nowrap bg-white px-4 py-2 flex gap-1 items-end border-b">
        {allTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.path;
          if (tab.isLabel) {
            return (
              <div
                key={tab.path}
                style={{
                  clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
                }}
                className="flex items-center px-6 py-3 text-sm bg-white text-gray-800 font-semibold border-t border-l border-r border-gray-300"
              >
                <Icon size={16} className="mr-2 text-blue-600" />
                <span className="truncate">{tab.label}</span>
              </div>
            );
          }
          return (
            <div
              key={tab.path}
              className={`
                flex items-center px-4 py-2 text-sm transition-all duration-200 cursor-pointer border-b-2
                ${isActive 
                  ? 'bg-white text-blue-600 font-semibold border-blue-600'
                  : 'bg-transparent text-gray-600 hover:text-gray-800 border-transparent hover:border-gray-300'
                }
              `}
              onClick={() => setActiveTab(tab.path)}
            >
              <Icon size={16} className="mr-2" />
              <span className="truncate">{tab.label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex-1 overflow-auto bg-gray-50">
        {renderDashboard()}
      </div>
    </div>
  );
};

export default Dashboard;