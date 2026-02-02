import React, { useState, useEffect } from 'react';
import { formatCurrency } from './ExportUtility';

const FixedDepositStatement = ({ data, companyInfo, selectedBranch, submittedFilters, onProcessedDataChange }) => {
  const [processedData, setProcessedData] = useState(null);

  useEffect(() => {
    if (data && data.length > 0) {
      const processed = processFixedDepositData(data);
      setProcessedData(processed);
      if (onProcessedDataChange) {
        onProcessedDataChange(processed);
      }
    }
  }, [data, onProcessedDataChange]);

  const processFixedDepositData = (rawData) => {
    if (!rawData || rawData.length === 0) {
      return { accountInfo: null, deposits: [], rawData: [] };
    }

    try {
      const firstRecord = rawData[0];
      const accountInfo = {
        branchId: firstRecord.OurBranchID ||'',
        accountId: firstRecord.AccountID || '',
        clientName: firstRecord.Name || '',
        freezedAmount: parseFloat(firstRecord.FreezedAmount || 0),
        availableAmount: parseFloat(firstRecord.Balance || 0),
        closingBalance: parseFloat(firstRecord.ClosingbalanceStartDate || 0)
      };

      const deposits = rawData.map((row) => ({
        receiptId: row.ReceiptID ||'',
        serialId: row.SerialID || '',
        fixedAmount: parseFloat(row.FixedAmount ||  0),
        closingBalance: parseFloat(row.ClosingbalanceStartDate || 0),
        rate: parseFloat(row.InterestRate || 0),
        startDate: row.StartDate || '',
        term: row.Term || '',
        endDate: row.EndDate ||  '',
        interestPaid: parseFloat(row.InterestPaid || 0),
        taxCharged: row.TaxCharged || '',
        netInterestPaid: row.NetInterestPaid ||'',
        interestPaidOn: row.InterestPaidOn || '',
        status: row.Status || ''
      }));

      return {
        accountInfo,
        deposits,
        rawData
      };
    } catch (error) {
      console.error('Error processing fixed deposit statement data:', error);
      return { accountInfo: null, deposits: [], rawData: [] };
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

  if (!processedData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Processing data...</div>
      </div>
    );
  }

  const { accountInfo, deposits } = processedData;

  return (
    <div className="w-full h-full overflow-auto bg-white p-6">
      <div className="max-w-full mx-auto bg-white">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {companyInfo.name}
          </h2>
          {selectedBranch && (
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              {selectedBranch.toUpperCase()}
            </h3>
          )}
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Fixed Deposit Statement</h3>
        </div>
        <div className="border-t border-b border-gray-300 py-3 mb-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Branch ID-{accountInfo.branchId || submittedFilters?.OurBranchID || ''}</span>
              {accountInfo.accountId && (
                <span className="ml-2">AccountID-{accountInfo.accountId}</span>
              )}
            </div>
            <div className="text-right">
              <span className="font-medium">Freezed Amount : </span>
              <span>{formatCurrency(accountInfo.freezedAmount)}</span>
            </div>
            <div className="text-right">
              <span className="font-medium">Available Amount </span>
              <span>{formatCurrency(accountInfo.availableAmount)}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm mt-2">
            {accountInfo.accountId && (
              <div>
                <span className="font-medium">Account ID : </span>
                <span>{accountInfo.accountId}</span>
              </div>
            )}
            <div className="col-span-2 text-right">
              <span className="font-medium">Closing Balance : </span>
              <span>{formatCurrency(accountInfo.closingBalance)}</span>
            </div>
          </div>
          {accountInfo.clientName && (
            <div className="text-sm mt-2">
              <span className="font-medium">Client Name : </span>
              <span>{accountInfo.clientName}</span>
            </div>
          )}
        </div>
        <div className="border-t border-gray-300">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-3 py-2 text-left text-xs font-bold border border-gray-300">ReceiptID</th>
                  <th className="px-3 py-2 text-left text-xs font-bold border border-gray-300">SerialID</th>
                  <th className="px-3 py-2 text-right text-xs font-bold border border-gray-300">FixedAmount</th>
                  <th className="px-3 py-2 text-right text-xs font-bold border border-gray-300">Closing balance</th>
                  <th className="px-3 py-2 text-right text-xs font-bold border border-gray-300">Rate</th>
                  <th className="px-3 py-2 text-left text-xs font-bold border border-gray-300">StartDate</th>
                  <th className="px-3 py-2 text-center text-xs font-bold border border-gray-300">Term</th>
                  <th className="px-3 py-2 text-left text-xs font-bold border border-gray-300">EndDate</th>
                  <th className="px-3 py-2 text-right text-xs font-bold border border-gray-300">InterestPaid</th>
                  <th className="px-3 py-2 text-right text-xs font-bold border border-gray-300">TaxCharged</th>
                  <th className="px-3 py-2 text-right text-xs font-bold border border-gray-300">NetInterestPaid</th>
                  <th className="px-3 py-2 text-left text-xs font-bold border border-gray-300">InterestPaidOn</th>
                  <th className="px-3 py-2 text-left text-xs font-bold border border-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((deposit, index) => (
                  <tr key={index} className="hover:bg-gray-50 border-b border-dotted border-gray-300">
                    <td className="px-3 py-2 text-xs border border-gray-200">{deposit.receiptId}</td>
                    <td className="px-3 py-2 text-xs border border-gray-200">{deposit.serialId}</td>
                    <td className="px-3 py-2 text-xs text-right border border-gray-200">{formatCurrency(deposit.fixedAmount)}</td>
                    <td className="px-3 py-2 text-xs text-right border border-gray-200">{formatCurrency(deposit.closingBalance)}</td>
                    <td className="px-3 py-2 text-xs text-right border border-gray-200">{deposit.rate.toFixed(2)}</td>
                    <td className="px-3 py-2 text-xs border border-gray-200">{formatDate(deposit.startDate)}</td>
                    <td className="px-3 py-2 text-xs text-center border border-gray-200">{deposit.term}</td>
                    <td className="px-3 py-2 text-xs border border-gray-200">{formatDate(deposit.endDate)}</td>
                    <td className="px-3 py-2 text-xs text-right border border-gray-200">{formatCurrency(deposit.interestPaid)}</td>
                    <td className="px-3 py-2 text-xs text-right border border-gray-200">{deposit.taxCharged || '-'}</td>
                    <td className="px-3 py-2 text-xs text-right border border-gray-200">{deposit.netInterestPaid || '-'}</td>
                    <td className="px-3 py-2 text-xs border border-gray-200">{deposit.interestPaidOn ? formatDate(deposit.interestPaidOn) : '-'}</td>
                    <td className="px-3 py-2 text-xs border border-gray-200">{deposit.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixedDepositStatement;








