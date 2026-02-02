import React, { useState, useEffect } from 'react';
import { formatCurrency } from './ExportUtility';

const SavingsAccountStatement = ({ data, companyInfo, selectedBranch, submittedFilters, onProcessedDataChange }) => {
  const [processedData, setProcessedData] = useState(null);

  useEffect(() => {
    if (data && data.length > 0) {
      const processed = processAccountData(data);
      setProcessedData(processed);
      if (onProcessedDataChange) {
        onProcessedDataChange(processed);
      }
    }
  }, [data, onProcessedDataChange]);

    const processAccountData = (rawData) => {
    if (!rawData || rawData.length === 0) {
        return { accountInfo: null, transactions: [], rawData: [] };
    }

    try {
        const firstRecord = rawData[0];
        const accountInfo = {
        branchId: firstRecord.OurBranchID || firstRecord.BranchID || '',
        branchName: firstRecord.AreaName || firstRecord.BranchName || '',
        accountNumber: firstRecord.AccountID || firstRecord.AccountNumber || '',
        accountName: firstRecord.AccountName || firstRecord.CustomerName || '',
        productName: firstRecord.ProductName || firstRecord.ProductDesc || 'N/A',
        accountCurrency: firstRecord.AccountCurrency || firstRecord.Currency || 'UGX',
        openingBalance: parseFloat(firstRecord.OpeningBalance) || 0,
        availableBalance: parseFloat(firstRecord.AvailableBalance) || 0,
        freezedAmount: parseFloat(firstRecord.FreezedAmount) || 0,
        unclearedBalance: parseFloat(firstRecord.UnclearedBalance) || 0,
        transactionsDone: rawData.length
        };
        const transactions = rawData.map((row, index) => ({
        trxDate: row.ValueDate || row.TrxDate || row.TransactionDate,
        trxTime: row.ValueDate || row.TrxDate || row.TransactionDate,
        description: row.Particulars || row.TrxDescription || row.Description || '',
        debit: parseFloat(row.Debit) || 0,
        credit: parseFloat(row.Credit) || 0,
        runningBalance: parseFloat(row.RunningTotal) || parseFloat(row.ClosingBalance) || parseFloat(row.Balance) || 0,
        trxType: row.TrxTypeID || row.TransactionType || ''
        }));

        const processedData = {
        accountInfo,
        transactions,
        rawData
        };
        return processedData;
        
    } catch (error) {
        console.error('Error processing savings statement data:', error);
        return { accountInfo: null, transactions: [], rawData: [] };
    }
    };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  if (!processedData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Processing data...</div>
      </div>
    );
  }

  const { accountInfo, transactions } = processedData;
  const fromDate = submittedFilters?.FromDate ? formatDate(submittedFilters.FromDate) : '';
  const toDate = submittedFilters?.ToDate ? formatDate(submittedFilters.ToDate) : '';

  return (
    <div className="w-full h-full overflow-auto bg-white p-6">
      <div className="max-w-full mx-auto bg-white">
        <div className="grid grid-cols-3 gap-x-8 gap-y-1 text-sm mb-4">
          <div className="flex justify-between pb-1">
            <span className="font-medium">Account Number:</span>
            <span>{accountInfo.accountNumber}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="font-medium">Account Name:</span>
            <span className="font-semibold">{accountInfo.productName || '-'}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="font-medium">Account Owner:</span>
            <span className="uppercase">{accountInfo.accountName}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="font-medium">Account Currency:</span>
            <span>{accountInfo.accountCurrency}</span>
          </div>
          
          <div className="flex justify-between pb-1">
            <span className="font-medium">Opening Balance:</span>
            <span className="font-semibold">{formatCurrency(accountInfo.openingBalance)}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="font-medium">Available Balance:</span>
            <span className="font-semibold">{formatCurrency(accountInfo.availableBalance)}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="font-medium">Freezed Amount:</span>
            <span>{formatCurrency(accountInfo.freezedAmount)}</span>
          </div>
          
          <div className="flex justify-between pb-1">
            <span className="font-medium">Uncleared Balance:</span>
            <span>{formatCurrency(accountInfo.unclearedBalance)}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="font-medium">Transactions Done:</span>
            <span>{accountInfo.transactionsDone}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span></span>
            <span></span>
          </div>
        </div>
        <div className="border-t-2 border-b-2 border-gray-800 py-2 mb-2">
          <h4 className="font-bold text-center">Savings Account Statement</h4>
        </div>
        <div className="border-b-2 border-gray-800">
          <div className="grid grid-cols-12 gap-2 py-2 text-xs font-bold">
            <div className="col-span-1">Trx.Date</div>
            <div className="col-span-1">Trx.Time</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-2 text-right">Debit</div>
            <div className="col-span-2 text-right">Credit</div>
            <div className="col-span-1 text-right">Running Balance</div>
            <div className="col-span-1">Trx.Type</div>
          </div>
        </div>
        <div className="divide-y divide-dotted divide-gray-300">
          {transactions.map((transaction, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 py-2 text-xs hover:bg-gray-50">
              <div className="col-span-1">{formatDate(transaction.trxDate)}</div>
              <div className="col-span-1">{formatTime(transaction.trxTime)}</div>
              <div className="col-span-4 break-words">{transaction.description}</div>
              <div className="col-span-2 text-right">
                {transaction.debit > 0 ? `(${formatCurrency(transaction.debit)})` : ''}
              </div>
              <div className="col-span-2 text-right">
                {transaction.credit > 0 ? formatCurrency(transaction.credit) : ''}
              </div>
              <div className="col-span-1 text-right font-medium">
                {formatCurrency(transaction.runningBalance)}
              </div>
              <div className="col-span-1">{transaction.trxType}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SavingsAccountStatement;