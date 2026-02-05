import { groupDataByBranchAndOfficer, processGroupedData } from './ReportUtils';

export const generateFilename = (reportName, extension) => {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${reportName.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.${extension}`;
};

export const formatDate = (value) => {
  if (!value) return value;
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const getUserInfo = () => {
  const userData = sessionStorage.getItem('userData');
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const year = now.getFullYear();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  const formattedDateTime = `${day}, ${month}, ${year}, ${hours}:${minutes}`;
  
  if (!userData) {
    return { 
      name: 'Unknown User', 
      date: formattedDateTime
    };
  }
  
  try {
    const parsed = JSON.parse(userData);
    return {
      name: parsed.UserName || parsed.username || parsed.name || parsed.Name || 
            parsed.email || parsed.Email || 'Unknown User',
      date: formattedDateTime
    };
  } catch (e) {
    console.error('Error parsing user data:', e);
    return { 
      name: 'Unknown User', 
      date: formattedDateTime
    };
  }
};

export const groupBalanceSheetData = (data) => {
  if (!data || !data.length) return {};
  
  const isBalanceSheet = data[0]?.GLAccountType && data[0]?.GLTypeGroup && data[0]?.GLSubAccountType;
  if (!isBalanceSheet) return null;
  
  const grouped = {};
  
  data.forEach(item => {
    const accountType = item.GLAccountType || 'Uncategorized';
    const typeGroup = item.GLTypeGroup || 'Uncategorized';
    const subAccountType = item.GLSubAccountType || 'Uncategorized';
    
    if (!grouped[accountType]) {
      grouped[accountType] = { name: accountType, total: 0, groups: {} };
    }
    
    if (!grouped[accountType].groups[typeGroup]) {
      grouped[accountType].groups[typeGroup] = { name: typeGroup, total: 0, subGroups: {} };
    }
    
    if (!grouped[accountType].groups[typeGroup].subGroups[subAccountType]) {
      grouped[accountType].groups[typeGroup].subGroups[subAccountType] = {
        name: subAccountType, total: 0, items: []
      };
    }
    
    const localBalance = parseFloat(item.LocalBalance) || 0;
    grouped[accountType].groups[typeGroup].subGroups[subAccountType].items.push({
      description: item.Description || '',
      localBalance: localBalance
    });
    
    grouped[accountType].groups[typeGroup].subGroups[subAccountType].total += localBalance;
    grouped[accountType].groups[typeGroup].total += localBalance;
    grouped[accountType].total += localBalance;
  });
  
  return grouped;
};

export const formatCellValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  
  if (typeof value === 'string' && value.includes('T00:00:00Z')) {
    const date = new Date(value);
    return date.toLocaleDateString();
  }
  
  return value;
};

export const getCompanyInfo = () => {
  try {
    const bankInfo = sessionStorage.getItem('bankInfo');
    if (bankInfo) {
      const bank = JSON.parse(bankInfo);
      if (bank.bankName) {
        return { name: bank.bankName };
      }
    }
    const userProfile = sessionStorage.getItem('userProfile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      return {
        name: profile.BankName || profile.CompanyName || profile.OurCompanyName || 'Company Name',
      };
    }
    return { name: 'Company Name' };
  } catch (error) {
    console.error('Error fetching company info:', error);
    return { name: 'Company Name' };
  }
};

export const getBranchName = (branchId) => {
  if (branchId) {
    try {
      const cachedBranches = sessionStorage.getItem('branches');
      if (cachedBranches) {
        const branches = JSON.parse(cachedBranches);
        const branch = branches.find(b => b.OurBranchId === branchId);
        return branch?.BranchName || '';
      }
    } catch (error) {
      console.error('Error getting branch name:', error);
    }
  }
  
  try {
    const userProfile = sessionStorage.getItem('userProfile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      return profile.BranchName || profile.OurBranchName || '';
    }
  } catch (error) {
    console.error('Error getting branch from user profile:', error);
  }
  
  return '';
};
export const getBankLogo = () => {
  try {
    const bankInfo = sessionStorage.getItem('bankInfo');
    if (bankInfo) {
      const bank = JSON.parse(bankInfo);
      if (bank.bankLogo) {
        return bank.bankLogo;
      }
    }
    const userProfile = sessionStorage.getItem('userProfile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      if (profile.BankLogo) {
        return profile.BankLogo;
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching bank logo:', error);
    return null;
  }
};

export const validateExportData = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { valid: false, message: 'No data available to export' };
  }
  
  if (typeof data[0] !== 'object') {
    return { valid: false, message: 'Invalid data format' };
  }
  
  return { valid: true };
};

export const detectReportType = (data) => {
  if (!data || data.length === 0) return 'table';
  
  const firstRow = data[0];
  const hasBalanceSheetStructure = 
    firstRow.GLAccountType && 
    firstRow.GLTypeGroup && 
    firstRow.GLSubAccountType;
  
  return hasBalanceSheetStructure ? 'balancesheet' : 'table';
};

export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const formatFilterForDisplay = (key, value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  
  if (key.toLowerCase().includes('date')) {
    return formatDate(value);
  }
  
  return String(value);
};

export const generateReportTitle = (reportName, filters) => {
  let title = reportName;
  
  if (filters?.FromDate && filters?.ToDate) {
    title += ` (${formatDate(filters.FromDate)} - ${formatDate(filters.ToDate)})`;
  } else if (filters?.AsOnDate) {
    title += ` (As on ${formatDate(filters.AsOnDate)})`;
  }
  
  return title;
};

export const processSavingsDataForExport = (rawData) => {
  if (!rawData || rawData.length === 0) {
    return { accountInfo: null, transactions: [], rawData: [] };
  }
  
  const firstRecord = rawData[0];
  const accountInfo = {
    branchId: firstRecord.OurBranchID || firstRecord.BranchID || '',
    branchName: firstRecord.AreaName || firstRecord.BranchName || '',
    accountNumber: firstRecord.AccountID || firstRecord.AccountNumber || '',
    accountName: firstRecord.AccountName || firstRecord.CustomerName || '',
    productName: firstRecord.ProductName || '',
    accountCurrency: firstRecord.AccountCurrency || firstRecord.Currency || 'UGX',
    openingBalance: parseFloat(firstRecord.OpeningBalance) || 0,
    availableBalance: parseFloat(firstRecord.AvailableBalance) || 0,
    freezedAmount: parseFloat(firstRecord.FreezedAmount) || 0,
    unclearedBalance: parseFloat(firstRecord.UnclearedBalance) || 0,
    transactionsDone: rawData.length
  };
  
  const transactions = rawData.map(row => ({
    trxDate: row.ValueDate || row.TrxDate,
    trxTime: row.ValueDate || row.TrxDate,
    description: row.Particulars || row.TrxDescription || '',
    debit: parseFloat(row.Debit) || 0,
    credit: parseFloat(row.Credit) || 0,
    runningBalance: parseFloat(row.RunningTotal) || parseFloat(row.ClosingBalance) || 0,
    trxType: row.TrxTypeID || ''
  }));
  
  return {
    accountInfo,
    transactions,
    rawData
  };
};

export const processPortfolioAtRiskDataForExport = (rawData) => {
  if (rawData && rawData.branches) {
    return rawData;
  }
  
  if (!rawData || rawData.length === 0) {
    return { branches: [], rawData: [] };
  }
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

export const processExpectedRepaymentsDataForExport = (rawData) => {
  if (rawData && rawData.branches) {
    return rawData;
  }
  
  if (!rawData || rawData.length === 0) {
    return { branches: [], rawData: [] };
  }
  
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

  return {
    branches,
    rawData
  };
};

const processReportDataForExport = (rawData, calculateTotals) => {
  if (rawData && rawData.branches) {
    return rawData;
  }
  
  if (!rawData || rawData.length === 0) {
    return { branches: [], rawData: [] };
  }
  
  const groupedByBranch = groupDataByBranchAndOfficer(rawData);
  const branches = processGroupedData(groupedByBranch, calculateTotals);

  return {
    branches,
    rawData
  };
};

export const processSavingsVsLoanBalanceDataForExport = (rawData) => {
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

  return processReportDataForExport(rawData, calculateTotals);
};

export const processLoansDisbursedDataForExport = (rawData) => {
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

  return processReportDataForExport(rawData, calculateTotals);
};

export const processLoanAgeingDataForExport = (rawData) => {
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

  return processReportDataForExport(rawData, calculateTotals);
};

export const processLoanArrearsDetailedDataForExport = (rawData) => {
  const calculateTotals = (records) => {
    return records.reduce((acc, record) => {
      acc.count += 1;
      acc.outPrinciple += parseFloat(record.OutTPrincipal || 0);
      acc.principalDue += parseFloat(record.PrinDueToDate || 0);
      acc.interestDue += parseFloat(record.IntDueToDate || 0);
      acc.penaltySms += parseFloat(record.PenaltyAmount || 0);
      acc.totalDue += parseFloat(record.TotDueToDate || 0);
      return acc;
    }, {
      count: 0,
      outPrinciple: 0,
      principalDue: 0,
      interestDue: 0,
      penaltySms: 0,
      totalDue: 0
    });
  };

  return processReportDataForExport(rawData, calculateTotals);
};

export const groupProfitLossData = (data) => {
  if (!data || !data.length) return null;
  
  const structure = {
    income: { title: 'INCOME', sections: {}, total: 0 },
    expense: { title: 'EXPENSE', sections: {}, total: 0 }
  };

  data.forEach(item => {
    const accountType = item.GLAccountType?.toUpperCase() || 'OTHER';
    const typeGroup = item.GLTypeGroup || 'Uncategorized';
    const subAccountType = item.GLSubAccountType || 'Uncategorized';
    const description = item.Description || '';
    const balance = parseFloat(item.LocalBalance) || 0;

    const category = accountType.includes('INCOME') ? 'income' : 'expense';

    if (!structure[category].sections[typeGroup]) {
      structure[category].sections[typeGroup] = {
        name: typeGroup,
        subGroups: {},
        total: 0
      };
    }

    if (!structure[category].sections[typeGroup].subGroups[subAccountType]) {
      structure[category].sections[typeGroup].subGroups[subAccountType] = {
        name: subAccountType,
        items: [],
        total: 0
      };
    }

    structure[category].sections[typeGroup].subGroups[subAccountType].items.push({
      description,
      balance
    });

    structure[category].sections[typeGroup].subGroups[subAccountType].total += balance;
    structure[category].sections[typeGroup].total += balance;
    structure[category].total += balance;
  });

  return structure;
};

export const addStandardExcelHeader = (worksheet, companyName, reportName, selectedBranch, submittedFilters, numColumns) => {
  let currentRow = 1;
  const centerColumn = Math.floor(numColumns / 2) + 1;
  
  const addCenteredRow = (value, fontSize = 12, isBold = true) => {
    const row = worksheet.getRow(currentRow);
    row.getCell(centerColumn).value = value;
    row.getCell(centerColumn).font = { bold: isBold, size: fontSize };
    row.getCell(centerColumn).alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow++;
  };
  let loggedInBranch = '';
  try {
    const selectedBranchData = sessionStorage.getItem('selectedBranch');
    if (selectedBranchData) {
      const branch = JSON.parse(selectedBranchData);
      loggedInBranch = branch.BranchName;
    } else {
      const userProfile = sessionStorage.getItem('userProfile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        loggedInBranch = profile.BranchName || profile.OurBranchName || '';
      }
    }
  } catch (error) {
    console.error('Error getting branch:', error);
  }
  
  const actualCompanyName = companyName || getCompanyName();
  addCenteredRow(actualCompanyName, 14);
  if (loggedInBranch) {
    addCenteredRow(loggedInBranch.toUpperCase(), 12);
  } else {
    console.log('No branch found in session storage for Excel');
  }
  
  addCenteredRow(reportName, 12);
  
  const paramParts = [];
  if (submittedFilters.OurBranchID) {
    paramParts.push(`Branch ID-${submittedFilters.OurBranchID}`);
  }
  if (submittedFilters.FromBranchID && submittedFilters.ToBranchID) {
    paramParts.push(`From Branch ID-${submittedFilters.FromBranchID}`);
    paramParts.push(`To Branch ID-${submittedFilters.ToBranchID}`);
  }
  if (submittedFilters.FromDate && submittedFilters.ToDate) {
    const fromDate = formatDate(submittedFilters.FromDate);
    const toDate = formatDate(submittedFilters.ToDate);
    paramParts.push(`From Trx. Date-${fromDate}`);
    paramParts.push(`To Trx. Date-${toDate}`);
  }
  
  if (submittedFilters.SkipZero !== undefined && submittedFilters.SkipZero !== null) {
    const skipZeroValue = submittedFilters.SkipZero === 1 || submittedFilters.SkipZero === true ? 'Yes' : 'No';
    paramParts.push(`Skip Zero-${skipZeroValue}`);
  }
  if (submittedFilters.IsSummary !== undefined && submittedFilters.IsSummary !== null) {
    const summaryValue = submittedFilters.IsSummary === 1 || submittedFilters.IsSummary === true ? 'Yes' : 'No';
    paramParts.push(`Is Summary-${summaryValue}`);
  }
  if (submittedFilters.SummaryOnMain !== undefined && submittedFilters.SummaryOnMain !== null) {
    const summaryOnMainValue = submittedFilters.SummaryOnMain === 1 || submittedFilters.SummaryOnMain === true ? 'Yes' : 'No';
    paramParts.push(`Summary On Main-${summaryOnMainValue}`);
  }
  
  const skipKeys = ['fromdate', 'todate', 'frombranchid', 'tobranchid', 'branchid', 'asondate', 'ourbranch', 'skipzero', 'issummary', 'summaryonmain'];
  Object.entries(submittedFilters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && !skipKeys.some(skip => key.toLowerCase().includes(skip))) {
      let displayValue;
      if (typeof value === 'boolean') {
        displayValue = value ? 'Yes' : 'No';
      } else if (typeof value === 'number' && (value === 0 || value === 1)) {
        displayValue = value === 1 ? 'Yes' : 'No';
      } else {
        displayValue = value;
      }
      const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
      paramParts.push(`${formattedKey}-${displayValue}`);
    }
  });
  
  if (paramParts.length > 0) {
    const paramLine = paramParts.join('  ');
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = paramLine; 
    row.getCell(1).font = { bold: false, size: 10 };
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    currentRow++;
  }

  currentRow++; 

  return currentRow;
};
export const addStandardPDFHeader = async (doc, pageWidth, companyName, reportName, selectedBranch, submittedFilters, isProfitLoss = false, isBalanceSheet = false) => {
  let yPos = isBalanceSheet ? 17 : 15;
  const logoUrl = getBankLogo();
  const leftMargin = 10;
  let loggedInBranch = '';
  try {
    const selectedBranchData = sessionStorage.getItem('selectedBranch');
    if (selectedBranchData) {
      const branch = JSON.parse(selectedBranchData);
      loggedInBranch = branch.BranchName;
    }
    if (!loggedInBranch) {
      const userProfile = sessionStorage.getItem('userProfile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        loggedInBranch = profile.BranchName || profile.OurBranchName || '';
      }
    }
  } catch (error) {
    console.error('Error getting branch from session:', error);
  }

  let logoHeight = 0;
  let logoBottomY = 0;
  if (logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      await new Promise((resolve) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imgData = canvas.toDataURL('image/png');
            
            const logoWidth = 30;
            logoHeight = (img.height / img.width) * logoWidth;
            const logoX = leftMargin;
            const logoY = yPos - 8;
            
            doc.addImage(imgData, 'PNG', logoX, logoY, logoWidth, logoHeight);
            logoBottomY = logoY + logoHeight;
            resolve();
          } catch (err) {
            console.log('Logo rendering error:', err);
            resolve();
          }
        };
        img.onerror = () => {
          resolve();
        };
        img.src = logoUrl;
      });
    } catch (error) {
      console.warn('Logo loading error:', error);
    }
  }
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(companyName || 'Company Limited', pageWidth / 2, yPos + 2, { align: 'center' });
  yPos += 6;
  if (loggedInBranch) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(loggedInBranch.toUpperCase(), pageWidth / 2, yPos + 2, { align: 'center' });
    yPos += isBalanceSheet ? 12 : 6;
  } else {
    console.log(' No branch found in session storage');
  }
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(reportName, pageWidth / 2, yPos + 2, { align: 'center' });
  yPos += isProfitLoss ? 8 : isBalanceSheet ? 12 : 6;
  
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  
  const paramParts = [];
  if (submittedFilters.FromBranchID && submittedFilters.ToBranchID) {
    paramParts.push(`From Branch ID-${submittedFilters.FromBranchID}  To Branch ID-${submittedFilters.ToBranchID}`);
  }
  if (submittedFilters.FromDate && submittedFilters.ToDate) {
    const fromDate = formatDate(submittedFilters.FromDate);
    const toDate = formatDate(submittedFilters.ToDate);
    paramParts.push(`From Trx. Date-${fromDate}  To Trx. Date-${toDate}`);
  }
  if (submittedFilters.FromAccountID && submittedFilters.ToAccountID) {
    paramParts.push(`From Account ID-${submittedFilters.FromAccountID}`);
    paramParts.push(`To Account ID-${submittedFilters.ToAccountID}`);
  }
  
  const skipKeys = ['fromdate', 'todate', 'frombranchid', 'tobranchid', 'branchid', 'asondate', 'ourbranch'];
  Object.entries(submittedFilters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && !skipKeys.some(skip => key.toLowerCase().includes(skip))) {
      let displayValue;
      if (typeof value === 'boolean') {
        displayValue = value ? 'Yes' : 'No';
      } else if (typeof value === 'number' && (value === 0 || value === 1)) {
        displayValue = value === 1 ? 'Yes' : 'No';
      } else {
        displayValue = value;
      }
      const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
      paramParts.push(`${formattedKey}-${displayValue}`);
    }
  });
  
  if (paramParts.length > 0) {
    const paramText = paramParts.join('  ');
    const paramYPos = logoBottomY > 0 ? Math.max(logoBottomY + 3, yPos + 2) : (isProfitLoss ? yPos + 3 : isBalanceSheet ? yPos + 5 : yPos + 2);
    doc.setFontSize(8);
    doc.text(paramText, leftMargin, paramYPos, { align: 'left' });
    yPos = paramYPos + 7;
  }

  return yPos + (isBalanceSheet ? 8 : 2);
};

export const getAllParametersForReport = (reportData, reportId, submittedFilters) => {
  if (!reportData || !reportData.ReportParameter || !reportId) {
    return [];
  }
  
  const allParams = reportData.ReportParameter
    .filter(param => {
      return param.ModuleId === reportId && param.ItemSection === 'I' && param.IsHidden !== 1;
    })
    .sort((a, b) => (a.ItemOrder || 0) - (b.ItemOrder || 0));
  
  return allParams.map(param => {
    const paramName = param.ItemName;
    const paramCaption = param.ItemCaption || paramName;
    let value = submittedFilters[paramName];
    
    if (value === null || value === undefined || value === '') {
      value = 'All';
    } else if (param.ItemType === 'CHK') {
      value = (value === 1 || value === true) ? 'Yes' : 'No';
    } else if (param.ItemType === 'DAT' && value) {
      value = formatDate(value);
    } else if (typeof value === 'string' && value.includes(' 00:00:00')) {
      value = formatDate(value);
    }
    
    return {
      caption: paramCaption,
      value: value || 'All'
    };
  });
};
