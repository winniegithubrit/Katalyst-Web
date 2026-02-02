import React, { useState, useEffect } from 'react';
import { formatDate, formatCurrency } from './ExportUtility';

const GeneralLedgerStatement = ({ data, companyInfo, selectedBranch, submittedFilters, onProcessedDataChange }) => {
  const [processedData, setProcessedData] = useState(null);

  useEffect(() => {
    if (data && data.length > 0) {
      const grouped = groupByAccount(data);
      setProcessedData(grouped);
      if (onProcessedDataChange) {
        onProcessedDataChange(grouped);
      }
    }
  }, [data, onProcessedDataChange]);

  const groupByAccount = (rawData) => {
    const accounts = {};
    
    rawData.forEach(row => {
      const accountId = row.AccountID || row.GLAccountID;
      const description = row.Description || row.GLAccountName || '';
      
      if (!accounts[accountId]) {
        accounts[accountId] = {
          accountId,
          description,
          transactions: []
        };
      }
      
      accounts[accountId].transactions.push(row);
    });
    Object.values(accounts).forEach(account => {
      const lastTransaction = account.transactions[account.transactions.length - 1];
      account.cumulatedDr = lastTransaction.CumulativeDr || 0;
      account.cumulatedCr = lastTransaction.CumulativeCr || 0;
      account.closingDr = lastTransaction.ClosingDr || 0;
      account.closingCr = lastTransaction.ClosingCr || 0;
    });

    return {
      accounts: Object.values(accounts),
      rawData
    };
  };

  if (!processedData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Processing data...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-white">
      <div className="min-w-full">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th 
                rowSpan="2" 
                className="border border-gray-300 px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase bg-gray-200"
                style={{ minWidth: '100px' }}
              >
                TRX DATE
              </th>
              <th 
                rowSpan="2" 
                className="border border-gray-300 px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase bg-gray-200"
                style={{ minWidth: '80px' }}
              >
                SerialID
              </th>
              <th 
                rowSpan="2" 
                className="border border-gray-300 px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase bg-gray-200"
                style={{ minWidth: '250px' }}
              >
                DESCRIPTION
              </th>
              <th 
                colSpan="2" 
                className="border border-gray-300 px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase bg-gray-200"
              >
                TRANSACTIONS
              </th>
              <th 
                colSpan="2" 
                className="border border-gray-300 px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase bg-gray-200"
              >
                CUMULATED
              </th>
              <th 
                colSpan="2" 
                className="border border-gray-300 px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase bg-gray-200"
              >
                CLOSING BALANCE
              </th>
              <th 
                rowSpan="2" 
                className="border border-gray-300 px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase bg-gray-200"
                style={{ minWidth: '150px' }}
              >
                THIRD PARTY ACCOUNT
              </th>
            </tr>
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase bg-gray-200" style={{ minWidth: '120px' }}>
                Debit
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase bg-gray-200" style={{ minWidth: '120px' }}>
                Credit
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase bg-gray-200" style={{ minWidth: '120px' }}>
                Debit
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase bg-gray-200" style={{ minWidth: '120px' }}>
                Credit
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase bg-gray-200" style={{ minWidth: '120px' }}>
                Debit
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase bg-gray-200" style={{ minWidth: '120px' }}>
                Credit
              </th>
            </tr>
          </thead>
          <tbody>
            {processedData.accounts.map((account, index) => {
              const lastTransaction = account.transactions[account.transactions.length - 1];
              
              return (
                <React.Fragment key={account.accountId}>
                  {account.transactions.map((transaction, txIndex) => (
                    <tr 
                      key={`${account.accountId}-${txIndex}`}
                      className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}
                    >
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center">
                        {formatDate(transaction.TrxDate)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center">
                        {transaction.SerialID || ''}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                        {transaction.TrxDescription || ''}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-right">
                        {formatCurrency(transaction.DebitAmount || 0)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-right">
                        {formatCurrency(transaction.CreditAmount || 0)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-right">
                        {formatCurrency(transaction.CumulativeDr || 0)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-right">
                        {formatCurrency(transaction.CumulativeCr || 0)}
                      </td>
                      
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-right">
                        {formatCurrency(transaction.ClosingDr || 0)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-right">
                        {formatCurrency(transaction.ClosingCr || 0)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center">
                        {transaction.ThirdPartyAcct || ''}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-200 font-bold">
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center">
                      {formatDate(lastTransaction.TrxDate)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center">
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                      Closing Balance
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-right">
                      {formatCurrency(account.transactions.reduce((sum, t) => sum + (t.DebitAmount || 0), 0))}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-right">
                      {formatCurrency(account.transactions.reduce((sum, t) => sum + (t.CreditAmount || 0), 0))}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-right">
                      {formatCurrency(lastTransaction.CumulativeDr || 0)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-right">
                      {formatCurrency(lastTransaction.CumulativeCr || 0)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-right">
                      {formatCurrency(lastTransaction.ClosingDr || 0)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-right">
                      {formatCurrency(lastTransaction.ClosingCr || 0)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center">
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GeneralLedgerStatement;