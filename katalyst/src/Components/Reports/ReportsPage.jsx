import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaFileAlt, FaSpinner, FaFolder } from 'react-icons/fa';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import ReportFilterWindow from './ReportFilterWindow';
import useSecureApi from '../../Hooks/useSecureApi';
import DataTable from 'react-data-table-component';
import BalanceSheetView from './BalanceSheetView';
import TrialBalanceView from './TrialBalanceView';
import ProfitLossView from './ProfitLossView';
import { formatDate, getCompanyInfo, getBranchName } from './ExportUtility';
import AccountJournal from './AccountJournal';
import GeneralLedgerStatement from './GeneralLedgerStatement';
import SavingsAccountStatement from './SavingsAccountStatement';
import PortfolioAtRiskNew from './PortfolioAtRiskNew';
import ExpectedRepaymentsReport from './ExpectedRepaymentsReport';
import SavingsVsLoanBalanceReport from './SavingsVsLoanBalanceReport';
import LoansDisbursedReport from './LoansDisbursedReport';
import LoanAgeingReport from './LoanAgeingReport';
import LoanArrearsDetailedReport from './LoanArrearsDetailedReport';
import FixedDepositStatement from './FixedDepositStatement';
import FixedDepositMemberStatement from './FixedDepositMemberStatement';

const ReportsPage = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [reportResultsData, setReportResultsData] = useState([]);
  const [reportResultsLoading, setReportResultsLoading] = useState(false);
  const [reportResultsError, setReportResultsError] = useState(null);
  const [companyInfo, setCompanyInfo] = useState({});
  const [selectedBranch, setSelectedBranch] = useState('');
  const [submittedFilters, setSubmittedFilters] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isBalancedSheet, setIsBalancedSheet] = useState(false);
  const [isTrialBalance, setIsTrialBalance] = useState(false);
  const [trialBalanceProcessedData, setTrialBalanceProcessedData] = useState(null);
  const [isProfitLoss, setIsProfitLoss] = useState(false);
  const [isAccountJournal, setIsAccountJournal] = useState(false);
  const [accountJournalProcessedData, setAccountJournalProcessedData] = useState(null);
  const [isGeneralLedger, setIsGeneralLedger] = useState(false);
  const [generalLedgerProcessedData, setGeneralLedgerProcessedData] = useState(null);
  const [isSavingsStatement, setIsSavingsStatement] = useState(false);
  const [savingsStatementProcessedData, setSavingsStatementProcessedData] = useState(null);
  const [isPortfolioAtRisk, setIsPortfolioAtRisk] = useState(false);
  const [portfolioAtRiskProcessedData, setPortfolioAtRiskProcessedData] = useState(null);
  const [isExpectedRepayments, setIsExpectedRepayments] = useState(false);
  const [expectedRepaymentsProcessedData, setExpectedRepaymentsProcessedData] = useState(null);
  const [isSavingsVsLoanBalance, setIsSavingsVsLoanBalance] = useState(false);
  const [savingsVsLoanBalanceProcessedData, setSavingsVsLoanBalanceProcessedData] = useState(null);
  const [isLoansDisbursed, setIsLoansDisbursed] = useState(false);
  const [loansDisbursedProcessedData, setLoansDisbursedProcessedData] = useState(null);
  const [isLoanAgeing, setIsLoanAgeing] = useState(false);
  const [loanAgeingProcessedData, setLoanAgeingProcessedData] = useState(null);
  const [isLoanArrearsDetailed, setIsLoanArrearsDetailed] = useState(false);
  const [loanArrearsDetailedProcessedData, setLoanArrearsDetailedProcessedData] = useState(null);
  const [isFixedDepositStatement, setIsFixedDepositStatement] = useState(false);
  const [fixedDepositStatementProcessedData, setFixedDepositStatementProcessedData] = useState(null);
  const [isFixedDepositMemberStatement, setIsFixedDepositMemberStatement] = useState(false);
  const [fixedDepositMemberStatementProcessedData, setFixedDepositMemberStatementProcessedData] = useState(null);
  const { callApi } = useSecureApi();

  useEffect(() => {
    setTrialBalanceProcessedData(null);
  }, [reportId]);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const result = await callApi({
          endpoint: '/Report/API/Group',
          method: 'GET',
          requiresAuth: true,
        });

        console.log('Complete Report Data API Response:', result);
        if (!result || !result.ReportGroup) {
          throw new Error('Invalid response structure from API');
        }
        setReportData(result);
        
        if (result.ReportGroup && result.ReportGroup.length > 0) {
          setSelectedCategory(result.ReportGroup[0].GroupId);
        }
        
        setError(null);
        
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(err.message || 'Failed to load reports');  
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);
  useEffect(() => {
    setCompanyInfo(getCompanyInfo());
  }, []);

  useEffect(() => {
    if (reportData && reportData.ReportModule && reportId) {
      const report = reportData.ReportModule.find(
        r => r.ModuleId === parseInt(reportId)
      );
      
      if (report) {
        setSelectedReport(report);
        setSelectedCategory(report.GroupId);
        setShowFilters(true);
        setExpandedCategories(new Set([report.GroupId]));
        setReportResultsData([]);
        setReportResultsError(null);
        setSidebarCollapsed(true); 
      } else {
        console.warn('Report not found:', reportId);
        setSelectedReport(null);
        setShowFilters(false);
        navigate('/reports');
      }
    } else if (!reportId) {
      setSelectedReport(null);
      setShowFilters(false);
      setReportResultsData([]);
      setSidebarCollapsed(false);
    }
  }, [reportData, reportId, navigate]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const scrollContainer = document.querySelector('.report-scroll-container');
      if (!scrollContainer) {
        console.error('Scroll container not found!');
        return;
      }
      const scrollAmount = 150; 

      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          scrollContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
          break;
        case 'ArrowRight':
          e.preventDefault();
          scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [reportResultsData]);

  const handleCloseFilters = () => {
    setShowFilters(false);
    setSelectedReport(null);
    setReportResultsData([]);
    setReportResultsError(null);
    navigate('/reports');
  };

  const handleRunReport = async (filterValues) => {
    setTrialBalanceProcessedData(null);
    const moduleId = selectedReport?.ModuleId;
    const reportTypeMap = {
      balancesheet: [8251, 9914, 9067, 9074],
      trialbalance: [8256, 9783],
      profitloss: [8254, 8252],
      accountjournal: [9908],
      generalledger: [8263],
      savingsstatement: [9961],
      portfolioatrisk: [9962],
      expectedrepayments: [9987],
      savingsvsloanbalance: [9555],
      loansdisbursed: [9965],
      loanageing: [9967],
      loanarrearsdetailed: [9968],
      fixeddepositstatement: [1935],
      fixeddepositmemberstatement: [1936]
    };
    
    setIsBalancedSheet(reportTypeMap.balancesheet.includes(moduleId));
    setIsTrialBalance(reportTypeMap.trialbalance.includes(moduleId));
    setIsProfitLoss(reportTypeMap.profitloss.includes(moduleId));
    setIsAccountJournal(reportTypeMap.accountjournal.includes(moduleId));
    setIsGeneralLedger(reportTypeMap.generalledger.includes(moduleId));
    setIsSavingsStatement(reportTypeMap.savingsstatement.includes(moduleId));
    setIsPortfolioAtRisk(reportTypeMap.portfolioatrisk.includes(moduleId));
    setIsExpectedRepayments(reportTypeMap.expectedrepayments.includes(moduleId));
    setIsSavingsVsLoanBalance(reportTypeMap.savingsvsloanbalance.includes(moduleId));
    setIsLoansDisbursed(reportTypeMap.loansdisbursed.includes(moduleId));
    setIsLoanAgeing(reportTypeMap.loanageing.includes(moduleId));
    setIsLoanArrearsDetailed(reportTypeMap.loanarrearsdetailed.includes(moduleId));
    setIsFixedDepositStatement(reportTypeMap.fixeddepositstatement.includes(moduleId));
    setIsFixedDepositMemberStatement(reportTypeMap.fixeddepositmemberstatement.includes(moduleId));
    setSidebarCollapsed(true);
    setSubmittedFilters(filterValues);
    const branchId = filterValues['OurBranchID'] || filterValues['FromBranchID'];
    setSelectedBranch(getBranchName(branchId));
    try {
      let reportModule = null;
      let storedProcedureName = null;
      if (reportData) {
        reportModule = reportData.ReportModule?.find(
          module => module.ModuleId === selectedReport.ModuleId
        );
        if (!reportModule && reportData.ReportModule2) {
          reportModule = reportData.ReportModule2.find(
            module => module.ModuleID === selectedReport.ModuleId
          );
        }
        if (reportModule) {
          storedProcedureName = reportModule.DetailSPName;
        }
      }
      if (!storedProcedureName) {
        try {
          const response = await fetch('/app.json');
          const jsonData = await response.json();
          reportModule = jsonData.ReportModule?.find(
            module => module.ModuleId === selectedReport.ModuleId
          );
          if (reportModule && reportModule.DetailSPName) {
            storedProcedureName = reportModule.DetailSPName;
          }
        } catch (jsonErr) {
          console.warn('Could not load app.json:', jsonErr);
        }
      }
      
      if (storedProcedureName) {
        await fetchReportResults(storedProcedureName, filterValues);
      } else {
        setReportResultsError('Stored procedure not found for this report');
      }
    } catch (err) {
      console.error('Error fetching stored procedure:', err);
      setReportResultsError('Failed to load report configuration');
    }
  };

  const fetchReportResults = async (storedProcedureName, filterValues) => {
    try {
      setReportResultsLoading(true);
      setReportResultsError(null);

      const authToken = sessionStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No authentication token found. Please login again.');
      }

      const cleanParameters = { ...filterValues };
      const requestBody = {
        storedProcedureName: storedProcedureName,
        parameters: cleanParameters,
        moduleID: selectedReport.ModuleId
      };

      console.log('Sending report request:', requestBody);
      const result = await callApi({
        endpoint: '/Report/API/Dynamic',
        method: 'POST',
        body: requestBody,
        requiresAuth: true,
      });

      if (result.Success && result.Data && result.Data.length > 0) {
        const tableData = result.Data[0];
        if (tableData.Rows && tableData.Rows.length > 0) {
          console.log('All Rows:', JSON.stringify(tableData.Rows, null, 2));
        }
        
        if (tableData.Rows && tableData.Rows.length > 0) {
          setReportResultsData(tableData.Rows);
        } else {
          setReportResultsData([]);
          setReportResultsError('No data found for that selected range');
        }
      } else {
        setReportResultsError(result.ErrorMessage || 'No data returned from the report');
        setReportResultsData([]);
      }

    } catch (err) {
      
      let errorMessage = 'Failed to load report data';
      if (err.message) {
        try {
          const jsonMatch = err.message.match(/\{.*\}/);
          if (jsonMatch) {
            const errorJson = JSON.parse(jsonMatch[0]);
            errorMessage = errorJson.ErrorMessage || errorJson.Message || errorMessage;
          } else {
            errorMessage = err.message;
          }
        } catch (parseError) {
          errorMessage = err.message;
        }
      }
      
      setReportResultsError(errorMessage);
      setReportResultsData([]);
    } finally {
      setReportResultsLoading(false); 
    }
  };
  const handleReportClick = (report) => {
    navigate(`/reports/${report.ModuleId}`);
  };


  const toggleCategory = (groupId) => {
    setExpandedCategories(prev => {
      if (prev.has(groupId)) {
        return new Set();
      }
      return new Set([groupId]);
    });
  };

  const getFilteredReports = (reports) => {
    if (!searchQuery) return reports;
    return reports.filter(report => 
      report.ReportName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.Description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getReportsByGroup = (groupId) => {
    if (!reportData || !reportData.ReportModule) return [];
    const reports = reportData.ReportModule.filter(r => r.GroupId === groupId);
    return getFilteredReports(reports);
  };

  const formatCellValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    if (typeof value === 'string' && value.includes('T00:00:00Z')) {
      const date = new Date(value);
      return date.toLocaleDateString();
    }
    return value;
  };

  const columns = reportResultsData.length > 0 ? Object.keys(reportResultsData[0]) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Reports</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .report-scroll-container {
          scrollbar-width: thin;
          scrollbar-color: #CBD5E0 #F7FAFC;
        }

        .report-scroll-container::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        .report-scroll-container::-webkit-scrollbar-track {
          background: #F7FAFC;
        }

        .report-scroll-container::-webkit-scrollbar-thumb {
          background: #CBD5E0;
          border-radius: 4px;
        }

        .report-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #A0AEC0;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #F7FAFC;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #CBD5E0;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #A0AEC0;
        }

        .rdt_Table {
          width: auto !important;
          min-width: 100% !important;
        }
        .table-container {
          height: calc(100vh - 200px);
        }
        .horizontal-scroll-container {
          overflow-x: auto;
          width: 100%;
        }
        .wide-table {
          min-width: max-content;
          width: 100%;
        }
        .sticky-column {
          position: sticky;
          left: 0;
          background: white;
          z-index: 5;
          box-shadow: 2px 0 5px rgba(0,0,0,0.1);
        }
        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .sidebar-transition {
          transition: all 0.3s ease-in-out;
        }
        /* Reports page layout - image 2 style */
        .reports-page {
          min-height: 100vh;
          height: 100vh;
          background-color: #f0f0f0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .reports-layout {
          display: flex;
          flex: 1;
          overflow: hidden;
          max-width: 100vw;
        }
        .reports-sidebar {
          width: 280px;
          min-width: 280px;
          background: white;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          max-height: 100%;
          overflow: hidden;
        }
        .reports-sidebar-collapsed {
          width: 0;
          min-width: 0;
          overflow: hidden;
        }
        .reports-sidebar-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #e5e7eb;
          flex-shrink: 0;
        }
        .reports-category-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0;
        }
        .reports-category-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: background-color 0.2s, color 0.2s;
          color: #374151;
        }
        .reports-category-item:hover {
          background-color: #f9fafb;
        }
        .reports-category-item-active {
          background-color: #eff6ff;
          color: #2563eb;
        }
        .reports-category-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .reports-folder-icon {
          width: 14px;
          height: 14px;
          color: inherit;
          flex-shrink: 0;
        }
        .reports-category-name {
          font-size: 0.875rem;
          font-weight: 500;
        }
        .reports-sidebar-report-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem 0.5rem 1.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background-color 0.2s;
          color: #4b5563;
        }
        .reports-sidebar-report-item:hover {
          background-color: #f3f4f6;
        }
        .reports-sidebar-report-active {
          background-color: #dbeafe;
          color: #2563eb;
          font-weight: 500;
        }
        .reports-file-icon {
          width: 12px;
          height: 12px;
          flex-shrink: 0;
        }
        .reports-report-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .reports-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }
        .reports-main-header {
          padding: 1.5rem 1.5rem 0.75rem;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }
        .reports-center-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.25rem 0;
        }
        .reports-all-title {
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 1rem 0;
        }
        .reports-filter-panel-wrapper {
          padding: 0 1.5rem 1rem 1.5rem;
          background: white;
        }
        .reports-main-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }
        .reports-table-wrapper {
          background: white;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .reports-table {
          width: 100%;
          border-collapse: collapse;
        }
        .reports-table-head {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        .reports-table-th {
          padding: 0.75rem 1.5rem;
          text-align: left;
          font-size: 0.6875rem;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .reports-table-body {
          border-bottom: 1px solid #e5e7eb;
        }
        .reports-table-group-row {
          background-color: #f3f4f6;
        }
        .reports-table-group-cell {
          padding: 0.75rem 1.5rem;
        }
        .reports-table-group-name {
          font-weight: 600;
          color: #374151;
          font-size: 0.9375rem;
        }
        .reports-table-row {
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .reports-table-row:hover {
          background-color: #f9fafb;
        }
        .reports-table-cell {
          padding: 0.875rem 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          font-size: 0.875rem;
        }
        .reports-table-report-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .reports-table-file-icon {
          width: 14px;
          height: 14px;
          color: #2563eb;
          flex-shrink: 0;
        }
        .reports-table-report-name {
          font-weight: 500;
          color: #2563eb;
        }
        .reports-table-row:hover .reports-table-report-name {
          color: #1d4ed8;
        }
        .reports-table-description {
          color: #6b7280;
        }
        /* Report configure empty state - image layout */
        .report-configure-empty {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .report-configure-header {
          padding: 1rem 1.5rem;
          background: #f3f4f6;
          border-bottom: 1px solid #e5e7eb;
        }
        .report-configure-info {
          text-align: center;
        }
        .report-configure-company {
          font-size: 1rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.25rem 0;
        }
        .report-configure-name {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #374151;
          margin: 0;
        }
        .report-configure-body {
          padding: 3rem 2rem;
          text-align: center;
        }
        .report-configure-icon {
          font-size: 4rem;
          color: #d1d5db;
          margin: 0 auto 1rem;
          display: block;
        }
        .report-configure-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #374151;
          margin: 0 0 0.5rem 0;
        }
        .report-configure-instruction {
          font-size: 0.9375rem;
          color: #6b7280;
          margin: 0;
          max-width: 480px;
          margin-left: auto;
          margin-right: auto;
        }

        /* Report header (match Image 2) */
        .report-result-header {
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
        }
        .report-result-header-inner {
          text-align: center;
          padding: 12px 16px;
        }
        .report-result-company {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: #111827;
        }
        .report-result-branch {
          margin: 4px 0 0;
          font-size: 0.85rem;
          font-weight: 700;
          color: #1f2937;
        }
        .report-result-name {
          margin: 6px 0 0;
          font-size: 0.85rem;
          font-weight: 600;
          color: #374151;
        }
        .report-result-params {
          margin-top: 6px;
          font-size: 0.72rem;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
      
      <div className="reports-page">
        <div className="reports-layout">
          <div className={`reports-sidebar sidebar-transition ${
            sidebarCollapsed ? 'reports-sidebar-collapsed' : ''
          }`}>
            <div className="reports-sidebar-header">
              <h2 className="reports-category-title">REPORTS CATEGORY</h2>
            </div>
            <div className="flex-1 overflow-y-scroll p-4 custom-scrollbar" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E0 #F7FAFC'
            }}>
              {reportData && reportData.ReportGroup && (
                <div className="space-y-1">
                  {reportData.ReportGroup.map((group) => {
                    const isExpanded = expandedCategories.has(group.GroupId);
                    const groupReports = getReportsByGroup(group.GroupId);
                    
                    return (
                      <div key={group.GroupId}>
                        <div
                          className={`reports-category-item ${
                            selectedReport?.GroupId === group.GroupId ? 'reports-category-item-active' : ''
                          }`}
                          onClick={() => {
                            if (reportId) {
                              toggleCategory(group.GroupId);
                            } else {
                              setSelectedCategory(group.GroupId);
                              setTimeout(() => {
                                const groupElement = document.getElementById(`group-${group.GroupId}`);
                                if (groupElement) {
                                  groupElement.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'start',
                                    inline: 'nearest'
                                  });
                                }
                              }, 100);
                            }
                          }}
                        >
                          <div className="reports-category-content">
                            <FaFolder className="reports-folder-icon" />
                            <span className="reports-category-name">{group.GroupName}</span>
                          </div>
                        </div>
                        {isExpanded && reportId && (
                          <div className="ml-4 mt-1 space-y-1">
                            {groupReports.map((report) => (
                              <div
                                key={report.ModuleId}
                                className={`reports-sidebar-report-item ${
                                  selectedReport?.ModuleId === report.ModuleId ? 'reports-sidebar-report-active' : ''
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReportClick(report);
                                }}
                              >
                                <FaFileAlt className="reports-file-icon" />
                                <span className="reports-report-name">{report.ReportName}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="reports-main">
            <div className="reports-main-header">
              <h1 className="reports-center-title">Reports Center</h1>
              {!reportId && <h2 className="reports-all-title">All Reports</h2>}
            </div>
            {showFilters && selectedReport && (
              <div className="reports-filter-panel-wrapper">
                <ReportFilterWindow
                  reportId={selectedReport.ModuleId}
                  reportName={selectedReport.ReportName}
                  groupName={reportData?.ReportGroup?.find(g => g.GroupId === selectedReport.GroupId)?.GroupName}
                  onClose={handleCloseFilters}
                  onRunReport={handleRunReport}
                  onToggleSidebar={toggleSidebar}
                  reportResultsData={reportResultsData}
                  companyInfo={companyInfo}
                  selectedBranch={selectedBranch}
                  submittedFilters={submittedFilters}
                  reportType={isBalancedSheet ? 'balancesheet' : isProfitLoss ? 'profitloss' : isTrialBalance ? 'trialbalance' : isAccountJournal ? 'accountjournal' : isGeneralLedger ? 'generalledger' : isSavingsStatement ? 'savingsstatement' : isPortfolioAtRisk ? 'portfolioatrisk' : isExpectedRepayments ? 'expectedrepayments' : isSavingsVsLoanBalance ? 'savingsvsloanbalance' : isLoansDisbursed ? 'loansdisbursed' : isLoanAgeing ? 'loanageing' : isLoanArrearsDetailed ? 'loanarrearsdetailed' : isFixedDepositStatement ? 'fixeddepositstatement' : isFixedDepositMemberStatement ? 'fixeddepositmemberstatement' : 'table'}
                  reportData={reportData}
                  trialBalanceProcessedData={isTrialBalance ? trialBalanceProcessedData : null}
                  accountJournalProcessedData={isAccountJournal ? accountJournalProcessedData : null}
                  generalLedgerProcessedData={isGeneralLedger ? generalLedgerProcessedData : null}
                  savingsStatementProcessedData={isSavingsStatement ? savingsStatementProcessedData : null}
                  portfolioAtRiskProcessedData={isPortfolioAtRisk ? portfolioAtRiskProcessedData : null}
                  expectedRepaymentsProcessedData={isExpectedRepayments ? expectedRepaymentsProcessedData : null}
                  savingsVsLoanBalanceProcessedData={isSavingsVsLoanBalance ? savingsVsLoanBalanceProcessedData : null}
                  loansDisbursedProcessedData={isLoansDisbursed ? loansDisbursedProcessedData : null}
                  loanAgeingProcessedData={isLoanAgeing ? loanAgeingProcessedData : null}
                  loanArrearsDetailedProcessedData={isLoanArrearsDetailed ? loanArrearsDetailedProcessedData : null}
                  fixedDepositStatementProcessedData={isFixedDepositStatement ? fixedDepositStatementProcessedData : null}
                  fixedDepositMemberStatementProcessedData={isFixedDepositMemberStatement ? fixedDepositMemberStatementProcessedData : null}
                />
              </div>
            )}
            <div className="reports-main-content">
              {!reportId ? (
                <div className="reports-table-wrapper">
                  <table className="reports-table">
                    <thead className="reports-table-head">
                      <tr>
                        <th className="reports-table-th">REPORT NAME</th>
                        <th className="reports-table-th">DESCRIPTION</th>
                      </tr>
                    </thead>
                      <tbody className="reports-table-body">
                        {reportData && reportData.ReportGroup && reportData.ReportGroup.map((group) => {
                          const groupReports = getReportsByGroup(group.GroupId);
                          const isGroupOpen = selectedCategory === group.GroupId;
                          
                          if (groupReports.length === 0) return null;
                          
                          return (
                            <React.Fragment key={group.GroupId}>
                              <tr className="reports-table-group-row" id={`group-${group.GroupId}`}>
                                <td colSpan="2" className="reports-table-group-cell">
                                  <span className="reports-table-group-name">{group.GroupName}</span>
                                </td>
                              </tr>
                              {(isGroupOpen || searchQuery) && groupReports.map((report) => (
                                <tr
                                  key={report.ModuleId}
                                  className="reports-table-row"
                                  onClick={() => handleReportClick(report)}
                                >
                                  <td className="reports-table-cell">
                                    <div className="reports-table-report-cell">
                                      <FaFileAlt className="reports-table-file-icon" />
                                      <span className="reports-table-report-name">{report.ReportName}</span>
                                    </div>
                                  </td>
                                  <td className="reports-table-cell">
                                    <span className="reports-table-description">
                                      {report.Description || 'No description available'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
              ) : selectedReport ? (
                <div className="h-full">
                  {reportResultsLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg shadow">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <p className="mt-4 text-gray-600 text-lg">Loading report data...</p>
                    </div>
                  ) : reportResultsError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">{reportResultsError}</h3>
                        </div>
                      </div>
                    </div>
                  ) : reportResultsData.length === 0 ? (
                    <div className="report-configure-empty">
                      <div className="report-configure-header">
                        <div className="report-configure-info">
                          <h2 className="report-configure-company">
                            {companyInfo.name || 'Extrainch Technologies Limited'}
                          </h2>
                          <h3 className="report-configure-name">
                            {selectedReport.ReportName}
                          </h3>
                        </div>
                      </div>
                      <div className="report-configure-body">
                        <FaFileAlt className="report-configure-icon" />
                        <h3 className="report-configure-title">Configure Report Filters</h3>
                        <p className="report-configure-instruction">
                          Use the filters at the top to configure your report parameters, then click "Run Report" to generate the report.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
                      <div className="report-result-header sticky top-0 z-20">
                        <div className="report-result-header-inner">
                          <h2 className="report-result-company">
                            {companyInfo.name || 'Extrainch Technologies Limited'}
                          </h2>
                          {(() => {
                            try {
                              const selectedBranchData = sessionStorage.getItem('selectedBranch');
                              if (selectedBranchData) {
                                const branch = JSON.parse(selectedBranchData);
                                return (
                                  <h3 className="report-result-branch">
                                    {(branch.BranchName || '').toUpperCase()}
                                  </h3>
                                );
                              }
                              const userProfile = sessionStorage.getItem('userProfile');
                              if (userProfile) {
                                const profile = JSON.parse(userProfile);
                                const branchName = profile.BranchName || profile.OurBranchName || '';
                                if (branchName) {
                                  return (
                                    <h3 className="report-result-branch">
                                      {branchName.toUpperCase()}
                                    </h3>
                                  );
                                }
                              }
                            } catch (error) {
                              console.error('Error getting logged-in branch:', error);
                            }
                            return null;
                          })()}
                          <h3 className="report-result-name">
                            {selectedReport.ReportName}
                          </h3>
                          
                          <div className="report-result-params">
                            {(() => {
                              const paramParts = [];
                              if (submittedFilters['OurBranchID']) {
                                paramParts.push(`Branch ID-${submittedFilters['OurBranchID']}`);
                              }
                              if (submittedFilters['FromBranchID'] && submittedFilters['ToBranchID']) {
                                paramParts.push(`From Branch ID-${submittedFilters['FromBranchID']}`);
                                paramParts.push(`To Branch ID-${submittedFilters['ToBranchID']}`);
                              }
                              if (submittedFilters['FromDate'] && submittedFilters['ToDate']) {
                                paramParts.push(`From Trx. Date-${formatDate(submittedFilters['FromDate'])}`);
                                paramParts.push(`To Trx. Date-${formatDate(submittedFilters['ToDate'])}`);
                              }
                              if (submittedFilters['SkipZero'] !== undefined && submittedFilters['SkipZero'] !== null) {
                                const skipZeroValue = submittedFilters['SkipZero'] === 1 || submittedFilters['SkipZero'] === true ? 'Yes' : 'No';
                                paramParts.push(`Skip Zero-${skipZeroValue}`);
                              }
                              if (submittedFilters['IsSummary'] !== undefined && submittedFilters['IsSummary'] !== null) {
                                const summaryValue = submittedFilters['IsSummary'] === 1 || submittedFilters['IsSummary'] === true ? 'Yes' : 'No';
                                paramParts.push(`Is Summary-${summaryValue}`);
                              }
                              if (submittedFilters['SummaryOnMain'] !== undefined && submittedFilters['SummaryOnMain'] !== null) {
                                const summaryOnMainValue = submittedFilters['SummaryOnMain'] === 1 || submittedFilters['SummaryOnMain'] === true ? 'Yes' : 'No';
                                paramParts.push(`Summary On Main-${summaryOnMainValue}`);
                              }
                              const skipKeys = ['fromdate', 'todate', 'frombranchid', 'tobranchid', 'branchid', 'asondate', 'ourbranch', 'skipzero', 'issummary', 'summaryonmain'];
                              Object.entries(submittedFilters).forEach(([key, value]) => {
                                if (skipKeys.some(skip => key.toLowerCase().includes(skip))) return;
                                if (value === null || value === undefined || value === '') return;
                                
                                let displayValue;
                                if (typeof value === 'boolean') {
                                  displayValue = value ? 'Yes' : 'No';
                                } else if (typeof value === 'number' && (value === 0 || value === 1)) {
                                  displayValue = value === 1 ? 'Yes' : 'No';
                                } else {
                                  displayValue = value;
                                }
                                const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
                                paramParts.push(`${formattedKey}-${displayValue}`);
                              });
                              
                              return paramParts.join('  ');
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 bg-white rounded-b-lg shadow-md overflow-hidden">
                        {isBalancedSheet ? (
                          <BalanceSheetView 
                            data={reportResultsData}
                            companyInfo={companyInfo}
                            selectedBranch={selectedBranch}
                            submittedFilters={submittedFilters}
                          />
                        ) : isProfitLoss ? (
                          <ProfitLossView
                            data={reportResultsData}
                            companyInfo={companyInfo}
                            selectedBranch={selectedBranch}
                            submittedFilters={submittedFilters}
                          />
                        ) : isTrialBalance ? (
                          <TrialBalanceView
                              data={reportResultsData}
                              companyInfo={companyInfo}
                              selectedBranch={selectedBranch}
                              submittedFilters={submittedFilters}
                              onProcessedDataChange={setTrialBalanceProcessedData}
                          />
                          ) : isAccountJournal ? (
                            <AccountJournal
                                data={reportResultsData}
                                companyInfo={companyInfo}
                                selectedBranch={selectedBranch}
                                submittedFilters={submittedFilters}
                                onProcessedDataChange={setAccountJournalProcessedData}
                            />
                          ) : isGeneralLedger ? (
                            <GeneralLedgerStatement
                                data={reportResultsData}
                                companyInfo={companyInfo}
                                selectedBranch={selectedBranch}
                                submittedFilters={submittedFilters}
                                onProcessedDataChange={setGeneralLedgerProcessedData}
                            />
                            ) : isSavingsStatement ? (
                              <SavingsAccountStatement
                                data={reportResultsData}
                                companyInfo={companyInfo}
                                selectedBranch={selectedBranch}
                                submittedFilters={submittedFilters}
                                onProcessedDataChange={setSavingsStatementProcessedData}
                              />
                              ) : isPortfolioAtRisk ? (
                            <PortfolioAtRiskNew
                              data={reportResultsData}
                              companyInfo={companyInfo}
                              selectedBranch={selectedBranch}
                              submittedFilters={submittedFilters}
                              onProcessedDataChange={setPortfolioAtRiskProcessedData}
                            />
                              ) : isExpectedRepayments ? (
                            <ExpectedRepaymentsReport
                              data={reportResultsData}
                              companyInfo={companyInfo}
                              selectedBranch={selectedBranch}
                              submittedFilters={submittedFilters}
                              onProcessedDataChange={setExpectedRepaymentsProcessedData}
                            />
                              ) : isSavingsVsLoanBalance ? (
                            <SavingsVsLoanBalanceReport
                              data={reportResultsData}
                              companyInfo={companyInfo}
                              selectedBranch={selectedBranch}
                              submittedFilters={submittedFilters}
                              onProcessedDataChange={setSavingsVsLoanBalanceProcessedData}
                            />
                              ) : isLoansDisbursed ? (
                            <LoansDisbursedReport
                              data={reportResultsData}
                              companyInfo={companyInfo}
                              selectedBranch={selectedBranch}
                              submittedFilters={submittedFilters}
                              onProcessedDataChange={setLoansDisbursedProcessedData}
                            />
                              ) : isLoanAgeing ? (
                            <LoanAgeingReport
                              data={reportResultsData}
                              companyInfo={companyInfo}
                              selectedBranch={selectedBranch}
                              submittedFilters={submittedFilters}
                              onProcessedDataChange={setLoanAgeingProcessedData}
                            />
                              ) : isLoanArrearsDetailed ? (
                            <LoanArrearsDetailedReport
                              data={reportResultsData}
                              companyInfo={companyInfo}
                              selectedBranch={selectedBranch}
                              submittedFilters={submittedFilters}
                              onProcessedDataChange={setLoanArrearsDetailedProcessedData}
                            />
                              ) : isFixedDepositStatement ? (
                            <FixedDepositStatement
                              data={reportResultsData}
                              companyInfo={companyInfo}
                              selectedBranch={selectedBranch}
                              submittedFilters={submittedFilters}
                              onProcessedDataChange={setFixedDepositStatementProcessedData}
                            />
                              ) : isFixedDepositMemberStatement ? (
                            <FixedDepositMemberStatement
                              data={reportResultsData}
                              companyInfo={companyInfo}
                              selectedBranch={selectedBranch}
                              submittedFilters={submittedFilters}
                              onProcessedDataChange={setFixedDepositMemberStatementProcessedData}
                            />
                          ) : (
                            <div className="h-full flex flex-col overflow-hidden" style={{ maxWidth: '100%' }}>
                              <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar report-scroll-container" style={{ width: '100%', maxWidth: '100%' }}>
                                  <DataTable
                                    columns={columns.map(column => ({
                                      name: column.replace(/([A-Z])/g, ' $1').trim(),
                                      selector: row => formatCellValue(row[column]),
                                      sortable: true,
                                      wrap: false,  
                                      width: '150px',
                                    }))}
                                    data={reportResultsData}
                                    pagination
                                    paginationPerPage={25}
                                    paginationRowsPerPageOptions={[10, 25, 50, 100, 200, 500]}
                                    customStyles={{
                                      table: {
                                        style: {
                                          width: '100%',
                                          tableLayout: 'auto',
                                        },
                                      },
                                      tableWrapper: {
                                        style: {
                                          display: 'block',
                                          overflow: 'visible',
                                          minWidth: 'max-content',
                                          maxWidth: '100%',
                                        },
                                      },
                                      headRow: {
                                        style: {
                                          backgroundColor: '#F9FAFB',
                                          borderBottom: '2px solid #E5E7EB',
                                          minHeight: '40px',
                                        },
                                      },
                                      headCells: {
                                        style: {
                                          fontSize: '10px', 
                                          fontWeight: '600',
                                          color: '#374151',
                                          textTransform: 'uppercase',
                                          paddingLeft: '8px', 
                                          paddingRight: '8px',  
                                          whiteSpace: 'nowrap',
                                        },
                                      },
                                      cells: {
                                        style: {
                                          fontSize: '12px', 
                                          color: '#111827',
                                          paddingLeft: '8px',  
                                          paddingRight: '8px',  
                                          whiteSpace: 'nowrap',
                                        },
                                      },
                                      rows: {
                                        style: {
                                          minHeight: '40px',  
                                          '&:nth-of-type(odd)': {
                                            backgroundColor: '#F9FAFB',
                                          },
                                          '&:hover': {
                                            backgroundColor: '#F3F4F6',
                                            cursor: 'default',
                                          },
                                        },
                                      },
                                      pagination: {
                                        style: {
                                          borderTop: '1px solid #E5E7EB',
                                          minHeight: '56px',
                                          position: 'sticky',
                                          left: 0,
                                          right: 0,
                                          backgroundColor: 'white',
                                        },
                                      },
                                    }}
                                    highlightOnHover
                                    striped
                                    progressPending={reportResultsLoading}
                                    progressComponent={
                                      <div className="flex flex-col items-center justify-center py-20">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                        <p className="mt-4 text-gray-600 text-lg">Loading report data...</p>
                                      </div>
                                    }
                                    noDataComponent={
                                      <div className="text-center py-12">
                                        <p className="text-gray-500">No data available</p>
                                      </div>
                                    }
                                  />
                                </div>
                              </div>
                          )}
                        </div>
                      </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading report details...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportsPage;