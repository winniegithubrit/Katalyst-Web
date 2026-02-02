import React, { useState, useEffect } from 'react';
import { formatDate, formatCurrency } from './ExportUtility';

const PortfolioAtRiskNew = ({ data, companyInfo, selectedBranch, submittedFilters, onProcessedDataChange }) => {
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
    const calculateTotals = (records) => {
      return records.reduce((acc, record) => {
        acc.count += 1;
        acc.disbAmt += parseFloat(record.DisbAmt || 0);
        acc.osPrinciple += parseFloat(record.OSPrinciple || 0);
        acc.osInterest += parseFloat(record.OSInterest || 0);
        acc.totalOutstanding += (parseFloat(record.OSPrinciple || 0) + parseFloat(record.OSInterest || 0));
        acc.portfolioAtRisk += parseFloat(record.OSPrinciple || 0);
        acc.principalPaid += parseFloat(record.PrincipalPaid || 0);
        acc.totalPaid += parseFloat(record.TotalPaid || 0);
        acc.arrearsPrinciple += parseFloat(record.ArrearsPrinciple || 0);
        acc.arrearsInterest += parseFloat(record.ArrearsInterest || 0);
        acc.arrearsTotal += (parseFloat(record.ArrearsPrinciple || 0) + parseFloat(record.ArrearsInterest || 0));
        return acc;
      }, {
        count: 0,
        disbAmt: 0,
        osPrinciple: 0,
        osInterest: 0,
        totalOutstanding: 0,
        portfolioAtRisk: 0,
        principalPaid: 0,
        totalPaid: 0,
        arrearsPrinciple: 0,
        arrearsInterest: 0,
        arrearsTotal: 0
      });
    };

    const branches = Object.values(groupedByBranch).map(branch => {
      const officers = Object.values(branch.officers);
      
      // Calculate branch totals
      const branchTotals = {
        count: 0,
        disbAmt: 0,
        osPrinciple: 0,
        osInterest: 0,
        totalOutstanding: 0,
        portfolioAtRisk: 0,
        principalPaid: 0,
        totalPaid: 0,
        arrearsPrinciple: 0,
        arrearsInterest: 0,
        arrearsTotal: 0
      };
      
      officers.forEach(officer => {
        const officerTotals = calculateTotals(officer.records);
        branchTotals.count += officerTotals.count;
        branchTotals.disbAmt += officerTotals.disbAmt;
        branchTotals.osPrinciple += officerTotals.osPrinciple;
        branchTotals.osInterest += officerTotals.osInterest;
        branchTotals.totalOutstanding += officerTotals.totalOutstanding;
        branchTotals.portfolioAtRisk += officerTotals.portfolioAtRisk;
        branchTotals.principalPaid += officerTotals.principalPaid;
        branchTotals.totalPaid += officerTotals.totalPaid;
        branchTotals.arrearsPrinciple += officerTotals.arrearsPrinciple;
        branchTotals.arrearsInterest += officerTotals.arrearsInterest;
        branchTotals.arrearsTotal += officerTotals.arrearsTotal;
      });
      
      return {
        ...branch,
        officers,
        totals: branchTotals
      };
    });

    return {
      branches,
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
              <th colSpan="3" className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200">
                Customers
              </th>
              <th colSpan="4" className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200">
                Outstanding
              </th>
              <th colSpan="3" className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200">
              </th>
              <th colSpan="3" className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200">
                Arrears
              </th>
              <th colSpan="2" className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200">
                %Arrear
              </th>
            </tr>
            <tr>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                Account ID
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '200px' }}>
                Account Name
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '80px' }}>
                Days
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                Loan Amount
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                OS Principal
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                OS Interest
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                Total Outstanding
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                Portfolio at Risk(PAR)
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                Principa IPaid
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                TotalPaid
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                Principal
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                Interest
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '120px' }}>
                Total
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '80px' }}>
                Rate
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700 bg-gray-200" style={{ minWidth: '80px' }}>
                %PAR
              </th>
            </tr>
          </thead>
          <tbody>
            {processedData.branches.map((branch, branchIndex) => (
              <React.Fragment key={branch.branchId}>
                {branchIndex > 0 && <tr><td colSpan="15" className="h-2"></td></tr>}
                <tr className="bg-gray-800">
                  <td colSpan="15" className="border border-gray-300 px-3 py-2 text-sm font-bold text-white underline">
                    Branch Name: {branch.branchName}
                  </td>
                </tr>
                {branch.officers.map((officer, officerIndex) => {
                  const calculateOfficerTotals = (records) => {
                    return records.reduce((acc, record) => {
                      acc.count += 1;
                      acc.disbAmt += parseFloat(record.DisbAmt || 0);
                      acc.osPrinciple += parseFloat(record.OSPrinciple || 0);
                      acc.osInterest += parseFloat(record.OSInterest || 0);
                      acc.totalOutstanding += (parseFloat(record.OSPrinciple || 0) + parseFloat(record.OSInterest || 0));
                      acc.portfolioAtRisk += parseFloat(record.OSPrinciple || 0);
                      acc.principalPaid += parseFloat(record.PrincipalPaid || 0);
                      acc.totalPaid += parseFloat(record.TotalPaid || 0);
                      acc.arrearsPrinciple += parseFloat(record.ArrearsPrinciple || 0);
                      acc.arrearsInterest += parseFloat(record.ArrearsInterest || 0);
                      acc.arrearsTotal += (parseFloat(record.ArrearsPrinciple || 0) + parseFloat(record.ArrearsInterest || 0));
                      return acc;
                    }, {
                      count: 0,
                      disbAmt: 0,
                      osPrinciple: 0,
                      osInterest: 0,
                      totalOutstanding: 0,
                      portfolioAtRisk: 0,
                      principalPaid: 0,
                      totalPaid: 0,
                      arrearsPrinciple: 0,
                      arrearsInterest: 0,
                      arrearsTotal: 0
                    });
                  };
                  
                  const officerTotals = calculateOfficerTotals(officer.records);
                  
                  return (
                    <React.Fragment key={`${branch.branchId}-${officer.officerId}`}>
                      <tr className="bg-gray-600">
                        <td colSpan="15" className="border border-gray-300 px-3 py-2 text-sm font-bold text-white underline">
                          Loan Officer: {officer.officerName}
                        </td>
                      </tr>
                      {officer.records.map((row, rowIndex) => {
                        const totalOutstanding = (row.OSPrinciple || 0) + (row.OSInterest || 0);
                        const portfolioAtRisk = row.OSPrinciple || 0;
                        const arrearsTotal = (row.ArrearsPrinciple || 0) + (row.ArrearsInterest || 0);
                        
                        return (
                          <tr 
                            key={`${branch.branchId}-${officer.officerId}-${rowIndex}`}
                            className={rowIndex % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}
                          >
                            <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                              {row.AccountID || ''}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900">
                              {row.AccountName || ''}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-center">
                              {row.ArrearsDays || 0}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                              {formatCurrency(row.DisbAmt || 0)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                              {formatCurrency(row.OSPrinciple || 0)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                              {formatCurrency(row.OSInterest || 0)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                              {formatCurrency(totalOutstanding)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                              {formatCurrency(portfolioAtRisk)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                              {formatCurrency(row.PrincipalPaid || 0)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                              {formatCurrency(row.TotalPaid || 0)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                              {formatCurrency(row.ArrearsPrinciple || 0)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                              {formatCurrency(row.ArrearsInterest || 0)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                              {formatCurrency(arrearsTotal)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                              {(row.PARpercentage || 0).toFixed(2)}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                              {(row.PARpercentage || 0).toFixed(2)}
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
                          {formatCurrency(officerTotals.disbAmt)}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                          {formatCurrency(officerTotals.osPrinciple)}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                          {formatCurrency(officerTotals.osInterest)}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                          {formatCurrency(officerTotals.totalOutstanding)}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                          {formatCurrency(officerTotals.portfolioAtRisk)}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                          {formatCurrency(officerTotals.principalPaid)}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                          {formatCurrency(officerTotals.totalPaid)}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                          {formatCurrency(officerTotals.arrearsPrinciple)}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                          {formatCurrency(officerTotals.arrearsInterest)}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                          {formatCurrency(officerTotals.arrearsTotal)}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                          -
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                          -
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
                    {formatCurrency(branch.totals.disbAmt)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                    {formatCurrency(branch.totals.osPrinciple)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                    {formatCurrency(branch.totals.osInterest)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                    {formatCurrency(branch.totals.totalOutstanding)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                    {formatCurrency(branch.totals.portfolioAtRisk)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                    {formatCurrency(branch.totals.principalPaid)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                    {formatCurrency(branch.totals.totalPaid)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                    {formatCurrency(branch.totals.arrearsPrinciple)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                    {formatCurrency(branch.totals.arrearsInterest)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                    {formatCurrency(branch.totals.arrearsTotal)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                    -
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-xs text-gray-900 text-right">
                    -
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PortfolioAtRiskNew;