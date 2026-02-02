import React, { useState, useEffect } from 'react';
import { formatCurrency } from './ExportUtility';
import { groupDataByBranchAndOfficer, processGroupedData, LoadingState } from './ReportUtils';

const SavingsVsLoanBalanceReport = ({ data, companyInfo, selectedBranch, submittedFilters, onProcessedDataChange }) => {
  const [processedData, setProcessedData] = useState(null);

  useEffect(() => {
    if (data && data.length > 0) {
      const calculateTotals = (records) => {
        return records.reduce((acc, record) => {
          acc.count += 1;
          acc.outPrinciple += parseFloat(record.OutTPrincipal || 0);
          acc.principalDue += parseFloat(record.PrinDueToDate || 0);
          acc.interestDue += parseFloat(record.IntDueToDate || 0);
          acc.penaltySms += parseFloat(record.PenaltyAmount || 0);
          acc.avlBal += parseFloat(record.AvailableBalance || 0);
          acc.totalDue += parseFloat(record.TotDueToDate || 0);
          return acc;
        }, {
          count: 0,
          outPrinciple: 0,
          principalDue: 0,
          interestDue: 0,
          penaltySms: 0,
          avlBal: 0,
          totalDue: 0
        });
      };

      const groupedByBranch = groupDataByBranchAndOfficer(data);
      const branches = processGroupedData(groupedByBranch, calculateTotals);
      const processed = { branches, rawData: data };
      
      setProcessedData(processed);
      if (onProcessedDataChange) {
        onProcessedDataChange(processed);
      }
    }
  }, [data, onProcessedDataChange]);

  if (!processedData) {
    return <LoadingState />;
  }

  return (
    <div className="w-full h-full overflow-auto bg-white">
      <div className="min-w-full">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                Loan A/C
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '200px' }}>
                Name
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                Mobile
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>
                Out Principle
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>
                PrincipalDue
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>
                InterestDue
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>
                Penalty&Sms
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>
                Avl. Bal
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>
                Total Due
              </th>
            </tr>
          </thead>
          <tbody>
            {processedData.branches.map((branch, branchIndex) => {
              const calculateTotals = (records) => {
                return records.reduce((acc, record) => {
                  acc.count += 1;
                  acc.outPrinciple += parseFloat(record.OutTPrincipal || 0);
                  acc.principalDue += parseFloat(record.PrinDueToDate || 0);
                  acc.interestDue += parseFloat(record.IntDueToDate || 0);
                  acc.penaltySms += parseFloat(record.PenaltyAmount || 0);
                  acc.avlBal += parseFloat(record.AvailableBalance || 0);
                  acc.totalDue += parseFloat(record.TotDueToDate || 0);
                  return acc;
                }, {
                  count: 0,
                  outPrinciple: 0,
                  principalDue: 0,
                  interestDue: 0,
                  penaltySms: 0,
                  avlBal: 0,
                  totalDue: 0
                });
              };
              
              return (
                <React.Fragment key={branch.branchId}>
                  {branchIndex > 0 && <tr><td colSpan="9" className="h-2"></td></tr>}
                  <tr className="bg-gray-800">
                    <td colSpan="9" className="border border-gray-300 px-3 py-2 text-sm font-bold text-white underline">
                      Branch Name: {branch.branchName}
                    </td>
                  </tr>
                  {branch.officers.map((officer) => {
                    const officerTotals = calculateTotals(officer.records);
                    
                    return (
                      <React.Fragment key={`${branch.branchId}-${officer.officerId}`}>
                        <tr className="bg-gray-600">
                          <td colSpan="9" className="border border-gray-300 px-3 py-2 text-sm font-bold text-white underline">
                            Loan Officer: {officer.officerName}
                          </td>
                        </tr>
                        {officer.records.map((row, rowIndex) => {
                          return (
                            <tr 
                              key={`${branch.branchId}-${officer.officerId}-${rowIndex}`}
                              className={rowIndex % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}
                            >
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                                {row['Loan A/C'] || row.AccountID || ''}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                                {row.Name || ''}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                                {row.Mobile || ''}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row.OutTPrincipal || 0)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row.PrinDueToDate || 0)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row.IntDueToDate || 0)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row.PenaltyAmount || row['Penalty&Sms'] || 0)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row.AvailableBalance|| 0)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row.TotDueToDate || 0)}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-gray-200 font-bold">
                          <td colSpan="2" className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                            Total By Loan Officer
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-center">
                            {officerTotals.count}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.outPrinciple)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.principalDue)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.interestDue)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.penaltySms)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.avlBal)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.totalDue)}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  <tr className="bg-blue-100 font-bold">
                    <td colSpan="2" className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                      Total By Branch
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-center">
                      {branch.totals.count}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.outPrinciple)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.principalDue)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.interestDue)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.penaltySms)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.avlBal)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.totalDue)}
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

export default SavingsVsLoanBalanceReport;

