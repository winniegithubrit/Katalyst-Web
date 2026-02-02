import React, { useState, useEffect } from 'react';
import { formatCurrency } from './ExportUtility';

const FixedDepositMemberStatement = ({ data, companyInfo, selectedBranch, submittedFilters, onProcessedDataChange }) => {
  const [processedData, setProcessedData] = useState(null);

  useEffect(() => {
    if (data && data.length > 0) {
      const processed = processFixedDepositMemberData(data);
      setProcessedData(processed);
      if (onProcessedDataChange) {
        onProcessedDataChange(processed);
      }
    }
  }, [data, onProcessedDataChange]);

  const processFixedDepositMemberData = (rawData) => {
    if (!rawData || rawData.length === 0) {
      return { depositInfo: null, maturityInfo: null, rawData: [] };
    }

    try {
      const firstRecord = rawData[0];
      const depositInfo = {
        branchId: firstRecord.OurBranchID || '',
        accountId: firstRecord.AccountID || '',
        receiptId: firstRecord.ReceiptID ||'',
        product: firstRecord.ProductName || '',
        name: firstRecord.Name || '',
        depositDate: firstRecord.StartDate || '',
        depositAmount: parseFloat( firstRecord.Amount || 0),
        periodInMonths: firstRecord.Term || '',
        annualIntRate: parseFloat( firstRecord.InterestRate || 0),
        maturityDate: firstRecord.MatureDate || '',
        totalInterest: parseFloat(firstRecord.GrossInterest|| 0)
      };

      const maturityValueBeforeTax = depositInfo.depositAmount + depositInfo.totalInterest;
      const withholdingTaxPercent = parseFloat(firstRecord.WithholdingTaxPercent || firstRecord.TaxPercent || 0);
      const withholdingTax = parseFloat(firstRecord.MaturityAmount || 0);
      const maturityValueAfterTax = maturityValueBeforeTax - withholdingTax;

      const maturityInfo = {
        maturityValueBeforeTax,
        withholdingTaxPercent: withholdingTaxPercent || null,
        withholdingTax,
        maturityValueAfterTax
      };

      return {
        depositInfo,
        maturityInfo,
        rawData
      };
    } catch (error) {
      console.error('Error processing fixed deposit member statement data:', error);
      return { depositInfo: null, maturityInfo: null, rawData: [] };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${month}/${day}/${year} ${displayHours}:${minutes}:${seconds}${ampm}`;
    } catch (error) {
      return dateString;
    }
  };

  if (!processedData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Processing data...</div>
      </div>
    );
  }

  const { depositInfo, maturityInfo } = processedData;

  return (
    <div className="w-full h-full overflow-auto bg-white p-6">
      <div className="max-w-4xl mx-auto bg-white">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {companyInfo.name || 'BUDDU CBS PEWOSA SACCO LIMITED'}
          </h2>
          {selectedBranch && (
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              {selectedBranch.toUpperCase()}
            </h3>
          )}
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Fixed Deposit Member Statement</h3>
        </div>
        <div className="bg-gray-600 text-white px-4 py-2 mb-4">
          <div className="flex gap-4 text-sm">
            {depositInfo.branchId && (
              <span>Branch ID-{depositInfo.branchId}</span>
            )}
            {depositInfo.accountId && (
              <span>AccountID-{depositInfo.accountId}</span>
            )}
            {depositInfo.receiptId && (
              <span>ReceiptID-{depositInfo.receiptId}</span>
            )}
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Product:</span>
            <span>{depositInfo.product}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Name:</span>
            <span>{depositInfo.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">A/C No.:</span>
            <span>{depositInfo.accountId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Fixed Deposit No.:</span>
            <span>{depositInfo.receiptId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Deposit Date:</span>
            <span>{formatDateTime(depositInfo.depositDate)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Deposit Amount:</span>
            <span>{formatCurrency(depositInfo.depositAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Period in Months:</span>
            <span>{depositInfo.periodInMonths}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Annual Int Rate (%):</span>
            <span>{depositInfo.annualIntRate.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Maturity Date:</span>
            <span>{formatDate(depositInfo.maturityDate)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Total Interest:</span>
            <span>{formatCurrency(depositInfo.totalInterest)}</span>
          </div>
        </div>
        <div className="border-t border-gray-300 pt-4 mb-4">
          <h4 className="font-bold text-sm mb-3">Transaction at Maturity:</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Maturity value before withholding tax:</span>
              <span className="font-bold">{formatCurrency(maturityInfo.maturityValueBeforeTax)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Withholding Tax %:</span>
              <span>{maturityInfo.withholdingTaxPercent !== null ? maturityInfo.withholdingTaxPercent.toFixed(2) : ''}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Withholding Tax:</span>
              <span>{formatCurrency(maturityInfo.withholdingTax)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Maturity value after withholding tax:</span>
              <span className="font-bold">{formatCurrency(maturityInfo.maturityValueAfterTax)}</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-300 pt-4 mt-4">
          <div className="flex justify-between text-xs text-gray-600">
            <div>
              <span className="font-medium">Printed By: </span>
              <span>{(() => {
                try {
                  const userData = sessionStorage.getItem('userData');
                  if (userData) {
                    const parsed = JSON.parse(userData);
                    return parsed.UserName || parsed.username || parsed.name || 'EXTRAINCH';
                  }
                } catch (e) {}
                return 'EXTRAINCH';
              })()}</span>
            </div>
            <div>
              <span className="font-medium">Print Date: </span>
              <span>{new Date().toLocaleString('en-US', { 
                month: '2-digit', 
                day: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              })}</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-2">
            <div>
              <span className="font-medium">Verified By: </span>
              <span></span>
            </div>
            <div>
              <span className="font-medium">Working Date: </span>
              <span>{(() => {
                try {
                  const userProfile = sessionStorage.getItem('userProfile');
                  if (userProfile) {
                    const profile = JSON.parse(userProfile);
                    if (profile.workingDate) {
                      const date = new Date(profile.workingDate);
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = date.toLocaleString('en-US', { month: 'short' });
                      const year = date.getFullYear();
                      return `${day}/${month}/${year}`;
                    }
                  }
                } catch (e) {}
                return '';
              })()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixedDepositMemberStatement;









