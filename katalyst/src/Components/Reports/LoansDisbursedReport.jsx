import React, { useState, useEffect } from 'react';
import { formatDate, formatCurrency } from './ExportUtility';
import { groupDataByBranchAndOfficer, processGroupedData, LoadingState } from './ReportUtils';

const LoansDisbursedReport = ({ data, companyInfo, selectedBranch, submittedFilters, onProcessedDataChange }) => {
  const [processedData, setProcessedData] = useState(null);

  useEffect(() => {
    if (data && data.length > 0) {
      const calculateTotals = (records) => {
        return records.reduce((acc, record) => {
          acc.count += 1;
          const disbursementAmount = parseFloat(record.DisbursementAmount || record.DisbAmt || 0);
          const interestAmount = parseFloat(record.InterestAmount || 0);
          acc.disbursementAmount += disbursementAmount;
          acc.interestAmount += interestAmount;
          acc.totalLoanAmount += (disbursementAmount + interestAmount);
          acc.principalPaid += parseFloat(record.PrincipalPaid || 0);
          acc.interestPaid += parseFloat(record.InterestPaid || 0);
          return acc;
        }, {
          count: 0,
          disbursementAmount: 0,
          interestAmount: 0,
          totalLoanAmount: 0,
          principalPaid: 0,
          interestPaid: 0
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
                Loan ID
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '200px' }}>
                Borrower
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '100px' }}>
                Date of Loan Disbursement
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '100px' }}>
                Maturity Date
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '80px' }}>
                Rate
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '80px' }}>
                Term
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                Repayment Period
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>
                Disbursement Amount
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>
                Interest Amount
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>
                Total Loan Amount
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>
                Principal Paid
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>
                Interest Paid
              </th>
            </tr>
          </thead>
          <tbody>
            {processedData.branches.map((branch, branchIndex) => {
              const calculateTotals = (records) => {
                return records.reduce((acc, record) => {
                  acc.count += 1;
                  const disbursementAmount = parseFloat(record.DisbursementAmount || record.DisbAmt || 0);
                  const interestAmount = parseFloat(record.InterestAmount || 0);
                  acc.disbursementAmount += disbursementAmount;
                  acc.interestAmount += interestAmount;
                  acc.totalLoanAmount += (disbursementAmount + interestAmount);
                  acc.principalPaid += parseFloat(record.PrincipalPaid || 0);
                  acc.interestPaid += parseFloat(record.InterestPaid || 0);
                  return acc;
                }, {
                  count: 0,
                  disbursementAmount: 0,
                  interestAmount: 0,
                  totalLoanAmount: 0,
                  principalPaid: 0,
                  interestPaid: 0
                });
              };
              
              return (
                <React.Fragment key={branch.branchId}>
                  {branchIndex > 0 && <tr><td colSpan="12" className="h-2"></td></tr>}
                  <tr className="bg-gray-800">
                    <td colSpan="12" className="border border-gray-300 px-3 py-2 text-sm font-bold text-white underline">
                      Branch Name: {branch.branchName}
                    </td>
                  </tr>
                  {branch.officers.map((officer) => {
                    const officerTotals = calculateTotals(officer.records);
                    
                    return (
                      <React.Fragment key={`${branch.branchId}-${officer.officerId}`}>
                        <tr className="bg-gray-600">
                          <td colSpan="12" className="border border-gray-300 px-3 py-2 text-sm font-bold text-white underline">
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
                                {row.AccountID || ''}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                                {row.Name || ''}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                                {formatDate(row.DisbursementDate)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                                {formatDate(row.MaturityDate)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-center">
                                {row.InterestRate || 0}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-center">
                                {row.Term || 0}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                                {row.RepaymentPeriod || ''}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row.DisbursementAmount  || 0)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row.InterestAmount || 0)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency((parseFloat(row.DisbursementAmount || 0) + parseFloat(row.InterestAmount || 0)))}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row.PrincipalPaid || 0)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row.InterestPaid || 0)}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-gray-200 font-bold">
                          <td colSpan="2" className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                            Total By Loan Officer
                          </td>
                          <td colSpan="5" className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-center">
                            {officerTotals.count}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.disbursementAmount)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.interestAmount)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.totalLoanAmount)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.principalPaid)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.interestPaid)}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  <tr className="bg-blue-100 font-bold">
                    <td colSpan="2" className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                      Total By Branch
                    </td>
                    <td colSpan="5" className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-center">
                      {branch.totals.count}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.disbursementAmount)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.interestAmount)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.totalLoanAmount)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.principalPaid)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.interestPaid)}
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

export default LoansDisbursedReport;

