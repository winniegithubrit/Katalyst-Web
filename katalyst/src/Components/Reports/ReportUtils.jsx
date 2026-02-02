import React from 'react';
export const extractBranchAndOfficer = (row) => {
  const branchId = row.OurBranchID || row.BranchID || row.TrxBranchID || 'Unknown';
  const branchName = row.BranchName || row.OurBranchName || row.TrxBranchName || `Branch ${branchId}`;
  const officerId = row.CreditOfficerID || row.CreditOfficerName || row.LoanOfficerID || row.LoanOfficerName || 'Unknown';
  const officerName = row.CreditOfficerName || row.CreditOfficerID || row.LoanOfficerName || row.LoanOfficerID || 'Unknown Officer';
  
  return { branchId, branchName, officerId, officerName };
};

export const groupDataByBranchAndOfficer = (rawData) => {
  const groupedByBranch = {};
  
  rawData.forEach(row => {
    const { branchId, branchName, officerId, officerName } = extractBranchAndOfficer(row);
    
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
  
  return groupedByBranch;
};

export const processGroupedData = (groupedByBranch, calculateTotals) => {
  return Object.values(groupedByBranch).map(branch => {
    const officers = Object.values(branch.officers);
    const firstOfficerTotals = officers.length > 0 ? calculateTotals(officers[0].records) : {};
    const branchTotals = Object.keys(firstOfficerTotals).reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});
    
    officers.forEach(officer => {
      const officerTotals = calculateTotals(officer.records);
      Object.keys(officerTotals).forEach(key => {
        branchTotals[key] = (branchTotals[key] || 0) + (officerTotals[key] || 0);
      });
    });
    
    return {
      ...branch,
      officers,
      totals: branchTotals
    };
  });
};

export const LoadingState = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-gray-500">Processing data...</div>
  </div>
);

