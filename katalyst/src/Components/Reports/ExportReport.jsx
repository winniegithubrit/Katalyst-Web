import React, { useState, useRef } from 'react';
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { toast } from 'react-toastify';
import { 
  exportTableToExcel, 
  exportBalanceSheetToExcel, 
  exportTrialBalanceToExcel, 
  exportProfitLossToExcel ,
  exportAccountJournalToExcel ,
  exportGeneralLedgerToExcel,
   exportSavingsStatementToExcel,
   exportPortfolioAtRiskToExcel,
   exportExpectedRepaymentsToExcel,
   exportSavingsVsLoanBalanceToExcel,
   exportLoansDisbursedToExcel,
   exportLoanAgeingToExcel,
   exportLoanArrearsDetailedToExcel,
   exportFixedDepositStatementToExcel,
   exportFixedDepositMemberStatementToExcel
} from './ExportToExcel';
import { exportTableToPDF, exportBalanceSheetToPDF, exportTrialBalanceToPDF, exportProfitLossToPDF,  exportAccountJournalToPDF,exportGeneralLedgerToPDF,exportSavingsStatementToPDF, exportPortfolioAtRiskToPDF, exportExpectedRepaymentsToPDF, exportSavingsVsLoanBalanceToPDF, exportLoansDisbursedToPDF, exportLoanAgeingToPDF, exportLoanArrearsDetailedToPDF, exportFixedDepositStatementToPDF, exportFixedDepositMemberStatementToPDF  } from './ExportToPDF';

const ExportReport = ({ 
  data, 
  reportName, 
  disabled, 
  companyInfo, 
  selectedBranch, 
  submittedFilters, 
  reportType = 'table',
  buttonClassName = '',
  processedData = null,
  savingsStatementProcessedData = null,
  portfolioAtRiskProcessedData = null,
  expectedRepaymentsProcessedData = null,
  savingsVsLoanBalanceProcessedData = null,
  loansDisbursedProcessedData = null,
  loanAgeingProcessedData = null,
  loanArrearsDetailedProcessedData = null,
  fixedDepositStatementProcessedData = null,
  fixedDepositMemberStatementProcessedData = null,
  reportData = null,
  reportId = null
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const handleExportToExcel = async () => {
    if (!data || data.length === 0) return;
    
    try {
      if (reportType === 'balancesheet') {
        await exportBalanceSheetToExcel(data, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      } else if (reportType === 'trialbalance') {
        const exportData = processedData || { rows: data, totals: {} };
        await exportTrialBalanceToExcel(
          exportData, 
          reportName, 
          companyInfo?.name, 
          selectedBranch, 
          submittedFilters
        );
      } else if (reportType === 'profitloss') {
        await exportProfitLossToExcel(data, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      } else if (reportType === 'accountjournal') {
        await exportAccountJournalToExcel(processedData || data, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      }
      else if (reportType === 'generalledger') {
        await exportGeneralLedgerToExcel(processedData || data, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      }
      else if (reportType === 'savingsstatement') {  
        const exportData = savingsStatementProcessedData || processedData || data;
        await exportSavingsStatementToExcel(exportData, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      }
      else if (reportType === 'portfolioatrisk') {  
        const exportData = portfolioAtRiskProcessedData || processedData || data;
        await exportPortfolioAtRiskToExcel(exportData, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      }
      else if (reportType === 'expectedrepayments') {  
        const exportData = processedData || data;
        await exportExpectedRepaymentsToExcel(exportData, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      }
      else if (reportType === 'savingsvsloanbalance') {  
        const exportData = processedData || data;
        await exportSavingsVsLoanBalanceToExcel(exportData, reportName, companyInfo?.name, selectedBranch, submittedFilters, reportData, reportId);
      }
      else if (reportType === 'loansdisbursed') {  
        const exportData = processedData || data;
        await exportLoansDisbursedToExcel(exportData, reportName, companyInfo?.name, selectedBranch, submittedFilters, reportData, reportId);
      }
      else if (reportType === 'loanageing') {  
        const exportData = processedData || data;
        await exportLoanAgeingToExcel(exportData, reportName, companyInfo?.name, selectedBranch, submittedFilters, reportData, reportId);
      }
      else if (reportType === 'loanarrearsdetailed') {  
        const exportData = processedData || data;
        await exportLoanArrearsDetailedToExcel(exportData, reportName, companyInfo?.name, selectedBranch, submittedFilters, reportData, reportId);
      }
      else if (reportType === 'fixeddepositstatement') {  
        const exportData = fixedDepositStatementProcessedData || processedData || data;
        await exportFixedDepositStatementToExcel(exportData, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      }
      else if (reportType === 'fixeddepositmemberstatement') {  
        const exportData = fixedDepositMemberStatementProcessedData || processedData || data;
        await exportFixedDepositMemberStatementToExcel(exportData, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      }
      else {
        await exportTableToExcel(data, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      }
      setShowDropdown(false);
    } catch (error) {
      console.error('Excel export failed:', error);
      toast.error('Failed to export to Excel. Please try again.');
    }
  };

  const handleExportToPDF = () => {
    if (!data || data.length === 0) return;
    
    try {
      if (reportType === 'profitloss') {
        exportProfitLossToPDF(data, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      } else if (reportType === 'balancesheet') {
        exportBalanceSheetToPDF(data, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      } else if (reportType === 'trialbalance') {
        exportTrialBalanceToPDF(
          processedData || data,
          reportName, 
          companyInfo?.name, 
          selectedBranch, 
          submittedFilters
        );
      } 
      else if (reportType === 'accountjournal') {
        exportAccountJournalToPDF(processedData || data, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      } else if (reportType === 'generalledger') {
        exportGeneralLedgerToPDF(processedData || data, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      }
      else if (reportType === 'savingsstatement') {  
        const exportData = savingsStatementProcessedData || processedData || data;
        exportSavingsStatementToPDF(exportData, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      }
      else if (reportType === 'portfolioatrisk') {  
        const exportData = portfolioAtRiskProcessedData || processedData || data;
        exportPortfolioAtRiskToPDF(exportData, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      }
      else if (reportType === 'expectedrepayments') {  
        const exportData = processedData || data;
        exportExpectedRepaymentsToPDF(exportData, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      }
      else if (reportType === 'savingsvsloanbalance') {  
        const exportData = processedData || data;
        exportSavingsVsLoanBalanceToPDF(exportData, reportName, companyInfo?.name, selectedBranch, submittedFilters, reportData, reportId);
      }
      else if (reportType === 'loansdisbursed') {  
        const exportData = processedData || data;
        exportLoansDisbursedToPDF(exportData, reportName, companyInfo?.name, selectedBranch, submittedFilters, reportData, reportId);
      }
      else if (reportType === 'loanageing') {  
        const exportData = processedData || data;
        exportLoanAgeingToPDF(exportData, reportName, companyInfo?.name, selectedBranch, submittedFilters, reportData, reportId);
      }
      else if (reportType === 'loanarrearsdetailed') {  
        const exportData = processedData || data;
        exportLoanArrearsDetailedToPDF(exportData, reportName, companyInfo?.name, selectedBranch, submittedFilters, reportData, reportId);
      }
      else if (reportType === 'fixeddepositstatement') {  
        const exportData = fixedDepositStatementProcessedData || processedData || data;
        exportFixedDepositStatementToPDF(exportData, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      }
      else if (reportType === 'fixeddepositmemberstatement') {  
        const exportData = fixedDepositMemberStatementProcessedData || processedData || data;
        exportFixedDepositMemberStatementToPDF(exportData, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      }
      else {
        exportTableToPDF(data, reportName, companyInfo?.name, selectedBranch, submittedFilters);
      }
      setShowDropdown(false);
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export to PDF. Please try again.');
    }
  };
  const handlePrint = () => {
    window.print();
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setShowDropdown(!showDropdown)}
        disabled={disabled}
        className={`export-report-btn flex items-center gap-2 whitespace-nowrap ${
          disabled
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
        } ${buttonClassName}`}
        title={disabled ? 'Run a report first to export' : 'Export report'}
      >
        <Download size={14} />
        Export
      </button>

      {showDropdown && !disabled && (
        <div className="export-menu" role="menu" aria-label="Export menu">
          <div className="export-menu-header">
            <h3 className="export-menu-title">Export As</h3>
          </div>
          <div className="export-menu-body">
            <button onClick={handleExportToExcel} className="export-menu-item" role="menuitem">
              <FileSpreadsheet size={16} className="export-menu-icon export-menu-icon-xlsx" />
              <div className="export-menu-text">
                <div className="export-menu-primary">XLSX (Microsoft Excel)</div>
                <div className="export-menu-secondary">Excel Sheet</div>
              </div>
            </button>

            <div className="export-menu-divider" />

            <button onClick={handleExportToPDF} className="export-menu-item" role="menuitem">
              <FileText size={16} className="export-menu-icon export-menu-icon-pdf" />
              <div className="export-menu-text">
                <div className="export-menu-primary">PDF</div>
                <div className="export-menu-secondary">Portable Document Format</div>
              </div>
            </button>

            <div className="export-menu-divider" />

            <div className="export-menu-section">PRINT</div>
            <button onClick={handlePrint} className="export-menu-item" role="menuitem">
              <Printer size={16} className="export-menu-icon export-menu-icon-print" />
              <div className="export-menu-text">
                <div className="export-menu-primary">Print</div>
                <div className="export-menu-secondary">Send to printer</div>
              </div>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .export-report-btn {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 6px;
          border-width: 1px;
          border-style: solid;
          min-height: 36px;
        }

        /* Match Image 3 dropdown */
        .export-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 260px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          box-shadow: 0 10px 24px rgba(0,0,0,0.12);
          z-index: 1000;
          overflow: hidden;
        }
        .export-menu-header {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }
        .export-menu-title {
          margin: 0;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #374151;
        }
        .export-menu-body {
          padding: 6px 0;
        }
        .export-menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.15s;
        }
        .export-menu-item:hover {
          background: #eff6ff;
        }
        .export-menu-icon {
          flex-shrink: 0;
        }
        .export-menu-icon-xlsx { color: #16a34a; }
        .export-menu-icon-pdf { color: #dc2626; }
        .export-menu-icon-print { color: #4b5563; }
        .export-menu-text { min-width: 0; }
        .export-menu-primary {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #111827;
          line-height: 1.1;
        }
        .export-menu-secondary {
          font-size: 0.6875rem;
          color: #6b7280;
          margin-top: 2px;
          line-height: 1.1;
        }
        .export-menu-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 6px 0;
        }
        .export-menu-section {
          padding: 6px 12px 2px;
          font-size: 0.625rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default ExportReport;