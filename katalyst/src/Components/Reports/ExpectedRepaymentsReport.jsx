import React, { useState, useEffect } from 'react';
import { formatDate, formatCurrency } from './ExportUtility';

const ExpectedRepaymentsReport = ({ data, companyInfo, selectedBranch, submittedFilters, onProcessedDataChange }) => {
  const [processedData, setProcessedData] = useState(null);

  useEffect(() => {
    if (data && data.length > 0) {
      const processed = processReportData(data);
      setProcessedData(processed);
      if (onProcessedDataChange) {
        onProcessedDataChange(processed);
      }
    }
  }, [data, onProcessedDataChange]);

  const processReportData = (rawData) => {
    const groupedByBranch = {};
    
    rawData.forEach(row => {
      const branchId = row.OurBranchID || row.BranchID || row.TrxBranchID || 'Unknown';
      const branchName = row.BranchName || row.OurBranchName || row.TrxBranchName || `Branch ${branchId}`;
      const officerId = row.CreditOfficerID || row.CreditOfficerName || row.LoanOfficerID || row.LoanOfficerName || 'Unknown';
      const officerName = row.CreditOfficerName || row.CreditOfficerID || row.LoanOfficerName || row.LoanOfficerID || 'Unknown Officer';
      
      if (!groupedByBranch[branchId]) {
        groupedByBranch[branchId] = {
          branchId,
          branchName,
          officers: {}
        };
      }
      
      if (!groupedByBranch[branchId].officers[officerId]) {
        groupedByBranch[branchId].officers[officerId] = {
          officerId,
          officerName,
          records: []
        };
      }
      
      groupedByBranch[branchId].officers[officerId].records.push(row);
    });
    
    const branches = Object.values(groupedByBranch).map(branch => {
      const officers = Object.values(branch.officers);
      const branchTotals = {
        count: 0,
        principalBal: 0,
        principalDue: 0,
        interestDue: 0,
        penaltyDue: 0,
        totalDue: 0
      };
      
      officers.forEach(officer => {
        const officerTotals = calculateTotals(officer.records);
        branchTotals.count += officerTotals.count;
        branchTotals.principalBal += officerTotals.principalBal;
        branchTotals.principalDue += officerTotals.principalDue;
        branchTotals.interestDue += officerTotals.interestDue;
        branchTotals.penaltyDue += officerTotals.penaltyDue;
        branchTotals.totalDue += officerTotals.totalDue;
      });
      
      return {
        ...branch,
        officers,
        totals: branchTotals
      };
    });

    console.log('Processed Expected Repayments Data:', {
      branchCount: branches.length,
      branches: branches.map(b => ({
        branchName: b.branchName,
        officerCount: b.officers.length,
        totals: b.totals
      }))
    });

    return {
      branches,
      rawData
    };
  };

  const calculateTotals = (records) => {
    return records.reduce((acc, record) => {
      acc.count += 1;
      acc.principalBal += parseFloat(record.PrincipalOutstanding || 0);
      acc.principalDue += parseFloat(record.PrincipalOverDueClosing || 0);
      acc.interestDue += parseFloat(record.InterestOverDueClosing || 0);
      acc.penaltyDue += parseFloat(record.PenaltyDue || 0);
      acc.totalDue += (parseFloat(record.PrincipalOverDueClosing || 0) + parseFloat(record.InterestOverDueClosing || 0));
      return acc;
    }, {
      count: 0,
      principalBal: 0,
      principalDue: 0,
      interestDue: 0,
      penaltyDue: 0,
      totalDue: 0
    });
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
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                AccountID
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '200px' }}>
                Name
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                Mobile
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>
                PrincipalBal
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>
                Principal Due
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>
                Interest Due
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>
                PenaltyDue
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>
                Total Due
              </th>
            </tr>
          </thead>
          <tbody>
            {processedData.branches.map((branch, branchIndex) => {
              return (
                <React.Fragment key={branch.branchId}>
                  {branchIndex > 0 && <tr><td colSpan="8" className="h-2"></td></tr>}
                  <tr className="bg-gray-800">
                    <td colSpan="8" className="border border-gray-300 px-3 py-2 text-sm font-bold text-white underline">
                      Branch Name: {branch.branchName}
                    </td>
                  </tr>
                  {branch.officers.map((officer, officerIndex) => {
                    const officerTotals = calculateTotals(officer.records);
                    
                    return (
                      <React.Fragment key={`${branch.branchId}-${officer.officerId}`}>
                        <tr className="bg-gray-600">
                          <td colSpan="8" className="border border-gray-300 px-3 py-2 text-sm font-bold text-white underline">
                            Loan Officer: {officer.officerName}
                          </td>
                        </tr>
                        {officer.records.map((row, rowIndex) => {
                          const principalDue = parseFloat(row.PrincipalOverDueClosing || 0);
                          const interestDue = parseFloat(row.InterestOverDueClosing || 0);
                          const totalDue = principalDue + interestDue;
                          
                          return (
                            <tr 
                              key={`${branch.branchId}-${officer.officerId}-${rowIndex}`}
                              className={rowIndex % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}
                            >
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                                {row.AccountID || ''}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                                {row.Name || ''}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                                {row.Mobile || ''}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row.PrincipalOutstanding || 0)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(principalDue)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(interestDue)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row.PenaltyDue || 0)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(totalDue)}
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
                            {formatCurrency(officerTotals.principalBal)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.principalDue)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.interestDue)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.penaltyDue)}
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
                      {formatCurrency(branch.totals.principalBal)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.principalDue)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.interestDue)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.penaltyDue)}
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

export default ExpectedRepaymentsReport;

