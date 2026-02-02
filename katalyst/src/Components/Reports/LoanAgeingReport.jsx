import React, { useState, useEffect } from 'react';
import { formatCurrency } from './ExportUtility';
import { groupDataByBranchAndOfficer, processGroupedData, LoadingState } from './ReportUtils';

const LoanAgeingReport = ({ data, companyInfo, selectedBranch, submittedFilters, onProcessedDataChange }) => {
  const [processedData, setProcessedData] = useState(null);

  useEffect(() => {
    if (data && data.length > 0) {
      const calculateTotals = (records) => {
        return records.reduce((acc, record) => {
          acc.count += 1;
          acc.osPrincipal += parseFloat(record.OSPrincipal || record.OSPrinciple || 0);
          acc.prinInArrears += parseFloat(record.PrinInArrears || record['Prin. in Arrears'] || record.PrincipalInArrear || 0);
          acc.days1to30 += parseFloat(record['1-30 Days'] || record.Days1to30 || 0);
          acc.days31to60 += parseFloat(record['31-60 Days'] || record.Days31to60 || 0);
          acc.days61to90 += parseFloat(record['61-90 Days'] || record.Days61to90 || 0);
          acc.days91to120 += parseFloat(record['91-120 Days'] || record.Days91to120 || 0);
          acc.days121to180 += parseFloat(record['121-180 Days'] || record.Days121to180 || 0);
          acc.above180 += parseFloat(record.Above180Day || record.Above180 || 0);
          return acc;
        }, {
          count: 0,
          osPrincipal: 0,
          prinInArrears: 0,
          days1to30: 0,
          days31to60: 0,
          days61to90: 0,
          days91to120: 0,
          days121to180: 0,
          above180: 0
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
                A/C No
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '200px' }}>
                Name
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '100px' }}>
                Phone
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '80px' }}>
                Days
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>
                OSPrincipal
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '150px' }}>
                Prin. in Arrears
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                1-30 Days
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                31-60 Days
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                61-90 Days
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                91-120 Days
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                121-180 Days
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                Above180 Day
              </th>
            </tr>
          </thead>
          <tbody>
            {processedData.branches.map((branch, branchIndex) => {
              const calculateTotals = (records) => {
                return records.reduce((acc, record) => {
                  acc.count += 1;
                  acc.osPrincipal += parseFloat(record.OSPrincipal || record.OSPrinciple || 0);
                  acc.prinInArrears += parseFloat(record.PrinInArrears || record['Prin. in Arrears'] || record.PrincipalInArrear || 0);
                  acc.days1to30 += parseFloat(record['1-30 Days'] || record.Days1to30 || 0);
                  acc.days31to60 += parseFloat(record['31-60 Days'] || record.Days31to60 || 0);
                  acc.days61to90 += parseFloat(record['61-90 Days'] || record.Days61to90 || 0);
                  acc.days91to120 += parseFloat(record['91-120 Days'] || record.Days91to120 || 0);
                  acc.days121to180 += parseFloat(record['121-180 Days'] || record.Days121to180 || 0);
                  acc.above180 += parseFloat(record.Above180Day || record.Above180 || 0);
                  return acc;
                }, {
                  count: 0,
                  osPrincipal: 0,
                  prinInArrears: 0,
                  days1to30: 0,
                  days31to60: 0,
                  days61to90: 0,
                  days91to120: 0,
                  days121to180: 0,
                  above180: 0
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
                                {row['A/C No'] || row.ACNo || row.AccountID || ''}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                                {row.Name || ''}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                                {row.PhoneNo || ''}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-center">
                                {row.DueDays || 0}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row.OSPrincipal || 0)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row['Principal in Arrears'] || row['Prin. in Arrears'] || row.PrincipalInArrear || 0)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row['1-30 Days'] || row.Days1to30 || 0)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row['31-60 Days'] || row.Days31to60 || 0)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row['61-90 Days'] || row.Days61to90 || 0)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row['91-120 Days'] || row.Days91to120 || 0)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row['121-180 Days'] || row.Days121to180 || 0)}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                                {formatCurrency(row.Above180Day || row.Above180 || 0)}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-gray-200 font-bold">
                          <td colSpan="2" className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                            Total By Loan Officer
                          </td>
                          <td colSpan="2" className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-center">
                            {officerTotals.count}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.osPrincipal)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.prinInArrears)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.days1to30)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.days31to60)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.days61to90)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.days91to120)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.days121to180)}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                            {formatCurrency(officerTotals.above180)}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  <tr className="bg-blue-100 font-bold">
                    <td colSpan="2" className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                      Total By Branch
                    </td>
                    <td colSpan="2" className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-center">
                      {branch.totals.count}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.osPrincipal)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.prinInArrears)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.days1to30)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.days31to60)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.days61to90)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.days91to120)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.days121to180)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                      {formatCurrency(branch.totals.above180)}
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

export default LoanAgeingReport;

