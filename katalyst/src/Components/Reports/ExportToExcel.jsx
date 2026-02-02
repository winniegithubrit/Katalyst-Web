import ExcelJS from 'exceljs';
import { 
  generateFilename, 
  formatDate, 
  getUserInfo, 
  formatCurrency,
  groupBalanceSheetData,
  groupProfitLossData,
  addStandardExcelHeader,
  processPortfolioAtRiskDataForExport,
  processSavingsDataForExport,
  processExpectedRepaymentsDataForExport,
  processSavingsVsLoanBalanceDataForExport,
  processLoansDisbursedDataForExport,
  processLoanAgeingDataForExport,
  processLoanArrearsDetailedDataForExport,
  getAllParametersForReport,
  getBranchName
} from './ExportUtility';
export const exportTableToExcel = async (data, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report Data');
    
    const headers = Object.keys(data[0] || {});
    const userInfo = getUserInfo();
    let currentRow = addStandardExcelHeader(worksheet, companyName, reportName, selectedBranch, submittedFilters, 12);

    const headerRow = worksheet.getRow(currentRow);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    currentRow++;
    
    // Add data rows
    data.forEach((row) => {
      const dataRow = worksheet.getRow(currentRow);
      headers.forEach((header, index) => {
        const cell = dataRow.getCell(index + 1);
        let value = row[header];
        
        // Format dates
        if (header.toLowerCase().includes('date') && value) {
          value = formatDate(value);
        }
        
        cell.value = value;
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      currentRow++;
    });
    worksheet.columns = headers.map(header => ({
      width: Math.max(header.length, 15)
    }));
    
    // Add footer
    currentRow += 2;
    worksheet.getRow(currentRow).getCell(1).value = `Printed on: ${userInfo.date}`;
    currentRow++;
    worksheet.getRow(currentRow).getCell(1).value = `Printed by: ${userInfo.name}`;
    
    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFilename(reportName, 'xlsx');
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log('Excel export successful');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};
export const exportTrialBalanceToExcel = async (processedData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Trial Balance');
    
    const userInfo = getUserInfo();
    let currentRow = addStandardExcelHeader(worksheet, companyName, reportName, selectedBranch, submittedFilters, 8);
    const headerRow1 = worksheet.getRow(currentRow);
    headerRow1.getCell(1).value = 'Account';
    headerRow1.getCell(2).value = 'Description';
    headerRow1.getCell(3).value = 'INITIAL BALANCE';
    worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
    headerRow1.getCell(5).value = 'MOVEMENT';
    worksheet.mergeCells(`E${currentRow}:F${currentRow}`);
    headerRow1.getCell(7).value = 'BALANCE';
    worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
  
    [1, 2, 3, 5, 7].forEach(col => {
      headerRow1.getCell(col).font = { bold: true };
      headerRow1.getCell(col).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      headerRow1.getCell(col).alignment = { horizontal: 'center' };
      headerRow1.getCell(col).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    currentRow++;
    const headerRow2 = worksheet.getRow(currentRow);
    const subHeaders = ['', '', 'OpeningDr', 'OpeningCr', 'Debit Amt', 'Credit Amt', 'ClosingDr', 'ClosingCr'];
    
    subHeaders.forEach((header, index) => {
      const cell = headerRow2.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center' };
    });
    
    currentRow++;
    const rows = processedData.rows || [];
    const totals = processedData.totals || {};
    
    rows.forEach((rowData) => {
      const row = worksheet.getRow(currentRow);
      
      row.getCell(1).value = rowData.accountId || '';
      row.getCell(2).value = rowData.description || '';
      row.getCell(3).value = rowData.openingDr || 0;
      row.getCell(4).value = rowData.openingCr || 0;
      row.getCell(5).value = rowData.debitAmt || 0;
      row.getCell(6).value = rowData.creditAmt || 0;
      row.getCell(7).value = rowData.closingDr || 0;
      row.getCell(8).value = rowData.closingCr || 0;
      
      for (let i = 3; i <= 8; i++) {
        row.getCell(i).numFmt = '#,##0.00';
        row.getCell(i).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
      row.getCell(1).border = row.getCell(2).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      currentRow++;
    });
    const totalsRow = worksheet.getRow(currentRow);
    totalsRow.getCell(1).value = 'TOTAL';
    totalsRow.getCell(1).font = { bold: true };
    totalsRow.getCell(2).value = '';
    totalsRow.getCell(3).value = totals.openingDr || 0;
    totalsRow.getCell(4).value = totals.openingCr || 0;
    totalsRow.getCell(5).value = totals.debitAmt || 0;
    totalsRow.getCell(6).value = totals.creditAmt || 0;
    totalsRow.getCell(7).value = totals.closingDr || 0;
    totalsRow.getCell(8).value = totals.closingCr || 0;
    for (let i = 3; i <= 8; i++) {
      totalsRow.getCell(i).numFmt = '#,##0.00';
      totalsRow.getCell(i).font = { bold: true };
      totalsRow.getCell(i).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      totalsRow.getCell(i).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
    worksheet.columns = [
      { width: 15 }, { width: 40 }, { width: 15 }, { width: 15 }, 
      { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }
    ];
    currentRow += 2;
    worksheet.getRow(currentRow).getCell(1).value = `Printed on: ${userInfo.date}`;
    currentRow++;
    worksheet.getRow(currentRow).getCell(1).value = `Printed by: ${userInfo.name}`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFilename(reportName, 'xlsx');
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log('Trial Balance Excel export successful');
  } catch (error) {
    console.error('Error exporting Trial Balance to Excel:', error);
    throw error;
  }
};
export const exportBalanceSheetToExcel = async (data, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Balance Sheet');
    
    const userInfo = getUserInfo();
    const groupedData = groupBalanceSheetData(data);
    
    if (!groupedData) {
      console.error('Failed to group balance sheet data');
      return;
    }
    let currentRow = addStandardExcelHeader(worksheet, companyName, reportName, selectedBranch, submittedFilters, 3);
    Object.entries(groupedData).forEach(([accountType, accountData]) => {
      const accountTypeRow = worksheet.getRow(currentRow);
      accountTypeRow.getCell(1).value = accountData.name;
      accountTypeRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      accountTypeRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF404040' }
      };
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      accountTypeRow.getCell(3).value = formatCurrency(accountData.total);
      accountTypeRow.getCell(3).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      accountTypeRow.getCell(3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF404040' }
      };
      accountTypeRow.getCell(3).alignment = { horizontal: 'right' };
      currentRow++;

      Object.entries(accountData.groups).forEach(([typeGroup, groupData]) => {
        const typeGroupRow = worksheet.getRow(currentRow);
        typeGroupRow.getCell(1).value = groupData.name;
        typeGroupRow.getCell(1).font = { bold: true, size: 10 };
        typeGroupRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        typeGroupRow.getCell(3).value = formatCurrency(groupData.total);
        typeGroupRow.getCell(3).font = { bold: true };
        typeGroupRow.getCell(3).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        typeGroupRow.getCell(3).alignment = { horizontal: 'right' };
        currentRow++;

        Object.entries(groupData.subGroups).forEach(([subAccountType, subGroupData]) => {
          const subGroupRow = worksheet.getRow(currentRow);
          subGroupRow.getCell(1).value = subGroupData.name;
          subGroupRow.getCell(1).font = { bold: true, size: 9 };
          subGroupRow.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F0F0' }
          };
          worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
          currentRow++;
          subGroupData.items.forEach(item => {
            const itemRow = worksheet.getRow(currentRow);
            itemRow.getCell(2).value = item.description;
            itemRow.getCell(3).value = item.localBalance;
            itemRow.getCell(3).numFmt = '#,##0.00';
            itemRow.getCell(3).alignment = { horizontal: 'right' };
            currentRow++;
          });
          const subTotalRow = worksheet.getRow(currentRow);
          subTotalRow.getCell(2).value = `Total ${subGroupData.name}`;
          subTotalRow.getCell(2).font = { bold: true };
          subTotalRow.getCell(2).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDCF0FF' }
          };
          subTotalRow.getCell(3).value = subGroupData.total;
          subTotalRow.getCell(3).numFmt = '#,##0.00';
          subTotalRow.getCell(3).font = { bold: true };
          subTotalRow.getCell(3).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDCF0FF' }
          };
          subTotalRow.getCell(3).alignment = { horizontal: 'right' };
          currentRow++;
        });

        currentRow++;
      });

      currentRow++;
    });
    worksheet.columns = [
      { width: 15 },
      { width: 50 },
      { width: 20 }
    ];
    currentRow += 2;
    worksheet.getRow(currentRow).getCell(1).value = `Printed on: ${userInfo.date}`;
    currentRow++;
    worksheet.getRow(currentRow).getCell(1).value = `Printed by: ${userInfo.name}`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFilename(reportName, 'xlsx');
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log('Balance Sheet Excel export successful');
  } catch (error) {
    console.error('Error exporting Balance Sheet to Excel:', error);
    throw error;
  }
};
export const exportProfitLossToExcel = async (data, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Profit & Loss');
    
    const userInfo = getUserInfo();
    const validFilters = getValidFilters(submittedFilters);
    const actualCompanyName = companyName || getCompanyName();
    const groupedData = groupProfitLossData(data);
    
    if (!groupedData) {
      console.error('Failed to group profit & loss data');
      return;
    }
    let currentRow = addStandardExcelHeader(worksheet, companyName, reportName, selectedBranch, submittedFilters, 3);
    const renderSection = (sectionData, title) => {
      const sectionRow = worksheet.getRow(currentRow);
      sectionRow.getCell(1).value = title;
      sectionRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      sectionRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF404040' }
      };
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      currentRow++;

      Object.entries(sectionData.sections).forEach(([typeKey, typeGroup]) => {
        const typeGroupRow = worksheet.getRow(currentRow);
        typeGroupRow.getCell(1).value = typeGroup.name.toUpperCase();
        typeGroupRow.getCell(1).font = { bold: true, size: 10 };
        typeGroupRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        currentRow++;

        Object.entries(typeGroup.subGroups).forEach(([subKey, subGroup]) => {
          const subGroupRow = worksheet.getRow(currentRow);
          subGroupRow.getCell(1).value = subGroup.name;
          subGroupRow.getCell(1).font = { bold: true, size: 9 };
          subGroupRow.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F0F0' }
          };
          worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
          currentRow++;
          subGroup.items.forEach(item => {
            const itemRow = worksheet.getRow(currentRow);
            itemRow.getCell(2).value = item.description;
            itemRow.getCell(3).value = item.balance;
            itemRow.getCell(3).numFmt = '#,##0.00';
            itemRow.getCell(3).alignment = { horizontal: 'right' };
            currentRow++;
          });
          const subTotalRow = worksheet.getRow(currentRow);
          subTotalRow.getCell(2).value = `TOTAL ${subGroup.name.toUpperCase()}`;
          subTotalRow.getCell(2).font = { bold: true };
          subTotalRow.getCell(2).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDCF0FF' }
          };
          subTotalRow.getCell(3).value = subGroup.total;
          subTotalRow.getCell(3).numFmt = '#,##0.00';
          subTotalRow.getCell(3).font = { bold: true };
          subTotalRow.getCell(3).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDCF0FF' }
          };
          subTotalRow.getCell(3).alignment = { horizontal: 'right' };
          currentRow++;
        });
        const typeTotalRow = worksheet.getRow(currentRow);
        typeTotalRow.getCell(1).value = `TOTAL ${typeGroup.name.toUpperCase()}`;
        typeTotalRow.getCell(1).font = { bold: true };
        typeTotalRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD0D0D0' }
        };
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        typeTotalRow.getCell(3).value = typeGroup.total;
        typeTotalRow.getCell(3).numFmt = '#,##0.00';
        typeTotalRow.getCell(3).font = { bold: true };
        typeTotalRow.getCell(3).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD0D0D0' }
        };
        typeTotalRow.getCell(3).alignment = { horizontal: 'right' };
        currentRow++;
      });
      const sectionTotalRow = worksheet.getRow(currentRow);
      sectionTotalRow.getCell(1).value = `TOTAL ${title}`;
      sectionTotalRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sectionTotalRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF606060' }
      };
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      sectionTotalRow.getCell(3).value = sectionData.total;
      sectionTotalRow.getCell(3).numFmt = '#,##0.00';
      sectionTotalRow.getCell(3).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sectionTotalRow.getCell(3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF606060' }
      };
      sectionTotalRow.getCell(3).alignment = { horizontal: 'right' };
      currentRow += 2;
    };

    renderSection(groupedData.income, 'INCOME');
    renderSection(groupedData.expense, 'EXPENSE');
    const netProfit = groupedData.income.total - groupedData.expense.total;
    const netProfitRow = worksheet.getRow(currentRow);
    netProfitRow.getCell(1).value = 'Net Profit / (Loss)';
    netProfitRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    netProfitRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF000000' }
    };
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    netProfitRow.getCell(3).value = netProfit;
    netProfitRow.getCell(3).numFmt = '#,##0.00';
    netProfitRow.getCell(3).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    netProfitRow.getCell(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF000000' }
    };
    netProfitRow.getCell(3).alignment = { horizontal: 'right' };
    worksheet.columns = [
      { width: 15 },
      { width: 50 },
      { width: 20 }
    ];
    currentRow += 3;
    worksheet.getRow(currentRow).getCell(1).value = `Printed on: ${userInfo.date}`;
    currentRow++;
    worksheet.getRow(currentRow).getCell(1).value = `Printed by: ${userInfo.name}`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFilename(reportName, 'xlsx');
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log('Profit & Loss Excel export successful');
  } catch (error) {
    console.error('Error exporting Profit & Loss to Excel:', error);
    throw error;
  }
};
export const exportAccountJournalToExcel = async (processedData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Account Journal');
    
    const userInfo = getUserInfo();
    let currentRow = addStandardExcelHeader(worksheet, companyName, reportName, selectedBranch, submittedFilters, 11);
    
    const grouped = processedData.grouped || {};
    
    Object.entries(grouped).forEach(([branchKey, branchData]) => {
      const branchRow = worksheet.getRow(currentRow);
      branchRow.getCell(1).value = branchData.branchName;
      branchRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      branchRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF404040' }
      };
      worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
      currentRow++;
      const headerRow = worksheet.getRow(currentRow);
      const headers = ['Batch ID', 'Serial ID', 'Branch', 'Date', 'GL Account', "Customer's Acc", 'GL Account Name', 'Description of Transaction', 'Debit', 'Credit', 'Customer Name', 'Created By'];
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, size: 9 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      currentRow++;
      branchData.transactions.forEach(transaction => {
        const row = worksheet.getRow(currentRow);
                
        row.getCell(1).value = transaction.TrxBatchID || '';
        row.getCell(2).value = transaction.SerialID || '';
        row.getCell(3).value = transaction.TrxBranchID || '';
        row.getCell(4).value = formatDate(transaction.TrxDate);
        row.getCell(5).value = transaction.GLAccountID || '';
        row.getCell(6).value = transaction.CustomerAccountID || '';
        row.getCell(7).value = transaction.GLAccountName || '';
        row.getCell(8).value = transaction.TrxDescription || '';
        row.getCell(9).value = transaction.Debit || 0;
        row.getCell(10).value = transaction.Credit || 0;
        row.getCell(11).value = transaction.CustomerName || '';
        row.getCell(12).value = transaction.CreatedBy || '';
        row.getCell(8).numFmt = '#,##0.00';
        row.getCell(9).numFmt = '#,##0.00';
        for (let i = 1; i <= 11; i++) {
          row.getCell(i).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'dotted' },
            right: { style: 'thin' }
          };
        }
        
        currentRow++;
      });
      
      currentRow++; 
    });
    worksheet.columns = [
      { width: 12 }, 
      { width: 10 }, 
      { width: 15 }, 
      { width: 18 },
      { width: 18 },
      { width: 25 },
      { width: 35 },
      { width: 15 },
      { width: 15 },
      { width: 25 },
      { width: 15 } 
    ];
    currentRow += 2;
    worksheet.getRow(currentRow).getCell(1).value = `Printed on: ${userInfo.date}`;
    currentRow++;
    worksheet.getRow(currentRow).getCell(1).value = `Printed by: ${userInfo.name}`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFilename(reportName, 'xlsx');
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log('Account Journal Excel export successful');
  } catch (error) {
    console.error('Error exporting Account Journal to Excel:', error);
    throw error;
  }
};
export const exportGeneralLedgerToExcel = async (processedData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!processedData || !processedData.accounts) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('General Ledger');
    const userInfo = getUserInfo();
    let currentRow = addStandardExcelHeader(worksheet, companyName, reportName, selectedBranch, submittedFilters, 9);
    const headerRow1 = worksheet.getRow(currentRow);
    headerRow1.getCell(1).value = 'TRX DATE';
    headerRow1.getCell(2).value = 'SERIALID';
    headerRow1.getCell(3).value = 'DESCRIPTION';
    headerRow1.getCell(4).value = 'TRANSACTIONS';
    worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
    headerRow1.getCell(6).value = 'CUMULATED';
    worksheet.mergeCells(`F${currentRow}:G${currentRow}`);
    headerRow1.getCell(8).value = 'CLOSING BALANCE';
    worksheet.mergeCells(`H${currentRow}:I${currentRow}`);
    headerRow1.getCell(10).value = 'THIRD PARTY ACCOUNT';
  
    [1, 2, 3, 4, 6, 8, 10].forEach(col => {
      headerRow1.getCell(col).font = { bold: true };
      headerRow1.getCell(col).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      headerRow1.getCell(col).alignment = { horizontal: 'center' };
      headerRow1.getCell(col).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    currentRow++;
    const headerRow2 = worksheet.getRow(currentRow);
    const subHeaders = ['', '', '', 'DEBIT', 'CREDIT', 'DEBIT', 'CREDIT', 'DEBIT', 'CREDIT', ''];
    
    subHeaders.forEach((header, index) => {
      const cell = headerRow2.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center' };
    });
    
    currentRow++;
    processedData.accounts.forEach((account) => {
      account.transactions.forEach((transaction) => {
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = formatDate(transaction.TrxDate);
        row.getCell(2).value = transaction.SerialID || '';
        row.getCell(3).value = transaction.TrxDescription || '';
        row.getCell(4).value = transaction.Debit || transaction.DebitAmount || 0;
        row.getCell(5).value = transaction.Credit || transaction.CreditAmount || 0;
        row.getCell(6).value = transaction.CumulativeDr || 0;
        row.getCell(7).value = transaction.CumulativeCr || 0;
        row.getCell(8).value = transaction.ClosingDr || 0;
        row.getCell(9).value = transaction.ClosingCr || 0;
        row.getCell(10).value = transaction.ThirdPartyAcct || transaction.CustomerAccountID || '';
        for (let i = 4; i <= 9; i++) {
          row.getCell(i).numFmt = '#,##0.00';
          row.getCell(i).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
        [1, 2, 3, 10].forEach(i => {
          row.getCell(i).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
        currentRow++;
      });
      currentRow += 1;
    });
    worksheet.columns = [
      { width: 12 },
      { width: 10 },
      { width: 40 },
      { width: 15 },
      { width: 15 },
      { width: 15 }, 
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 20 } 
    ];
    currentRow += 2;
    worksheet.getRow(currentRow).getCell(1).value = `Printed on: ${userInfo.date}`;
    currentRow++;
    worksheet.getRow(currentRow).getCell(1).value = `Printed by: ${userInfo.name}`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFilename(reportName, 'xlsx');
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log('General Ledger Excel export successful');
  } catch (error) {
    console.error('Error exporting General Ledger to Excel:', error);
    throw error;
  }
};
export const exportSavingsStatementToExcel = async (exportData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (Array.isArray(exportData)) {
    const processedData = processSavingsDataForExport(exportData);
    return await exportProcessedSavingsData(processedData, reportName, companyName, selectedBranch, submittedFilters);
  }
  if (exportData && (exportData.accountInfo || exportData.transactions || exportData.rawData)) {
    return await exportProcessedSavingsData(exportData, reportName, companyName, selectedBranch, submittedFilters);
  }
  return;
};
const exportProcessedSavingsData = async (processedData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Savings Statement');
    
    const userInfo = getUserInfo();
    const { accountInfo, transactions } = processedData;
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
    let currentRow = addStandardExcelHeader(
      worksheet, 
      companyName, 
      'Savings Account Statement', 
      null,
      submittedFilters, 
      7
    );
    currentRow += 1;
    const detailsData = [
      { 
        col1Label: 'Account Number', 
        col1Value: accountInfo.accountNumber, 
        col2Label: 'Account Name :', 
        col2Value: accountInfo.productName || accountInfo.accountName,
        col3Label: 'Account Owner :',
        col3Value: accountInfo.accountName.toUpperCase()
      },
      { 
        col1Label: 'Account Currency:', 
        col1Value: accountInfo.accountCurrency, 
        col2Label: 'Opening Balance:', 
        col2Value: formatCurrency(accountInfo.openingBalance),
        col3Label: 'Available Balance :',
        col3Value: formatCurrency(accountInfo.availableBalance)
      },
      { 
        col1Label: 'Freezed Amount :', 
        col1Value: formatCurrency(accountInfo.freezedAmount), 
        col2Label: 'Uncleared Balance :', 
        col2Value: formatCurrency(accountInfo.unclearedBalance),
        col3Label: 'Transactions Done :',
        col3Value: accountInfo.transactionsDone
      }
    ];

    detailsData.forEach((rowData) => {
      const row = worksheet.getRow(currentRow);
      
      if (rowData.col1Label) {
        row.getCell(1).value = rowData.col1Label;
        row.getCell(1).font = { bold: true, size: 9 };
      }
      if (rowData.col1Value) {
        row.getCell(2).value = rowData.col1Value;
        row.getCell(2).font = { size: 9 };
      }
      
      if (rowData.col2Label) {
        row.getCell(3).value = rowData.col2Label;
        row.getCell(3).font = { bold: true, size: 9 };
      }
      if (rowData.col2Value !== undefined && rowData.col2Value !== '') {
        row.getCell(4).value = rowData.col2Value;
        row.getCell(4).font = { size: 9 };
      }
      
      if (rowData.col3Label) {
        row.getCell(5).value = rowData.col3Label;
        row.getCell(5).font = { bold: true, size: 9 };
      }
      if (rowData.col3Value !== undefined && rowData.col3Value !== '') {
        row.getCell(6).value = rowData.col3Value;
        row.getCell(6).font = { size: 9 };
      }
      
      for (let i = 1; i <= 7; i++) {
        row.getCell(i).border = {
          top: { style: 'dotted', color: { argb: 'FFC0C0C0' } },
          left: { style: 'thin', color: { argb: 'FFC0C0C0' } },
          bottom: { style: 'dotted', color: { argb: 'FFC0C0C0' } },
          right: { style: 'thin', color: { argb: 'FFC0C0C0' } }
        };
      }
      
      currentRow++;
    });
    
    currentRow += 1;
    const statementHeaderRow = worksheet.getRow(currentRow);
    statementHeaderRow.getCell(4).value = 'Savings Account Statement';
    statementHeaderRow.getCell(4).font = { bold: true, size: 10 };
    statementHeaderRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow += 1;
    const headerRow = worksheet.getRow(currentRow);
    const headers = ['Trx.Date', 'Trx.Time', 'Description', 'Debit', 'Credit', 'Running Balance', 'Trx.Type'];
    
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 9 };
      cell.fill = { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: 'FFE0E0E0' } 
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    currentRow++;
    transactions.forEach((transaction) => {
      const row = worksheet.getRow(currentRow);
      
      row.getCell(1).value = formatDate(transaction.trxDate);
      row.getCell(1).alignment = { horizontal: 'center' };
      
      row.getCell(2).value = new Date(transaction.trxTime).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
      row.getCell(2).alignment = { horizontal: 'center' };
      
      row.getCell(3).value = transaction.description;
      row.getCell(3).alignment = { horizontal: 'left' };
      if (transaction.debit > 0) {
        row.getCell(4).value = `(${formatCurrency(transaction.debit)})`;
      } else {
        row.getCell(4).value = '';
      }
      row.getCell(4).alignment = { horizontal: 'right' };
      if (transaction.credit > 0) {
        row.getCell(5).value = formatCurrency(transaction.credit);
      } else {
        row.getCell(5).value = '';
      }
      row.getCell(5).alignment = { horizontal: 'right' };
      
      row.getCell(6).value = formatCurrency(transaction.runningBalance);
      row.getCell(6).alignment = { horizontal: 'right' };
      
      row.getCell(7).value = transaction.trxType;
      row.getCell(7).alignment = { horizontal: 'center' };
      for (let i = 1; i <= 7; i++) {
        row.getCell(i).border = {
          top: { style: 'dotted', color: { argb: 'FFC0C0C0' } },
          left: { style: 'thin' },
          bottom: { style: 'dotted', color: { argb: 'FFC0C0C0' } },
          right: { style: 'thin' }
        };
        row.getCell(i).font = { size: 8 };
      }
      
      currentRow++;
    });
    worksheet.columns = [
      { width: 12 }, 
      { width: 12 }, 
      { width: 50 },
      { width: 18 },  
      { width: 18 },  
      { width: 20 }, 
      { width: 15 } 
    ];
    currentRow += 2;
    worksheet.getRow(currentRow).getCell(1).value = `Printed on: ${userInfo.date}`;
    worksheet.getRow(currentRow).getCell(1).font = { size: 9 };
    currentRow++;
    worksheet.getRow(currentRow).getCell(1).value = `Printed by: ${userInfo.name}`;
    worksheet.getRow(currentRow).getCell(1).font = { size: 9 };
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFilename(reportName, 'xlsx');
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log('Savings Statement Excel export successful');
  } catch (error) {
    console.error('Error exporting Savings Statement to Excel:', error);
    throw error;
  }
};

export const exportPortfolioAtRiskToExcel = async (exportData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (exportData && exportData.branches) {
    return await exportProcessedPortfolioAtRiskData(exportData, reportName, companyName, selectedBranch, submittedFilters);
  }
  if (Array.isArray(exportData)) {
    const processedData = processPortfolioAtRiskDataForExport(exportData);
    return await exportProcessedPortfolioAtRiskData(processedData, reportName, companyName, selectedBranch, submittedFilters);
  }
  
  return;
};

const exportProcessedPortfolioAtRiskData = async (processedData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Portfolio at Risk');
    
    const userInfo = getUserInfo();
    const { branches } = processedData;
    
    let currentRow = addStandardExcelHeader(
      worksheet, 
      companyName, 
      reportName, 
      selectedBranch,
      submittedFilters, 
      15 
    );
    currentRow++;
    const headers = [
      'Account ID', 'Account Name', 'Days', 'Loan Amount', 'OS Principal', 'OS Interest', 
      'Total Outstanding', 'Portfolio at Risk(PAR)', 'Principal Paid', 'Total Paid', 
      'Principal', 'Interest', 'Total', 'Rate', '%PAR'
    ];
    
    const headerRow = worksheet.getRow(currentRow);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 9 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    currentRow++;
    branches.forEach((branch) => {
      const branchRow = worksheet.getRow(currentRow);
      branchRow.getCell(1).value = `Branch Name: ${branch.branchName}`;
      branchRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' }, underline: true };
      branchRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF404040' }
      };
      worksheet.mergeCells(`A${currentRow}:O${currentRow}`);
      currentRow++;
      
      branch.officers.forEach((officer) => {
        const officerRow = worksheet.getRow(currentRow);
        officerRow.getCell(1).value = `Loan Officer: ${officer.officerName}`;
        officerRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, underline: true };
        officerRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF606060' }
        };
        worksheet.mergeCells(`A${currentRow}:O${currentRow}`);
        currentRow++;
        
        let officerTotals = {
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
        
        officer.records.forEach((record) => {
          const totalOutstanding = (record.OSPrinciple || 0) + (record.OSInterest || 0);
          const portfolioAtRisk = record.OSPrinciple || 0;
          const arrearsTotal = (record.ArrearsPrinciple || 0) + (record.ArrearsInterest || 0);
          
          officerTotals.count++;
          officerTotals.disbAmt += parseFloat(record.DisbAmt || 0);
          officerTotals.osPrinciple += parseFloat(record.OSPrinciple || 0);
          officerTotals.osInterest += parseFloat(record.OSInterest || 0);
          officerTotals.totalOutstanding += totalOutstanding;
          officerTotals.portfolioAtRisk += portfolioAtRisk;
          officerTotals.principalPaid += parseFloat(record.PrincipalPaid || 0);
          officerTotals.totalPaid += parseFloat(record.TotalPaid || 0);
          officerTotals.arrearsPrinciple += parseFloat(record.ArrearsPrinciple || 0);
          officerTotals.arrearsInterest += parseFloat(record.ArrearsInterest || 0);
          officerTotals.arrearsTotal += arrearsTotal;
          
          const dataRow = worksheet.getRow(currentRow);
          
          dataRow.getCell(1).value = record.AccountID || '';
          dataRow.getCell(2).value = record.AccountName || '';
          dataRow.getCell(3).value = record.ArrearsDays || 0;
          dataRow.getCell(4).value = record.DisbAmt || 0;
          dataRow.getCell(5).value = record.OSPrinciple || 0;
          dataRow.getCell(6).value = record.OSInterest || 0;
          dataRow.getCell(7).value = totalOutstanding;
          dataRow.getCell(8).value = portfolioAtRisk;
          dataRow.getCell(9).value = record.PrincipalPaid || 0;
          dataRow.getCell(10).value = record.TotalPaid || 0;
          dataRow.getCell(11).value = record.ArrearsPrinciple || 0;
          dataRow.getCell(12).value = record.ArrearsInterest || 0;
          dataRow.getCell(13).value = arrearsTotal;
          dataRow.getCell(14).value = record.PARpercentage || 0;
          dataRow.getCell(15).value = record.PARpercentage || 0;
          for (let i = 4; i <= 13; i++) {
            dataRow.getCell(i).numFmt = '#,##0.00';
            dataRow.getCell(i).alignment = { horizontal: 'right' };
          }
          dataRow.getCell(14).numFmt = '0.00';
          dataRow.getCell(14).alignment = { horizontal: 'right' };
          dataRow.getCell(15).numFmt = '0.00';
          dataRow.getCell(15).alignment = { horizontal: 'right' };
          for (let i = 1; i <= 15; i++) {
            dataRow.getCell(i).border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          }
          
          currentRow++;
        });
        
        const totalsRow = worksheet.getRow(currentRow);
        totalsRow.getCell(1).value = 'Total By Loan Officer';
        totalsRow.getCell(1).font = { bold: true };
        totalsRow.getCell(2).value = '';
        totalsRow.getCell(3).value = officerTotals.count;
        totalsRow.getCell(4).value = officerTotals.disbAmt;
        totalsRow.getCell(5).value = officerTotals.osPrinciple;
        totalsRow.getCell(6).value = officerTotals.osInterest;
        totalsRow.getCell(7).value = officerTotals.totalOutstanding;
        totalsRow.getCell(8).value = officerTotals.portfolioAtRisk;
        totalsRow.getCell(9).value = officerTotals.principalPaid;
        totalsRow.getCell(10).value = officerTotals.totalPaid;
        totalsRow.getCell(11).value = officerTotals.arrearsPrinciple;
        totalsRow.getCell(12).value = officerTotals.arrearsInterest;
        totalsRow.getCell(13).value = officerTotals.arrearsTotal;
        totalsRow.getCell(14).value = '-';
        totalsRow.getCell(15).value = '-';
        
        for (let i = 4; i <= 13; i++) {
          totalsRow.getCell(i).numFmt = '#,##0.00';
          totalsRow.getCell(i).font = { bold: true };
          totalsRow.getCell(i).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          totalsRow.getCell(i).alignment = { horizontal: 'right' };
        }
        for (let i = 1; i <= 15; i++) {
          totalsRow.getCell(i).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
        currentRow += 2;
      });
      
      const branchTotalsRow = worksheet.getRow(currentRow);
      branchTotalsRow.getCell(1).value = 'Total By Branch';
      branchTotalsRow.getCell(1).font = { bold: true };
      branchTotalsRow.getCell(2).value = '';
      branchTotalsRow.getCell(3).value = branch.totals.count;
      branchTotalsRow.getCell(4).value = branch.totals.disbAmt;
      branchTotalsRow.getCell(5).value = branch.totals.osPrinciple;
      branchTotalsRow.getCell(6).value = branch.totals.osInterest;
      branchTotalsRow.getCell(7).value = branch.totals.totalOutstanding;
      branchTotalsRow.getCell(8).value = branch.totals.portfolioAtRisk;
      branchTotalsRow.getCell(9).value = branch.totals.principalPaid;
      branchTotalsRow.getCell(10).value = branch.totals.totalPaid;
      branchTotalsRow.getCell(11).value = branch.totals.arrearsPrinciple;
      branchTotalsRow.getCell(12).value = branch.totals.arrearsInterest;
      branchTotalsRow.getCell(13).value = branch.totals.arrearsTotal;
      branchTotalsRow.getCell(14).value = '-';
      branchTotalsRow.getCell(15).value = '-';
      
      for (let i = 4; i <= 13; i++) {
        branchTotalsRow.getCell(i).numFmt = '#,##0.00';
        branchTotalsRow.getCell(i).font = { bold: true };
        branchTotalsRow.getCell(i).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFADD8E6' }
        };
        branchTotalsRow.getCell(i).alignment = { horizontal: 'right' };
      }
      for (let i = 1; i <= 15; i++) {
        branchTotalsRow.getCell(i).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
      currentRow += 2;
    });
    worksheet.columns = [
      { width: 15 }, { width: 25 }, { width: 10 }, { width: 15 }, { width: 15 },
      { width: 15 }, { width: 15 }, { width: 20 }, { width: 15 }, { width: 15 },
      { width: 15 }, { width: 15 }, { width: 15 }, { width: 10 }, { width: 10 }
    ];
    currentRow += 2;
    worksheet.getRow(currentRow).getCell(1).value = `Printed on: ${userInfo.date}`;
    worksheet.getRow(currentRow).getCell(1).font = { size: 9 };
    currentRow++;
    worksheet.getRow(currentRow).getCell(1).value = `Printed by: ${userInfo.name}`;
    worksheet.getRow(currentRow).getCell(1).font = { size: 9 };
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFilename(reportName, 'xlsx');
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log('Portfolio at Risk Excel export successful');
  } catch (error) {
    console.error('Error exporting Portfolio at Risk to Excel:', error);
    throw error;
  }
};

export const exportExpectedRepaymentsToExcel = async (exportData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (exportData && exportData.branches) {
    return await exportProcessedExpectedRepaymentsData(exportData, reportName, companyName, selectedBranch, submittedFilters);
  }
  if (Array.isArray(exportData)) {
    const processedData = processExpectedRepaymentsDataForExport(exportData);
    return await exportProcessedExpectedRepaymentsData(processedData, reportName, companyName, selectedBranch, submittedFilters);
  }
  
  return;
};

const exportProcessedExpectedRepaymentsData = async (processedData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expected Repayments');
    
    const userInfo = getUserInfo();
    const { branches } = processedData;
    
    let currentRow = addStandardExcelHeader(
      worksheet, 
      companyName, 
      reportName, 
      selectedBranch,
      submittedFilters, 
      8 
    );
    currentRow++;
    const headers = [
      'AccountID', 'Name', 'Mobile', 'PrincipalBal', 'Principal Due', 
      'Interest Due', 'PenaltyDue', 'Total Due'
    ];
    
    const headerRow = worksheet.getRow(currentRow);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 9 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    currentRow++;
    
    branches.forEach((branch) => {
      const branchRow = worksheet.getRow(currentRow);
      branchRow.getCell(1).value = `Branch Name: ${branch.branchName}`;
      branchRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' }, underline: true };
      branchRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF404040' }
      };
      worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
      currentRow++;
      
      branch.officers.forEach((officer) => {
        const officerRow = worksheet.getRow(currentRow);
        officerRow.getCell(1).value = `Loan Officer: ${officer.officerName}`;
        officerRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, underline: true };
        officerRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF606060' }
        };
        worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
        currentRow++;
        
        let officerTotals = {
          count: 0,
          principalBal: 0,
          principalDue: 0,
          interestDue: 0,
          penaltyDue: 0,
          totalDue: 0
        };
        
        officer.records.forEach((record) => {
          const principalDue = parseFloat(record.PrincipalOverDueClosing || 0);
          const interestDue = parseFloat(record.InterestOverDueClosing || 0);
          const totalDue = principalDue + interestDue;
          
          officerTotals.count++;
          officerTotals.principalBal += parseFloat(record.PrincipalOutstanding || 0);
          officerTotals.principalDue += principalDue;
          officerTotals.interestDue += interestDue;
          officerTotals.penaltyDue += parseFloat(record.PenaltyDue || 0);
          officerTotals.totalDue += totalDue;
          
          const dataRow = worksheet.getRow(currentRow);
          
          dataRow.getCell(1).value = record.AccountID || '';
          dataRow.getCell(2).value = record.Name || '';
          dataRow.getCell(3).value = record.Mobile || '';
          dataRow.getCell(4).value = record.PrincipalOutstanding || 0;
          dataRow.getCell(5).value = principalDue;
          dataRow.getCell(6).value = interestDue;
          dataRow.getCell(7).value = record.PenaltyDue || 0;
          dataRow.getCell(8).value = totalDue;
          
          for (let i = 4; i <= 8; i++) {
            dataRow.getCell(i).numFmt = '#,##0.00';
            dataRow.getCell(i).alignment = { horizontal: 'right' };
          }
          
          for (let i = 1; i <= 8; i++) {
            dataRow.getCell(i).border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          }
          
          currentRow++;
        });
        
        const totalsRow = worksheet.getRow(currentRow);
        totalsRow.getCell(1).value = 'Total By Loan Officer';
        totalsRow.getCell(1).font = { bold: true };
        totalsRow.getCell(2).value = '';
        totalsRow.getCell(3).value = officerTotals.count;
        totalsRow.getCell(4).value = officerTotals.principalBal;
        totalsRow.getCell(5).value = officerTotals.principalDue;
        totalsRow.getCell(6).value = officerTotals.interestDue;
        totalsRow.getCell(7).value = officerTotals.penaltyDue;
        totalsRow.getCell(8).value = officerTotals.totalDue;
        
        for (let i = 4; i <= 8; i++) {
          totalsRow.getCell(i).numFmt = '#,##0.00';
          totalsRow.getCell(i).font = { bold: true };
          totalsRow.getCell(i).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          totalsRow.getCell(i).alignment = { horizontal: 'right' };
        }
        for (let i = 1; i <= 8; i++) {
          totalsRow.getCell(i).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
        currentRow += 2;
      });
      
      const branchTotalsRow = worksheet.getRow(currentRow);
      branchTotalsRow.getCell(1).value = 'Total By Branch';
      branchTotalsRow.getCell(1).font = { bold: true };
      branchTotalsRow.getCell(2).value = '';
      branchTotalsRow.getCell(3).value = branch.totals.count;
      branchTotalsRow.getCell(4).value = branch.totals.principalBal;
      branchTotalsRow.getCell(5).value = branch.totals.principalDue;
      branchTotalsRow.getCell(6).value = branch.totals.interestDue;
      branchTotalsRow.getCell(7).value = branch.totals.penaltyDue;
      branchTotalsRow.getCell(8).value = branch.totals.totalDue;
      
      for (let i = 4; i <= 8; i++) {
        branchTotalsRow.getCell(i).numFmt = '#,##0.00';
        branchTotalsRow.getCell(i).font = { bold: true };
        branchTotalsRow.getCell(i).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFADD8E6' }
        };
        branchTotalsRow.getCell(i).alignment = { horizontal: 'right' };
      }
      for (let i = 1; i <= 8; i++) {
        branchTotalsRow.getCell(i).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
      currentRow += 2;
    });
    
    worksheet.columns = [
      { width: 15 }, { width: 30 }, { width: 15 }, { width: 18 },
      { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }
    ];
    currentRow += 2;
    worksheet.getRow(currentRow).getCell(1).value = `Printed on: ${userInfo.date}`;
    worksheet.getRow(currentRow).getCell(1).font = { size: 9 };
    currentRow++;
    worksheet.getRow(currentRow).getCell(1).value = `Printed by: ${userInfo.name}`;
    worksheet.getRow(currentRow).getCell(1).font = { size: 9 };
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFilename(reportName, 'xlsx');
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log('Expected Repayments Excel export successful');
  } catch (error) {
    console.error('Error exporting Expected Repayments to Excel:', error);
    throw error;
  }
};

export const exportSavingsVsLoanBalanceToExcel = async (exportData, reportName, companyName, selectedBranch, submittedFilters, reportData = null, reportId = null) => {
  if (exportData && exportData.branches) {
    return await exportProcessedSavingsVsLoanBalanceData(exportData, reportName, companyName, selectedBranch, submittedFilters, reportData, reportId);
  }
  if (Array.isArray(exportData)) {
    const processedData = processSavingsVsLoanBalanceDataForExport(exportData);
    return await exportProcessedSavingsVsLoanBalanceData(processedData, reportName, companyName, selectedBranch, submittedFilters, reportData, reportId);
  }
  return;
};

const exportProcessedSavingsVsLoanBalanceData = async (processedData, reportName, companyName, selectedBranch, submittedFilters, reportData = null, reportId = null) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Savings vs Loan Balance');
    
    const userInfo = getUserInfo();
    const { branches } = processedData;
    
    let currentRow = addStandardExcelHeader(
      worksheet, 
      companyName, 
      reportName, 
      selectedBranch,
      {}, 
      9 
    );
    
    if (reportData && reportId) {
      const allParams = getAllParametersForReport(reportData, reportId, submittedFilters);
      if (allParams.length > 0) {
        const paramParts = allParams.map(p => `${p.caption}-${p.value}`);
        const paramLine = paramParts.join('  ');
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = paramLine;
        row.getCell(1).font = { bold: false, size: 10 };
        row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        currentRow++;
      }
    }
    
    currentRow++;
    const headers = [
      'Loan A/C', 'Name', 'Mobile', 'Out Principle', 'PrincipalDue', 
      'InterestDue', 'Penalty&Sms', 'Avl. Bal', 'Total Due'
    ];
    
    const headerRow = worksheet.getRow(currentRow);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 9 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    currentRow++;
    
    branches.forEach((branch) => {
      const branchRow = worksheet.getRow(currentRow);
      branchRow.getCell(1).value = `Branch Name: ${branch.branchName}`;
      branchRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' }, underline: true };
      branchRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF404040' }
      };
      worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
      currentRow++;
      
      branch.officers.forEach((officer) => {
        const officerRow = worksheet.getRow(currentRow);
        officerRow.getCell(1).value = `Loan Officer: ${officer.officerName}`;
        officerRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, underline: true };
        officerRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF606060' }
        };
        worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
        currentRow++;
        
        let officerTotals = {
          count: 0,
          outPrinciple: 0,
          principalDue: 0,
          interestDue: 0,
          penaltySms: 0,
          avlBal: 0,
          totalDue: 0
        };
        
        officer.records.forEach((record) => {
          officerTotals.count++;
          officerTotals.outPrinciple += parseFloat(record.OutTPrincipal || 0);
          officerTotals.principalDue += parseFloat(record.PrinDueToDate || 0);
          officerTotals.interestDue += parseFloat(record.IntDueToDate || 0);
          officerTotals.penaltySms += parseFloat(record.PenaltyAmount || 0);
          officerTotals.avlBal += parseFloat(record.AvailableBalance || 0);
          officerTotals.totalDue += parseFloat(record.TotDueToDate || 0);
          
          const dataRow = worksheet.getRow(currentRow);
          
          dataRow.getCell(1).value = record['Loan A/C'] || record.AccountID || '';
          dataRow.getCell(2).value = record.Name || '';
          dataRow.getCell(3).value = record.Mobile || '';
          dataRow.getCell(4).value = record.OutTPrincipal || 0;
          dataRow.getCell(5).value = record.PrinDueToDate || 0;
          dataRow.getCell(6).value = record.IntDueToDate || 0;
          dataRow.getCell(7).value = record.PenaltyAmount || 0;
          dataRow.getCell(8).value = record.AvailableBalance || 0;
          dataRow.getCell(9).value = record.TotDueToDate || 0;
          
          for (let i = 4; i <= 9; i++) {
            dataRow.getCell(i).numFmt = '#,##0.00';
            dataRow.getCell(i).alignment = { horizontal: 'right' };
          }
          
          for (let i = 1; i <= 9; i++) {
            dataRow.getCell(i).border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          }
          
          currentRow++;
        });
        
        const totalsRow = worksheet.getRow(currentRow);
        totalsRow.getCell(1).value = 'Total By Loan Officer';
        totalsRow.getCell(1).font = { bold: true };
        totalsRow.getCell(2).value = '';
        totalsRow.getCell(3).value = officerTotals.count;
        totalsRow.getCell(4).value = officerTotals.outPrinciple;
        totalsRow.getCell(5).value = officerTotals.principalDue;
        totalsRow.getCell(6).value = officerTotals.interestDue;
        totalsRow.getCell(7).value = officerTotals.penaltySms;
        totalsRow.getCell(8).value = officerTotals.avlBal;
        totalsRow.getCell(9).value = officerTotals.totalDue;
        
        for (let i = 4; i <= 9; i++) {
          totalsRow.getCell(i).numFmt = '#,##0.00';
          totalsRow.getCell(i).font = { bold: true };
          totalsRow.getCell(i).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          totalsRow.getCell(i).alignment = { horizontal: 'right' };
        }
        for (let i = 1; i <= 9; i++) {
          totalsRow.getCell(i).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
        currentRow += 2;
      });
      
      const branchTotalsRow = worksheet.getRow(currentRow);
      branchTotalsRow.getCell(1).value = 'Total By Branch';
      branchTotalsRow.getCell(1).font = { bold: true };
      branchTotalsRow.getCell(2).value = '';
      branchTotalsRow.getCell(3).value = branch.totals.count;
      branchTotalsRow.getCell(4).value = branch.totals.outPrinciple;
      branchTotalsRow.getCell(5).value = branch.totals.principalDue;
      branchTotalsRow.getCell(6).value = branch.totals.interestDue;
      branchTotalsRow.getCell(7).value = branch.totals.penaltySms;
      branchTotalsRow.getCell(8).value = branch.totals.avlBal;
      branchTotalsRow.getCell(9).value = branch.totals.totalDue;
      
      for (let i = 4; i <= 9; i++) {
        branchTotalsRow.getCell(i).numFmt = '#,##0.00';
        branchTotalsRow.getCell(i).font = { bold: true };
        branchTotalsRow.getCell(i).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFADD8E6' }
        };
        branchTotalsRow.getCell(i).alignment = { horizontal: 'right' };
      }
      for (let i = 1; i <= 9; i++) {
        branchTotalsRow.getCell(i).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
      currentRow += 2;
    });
    
    worksheet.columns = [
      { width: 20 }, { width: 35 }, { width: 20 }, { width: 20 },
      { width: 20 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 20 }
    ];
    currentRow += 2;
    worksheet.getRow(currentRow).getCell(1).value = `Printed on: ${userInfo.date}`;
    worksheet.getRow(currentRow).getCell(1).font = { size: 9 };
    currentRow++;
    worksheet.getRow(currentRow).getCell(1).value = `Printed by: ${userInfo.name}`;
    worksheet.getRow(currentRow).getCell(1).font = { size: 9 };
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFilename(reportName, 'xlsx');
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log('Savings vs Loan Balance Excel export successful');
  } catch (error) {
    console.error('Error exporting Savings vs Loan Balance to Excel:', error);
    throw error;
  }
};

export const exportLoansDisbursedToExcel = async (exportData, reportName, companyName, selectedBranch, submittedFilters, reportData = null, reportId = null) => {
  if (exportData && exportData.branches) {
    return await exportProcessedLoansDisbursedData(exportData, reportName, companyName, selectedBranch, submittedFilters, reportData, reportId);
  }
  if (Array.isArray(exportData)) {
    const processedData = processLoansDisbursedDataForExport(exportData);
    return await exportProcessedLoansDisbursedData(processedData, reportName, companyName, selectedBranch, submittedFilters, reportData, reportId);
  }
  return;
};

const exportProcessedLoansDisbursedData = async (processedData, reportName, companyName, selectedBranch, submittedFilters, reportData = null, reportId = null) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Loans Disbursed');
    
    const userInfo = getUserInfo();
    const { branches } = processedData;
    
    let currentRow = addStandardExcelHeader(
      worksheet, 
      companyName, 
      reportName, 
      selectedBranch,
      {}, 
      12 
    );
    
    if (reportData && reportId) {
      const allParams = getAllParametersForReport(reportData, reportId, submittedFilters);
      if (allParams.length > 0) {
        const paramParts = allParams.map(p => `${p.caption}-${p.value}`);
        const paramLine = paramParts.join('  ');
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = paramLine;
        row.getCell(1).font = { bold: false, size: 10 };
        row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        currentRow++;
      }
    }
    
    currentRow++;
    const headers = [
      'Loan ID', 'Borrower', 'Date of Loan Disbursement', 'Maturity Date', 'Rate', 'Term', 
      'Repayment Period', 'Disbursement Amount', 'Interest Amount', 'Total Loan Amount', 
      'Principal Paid', 'Interest Paid'
    ];
    
    const headerRow = worksheet.getRow(currentRow);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 9 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    currentRow++;
    
    branches.forEach((branch) => {
      const branchRow = worksheet.getRow(currentRow);
      branchRow.getCell(1).value = `Branch Name: ${branch.branchName}`;
      branchRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' }, underline: true };
      branchRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF404040' }
      };
      worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
      currentRow++;
      
      branch.officers.forEach((officer) => {
        const officerRow = worksheet.getRow(currentRow);
        officerRow.getCell(1).value = `Loan Officer: ${officer.officerName}`;
        officerRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, underline: true };
        officerRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF606060' }
        };
        worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
        currentRow++;
        
        let officerTotals = {
          count: 0,
          disbursementAmount: 0,
          interestAmount: 0,
          totalLoanAmount: 0,
          principalPaid: 0,
          interestPaid: 0
        };
        
        officer.records.forEach((record) => {
          const disbursementAmount = parseFloat(record.DisbursementAmount || record.DisbAmt || 0);
          const interestAmount = parseFloat(record.InterestAmount || 0);
          const totalLoanAmount = disbursementAmount + interestAmount;
          
          officerTotals.count++;
          officerTotals.disbursementAmount += disbursementAmount;
          officerTotals.interestAmount += interestAmount;
          officerTotals.totalLoanAmount += totalLoanAmount;
          officerTotals.principalPaid += parseFloat(record.PrincipalPaid || 0);
          officerTotals.interestPaid += parseFloat(record.InterestPaid || 0);
          
          const dataRow = worksheet.getRow(currentRow);
          
          dataRow.getCell(1).value = record.AccountID || '';
          dataRow.getCell(2).value = record.Name || '';
          dataRow.getCell(3).value = record.DisbursementDate || '';
          dataRow.getCell(4).value = record.MaturityDate || '';
          dataRow.getCell(5).value = record.InterestRate || 0;
          dataRow.getCell(6).value = record.Term || 0;
          dataRow.getCell(7).value = record.RepaymentPeriod || '';
          dataRow.getCell(8).value = disbursementAmount;
          dataRow.getCell(9).value = interestAmount;
          dataRow.getCell(10).value = totalLoanAmount;
          dataRow.getCell(11).value = record.PrincipalPaid || 0;
          dataRow.getCell(12).value = record.InterestPaid || 0;
          
          for (let i = 8; i <= 12; i++) {
            dataRow.getCell(i).numFmt = '#,##0.00';
            dataRow.getCell(i).alignment = { horizontal: 'right' };
          }
          
          for (let i = 1; i <= 12; i++) {
            dataRow.getCell(i).border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          }
          
          currentRow++;
        });
        
        const totalsRow = worksheet.getRow(currentRow);
        totalsRow.getCell(1).value = 'Total By Loan Officer';
        totalsRow.getCell(1).font = { bold: true };
        totalsRow.getCell(2).value = '';
        totalsRow.getCell(3).value = '';
        totalsRow.getCell(4).value = '';
        totalsRow.getCell(5).value = '';
        totalsRow.getCell(6).value = '';
        totalsRow.getCell(7).value = officerTotals.count;
        totalsRow.getCell(8).value = officerTotals.disbursementAmount;
        totalsRow.getCell(9).value = officerTotals.interestAmount;
        totalsRow.getCell(10).value = officerTotals.totalLoanAmount;
        totalsRow.getCell(11).value = officerTotals.principalPaid;
        totalsRow.getCell(12).value = officerTotals.interestPaid;
        
        for (let i = 8; i <= 12; i++) {
          totalsRow.getCell(i).numFmt = '#,##0.00';
          totalsRow.getCell(i).font = { bold: true };
          totalsRow.getCell(i).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          totalsRow.getCell(i).alignment = { horizontal: 'right' };
        }
        for (let i = 1; i <= 12; i++) {
          totalsRow.getCell(i).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
        currentRow += 2;
      });
      
      const branchTotalsRow = worksheet.getRow(currentRow);
      branchTotalsRow.getCell(1).value = 'Total By Branch';
      branchTotalsRow.getCell(1).font = { bold: true };
      branchTotalsRow.getCell(2).value = '';
      branchTotalsRow.getCell(3).value = '';
      branchTotalsRow.getCell(4).value = '';
      branchTotalsRow.getCell(5).value = '';
      branchTotalsRow.getCell(6).value = '';
      branchTotalsRow.getCell(7).value = branch.totals.count;
      branchTotalsRow.getCell(8).value = branch.totals.disbursementAmount;
      branchTotalsRow.getCell(9).value = branch.totals.interestAmount;
      branchTotalsRow.getCell(10).value = branch.totals.totalLoanAmount;
      branchTotalsRow.getCell(11).value = branch.totals.principalPaid;
      branchTotalsRow.getCell(12).value = branch.totals.interestPaid;
      
      for (let i = 8; i <= 12; i++) {
        branchTotalsRow.getCell(i).numFmt = '#,##0.00';
        branchTotalsRow.getCell(i).font = { bold: true };
        branchTotalsRow.getCell(i).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFADD8E6' }
        };
        branchTotalsRow.getCell(i).alignment = { horizontal: 'right' };
      }
      for (let i = 1; i <= 12; i++) {
        branchTotalsRow.getCell(i).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
      currentRow += 2;
    });
    
    worksheet.columns = [
      { width: 20 }, { width: 30 }, { width: 25 }, { width: 25 }, { width: 12 },
      { width: 12 }, { width: 20 }, { width: 22 }, { width: 22 }, { width: 22 },
      { width: 22 }, { width: 22 }
    ];
    currentRow += 2;
    worksheet.getRow(currentRow).getCell(1).value = `Printed on: ${userInfo.date}`;
    worksheet.getRow(currentRow).getCell(1).font = { size: 9 };
    currentRow++;
    worksheet.getRow(currentRow).getCell(1).value = `Printed by: ${userInfo.name}`;
    worksheet.getRow(currentRow).getCell(1).font = { size: 9 };
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFilename(reportName, 'xlsx');
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log('Loans Disbursed Excel export successful');
  } catch (error) {
    console.error('Error exporting Loans Disbursed to Excel:', error);
    throw error;
  }
};

export const exportLoanAgeingToExcel = async (exportData, reportName, companyName, selectedBranch, submittedFilters, reportData = null, reportId = null) => {
  if (exportData && exportData.branches) {
    return await exportProcessedLoanAgeingData(exportData, reportName, companyName, selectedBranch, submittedFilters, reportData, reportId);
  }
  if (Array.isArray(exportData)) {
    const processedData = processLoanAgeingDataForExport(exportData);
    return await exportProcessedLoanAgeingData(processedData, reportName, companyName, selectedBranch, submittedFilters, reportData, reportId);
  }
  return;
};

const exportProcessedLoanAgeingData = async (processedData, reportName, companyName, selectedBranch, submittedFilters, reportData = null, reportId = null) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Loan Ageing');
    
    const userInfo = getUserInfo();
    const { branches } = processedData;
    
    let currentRow = addStandardExcelHeader(
      worksheet, 
      companyName, 
      reportName, 
      selectedBranch,
      {}, 
      12 
    );
    
    if (reportData && reportId) {
      const allParams = getAllParametersForReport(reportData, reportId, submittedFilters);
      if (allParams.length > 0) {
        const paramParts = allParams.map(p => `${p.caption}-${p.value}`);
        const paramLine = paramParts.join('  ');
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = paramLine;
        row.getCell(1).font = { bold: false, size: 10 };
        row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        currentRow++;
      }
    }
    
    currentRow++;
    const headers = [
      'A/C No', 'Name', 'Phone', 'Days', 'OSPrincipal', 'Prin. in Arrears', 
      '1-30 Days', '31-60 Days', '61-90 Days', '91-120 Days', '121-180 Days', 'Above180 Day'
    ];
    
    const headerRow = worksheet.getRow(currentRow);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 9 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    currentRow++;
    
    branches.forEach((branch) => {
      const branchRow = worksheet.getRow(currentRow);
      branchRow.getCell(1).value = `Branch Name: ${branch.branchName}`;
      branchRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' }, underline: true };
      branchRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF404040' }
      };
      worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
      currentRow++;
      
      branch.officers.forEach((officer) => {
        const officerRow = worksheet.getRow(currentRow);
        officerRow.getCell(1).value = `Loan Officer: ${officer.officerName}`;
        officerRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, underline: true };
        officerRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF606060' }
        };
        worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
        currentRow++;
        
        let officerTotals = {
          count: 0,
          osPrincipal: 0,
          prinInArrears: 0,
          days1to30: 0,
          days31to60: 0,
          days61to90: 0,
          days91to120: 0,
          days121to180: 0,
          above180: 0
        };
        
        officer.records.forEach((record) => {
          officerTotals.count++;
          officerTotals.osPrincipal += parseFloat(record.OSPrincipal || record.OSPrinciple || 0);
          officerTotals.prinInArrears += parseFloat(record.PrinInArrears || record['Prin. in Arrears'] || record.PrincipalInArrear || 0);
          officerTotals.days1to30 += parseFloat(record['1-30 Days'] || record.Days1to30 || 0);
          officerTotals.days31to60 += parseFloat(record['31-60 Days'] || record.Days31to60 || 0);
          officerTotals.days61to90 += parseFloat(record['61-90 Days'] || record.Days61to90 || 0);
          officerTotals.days91to120 += parseFloat(record['91-120 Days'] || record.Days91to120 || 0);
          officerTotals.days121to180 += parseFloat(record['121-180 Days'] || record.Days121to180 || 0);
          officerTotals.above180 += parseFloat(record.Above180Day || record.Above180 || 0);
          
          const dataRow = worksheet.getRow(currentRow);
          
          dataRow.getCell(1).value = record['A/C No'] || record.ACNo || record.AccountID || '';
          dataRow.getCell(2).value = record.Name || '';
          dataRow.getCell(3).value = record.PhoneNo || '';
          dataRow.getCell(4).value = record.DueDays || 0;
          dataRow.getCell(5).value = record.OSPrincipal || 0;
          dataRow.getCell(6).value = record['Principal in Arrears'] || record['Prin. in Arrears'] || record.PrincipalInArrear || 0;
          dataRow.getCell(7).value = record['1-30 Days'] || record.Days1to30 || 0;
          dataRow.getCell(8).value = record['31-60 Days'] || record.Days31to60 || 0;
          dataRow.getCell(9).value = record['61-90 Days'] || record.Days61to90 || 0;
          dataRow.getCell(10).value = record['91-120 Days'] || record.Days91to120 || 0;
          dataRow.getCell(11).value = record['121-180 Days'] || record.Days121to180 || 0;
          dataRow.getCell(12).value = record.Above180Day || record.Above180 || 0;
          
          for (let i = 5; i <= 12; i++) {
            dataRow.getCell(i).numFmt = '#,##0.00';
            dataRow.getCell(i).alignment = { horizontal: 'right' };
          }
          
          for (let i = 1; i <= 12; i++) {
            dataRow.getCell(i).border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          }
          
          currentRow++;
        });
        
        const totalsRow = worksheet.getRow(currentRow);
        totalsRow.getCell(1).value = 'Total By Loan Officer';
        totalsRow.getCell(1).font = { bold: true };
        totalsRow.getCell(2).value = '';
        totalsRow.getCell(3).value = '';
        totalsRow.getCell(4).value = officerTotals.count;
        totalsRow.getCell(5).value = officerTotals.osPrincipal;
        totalsRow.getCell(6).value = officerTotals.prinInArrears;
        totalsRow.getCell(7).value = officerTotals.days1to30;
        totalsRow.getCell(8).value = officerTotals.days31to60;
        totalsRow.getCell(9).value = officerTotals.days61to90;
        totalsRow.getCell(10).value = officerTotals.days91to120;
        totalsRow.getCell(11).value = officerTotals.days121to180;
        totalsRow.getCell(12).value = officerTotals.above180;
        
        for (let i = 5; i <= 12; i++) {
          totalsRow.getCell(i).numFmt = '#,##0.00';
          totalsRow.getCell(i).font = { bold: true };
          totalsRow.getCell(i).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          totalsRow.getCell(i).alignment = { horizontal: 'right' };
        }
        for (let i = 1; i <= 12; i++) {
          totalsRow.getCell(i).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
        currentRow += 2;
      });
      
      const branchTotalsRow = worksheet.getRow(currentRow);
      branchTotalsRow.getCell(1).value = 'Total By Branch';
      branchTotalsRow.getCell(1).font = { bold: true };
      branchTotalsRow.getCell(2).value = '';
      branchTotalsRow.getCell(3).value = '';
      branchTotalsRow.getCell(4).value = branch.totals.count;
      branchTotalsRow.getCell(5).value = branch.totals.osPrincipal;
      branchTotalsRow.getCell(6).value = branch.totals.prinInArrears;
      branchTotalsRow.getCell(7).value = branch.totals.days1to30;
      branchTotalsRow.getCell(8).value = branch.totals.days31to60;
      branchTotalsRow.getCell(9).value = branch.totals.days61to90;
      branchTotalsRow.getCell(10).value = branch.totals.days91to120;
      branchTotalsRow.getCell(11).value = branch.totals.days121to180;
      branchTotalsRow.getCell(12).value = branch.totals.above180;
      
      for (let i = 5; i <= 12; i++) {
        branchTotalsRow.getCell(i).numFmt = '#,##0.00';
        branchTotalsRow.getCell(i).font = { bold: true };
        branchTotalsRow.getCell(i).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFADD8E6' }
        };
        branchTotalsRow.getCell(i).alignment = { horizontal: 'right' };
      }
      for (let i = 1; i <= 12; i++) {
        branchTotalsRow.getCell(i).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
      currentRow += 2;
    });
    
    worksheet.columns = [
      { width: 20 }, { width: 30 }, { width: 20 }, { width: 12 }, { width: 20 },
      { width: 20 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 },
      { width: 18 }, { width: 18 }
    ];
    currentRow += 2;
    worksheet.getRow(currentRow).getCell(1).value = `Printed on: ${userInfo.date}`;
    worksheet.getRow(currentRow).getCell(1).font = { size: 9 };
    currentRow++;
    worksheet.getRow(currentRow).getCell(1).value = `Printed by: ${userInfo.name}`;
    worksheet.getRow(currentRow).getCell(1).font = { size: 9 };
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFilename(reportName, 'xlsx');
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log('Loan Ageing Excel export successful');
  } catch (error) {
    console.error('Error exporting Loan Ageing to Excel:', error);
    throw error;
  }
};

export const exportLoanArrearsDetailedToExcel = async (exportData, reportName, companyName, selectedBranch, submittedFilters, reportData = null, reportId = null) => {
  if (exportData && exportData.branches) {
    return await exportProcessedLoanArrearsDetailedData(exportData, reportName, companyName, selectedBranch, submittedFilters, reportData, reportId);
  }
  if (Array.isArray(exportData)) {
    const processedData = processLoanArrearsDetailedDataForExport(exportData);
    return await exportProcessedLoanArrearsDetailedData(processedData, reportName, companyName, selectedBranch, submittedFilters, reportData, reportId);
  }
  return;
};

const exportProcessedLoanArrearsDetailedData = async (processedData, reportName, companyName, selectedBranch, submittedFilters, reportData = null, reportId = null) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Loan Arrears Detailed');
    
    const userInfo = getUserInfo();
    const { branches } = processedData;
    
    let currentRow = addStandardExcelHeader(
      worksheet, 
      companyName, 
      reportName, 
      selectedBranch,
      {}, 
      9 
    );
    
    if (reportData && reportId) {
      const allParams = getAllParametersForReport(reportData, reportId, submittedFilters);
      if (allParams.length > 0) {
        const paramParts = allParams.map(p => `${p.caption}-${p.value}`);
        const paramLine = paramParts.join('  ');
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = paramLine;
        row.getCell(1).font = { bold: false, size: 10 };
        row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        currentRow++;
      }
    }
    
    currentRow++;
    const headers = [
      'Loan A/C', 'Name', 'Days', 'Mobile', 'Out Principle', 'PrincipalDue', 
      'InterestDue', 'Penalty&Sms', 'Total Due'
    ];
    
    const headerRow = worksheet.getRow(currentRow);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 9 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    currentRow++;
    
    branches.forEach((branch) => {
      const branchRow = worksheet.getRow(currentRow);
      branchRow.getCell(1).value = `Branch Name: ${branch.branchName}`;
      branchRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' }, underline: true };
      branchRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF404040' }
      };
      worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
      currentRow++;
      
      branch.officers.forEach((officer) => {
        const officerRow = worksheet.getRow(currentRow);
        officerRow.getCell(1).value = `Loan Officer: ${officer.officerName}`;
        officerRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' }, underline: true };
        officerRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF606060' }
        };
        worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
        currentRow++;
        
        let officerTotals = {
          count: 0,
          outPrinciple: 0,
          principalDue: 0,
          interestDue: 0,
          penaltySms: 0,
          totalDue: 0
        };
        
        officer.records.forEach((record) => {
          officerTotals.count++;
          officerTotals.outPrinciple += parseFloat(record.OutTPrincipal || 0);
          officerTotals.principalDue += parseFloat(record.PrinDueToDate || 0);
          officerTotals.interestDue += parseFloat(record.IntDueToDate || 0);
          officerTotals.penaltySms += parseFloat(record.PenaltyAmount || 0);
          officerTotals.totalDue += parseFloat(record.TotDueToDate || 0);
          
          const dataRow = worksheet.getRow(currentRow);
          
          dataRow.getCell(1).value = record.AccountID || '';
          dataRow.getCell(2).value = record.Name || '';
          dataRow.getCell(3).value = record.DueDays || 0;
          dataRow.getCell(4).value = record.Mobile || '';
          dataRow.getCell(5).value = record.OutTPrincipal || 0;
          dataRow.getCell(6).value = record.PrinDueToDate || 0;
          dataRow.getCell(7).value = record.IntDueToDate || 0;
          dataRow.getCell(8).value = record.PenaltyAmount || 0;
          dataRow.getCell(9).value = record.TotDueToDate || 0;
          
          for (let i = 5; i <= 9; i++) {
            dataRow.getCell(i).numFmt = '#,##0.00';
            dataRow.getCell(i).alignment = { horizontal: 'right' };
          }
          
          for (let i = 1; i <= 9; i++) {
            dataRow.getCell(i).border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          }
          
          currentRow++;
        });
        
        const totalsRow = worksheet.getRow(currentRow);
        totalsRow.getCell(1).value = 'Total By Loan Officer';
        totalsRow.getCell(1).font = { bold: true };
        totalsRow.getCell(2).value = '';
        totalsRow.getCell(3).value = officerTotals.count;
        totalsRow.getCell(4).value = '';
        totalsRow.getCell(5).value = officerTotals.outPrinciple;
        totalsRow.getCell(6).value = officerTotals.principalDue;
        totalsRow.getCell(7).value = officerTotals.interestDue;
        totalsRow.getCell(8).value = officerTotals.penaltySms;
        totalsRow.getCell(9).value = officerTotals.totalDue;
        
        for (let i = 5; i <= 9; i++) {
          totalsRow.getCell(i).numFmt = '#,##0.00';
          totalsRow.getCell(i).font = { bold: true };
          totalsRow.getCell(i).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          totalsRow.getCell(i).alignment = { horizontal: 'right' };
        }
        for (let i = 1; i <= 9; i++) {
          totalsRow.getCell(i).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
        currentRow += 2;
      });
      
      const branchTotalsRow = worksheet.getRow(currentRow);
      branchTotalsRow.getCell(1).value = 'Total By Branch';
      branchTotalsRow.getCell(1).font = { bold: true };
      branchTotalsRow.getCell(2).value = '';
      branchTotalsRow.getCell(3).value = branch.totals.count;
      branchTotalsRow.getCell(4).value = '';
      branchTotalsRow.getCell(5).value = branch.totals.outPrinciple;
      branchTotalsRow.getCell(6).value = branch.totals.principalDue;
      branchTotalsRow.getCell(7).value = branch.totals.interestDue;
      branchTotalsRow.getCell(8).value = branch.totals.penaltySms;
      branchTotalsRow.getCell(9).value = branch.totals.totalDue;
      
      for (let i = 5; i <= 9; i++) {
        branchTotalsRow.getCell(i).numFmt = '#,##0.00';
        branchTotalsRow.getCell(i).font = { bold: true };
        branchTotalsRow.getCell(i).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFADD8E6' }
        };
        branchTotalsRow.getCell(i).alignment = { horizontal: 'right' };
      }
      for (let i = 1; i <= 9; i++) {
        branchTotalsRow.getCell(i).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
      currentRow += 2;
    });
    
    worksheet.columns = [
      { width: 20 }, { width: 35 }, { width: 12 }, { width: 20 }, { width: 20 },
      { width: 20 }, { width: 20 }, { width: 20 }, { width: 20 }
    ];
    currentRow += 2;
    worksheet.getRow(currentRow).getCell(1).value = `Printed on: ${userInfo.date}`;
    worksheet.getRow(currentRow).getCell(1).font = { size: 9 };
    currentRow++;
    worksheet.getRow(currentRow).getCell(1).value = `Printed by: ${userInfo.name}`;
    worksheet.getRow(currentRow).getCell(1).font = { size: 9 };
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFilename(reportName, 'xlsx');
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log('Loan Arrears Detailed Excel export successful');
  } catch (error) {
    console.error('Error exporting Loan Arrears Detailed to Excel:', error);
    throw error;
  }
};

export const exportFixedDepositStatementToExcel = async (exportData, reportName, companyName, selectedBranch, submittedFilters) => {
  let processedData = exportData;
  
  if (Array.isArray(exportData)) {
    if (exportData.length === 0) {
      console.error('No data to export');
      return;
    }
    const firstRecord = exportData[0];
    const accountInfo = {
      branchId: firstRecord.OurBranchID || '',
      accountId: firstRecord.AccountID || '',
      clientName: firstRecord.Name || '',
      freezedAmount: parseFloat(firstRecord.FreezedAmount || 0),
      availableAmount: parseFloat(firstRecord.Balance || 0),
      closingBalance: parseFloat(firstRecord.ClosingbalanceStartDate || 0)
    };
    const deposits = exportData.map((row) => ({
      receiptId: row.ReceiptID || '',
      serialId: row.SerialID || '',
      fixedAmount: parseFloat(row.FixedAmount || 0),
      closingBalance: parseFloat(row.ClosingbalanceStartDate || 0),
      rate: parseFloat(row.InterestRate || 0),
      startDate: row.StartDate || '',
      term: row.Term || '',
      endDate: row.EndDate || '',
      interestPaid: parseFloat(row.InterestPaid || 0),
      taxCharged: row.TaxCharged || '',
      netInterestPaid: row.NetInterestPaid || '',
      interestPaidOn: row.InterestPaidOn || '',
      status: row.Status || ''
    }));
    processedData = { accountInfo, deposits, rawData: exportData };
  }
  
  if (!processedData || (!processedData.accountInfo && !processedData.deposits)) {
    console.error('No valid data to export');
    return;
  }
  
  return await exportProcessedFixedDepositStatementData(processedData, reportName, companyName, selectedBranch, submittedFilters);
};

const exportProcessedFixedDepositStatementData = async (processedData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Fixed Deposit Statement');
    
    const userInfo = getUserInfo();
    const { accountInfo, deposits } = processedData;
    
    let currentRow = addStandardExcelHeader(
      worksheet, 
      companyName, 
      reportName, 
      selectedBranch,
      submittedFilters, 
      7
    );
    
    currentRow += 1;
    const detailsData = [
      { 
        col1Label: 'Branch ID', 
        col1Value: accountInfo.branchId || submittedFilters?.OurBranchID || '', 
        col2Label: 'AccountID', 
        col2Value: accountInfo.accountId || '',
        col3Label: '',
        col3Value: ''
      },
      { 
        col1Label: 'Account ID', 
        col1Value: accountInfo.accountId || '', 
        col2Label: 'Freezed Amount :', 
        col2Value: formatCurrency(accountInfo.freezedAmount),
        col3Label: 'Available Amount',
        col3Value: formatCurrency(accountInfo.availableAmount)
      },
      { 
        col1Label: 'Client Name :', 
        col1Value: accountInfo.clientName || '', 
        col2Label: 'Closing Balance :', 
        col2Value: formatCurrency(accountInfo.closingBalance),
        col3Label: '',
        col3Value: ''
      }
    ];

    detailsData.forEach((rowData) => {
      const row = worksheet.getRow(currentRow);
      
      if (rowData.col1Label) {
        row.getCell(1).value = rowData.col1Label;
        row.getCell(1).font = { bold: true, size: 9 };
      }
      if (rowData.col1Value) {
        row.getCell(2).value = rowData.col1Value;
        row.getCell(2).font = { size: 9 };
      }
      
      if (rowData.col2Label) {
        row.getCell(3).value = rowData.col2Label;
        row.getCell(3).font = { bold: true, size: 9 };
      }
      if (rowData.col2Value !== undefined && rowData.col2Value !== '') {
        row.getCell(4).value = rowData.col2Value;
        row.getCell(4).font = { size: 9 };
      }
      
      if (rowData.col3Label) {
        row.getCell(5).value = rowData.col3Label;
        row.getCell(5).font = { bold: true, size: 9 };
      }
      if (rowData.col3Value !== undefined && rowData.col3Value !== '') {
        row.getCell(6).value = rowData.col3Value;
        row.getCell(6).font = { size: 9 };
      }
      
      currentRow++;
    });
    
    currentRow += 1;
    const headerRow = worksheet.getRow(currentRow);
    const headers = ['ReceiptID', 'SerialID', 'FixedAmount', 'Closing balance', 'Rate', 'StartDate', 'Term', 'EndDate', 'InterestPaid', 'TaxCharged', 'NetInterestPaid', 'InterestPaidOn', 'Status'];
    
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 9 };
      cell.fill = { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: 'FFE0E0E0' } 
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    currentRow++;
    
    deposits.forEach((deposit) => {
      const row = worksheet.getRow(currentRow);
      
      row.getCell(1).value = deposit.receiptId || '';
      row.getCell(2).value = deposit.serialId || '';
      row.getCell(3).value = deposit.fixedAmount || 0;
      row.getCell(4).value = deposit.closingBalance || 0;
      row.getCell(5).value = deposit.rate || 0;
      row.getCell(6).value = formatDate(deposit.startDate);
      row.getCell(7).value = deposit.term || '';
      row.getCell(8).value = formatDate(deposit.endDate);
      row.getCell(9).value = deposit.interestPaid || 0;
      row.getCell(10).value = deposit.taxCharged || '';
      row.getCell(11).value = deposit.netInterestPaid || '';
      row.getCell(12).value = deposit.interestPaidOn ? formatDate(deposit.interestPaidOn) : '';
      row.getCell(13).value = deposit.status || '';
      
      [3, 4, 9].forEach(i => {
        row.getCell(i).numFmt = '#,##0.00';
        row.getCell(i).alignment = { horizontal: 'right' };
      });
      if (deposit.rate !== undefined && deposit.rate !== null) {
        row.getCell(5).numFmt = '0.00';
      }
      row.getCell(5).alignment = { horizontal: 'right' };
      
      for (let i = 1; i <= 13; i++) {
        row.getCell(i).border = {
          top: { style: 'dotted', color: { argb: 'FFC0C0C0' } },
          left: { style: 'thin' },
          bottom: { style: 'dotted', color: { argb: 'FFC0C0C0' } },
          right: { style: 'thin' }
        };
        row.getCell(i).font = { size: 8 };
      }
      
      currentRow++;
    });
    
    worksheet.columns = [
      { width: 12 }, 
      { width: 12 }, 
      { width: 18 },
      { width: 18 },  
      { width: 12 },  
      { width: 18 }, 
      { width: 12 },
      { width: 18 },
      { width: 18 },
      { width: 15 },
      { width: 18 },
      { width: 18 },
      { width: 25 }
    ];
    currentRow += 2;
    worksheet.getRow(currentRow).getCell(1).value = `Printed on: ${userInfo.date}`;
    worksheet.getRow(currentRow).getCell(1).font = { size: 9 };
    currentRow++;
    worksheet.getRow(currentRow).getCell(1).value = `Printed by: ${userInfo.name}`;
    worksheet.getRow(currentRow).getCell(1).font = { size: 9 };
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFilename(reportName, 'xlsx');
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log('Fixed Deposit Statement Excel export successful');
  } catch (error) {
    console.error('Error exporting Fixed Deposit Statement to Excel:', error);
    throw error;
  }
};

export const exportFixedDepositMemberStatementToExcel = async (exportData, reportName, companyName, selectedBranch, submittedFilters) => {
  let processedData = exportData;
  
  if (Array.isArray(exportData)) {
    if (exportData.length === 0) {
      console.error('No data to export');
      return;
    }
    const firstRecord = exportData[0];
    const depositInfo = {
      branchId: firstRecord.OurBranchID || '',
      accountId: firstRecord.AccountID || '',
      receiptId: firstRecord.ReceiptID || '',
      product: firstRecord.ProductName || '',
      name: firstRecord.Name || '',
      depositDate: firstRecord.StartDate || '',
      depositAmount: parseFloat(firstRecord.Amount || 0),
      periodInMonths: firstRecord.Term || '',
      annualIntRate: parseFloat(firstRecord.InterestRate || 0),
      maturityDate: firstRecord.MatureDate || '',
      totalInterest: parseFloat(firstRecord.GrossInterest || 0)
    };
    const maturityValueBeforeTax = depositInfo.depositAmount + depositInfo.totalInterest;
    const withholdingTaxPercent = parseFloat(firstRecord.WithholdingTaxPercent || firstRecord.TaxPercent || 0);
    const withholdingTax = parseFloat(firstRecord.MaturityAmount || 0);
    const maturityValueAfterTax = maturityValueBeforeTax - withholdingTax;
    const maturityInfo = {
      maturityValueBeforeTax,
      withholdingTaxPercent: withholdingTaxPercent || null,
      withholdingTax,
      maturityValueAfterTax
    };
    processedData = { depositInfo, maturityInfo, rawData: exportData };
  }
  
  if (!processedData || (!processedData.depositInfo && !processedData.maturityInfo)) {
    console.error('No valid data to export');
    return;
  }
  
  return await exportProcessedFixedDepositMemberStatementData(processedData, reportName, companyName, selectedBranch, submittedFilters);
};

const exportProcessedFixedDepositMemberStatementData = async (processedData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Fixed Deposit Member Statement');
    
    const userInfo = getUserInfo();
    const { depositInfo, maturityInfo } = processedData;
    
    let currentRow = addStandardExcelHeader(
      worksheet, 
      companyName, 
      'Fixed Deposit Member Statement', 
      selectedBranch,
      submittedFilters, 
      7
    );
    
    currentRow += 1;
    const identificationRow = worksheet.getRow(currentRow);
    identificationRow.getCell(1).value = `Branch ID-${depositInfo.branchId || ''}    AccountID-${depositInfo.accountId || ''}    ReceiptID-${depositInfo.receiptId || ''}`;
    identificationRow.getCell(1).font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
    identificationRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF606060' }
    };
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
    currentRow += 2;
    
    const detailsData = [
      ['Product:', depositInfo.product],
      ['Name:', depositInfo.name],
      ['A/C No.:', depositInfo.accountId || ''],
      ['Fixed Deposit No.:', depositInfo.receiptId || ''],
      ['Deposit Date:', (() => {
        if (!depositInfo.depositDate) return '-';
        try {
          const date = new Date(depositInfo.depositDate);
          const month = date.getMonth() + 1;
          const day = date.getDate();
          const year = date.getFullYear();
          const hours = date.getHours();
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          const ampm = hours >= 12 ? 'AM' : 'PM';
          const displayHours = hours % 12 || 12;
          return `${month}/${day}/${year} ${displayHours}:${minutes}:${seconds}${ampm}`;
        } catch (e) {
          return depositInfo.depositDate;
        }
      })()],
      ['Deposit Amount:', formatCurrency(depositInfo.depositAmount)],
      ['Period in Months:', depositInfo.periodInMonths || ''],
      ['Annual Int Rate (%):', depositInfo.annualIntRate ? depositInfo.annualIntRate.toFixed(2) : '0.00'],
      ['Maturity Date:', formatDate(depositInfo.maturityDate)],
      ['Total Interest:', formatCurrency(depositInfo.totalInterest)]
    ];

    detailsData.forEach(([label, value]) => {
      const row = worksheet.getRow(currentRow);
      row.getCell(1).value = label;
      row.getCell(1).font = { bold: true, size: 9 };
      row.getCell(2).value = value;
      row.getCell(2).font = { size: 9 };
      currentRow++;
    });
    
    currentRow += 1;
    const maturityHeaderRow = worksheet.getRow(currentRow);
    maturityHeaderRow.getCell(1).value = 'Transaction at Maturity:';
    maturityHeaderRow.getCell(1).font = { bold: true, size: 9 };
    currentRow += 1;
    
    const maturityDetails = [
      ['Maturity value before withholding tax:', formatCurrency(maturityInfo.maturityValueBeforeTax), true],
      ['Withholding Tax %:', maturityInfo.withholdingTaxPercent !== null ? maturityInfo.withholdingTaxPercent.toFixed(2) : '', false],
      ['Withholding Tax:', formatCurrency(maturityInfo.withholdingTax), false],
      ['Maturity value after withholding tax:', formatCurrency(maturityInfo.maturityValueAfterTax), true]
    ];
    
    maturityDetails.forEach(([label, value, isBold]) => {
      const row = worksheet.getRow(currentRow);
      row.getCell(1).value = label;
      row.getCell(1).font = { bold: isBold, size: 9 };
      row.getCell(2).value = value;
      row.getCell(2).font = { bold: isBold, size: 9 };
      row.getCell(2).alignment = { horizontal: 'right' };
      if (typeof value === 'string' && value.includes(',')) {
        row.getCell(2).numFmt = '#,##0.00';
      }
      currentRow++;
    });
    
    currentRow += 2;
    worksheet.getRow(currentRow).getCell(1).value = `Printed By: ${userInfo.name}`;
    worksheet.getRow(currentRow).getCell(1).font = { size: 9 };
    worksheet.getRow(currentRow).getCell(5).value = `Print Date: ${new Date().toLocaleString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })}`;
    worksheet.getRow(currentRow).getCell(5).font = { size: 9 };
    currentRow++;
    worksheet.getRow(currentRow).getCell(1).value = 'Verified By:';
    worksheet.getRow(currentRow).getCell(1).font = { size: 9 };
    
    try {
      const userProfile = sessionStorage.getItem('userProfile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        if (profile.workingDate) {
          const date = new Date(profile.workingDate);
          const day = String(date.getDate()).padStart(2, '0');
          const month = date.toLocaleString('en-US', { month: 'short' });
          const year = date.getFullYear();
          worksheet.getRow(currentRow).getCell(5).value = `Working Date: ${day}/${month}/${year}`;
          worksheet.getRow(currentRow).getCell(5).font = { size: 9 };
        }
      }
    } catch (e) {}
    
    worksheet.columns = [
      { width: 50 }, 
      { width: 50 }
    ];
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFilename(reportName, 'xlsx');
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log('Fixed Deposit Member Statement Excel export successful');
  } catch (error) {
    console.error('Error exporting Fixed Deposit Member Statement to Excel:', error);
    throw error;
  }
};