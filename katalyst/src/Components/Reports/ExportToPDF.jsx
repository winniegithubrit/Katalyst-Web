import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  generateFilename, 
  formatDate, 
  formatCurrency, 
  getUserInfo, 
  groupBalanceSheetData,
  getBankLogo,
  addStandardPDFHeader,
  groupProfitLossData,
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
export const exportTableToPDF = async (data, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const yPosition = await addStandardPDFHeader(doc, pageWidth, companyName, reportName, selectedBranch, submittedFilters);
    const headers = Object.keys(data[0] || {});
    const tableData = data.map(row => 
      headers.map(header => {
        let value = row[header];
        if (header.toLowerCase().includes('date') && value) {
          value = formatDate(value);
        }
        return value ?? '';
      })
    );
    
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: yPosition,
      theme: 'grid',
      headStyles: {
        fillColor: [224, 224, 224],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      didDrawPage: () => addPDFFooter(doc, pageHeight, 14, pageWidth)
    });

    doc.save(generateFilename(reportName, 'pdf'));
    console.log('PDF export successful');
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
};
export const exportBalanceSheetToPDF = async (data, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  try {
    const groupedData = groupBalanceSheetData(data);
    if (!groupedData) {
      console.error('Data is not in balance sheet format');
      return exportTableToPDF(data, reportName, companyName, selectedBranch, submittedFilters);
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 14;
    const rightMargin = pageWidth - 14;
    
    let yPosition = await addStandardPDFHeader(doc, pageWidth, companyName, reportName, selectedBranch, submittedFilters);

    Object.entries(groupedData).forEach(([accountType, accountData]) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFillColor(128, 128, 128);
      doc.rect(leftMargin, yPosition - 5, rightMargin - leftMargin, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(accountData.name, leftMargin + 2, yPosition);
      yPosition += 12;

      Object.entries(accountData.groups).forEach(([typeGroup, groupData]) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFillColor(220, 220, 220);
        doc.rect(leftMargin + 5, yPosition - 5, rightMargin - leftMargin - 10, 7, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(groupData.name, leftMargin + 7, yPosition);
        yPosition += 10;

        Object.entries(groupData.subGroups).forEach(([subAccountType, subGroupData]) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }
          doc.setFillColor(240, 240, 240);
          doc.rect(leftMargin + 10, yPosition - 5, rightMargin - leftMargin - 20, 6, 'F');
          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.text(subGroupData.name, leftMargin + 12, yPosition);
          yPosition += 7;
          doc.setFont(undefined, 'normal');
          doc.setFontSize(8);
          subGroupData.items.forEach((item, itemIndex) => {
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }
            const maxWidth = rightMargin - (leftMargin + 15) - 35;
            doc.text(item.description, leftMargin + 15, yPosition, { maxWidth });
            doc.text(formatCurrency(item.localBalance), rightMargin - 3, yPosition, { align: 'right' });
            if (itemIndex < subGroupData.items.length - 1) {
              yPosition += 3.0; 
              doc.setDrawColor(150, 150, 150);
              doc.setLineWidth(0.1);
              doc.setLineDash([1, 1]);
              doc.line(leftMargin + 15, yPosition, rightMargin - 3, yPosition);
              doc.setLineDash([]);
              yPosition += 3.0; 
            } else {
              yPosition += 5;
            }
          });
          doc.setFillColor(220, 240, 255);
          doc.rect(leftMargin + 10, yPosition - 4, rightMargin - leftMargin - 10, 6, 'F');
          doc.setFont(undefined, 'bold');
          const maxWidthSub = rightMargin - (leftMargin + 15) - 35;
          doc.text(`Total ${subGroupData.name}`, leftMargin + 15, yPosition, { maxWidth: maxWidthSub });
          doc.text(formatCurrency(subGroupData.total), rightMargin - 3, yPosition, { align: 'right' });
          yPosition += 10;
        });
        doc.setFillColor(200, 200, 200);
        doc.rect(leftMargin + 5, yPosition - 4, rightMargin - leftMargin - 5, 7, 'F');
        doc.setFontSize(9);
        const maxWidthGroup = rightMargin - (leftMargin + 10) - 35;
        doc.text(`Total ${groupData.name}`, leftMargin + 10, yPosition, { maxWidth: maxWidthGroup });
        doc.text(formatCurrency(groupData.total), rightMargin - 3, yPosition, { align: 'right' });
        yPosition += 12;
      });
      doc.setFillColor(140, 140, 140);
      doc.rect(leftMargin, yPosition - 5, rightMargin - leftMargin, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      const maxWidthAccount = rightMargin - (leftMargin + 2) - 35;
      doc.text(`Total ${accountData.name}`, leftMargin + 2, yPosition, { maxWidth: maxWidthAccount });
      doc.text(formatCurrency(accountData.total), rightMargin - 3, yPosition, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      yPosition += 15;
    });
    yPosition += 10;
    addPDFFooter(doc, pageHeight, leftMargin, pageWidth);
    doc.save(generateFilename(reportName, 'pdf'));
    console.log('Balance sheet PDF export successful');
  } catch (error) {
    console.error('Error exporting balance sheet to PDF:', error);
    throw error;
  }
};
export const exportTrialBalanceToPDF = async (processedData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }

  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 14;
    const rightMargin = pageWidth - 14;
    
    let yPosition = await addStandardPDFHeader(doc, pageWidth, companyName, reportName, selectedBranch, submittedFilters, false, true);
    
    const rows = processedData.rows || [];
    const totals = processedData.totals || {};
    
    const tableData = rows.map(row => {
      return [
        row.accountId || '',
        row.description || '',
        formatCurrency(row.openingDr || 0),
        formatCurrency(row.openingCr || 0),
        formatCurrency(row.debitAmt || 0),
        formatCurrency(row.creditAmt || 0),
        formatCurrency(row.closingDr || 0),
        formatCurrency(row.closingCr || 0)
      ];
    });
    tableData.push([
      'TOTAL',
      '',
      formatCurrency(totals.openingDr || 0),
      formatCurrency(totals.openingCr || 0),
      formatCurrency(totals.debitAmt || 0),
      formatCurrency(totals.creditAmt || 0),
      formatCurrency(totals.closingDr || 0),
      formatCurrency(totals.closingCr || 0)
    ]);

    const tableWidth = rightMargin - leftMargin;

    autoTable(doc, {
      startY: yPosition,
      margin: { left: leftMargin, right: leftMargin },
      head: [
        [
          { content: 'Account', styles: { fillColor: [224, 224, 224], textColor: 0, fontStyle: 'bold', fontSize: 8, halign: 'center' }, colSpan: 2 },
          { content: 'INITIAL BALANCE', styles: { fillColor: [224, 224, 224], textColor: 0, fontStyle: 'bold', halign: 'center', fontSize: 8 }, colSpan: 2 },
          { content: 'MOVEMENT', styles: { fillColor: [224, 224, 224], textColor: 0, fontStyle: 'bold', halign: 'center', fontSize: 8 }, colSpan: 2 },
          { content: 'BALANCE', styles: { fillColor: [224, 224, 224], textColor: 0, fontStyle: 'bold', halign: 'center', fontSize: 8 }, colSpan: 2 }
        ],
        [
          { content: 'Account', styles: { fillColor: [224, 224, 224], textColor: 0, fontStyle: 'bold', fontSize: 7, halign: 'center' } },
          { content: 'Description', styles: { fillColor: [224, 224, 224], textColor: 0, fontStyle: 'bold', fontSize: 7, halign: 'center' } },
          { content: 'OpeningDr', styles: { fillColor: [224, 224, 224], textColor: 0, fontStyle: 'bold', fontSize: 7, halign: 'center' } },
          { content: 'OpeningCr', styles: { fillColor: [224, 224, 224], textColor: 0, fontStyle: 'bold', fontSize: 7, halign: 'center' } },
          { content: 'Debit Amt', styles: { fillColor: [224, 224, 224], textColor: 0, fontStyle: 'bold', fontSize: 7, halign: 'center' } },
          { content: 'Credit Amt', styles: { fillColor: [224, 224, 224], textColor: 0, fontStyle: 'bold', fontSize: 7, halign: 'center' } },
          { content: 'ClosingDr', styles: { fillColor: [224, 224, 224], textColor: 0, fontStyle: 'bold', fontSize: 7, halign: 'center' } },
          { content: 'ClosingCr', styles: { fillColor: [224, 224, 224], textColor: 0, fontStyle: 'bold', fontSize: 7, halign: 'center' } }
        ]
      ],
      body: tableData,
      theme: 'plain',
      showHead: 'firstPage',
      headStyles: {
        fillColor: [224, 224, 224],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        halign: 'right',
        valign: 'middle',
        lineWidth: 0,
        fontStyle: 'normal'
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 25, fontStyle: 'normal', fontSize: 7 },
        1: { halign: 'left', cellWidth: 50, fontSize: 7, fontStyle: 'normal' }
      },
      didDrawCell: function(data) {
        if (data.section === 'body' && data.row.index < tableData.length - 1) {
          const y = data.cell.y + data.cell.height;
          doc.setDrawColor(150, 150, 150);
          doc.setLineWidth(0.1);
          doc.setLineDash([1, 1]);
          doc.line(leftMargin, y, rightMargin, y);
          doc.setLineDash([]);
        }
      },
      didParseCell: function(data) {
        if (data.row.index === tableData.length - 1 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 8;
          data.cell.styles.fillColor = [255, 255, 255];
        }
      },
      didDrawPage: function(data) {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.001);
        let topY = data.settings.startY; 
        let bottomY = data.cursor.y; 
        if (data.pageNumber > 1) {
          topY = 10;
        }
        const tableHeight = bottomY - topY;
        if (tableHeight > 0 && tableWidth > 0) {
          doc.rect(leftMargin, topY, tableWidth, tableHeight);
        }
        if (data.table && data.table.body && data.table.body.length > 0) {
          const lastBodyRow = data.table.body[data.table.body.length - 1];
          if (lastBodyRow && lastBodyRow.index === tableData.length - 1) {
            const firstCell = lastBodyRow.cells && lastBodyRow.cells[0];
            if (firstCell && firstCell.y) {
              const totalsRowY = firstCell.y;
              doc.setLineWidth(0.5);
              doc.line(leftMargin, totalsRowY, rightMargin, totalsRowY);
            }
          }
        }
      }
    });
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          const footerY = pageHeight - 10;
          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
          const userInfo = getUserInfo();
          doc.text(`Printed on: ${userInfo.date}`, leftMargin, footerY);
          doc.text(`Printed by: ${userInfo.name}`, leftMargin, footerY + 4);
          doc.setFontSize(7);
          doc.text(`Page ${i} of ${totalPages}`, pageWidth - leftMargin, footerY, { align: 'right' });
        }

          doc.save(generateFilename(reportName, 'pdf'));
        } catch (error) {
          console.error('Error exporting Trial Balance to PDF:', error);
          throw error;
        }
      };

const addPDFFooter = (doc, pageHeight, leftMargin, pageWidth, currentPage = null, totalPages = null) => {
  const userInfo = getUserInfo();
  const footerY = pageHeight - 15;
  
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text(`Printed on: ${userInfo.date}`, leftMargin, footerY);
  doc.text(`Printed by: ${userInfo.name}`, leftMargin, footerY + 4);
  const pageNum = currentPage || doc.internal.getCurrentPageInfo().pageNumber;
  const total = totalPages || doc.getNumberOfPages();
  doc.setFontSize(9);
  doc.text(`Page ${pageNum} of ${total}`, pageWidth - leftMargin, footerY, { align: 'right' });
};
export const exportProfitLossToPDF = async (data, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  try {
    const groupedData = groupProfitLossData(data);
    if (!groupedData) {
      console.error('Failed to group P&L data');
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 14;
    const rightMargin = pageWidth - 14;
    
    let yPosition = await addStandardPDFHeader(doc, pageWidth, companyName, reportName, selectedBranch, submittedFilters, true);
    yPosition = renderPLSection(doc, groupedData.income, 'INCOME', yPosition, pageHeight, leftMargin, rightMargin);
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }
    yPosition = renderPLSection(doc, groupedData.expense, 'EXPENSE', yPosition, pageHeight, leftMargin, rightMargin);
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }
    
    const netProfit = groupedData.income.total - groupedData.expense.total;
    doc.setFillColor(120, 120, 120);
    doc.rect(leftMargin, yPosition - 5, rightMargin - leftMargin, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Net Profit / (Loss)', leftMargin + 2, yPosition);
    doc.text(formatCurrency(netProfit), rightMargin - 3, yPosition, { align: 'right' });
    
    addPDFFooter(doc, pageHeight, leftMargin, pageWidth);
    doc.save(generateFilename(reportName, 'pdf'));
    console.log('Profit & Loss PDF export successful');
  } catch (error) {
    console.error('Error exporting Profit & Loss to PDF:', error);
    throw error;
  }
};
const renderPLSection = (doc, sectionData, title, startY, pageHeight, leftMargin, rightMargin) => {
  let yPosition = startY;
  doc.setFillColor(128, 128, 128);
  doc.rect(leftMargin, yPosition - 5, rightMargin - leftMargin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(title, leftMargin + 2, yPosition);
  yPosition += 10;

  Object.entries(sectionData.sections).forEach(([typeKey, typeGroup]) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFillColor(220, 220, 220);
    doc.rect(leftMargin + 3, yPosition - 5, rightMargin - leftMargin - 6, 7, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(typeGroup.name.toUpperCase(), leftMargin + 5, yPosition);
    yPosition += 8;

    Object.entries(typeGroup.subGroups).forEach(([subKey, subGroup]) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFillColor(240, 240, 240);
      doc.rect(leftMargin + 8, yPosition - 5, rightMargin - leftMargin - 16, 6, 'F');
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(subGroup.name, leftMargin + 10, yPosition);
      yPosition += 7;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      subGroup.items.forEach(item => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        const maxWidth = rightMargin - (leftMargin + 20) - 35;
        doc.text(item.description, leftMargin + 20, yPosition, { maxWidth });
        doc.text(formatCurrency(item.balance), rightMargin - 3, yPosition, { align: 'right' });
        yPosition += 5;
      });
      doc.setFillColor(220, 240, 255);
      doc.rect(leftMargin + 8, yPosition - 4, rightMargin - leftMargin - 8, 6, 'F');
      doc.setFont(undefined, 'bold');
      doc.text(`TOTAL ${subGroup.name.toUpperCase()}`, leftMargin + 10, yPosition);
      doc.text(formatCurrency(subGroup.total), rightMargin - 3, yPosition, { align: 'right' });
      yPosition += 8;
    });
    doc.setFillColor(200, 200, 200);
    doc.rect(leftMargin + 3, yPosition - 4, rightMargin - leftMargin - 3, 7, 'F');
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL ${typeGroup.name.toUpperCase()}`, leftMargin + 5, yPosition);
    doc.text(formatCurrency(typeGroup.total), rightMargin - 3, yPosition, { align: 'right' });
    yPosition += 10;
  });
  doc.setFillColor(140, 140, 140);
  doc.rect(leftMargin, yPosition - 5, rightMargin - leftMargin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(`TOTAL ${title}`, leftMargin + 2, yPosition);
  doc.text(formatCurrency(sectionData.total), rightMargin - 3, yPosition, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  yPosition += 15;

  return yPosition;
};
export const exportAccountJournalToPDF = async (processedData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }

  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 10;
    const rightMargin = pageWidth - 10;
    
    let yPosition = await addStandardPDFHeader(doc, pageWidth, companyName, reportName, selectedBranch, submittedFilters, false, false);
    
    const grouped = processedData.grouped || {};
    let isFirstTable = true;
    
    Object.entries(grouped).forEach(([branchKey, branchData]) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFillColor(64, 64, 64);
      doc.rect(leftMargin, yPosition - 5, rightMargin - leftMargin, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(branchData.branchName, leftMargin + 2, yPosition);
      yPosition += 10;
      
      const tableHeaders = [
        'Batch ID', 
        'Serial ID', 
        'Branch', 
        'Date', 
        'Account Number', 
        "Customer's Acc", 
        'Account Name', 
        'Description', 
        'Debit', 
        'Credit', 
        'Customer Name', 
        'Operator ID'
      ];
      
      const tableData = branchData.transactions.map(transaction => [
        transaction.TrxBatchID || '',
        transaction.SerialID || '',
        transaction.TrxBranchID || '',
        formatDate(transaction.TrxDate),
        transaction.GLAccountID || '',
        transaction.CustomerAccountID || '',
        transaction.GLAccountName || '',
        transaction.TrxDescription || '',
        formatCurrency(transaction.Debit || 0),
        formatCurrency(transaction.Credit || 0),
        transaction.CustomerName || '',
        transaction.CreatedBy || ''
      ]);
      autoTable(doc, {
        startY: yPosition,
        head: isFirstTable ? [tableHeaders] : undefined,  
        body: tableData,
        theme: 'plain',
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          overflow: 'linebreak',
          cellWidth: 'wrap',
          lineWidth: 0,
          lineColor: [0, 0, 0]
        },
        headStyles: {
          fillColor: [224, 224, 224],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 7,
          halign: 'center',
          lineWidth: 0.1,
          lineColor: [0, 0, 0]
        },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 18 },
          2: { cellWidth: 15 },
          3: { cellWidth: 22 },
          4: { cellWidth: 22 },
          5: { cellWidth: 22 },
          6: { cellWidth: 30 },
          7: { cellWidth: 45 },
          8: { cellWidth: 20, halign: 'right' },
          9: { cellWidth: 20, halign: 'right' },
          10: { cellWidth: 30 },
          11: { cellWidth: 18 }
        },
        margin: { left: leftMargin, right: leftMargin, bottom: 25 }, 
        didDrawCell: function(data) {
          if (data.section === 'body' && data.column.index === 0) {
            const y = data.cell.y + data.cell.height;
            doc.setDrawColor(150, 150, 150);
            doc.setLineWidth(0.1);
            doc.setLineDash([1, 1]);
            doc.line(leftMargin, y, rightMargin, y);
            doc.setLineDash([]);
          }
        },
        didDrawPage: function(data) {
          yPosition = data.cursor.y;
        }
      });
      isFirstTable = false;
      
      yPosition += 10;
    });
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addPDFFooter(doc, pageHeight, leftMargin, pageWidth, i, totalPages);
    }
    
    doc.save(generateFilename(reportName, 'pdf'));
    console.log('Account Journal PDF export successful');
  } catch (error) {
    console.error('Error exporting Account Journal to PDF:', error);
    throw error;
  }
};

export const exportGeneralLedgerToPDF = async (processedData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!processedData || !processedData.accounts) {
    console.error('No processed data to export');
    return;
  }

  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 10;
    const rightMargin = pageWidth - 10;
    
    let yPosition = await addStandardPDFHeader(doc, pageWidth, companyName, reportName, selectedBranch, submittedFilters, false, false);
    
    const tableHeaders = [
      'TRX DATE', 
      'SERIALID', 
      'DESCRIPTION', 
      'Debit', 
      'Credit', 
      'Cumulated\nDebit', 
      'Cumulated\nCredit', 
      'Closing\nDebit', 
      'Closing\nCredit', 
      'Third Party\nAccount'
    ];
    
    const tableData = [];
    processedData.accounts.forEach((account) => {
      account.transactions.forEach((transaction) => {
        const row = [
          formatDate(transaction.TrxDate),
          transaction.SerialID || '',
          transaction.TrxDescription || '',
          formatCurrency(transaction.Debit || transaction.DebitAmount || 0),
          formatCurrency(transaction.Credit || transaction.CreditAmount || 0),
          formatCurrency(transaction.CumulativeDr || 0),
          formatCurrency(transaction.CumulativeCr || 0),
          formatCurrency(transaction.ClosingDr || 0),
          formatCurrency(transaction.ClosingCr || 0),
          transaction.ThirdPartyAcct || transaction.CustomerAccountID || ''
        ];
        tableData.push(row);
      });
    });
    
    autoTable(doc, {
      startY: yPosition,
      head: [tableHeaders],
      body: tableData,
      theme: 'plain',
      showHead: 'firstPage',   
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        overflow: 'linebreak',
        cellWidth: 'wrap',
        lineWidth: 0.1,  
        lineColor: [200, 200, 200] 
      },
      headStyles: {
        fillColor: [224, 224, 224],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7,
        halign: 'center',
        lineWidth: 0.1,
        lineColor: [200, 200, 200] 
      },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' },  
        1: { cellWidth: 15, halign: 'center' },   
        2: { cellWidth: 70 },                     
        3: { cellWidth: 22, halign: 'right' },  
        4: { cellWidth: 22, halign: 'right' },  
        5: { cellWidth: 22, halign: 'right' },    
        6: { cellWidth: 22, halign: 'right' },   
        7: { cellWidth: 22, halign: 'right' },   
        8: { cellWidth: 22, halign: 'right' },   
        9: { cellWidth: 25, halign: 'center' }  
      },
      margin: { left: leftMargin, right: leftMargin, bottom: 25 },
      didDrawCell: function(data) {
        if (data.section === 'body' || data.section === 'head') {
          const { x, y, width, height } = data.cell;
          doc.setDrawColor(200, 200, 200); 
          doc.setLineWidth(0.1);
          doc.setLineDash([]); 
          doc.rect(x, y, width, height);
        }
      },
      didDrawPage: function(data) {
        yPosition = data.cursor.y;
      }
    });
    
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addPDFFooter(doc, pageHeight, leftMargin, pageWidth, i, totalPages);
    }
    
    doc.save(generateFilename(reportName, 'pdf'));
    console.log('General Ledger PDF export successful');
  } catch (error) {
    console.error('Error exporting General Ledger to PDF:', error);
    throw error;
  }
};

export const exportSavingsStatementToPDF = async (exportData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (Array.isArray(exportData)) {
    const processedData = processSavingsDataForExport(exportData);
    return exportProcessedSavingsDataPDF(processedData, reportName, companyName, selectedBranch, submittedFilters);
  }
  if (exportData && (exportData.accountInfo || exportData.transactions || exportData.rawData)) {
    return exportProcessedSavingsDataPDF(exportData, reportName, companyName, selectedBranch, submittedFilters);
  }
  console.error('No valid data to export');
  return;
};
const exportProcessedSavingsDataPDF = async (processedData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 14;
    const rightMargin = pageWidth - 14;
    
    const { accountInfo, transactions } = processedData;
    const loggedInBranch = getBranchName();
    
    let yPosition = 25;
    const logoUrl = getBankLogo();
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
              const logoHeight = (img.height / img.width) * logoWidth;
              doc.addImage(imgData, 'PNG', leftMargin, yPosition - 5, logoWidth, logoHeight);
              resolve();
            } catch (err) {
              resolve();
            }
          };
          img.onerror = () => resolve();
          img.src = logoUrl;
        });
      } catch (error) {
        console.warn('Logo loading error:', error);
      }
    }
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(companyName || 'BUDDU CBS PEWOSA SACCO LIMITED', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    doc.setFontSize(12);
    doc.text((loggedInBranch || 'BRANCH').toUpperCase(), pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    
    doc.setFontSize(11);
    doc.text('Savings Account Statement', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Branch ID: ${accountInfo.branchId}    AccountID: ${accountInfo.accountNumber}    From Date: ${formatDate(submittedFilters.FromDate)}    To Date: ${formatDate(submittedFilters.ToDate)}`, leftMargin, yPosition);
    yPosition += 8;
    doc.setFontSize(8);
    const details = [
      ['Account Number', accountInfo.accountNumber, 'Account Name :', accountInfo.productName, 'Account Owner :', accountInfo.accountName.toUpperCase()],
      ['Account Currency:',accountInfo.accountCurrency , 'Opening Balance:', formatCurrency(accountInfo.openingBalance), 'Available Balance :', formatCurrency(accountInfo.availableBalance)],
      ['Freezed Amount :', formatCurrency(accountInfo.freezedAmount), 'Uncleared Balance :', formatCurrency(accountInfo.unclearedBalance), 'Transactions Done :', accountInfo.transactionsDone]
    ];

    details.forEach(row => {
      doc.setFont(undefined, 'bold');
      doc.text(row[0], leftMargin, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(row[1], leftMargin + 32, yPosition);

      doc.setFont(undefined, 'bold');
      doc.text(row[2], leftMargin + 68, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(String(row[3]), leftMargin + 98, yPosition);

      doc.setFont(undefined, 'bold');
      doc.text(row[4], leftMargin + 128, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(String(row[5]), leftMargin + 160, yPosition, { maxWidth: 35 });
      
      yPosition += 5;
    });
    yPosition += 5;
    const tableHeaders = [['Trx.Date', 'Trx.Time', 'Description', 'Debit', 'Credit', 'Running Balance', 'Trx.Type']];
    const tableData = transactions.map(t => [
      formatDate(t.trxDate),
      new Date(t.trxTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      t.description,
      t.debit > 0 ? `(${formatCurrency(t.debit)})` : '',
      t.credit > 0 ? formatCurrency(t.credit) : '',
      formatCurrency(t.runningBalance),
      t.trxType
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: tableHeaders,
      body: tableData,
      theme: 'plain',
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        lineWidth: 0,
      },
      headStyles: {
        fillColor: [224, 224, 224],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 18 },
        2: { cellWidth: 65 },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 15 }
      },
      didDrawCell: function(data) {
        if (data.section === 'body') {
          const y = data.cell.y + data.cell.height;
          doc.setDrawColor(150, 150, 150);
          doc.setLineWidth(0.1);
          doc.setLineDash([1, 1]);
          doc.line(leftMargin, y, rightMargin, y);
          doc.setLineDash([]);
        }
      },
      margin: { left: leftMargin, right: leftMargin }
    });
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addPDFFooter(doc, pageHeight, leftMargin, pageWidth, i, totalPages);
    }
    
    doc.save(generateFilename(reportName, 'pdf'));
    console.log('Savings Statement PDF export successful');
  } catch (error) {
    console.error('Error exporting Savings Statement to PDF:', error);
    throw error;
  }
};

export const exportPortfolioAtRiskToPDF = async (exportData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (exportData && exportData.branches) {
    return exportProcessedPortfolioAtRiskDataPDF(exportData, reportName, companyName, selectedBranch, submittedFilters);
  }
  if (Array.isArray(exportData)) {
    const processedData = processPortfolioAtRiskDataForExport(exportData);
    return exportProcessedPortfolioAtRiskDataPDF(processedData, reportName, companyName, selectedBranch, submittedFilters);
  }
  
  console.error('No valid data to export');
  return;
};

const exportProcessedPortfolioAtRiskDataPDF = async (processedData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const doc = new jsPDF('l', 'mm', 'a4'); 
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const { branches } = processedData;
    let yPosition = await addStandardPDFHeader(doc, pageWidth, companyName, reportName, selectedBranch, submittedFilters, false, false);
    
    const headers = [
      'Account ID', 'Account Name', 'Days', 'Loan Amount', 'OS Principal', 'OS Interest', 
      'Total Outstanding', 'Portfolio at Risk(PAR)', 'Principal Paid', 'Total Paid', 
      'Principal', 'Interest', 'Total', 'Rate', '%PAR'
    ];
    const columnWidths = [20, 35, 12, 20, 20, 20, 22, 25, 20, 20, 20, 20, 20, 12, 12];
    const totalTableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const leftMargin = (pageWidth - totalTableWidth) / 2;
    const rightMargin = pageWidth - leftMargin;
    const tableData = [];
    
    branches.forEach((branch) => {
      tableData.push([
        { content: `Branch Name: ${branch.branchName}`, colSpan: 15, styles: { 
          fillColor: [64, 64, 64], 
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11,
          halign: 'left',
          textDecoration: 'underline'
        }}
      ]);
      
      branch.officers.forEach((officer) => {
        tableData.push([
          { content: `Loan Officer: ${officer.officerName}`, colSpan: 15, styles: { 
            fillColor: [96, 96, 96], 
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10,
            halign: 'left',
            textDecoration: 'underline'
          }}
        ]);
        
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
          
          tableData.push([
            record.AccountID || '',
            record.AccountName || '',
            record.ArrearsDays || 0,
            formatCurrency(record.DisbAmt || 0),
            formatCurrency(record.OSPrinciple || 0),
            formatCurrency(record.OSInterest || 0),
            formatCurrency(totalOutstanding),
            formatCurrency(portfolioAtRisk),
            formatCurrency(record.PrincipalPaid || 0),
            formatCurrency(record.TotalPaid || 0),
            formatCurrency(record.ArrearsPrinciple || 0),
            formatCurrency(record.ArrearsInterest || 0),
            formatCurrency(arrearsTotal),
            (record.PARpercentage || 0).toFixed(2),
            (record.PARpercentage || 0).toFixed(2)
          ]);
        });
        
        tableData.push([
          { content: 'Total By Loan Officer', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
          officerTotals.count,
          formatCurrency(officerTotals.disbAmt),
          formatCurrency(officerTotals.osPrinciple),
          formatCurrency(officerTotals.osInterest),
          formatCurrency(officerTotals.totalOutstanding),
          formatCurrency(officerTotals.portfolioAtRisk),
          formatCurrency(officerTotals.principalPaid),
          formatCurrency(officerTotals.totalPaid),
          formatCurrency(officerTotals.arrearsPrinciple),
          formatCurrency(officerTotals.arrearsInterest),
          formatCurrency(officerTotals.arrearsTotal),
          '-',
          '-'
        ]);
        tableData.push(new Array(15).fill(''));
      });
      
      tableData.push([
        { content: 'Total By Branch', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [173, 216, 230] } },
        branch.totals.count,
        formatCurrency(branch.totals.disbAmt),
        formatCurrency(branch.totals.osPrinciple),
        formatCurrency(branch.totals.osInterest),
        formatCurrency(branch.totals.totalOutstanding),
        formatCurrency(branch.totals.portfolioAtRisk),
        formatCurrency(branch.totals.principalPaid),
        formatCurrency(branch.totals.totalPaid),
        formatCurrency(branch.totals.arrearsPrinciple),
        formatCurrency(branch.totals.arrearsInterest),
        formatCurrency(branch.totals.arrearsTotal),
        '-',
        '-'
      ]);
      tableData.push(new Array(15).fill(''));
    });
    
    autoTable(doc, {
      startY: yPosition,
      head: [headers],
      body: tableData,
      theme: 'grid',
      margin: { left: leftMargin, right: leftMargin, bottom: 25 },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        cellWidth: 'wrap',
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      headStyles: {
        fillColor: [224, 224, 224],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: columnWidths[0], halign: 'left' },
        1: { cellWidth: columnWidths[1], halign: 'left' },
        2: { cellWidth: columnWidths[2], halign: 'center' },
        3: { cellWidth: columnWidths[3], halign: 'right' },
        4: { cellWidth: columnWidths[4], halign: 'right' },
        5: { cellWidth: columnWidths[5], halign: 'right' },
        6: { cellWidth: columnWidths[6], halign: 'right' },
        7: { cellWidth: columnWidths[7], halign: 'right' },
        8: { cellWidth: columnWidths[8], halign: 'right' },
        9: { cellWidth: columnWidths[9], halign: 'right' },
        10: { cellWidth: columnWidths[10], halign: 'right' },
        11: { cellWidth: columnWidths[11], halign: 'right' },
        12: { cellWidth: columnWidths[12], halign: 'right' },
        13: { cellWidth: columnWidths[13], halign: 'right' },
        14: { cellWidth: columnWidths[14], halign: 'right' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.row.index < tableData.length) {
          const rowData = tableData[data.row.index];
          if (rowData && Array.isArray(rowData) && rowData.length > 0) {
            const firstCell = rowData[0];
            if (firstCell && typeof firstCell === 'object' && firstCell.content) {
              const colSpan = firstCell.colSpan || 15;
              if (data.column.index === 0) {
                if (firstCell.styles) {
                  data.cell.styles.fillColor = firstCell.styles.fillColor || [64, 64, 64];
                  data.cell.styles.textColor = firstCell.styles.textColor || [255, 255, 255];
                  data.cell.styles.fontStyle = firstCell.styles.fontStyle || 'bold';
                  data.cell.styles.fontSize = firstCell.styles.fontSize || 11;
                  data.cell.styles.halign = firstCell.styles.halign || 'left';
                }
                data.cell.text = firstCell.content;
                data.cell.colSpan = colSpan;
              } else if (data.column.index < colSpan) {
                data.cell.styles.fillColor = firstCell.styles?.fillColor || [64, 64, 64];
                data.cell.styles.textColor = firstCell.styles?.textColor || [255, 255, 255];
                data.cell.text = '';
              }
            }
          }
        }
        if (data.section === 'body' && data.column.index >= 3 && data.column.index <= 12) {
          if (typeof data.cell.text === 'string' && data.cell.text.includes(',')) {
          }
        }
        if (data.section === 'body' && (data.column.index === 13 || data.column.index === 14)) {
          if (typeof data.cell.text === 'string') {
            const numValue = parseFloat(data.cell.text);
            if (!isNaN(numValue)) {
              data.cell.text = numValue.toFixed(2);
            }
          }
        }
      },
      didDrawPage: function(data) {
        yPosition = data.cursor.y;
      }
    });
    
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addPDFFooter(doc, pageHeight, leftMargin, pageWidth, i, totalPages);
    }
    
    doc.save(generateFilename(reportName, 'pdf'));
    console.log('Portfolio at Risk PDF export successful');
  } catch (error) {
    console.error('Error exporting Portfolio at Risk to PDF:', error);
    throw error;
  }
};

export const exportExpectedRepaymentsToPDF = async (exportData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (exportData && exportData.branches) {
    return exportProcessedExpectedRepaymentsDataPDF(exportData, reportName, companyName, selectedBranch, submittedFilters);
  }
  if (Array.isArray(exportData)) {
    const processedData = processExpectedRepaymentsDataForExport(exportData);
    return exportProcessedExpectedRepaymentsDataPDF(processedData, reportName, companyName, selectedBranch, submittedFilters);
  }
  
  console.error('No valid data to export');
  return;
};

const exportProcessedExpectedRepaymentsDataPDF = async (processedData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const doc = new jsPDF('l', 'mm', 'a4'); 
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const { branches } = processedData;
    let yPosition = await addStandardPDFHeader(doc, pageWidth, companyName, reportName, selectedBranch, submittedFilters, false, false);
    
    const headers = [
      'AccountID', 'Name', 'Mobile', 'PrincipalBal', 'Principal Due', 
      'Interest Due', 'PenaltyDue', 'Total Due'
    ];
    const columnWidths = [25, 50, 25, 30, 30, 30, 30, 30];
    const totalTableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const leftMargin = 10;
    const rightMargin = pageWidth - leftMargin;
    const tableData = [];
    
    branches.forEach((branch) => {
      tableData.push([
        { content: `Branch Name: ${branch.branchName}`, colSpan: 8, styles: { 
          fillColor: [64, 64, 64], 
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11,
          halign: 'left',
          textDecoration: 'underline'
        }}
      ]);
      
      branch.officers.forEach((officer) => {
        tableData.push([
          { content: `Loan Officer: ${officer.officerName}`, colSpan: 8, styles: { 
            fillColor: [96, 96, 96], 
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10,
            halign: 'left',
            textDecoration: 'underline'
          }}
        ]);
        
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
          
          tableData.push([
            record.AccountID || '',
            record.Name || '',
            record.Mobile || '',
            formatCurrency(record.PrincipalOutstanding || 0),
            formatCurrency(principalDue),
            formatCurrency(interestDue),
            formatCurrency(record.PenaltyDue || 0),
            formatCurrency(totalDue)
          ]);
        });
        
        tableData.push([
          { content: 'Total By Loan Officer', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
          officerTotals.count,
          formatCurrency(officerTotals.principalBal),
          formatCurrency(officerTotals.principalDue),
          formatCurrency(officerTotals.interestDue),
          formatCurrency(officerTotals.penaltyDue),
          formatCurrency(officerTotals.totalDue)
        ]);
        tableData.push(new Array(8).fill(''));
      });
      
      tableData.push([
        { content: 'Total By Branch', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [173, 216, 230] } },
        branch.totals.count,
        formatCurrency(branch.totals.principalBal),
        formatCurrency(branch.totals.principalDue),
        formatCurrency(branch.totals.interestDue),
        formatCurrency(branch.totals.penaltyDue),
        formatCurrency(branch.totals.totalDue)
      ]);
      tableData.push(new Array(8).fill(''));
    });
    
    autoTable(doc, {
      startY: yPosition,
      head: [headers],
      body: tableData,
      theme: 'grid',
      margin: { left: leftMargin, right: leftMargin, bottom: 25 },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        cellWidth: 'wrap',
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      headStyles: {
        fillColor: [224, 224, 224],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: columnWidths[0], halign: 'left' },
        1: { cellWidth: columnWidths[1], halign: 'left' },
        2: { cellWidth: columnWidths[2], halign: 'left' },
        3: { cellWidth: columnWidths[3], halign: 'right' },
        4: { cellWidth: columnWidths[4], halign: 'right' },
        5: { cellWidth: columnWidths[5], halign: 'right' },
        6: { cellWidth: columnWidths[6], halign: 'right' },
        7: { cellWidth: columnWidths[7], halign: 'right' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.row.index < tableData.length) {
          const rowData = tableData[data.row.index];
          if (rowData && Array.isArray(rowData) && rowData.length > 0) {
            const firstCell = rowData[0];
            if (firstCell && typeof firstCell === 'object' && firstCell.content) {
              const colSpan = firstCell.colSpan || 8;
              if (data.column.index === 0) {
                if (firstCell.styles) {
                  data.cell.styles.fillColor = firstCell.styles.fillColor || [64, 64, 64];
                  data.cell.styles.textColor = firstCell.styles.textColor || [255, 255, 255];
                  data.cell.styles.fontStyle = firstCell.styles.fontStyle || 'bold';
                  data.cell.styles.fontSize = firstCell.styles.fontSize || 11;
                  data.cell.styles.halign = firstCell.styles.halign || 'left';
                }
                data.cell.text = firstCell.content;
                data.cell.colSpan = colSpan;
              } else if (data.column.index < colSpan) {
                data.cell.styles.fillColor = firstCell.styles?.fillColor || [64, 64, 64];
                data.cell.styles.textColor = firstCell.styles?.textColor || [255, 255, 255];
                data.cell.text = '';
              }
            }
          }
        }
      },
      didDrawPage: function(data) {
        yPosition = data.cursor.y;
      }
    });
    
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addPDFFooter(doc, pageHeight, leftMargin, pageWidth, i, totalPages);
    }
    
    doc.save(generateFilename(reportName, 'pdf'));
    console.log('Expected Repayments PDF export successful');
  } catch (error) {
    console.error('Error exporting Expected Repayments to PDF:', error);
    throw error;
  }
};

export const exportSavingsVsLoanBalanceToPDF = async (exportData, reportName, companyName, selectedBranch, submittedFilters, reportData = null, reportId = null) => {
  if (exportData && exportData.branches) {
    return exportProcessedSavingsVsLoanBalanceDataPDF(exportData, reportName, companyName, selectedBranch, submittedFilters, reportData, reportId);
  }
  if (Array.isArray(exportData)) {
    const processedData = processSavingsVsLoanBalanceDataForExport(exportData);
    return exportProcessedSavingsVsLoanBalanceDataPDF(processedData, reportName, companyName, selectedBranch, submittedFilters, reportData, reportId);
  }
  console.error('No valid data to export');
  return;
};

const exportProcessedSavingsVsLoanBalanceDataPDF = async (processedData, reportName, companyName, selectedBranch, submittedFilters, reportData = null, reportId = null) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 10;
    const rightMargin = 10;
    let yPosition = await addStandardPDFHeader(doc, pageWidth, companyName, reportName, selectedBranch, {}, false, false);
    
    if (reportData && reportId) {
      const allParams = getAllParametersForReport(reportData, reportId, submittedFilters);
      if (allParams.length > 0) {
        const paramParts = allParams.map(p => `${p.caption}-${p.value}`);
        const paramText = paramParts.join('  ');
        doc.setFontSize(8);
        doc.text(paramText, leftMargin, yPosition, { align: 'left' });
        yPosition += 7;
      }
    }
    
    const headers = ['Loan A/C', 'Name', 'Mobile', 'Out Principle', 'PrincipalDue', 'InterestDue', 'Penalty&Sms', 'Avl. Bal', 'Total Due'];
    const tableData = [];
    const { branches } = processedData;
    
    branches.forEach((branch) => {
      tableData.push([
        { content: `Branch Name: ${branch.branchName}`, colSpan: 9, styles: { 
          fillColor: [64, 64, 64], 
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11,
          halign: 'left',
          textDecoration: 'underline'
        }}
      ]);
      
      branch.officers.forEach((officer) => {
        tableData.push([
          { content: `Loan Officer: ${officer.officerName}`, colSpan: 9, styles: { 
            fillColor: [96, 96, 96], 
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10,
            halign: 'left',
            textDecoration: 'underline'
          }}
        ]);
        
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
          
          tableData.push([
            record['Loan A/C'] || record.AccountID || '',
            record.Name || '',
            record.Mobile || '',
            formatCurrency(record.OutTPrincipal || 0),
            formatCurrency(record.PrinDueToDate || 0),
            formatCurrency(record.IntDueToDate || 0),
            formatCurrency(record.PenaltyAmount || 0),
            formatCurrency(record.AvailableBalance || 0),
            formatCurrency(record.TotDueToDate || 0)
          ]);
        });
        
        tableData.push([
          { content: 'Total By Loan Officer', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
          officerTotals.count,
          formatCurrency(officerTotals.outPrinciple),
          formatCurrency(officerTotals.principalDue),
          formatCurrency(officerTotals.interestDue),
          formatCurrency(officerTotals.penaltySms),
          formatCurrency(officerTotals.avlBal),
          formatCurrency(officerTotals.totalDue)
        ]);
        tableData.push(new Array(9).fill(''));
      });
      
      tableData.push([
        { content: 'Total By Branch', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [173, 216, 230] } },
        branch.totals.count,
        formatCurrency(branch.totals.outPrinciple),
        formatCurrency(branch.totals.principalDue),
        formatCurrency(branch.totals.interestDue),
        formatCurrency(branch.totals.penaltySms),
        formatCurrency(branch.totals.avlBal),
        formatCurrency(branch.totals.totalDue)
      ]);
      tableData.push(new Array(9).fill(''));
    });
    
    autoTable(doc, {
      startY: yPosition,
      head: [headers],
      body: tableData,
      theme: 'plain',
      showHead: 'firstPage',
      margin: { left: leftMargin, right: leftMargin, bottom: 25 },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        cellWidth: 'wrap',
        lineWidth: 0,
        lineColor: [200, 200, 200]
      },
      headStyles: {
        fillColor: [224, 224, 224],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        lineWidth: 0
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'left' },
        1: { cellWidth: 40, halign: 'left' },
        2: { cellWidth: 25, halign: 'left' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' },
        6: { cellWidth: 30, halign: 'right' },
        7: { cellWidth: 30, halign: 'right' },
        8: { cellWidth: 30, halign: 'right' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.row.index < tableData.length) {
          const rowData = tableData[data.row.index];
          if (rowData && Array.isArray(rowData) && rowData.length > 0) {
            const firstCell = rowData[0];
            if (firstCell && typeof firstCell === 'object' && firstCell.content) {
              const colSpan = firstCell.colSpan || 9;
              if (data.column.index === 0) {
                if (firstCell.styles) {
                  data.cell.styles.fillColor = firstCell.styles.fillColor || [64, 64, 64];
                  data.cell.styles.textColor = firstCell.styles.textColor || [255, 255, 255];
                  data.cell.styles.fontStyle = firstCell.styles.fontStyle || 'bold';
                  data.cell.styles.fontSize = firstCell.styles.fontSize || 11;
                  data.cell.styles.halign = firstCell.styles.halign || 'left';
                }
                data.cell.text = firstCell.content;
                data.cell.colSpan = colSpan;
              } else if (data.column.index < colSpan) {
                data.cell.styles.fillColor = firstCell.styles?.fillColor || [64, 64, 64];
                data.cell.styles.textColor = firstCell.styles?.textColor || [255, 255, 255];
                data.cell.text = '';
              }
            }
          }
        }
      },
      didDrawCell: function(data) {
        if (data.section === 'body' || data.section === 'head') {
          const { x, y, width, height } = data.cell;
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.1);
          doc.setLineDash([2, 2]);
          doc.rect(x, y, width, height);
          doc.setLineDash([]);
        }
      },
      didDrawPage: function(data) {
        yPosition = data.cursor.y;
      }
    });
    
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addPDFFooter(doc, pageHeight, leftMargin, pageWidth, i, totalPages);
    }
    
    doc.save(generateFilename(reportName, 'pdf'));
    console.log('Savings vs Loan Balance PDF export successful');
  } catch (error) {
    console.error('Error exporting Savings vs Loan Balance to PDF:', error);
    throw error;
  }
};

export const exportLoansDisbursedToPDF = async (exportData, reportName, companyName, selectedBranch, submittedFilters, reportData = null, reportId = null) => {
  if (exportData && exportData.branches) {
    return exportProcessedLoansDisbursedDataPDF(exportData, reportName, companyName, selectedBranch, submittedFilters, reportData, reportId);
  }
  if (Array.isArray(exportData)) {
    const processedData = processLoansDisbursedDataForExport(exportData);
    return exportProcessedLoansDisbursedDataPDF(processedData, reportName, companyName, selectedBranch, submittedFilters, reportData, reportId);
  }
  console.error('No valid data to export');
  return;
};

const exportProcessedLoansDisbursedDataPDF = async (processedData, reportName, companyName, selectedBranch, submittedFilters, reportData = null, reportId = null) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 10;
    const rightMargin = 10;
    let yPosition = await addStandardPDFHeader(doc, pageWidth, companyName, reportName, selectedBranch, {}, false, false);
    
    if (reportData && reportId) {
      const allParams = getAllParametersForReport(reportData, reportId, submittedFilters);
      if (allParams.length > 0) {
        const paramParts = allParams.map(p => `${p.caption}-${p.value}`);
        const paramText = paramParts.join('  ');
        doc.setFontSize(8);
        doc.text(paramText, leftMargin, yPosition, { align: 'left' });
        yPosition += 7;
      }
    }
    
    const headers = ['Loan ID', 'Borrower', 'Date of Loan Disbursement', 'Maturity Date', 'Rate', 'Term', 'Repayment Period', 'Disbursement Amount', 'Interest Amount', 'Total Loan Amount', 'Principal Paid', 'Interest Paid'];
    const tableData = [];
    const { branches } = processedData;
    
    branches.forEach((branch) => {
      tableData.push([
        { content: `Branch Name: ${branch.branchName}`, colSpan: 12, styles: { 
          fillColor: [64, 64, 64], 
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11,
          halign: 'left',
          textDecoration: 'underline'
        }}
      ]);
      
      branch.officers.forEach((officer) => {
        tableData.push([
          { content: `Loan Officer: ${officer.officerName}`, colSpan: 12, styles: { 
            fillColor: [96, 96, 96], 
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10,
            halign: 'left',
            textDecoration: 'underline'
          }}
        ]);
        
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
          
          tableData.push([
            record.AccountID || '',
            record.Name || '',
            formatDate(record.DisbursementDate),
            formatDate(record.MaturityDate),
            record.InterestRate || 0,
            record.Term || 0,
            record.RepaymentPeriod || '',
            formatCurrency(disbursementAmount),
            formatCurrency(interestAmount),
            formatCurrency(totalLoanAmount),
            formatCurrency(record.PrincipalPaid || 0),
            formatCurrency(record.InterestPaid || 0)
          ]);
        });
        
        tableData.push([
          { content: 'Total By Loan Officer', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
          '',
          '',
          '',
          '',
          '',
          officerTotals.count,
          formatCurrency(officerTotals.disbursementAmount),
          formatCurrency(officerTotals.interestAmount),
          formatCurrency(officerTotals.totalLoanAmount),
          formatCurrency(officerTotals.principalPaid),
          formatCurrency(officerTotals.interestPaid)
        ]);
        tableData.push(new Array(12).fill(''));
      });
      
      tableData.push([
        { content: 'Total By Branch', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [173, 216, 230] } },
        '',
        '',
        '',
        '',
        '',
        branch.totals.count,
        formatCurrency(branch.totals.disbursementAmount),
        formatCurrency(branch.totals.interestAmount),
        formatCurrency(branch.totals.totalLoanAmount),
        formatCurrency(branch.totals.principalPaid),
        formatCurrency(branch.totals.interestPaid)
      ]);
      tableData.push(new Array(12).fill(''));
    });
    
    autoTable(doc, {
      startY: yPosition,
      head: [headers],
      body: tableData,
      theme: 'plain',
      showHead: 'firstPage',
      margin: { left: leftMargin, right: leftMargin, bottom: 25 },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak',
        cellWidth: 'wrap',
        lineWidth: 0,
        lineColor: [200, 200, 200]
      },
      headStyles: {
        fillColor: [224, 224, 224],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7,
        halign: 'center',
        lineWidth: 0
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'left' },
        1: { cellWidth: 35, halign: 'left' },
        2: { cellWidth: 25, halign: 'left' },
        3: { cellWidth: 25, halign: 'left' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 15, halign: 'center' },
        6: { cellWidth: 25, halign: 'left' },
        7: { cellWidth: 28, halign: 'right' },
        8: { cellWidth: 28, halign: 'right' },
        9: { cellWidth: 28, halign: 'right' },
        10: { cellWidth: 28, halign: 'right' },
        11: { cellWidth: 28, halign: 'right' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.row.index < tableData.length) {
          const rowData = tableData[data.row.index];
          if (rowData && Array.isArray(rowData) && rowData.length > 0) {
            const firstCell = rowData[0];
            if (firstCell && typeof firstCell === 'object' && firstCell.content) {
              const colSpan = firstCell.colSpan || 12;
              if (data.column.index === 0) {
                if (firstCell.styles) {
                  data.cell.styles.fillColor = firstCell.styles.fillColor || [64, 64, 64];
                  data.cell.styles.textColor = firstCell.styles.textColor || [255, 255, 255];
                  data.cell.styles.fontStyle = firstCell.styles.fontStyle || 'bold';
                  data.cell.styles.fontSize = firstCell.styles.fontSize || 11;
                  data.cell.styles.halign = firstCell.styles.halign || 'left';
                }
                data.cell.text = firstCell.content;
                data.cell.colSpan = colSpan;
              } else if (data.column.index < colSpan) {
                data.cell.styles.fillColor = firstCell.styles?.fillColor || [64, 64, 64];
                data.cell.styles.textColor = firstCell.styles?.textColor || [255, 255, 255];
                data.cell.text = '';
              }
            }
          }
        }
      },
      didDrawCell: function(data) {
        if (data.section === 'body' || data.section === 'head') {
          const { x, y, width, height } = data.cell;
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.1);
          doc.setLineDash([2, 2]);
          doc.rect(x, y, width, height);
          doc.setLineDash([]);
        }
      },
      didDrawPage: function(data) {
        yPosition = data.cursor.y;
      }
    });
    
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addPDFFooter(doc, pageHeight, leftMargin, pageWidth, i, totalPages);
    }
    
    doc.save(generateFilename(reportName, 'pdf'));
    console.log('Loans Disbursed PDF export successful');
  } catch (error) {
    console.error('Error exporting Loans Disbursed to PDF:', error);
    throw error;
  }
};

export const exportLoanAgeingToPDF = async (exportData, reportName, companyName, selectedBranch, submittedFilters, reportData = null, reportId = null) => {
  if (exportData && exportData.branches) {
    return exportProcessedLoanAgeingDataPDF(exportData, reportName, companyName, selectedBranch, submittedFilters, reportData, reportId);
  }
  if (Array.isArray(exportData)) {
    const processedData = processLoanAgeingDataForExport(exportData);
    return exportProcessedLoanAgeingDataPDF(processedData, reportName, companyName, selectedBranch, submittedFilters, reportData, reportId);
  }
  console.error('No valid data to export');
  return;
};

const exportProcessedLoanAgeingDataPDF = async (processedData, reportName, companyName, selectedBranch, submittedFilters, reportData = null, reportId = null) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 10;
    const rightMargin = 10;
    let yPosition = await addStandardPDFHeader(doc, pageWidth, companyName, reportName, selectedBranch, {}, false, false);
    
    if (reportData && reportId) {
      const allParams = getAllParametersForReport(reportData, reportId, submittedFilters);
      if (allParams.length > 0) {
        const paramParts = allParams.map(p => `${p.caption}-${p.value}`);
        const paramText = paramParts.join('  ');
        doc.setFontSize(8);
        doc.text(paramText, leftMargin, yPosition, { align: 'left' });
        yPosition += 7;
      }
    }
    
    const headers = ['A/C No', 'Name', 'Phone', 'Days', 'OSPrincipal', 'Prin. in Arrears', '1-30 Days', '31-60 Days', '61-90 Days', '91-120 Days', '121-180 Days', 'Above180 Day'];
    const tableData = [];
    const { branches } = processedData;
    
    branches.forEach((branch) => {
      tableData.push([
        { content: `Branch Name: ${branch.branchName}`, colSpan: 12, styles: { 
          fillColor: [64, 64, 64], 
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11,
          halign: 'left',
          textDecoration: 'underline'
        }}
      ]);
      
      branch.officers.forEach((officer) => {
        tableData.push([
          { content: `Loan Officer: ${officer.officerName}`, colSpan: 12, styles: { 
            fillColor: [96, 96, 96], 
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10,
            halign: 'left',
            textDecoration: 'underline'
          }}
        ]);
        
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
          
          tableData.push([
            record['A/C No'] || record.ACNo || record.AccountID || '',
            record.Name || '',
            record.PhoneNo || '',
            record.DueDays || 0,
            formatCurrency(record.OSPrincipal || 0),
            formatCurrency(record['Principal in Arrears'] || record['Prin. in Arrears'] || record.PrincipalInArrear || 0),
            formatCurrency(record['1-30 Days'] || record.Days1to30 || 0),
            formatCurrency(record['31-60 Days'] || record.Days31to60 || 0),
            formatCurrency(record['61-90 Days'] || record.Days61to90 || 0),
            formatCurrency(record['91-120 Days'] || record.Days91to120 || 0),
            formatCurrency(record['121-180 Days'] || record.Days121to180 || 0),
            formatCurrency(record.Above180Day || record.Above180 || 0)
          ]);
        });
        
        tableData.push([
          { content: 'Total By Loan Officer', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
          '',
          officerTotals.count,
          formatCurrency(officerTotals.osPrincipal),
          formatCurrency(officerTotals.prinInArrears),
          formatCurrency(officerTotals.days1to30),
          formatCurrency(officerTotals.days31to60),
          formatCurrency(officerTotals.days61to90),
          formatCurrency(officerTotals.days91to120),
          formatCurrency(officerTotals.days121to180),
          formatCurrency(officerTotals.above180)
        ]);
        tableData.push(new Array(12).fill(''));
      });
      
      tableData.push([
        { content: 'Total By Branch', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [173, 216, 230] } },
        '',
        branch.totals.count,
        formatCurrency(branch.totals.osPrincipal),
        formatCurrency(branch.totals.prinInArrears),
        formatCurrency(branch.totals.days1to30),
        formatCurrency(branch.totals.days31to60),
        formatCurrency(branch.totals.days61to90),
        formatCurrency(branch.totals.days91to120),
        formatCurrency(branch.totals.days121to180),
        formatCurrency(branch.totals.above180)
      ]);
      tableData.push(new Array(12).fill(''));
    });
    
    autoTable(doc, {
      startY: yPosition,
      head: [headers],
      body: tableData,
      theme: 'plain',
      showHead: 'firstPage',
      margin: { left: leftMargin, right: leftMargin, bottom: 25 },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak',
        cellWidth: 'wrap',
        lineWidth: 0,
        lineColor: [200, 200, 200]
      },
      headStyles: {
        fillColor: [224, 224, 224],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7,
        halign: 'center',
        lineWidth: 0
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'left' },
        1: { cellWidth: 35, halign: 'left' },
        2: { cellWidth: 25, halign: 'left' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 22, halign: 'right' },
        7: { cellWidth: 22, halign: 'right' },
        8: { cellWidth: 22, halign: 'right' },
        9: { cellWidth: 22, halign: 'right' },
        10: { cellWidth: 22, halign: 'right' },
        11: { cellWidth: 22, halign: 'right' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.row.index < tableData.length) {
          const rowData = tableData[data.row.index];
          if (rowData && Array.isArray(rowData) && rowData.length > 0) {
            const firstCell = rowData[0];
            if (firstCell && typeof firstCell === 'object' && firstCell.content) {
              const colSpan = firstCell.colSpan || 12;
              if (data.column.index === 0) {
                if (firstCell.styles) {
                  data.cell.styles.fillColor = firstCell.styles.fillColor || [64, 64, 64];
                  data.cell.styles.textColor = firstCell.styles.textColor || [255, 255, 255];
                  data.cell.styles.fontStyle = firstCell.styles.fontStyle || 'bold';
                  data.cell.styles.fontSize = firstCell.styles.fontSize || 11;
                  data.cell.styles.halign = firstCell.styles.halign || 'left';
                }
                data.cell.text = firstCell.content;
                data.cell.colSpan = colSpan;
              } else if (data.column.index < colSpan) {
                data.cell.styles.fillColor = firstCell.styles?.fillColor || [64, 64, 64];
                data.cell.styles.textColor = firstCell.styles?.textColor || [255, 255, 255];
                data.cell.text = '';
              }
            }
          }
        }
      },
      didDrawCell: function(data) {
        if (data.section === 'body' || data.section === 'head') {
          const { x, y, width, height } = data.cell;
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.1);
          doc.setLineDash([2, 2]);
          doc.rect(x, y, width, height);
          doc.setLineDash([]);
        }
      },
      didDrawPage: function(data) {
        yPosition = data.cursor.y;
      }
    });
    
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addPDFFooter(doc, pageHeight, leftMargin, pageWidth, i, totalPages);
    }
    
    doc.save(generateFilename(reportName, 'pdf'));
    console.log('Loan Ageing PDF export successful');
  } catch (error) {
    console.error('Error exporting Loan Ageing to PDF:', error);
    throw error;
  }
};

export const exportLoanArrearsDetailedToPDF = async (exportData, reportName, companyName, selectedBranch, submittedFilters, reportData = null, reportId = null) => {
  if (exportData && exportData.branches) {
    return exportProcessedLoanArrearsDetailedDataPDF(exportData, reportName, companyName, selectedBranch, submittedFilters, reportData, reportId);
  }
  if (Array.isArray(exportData)) {
    const processedData = processLoanArrearsDetailedDataForExport(exportData);
    return exportProcessedLoanArrearsDetailedDataPDF(processedData, reportName, companyName, selectedBranch, submittedFilters, reportData, reportId);
  }
  console.error('No valid data to export');
  return;
};

const exportProcessedLoanArrearsDetailedDataPDF = async (processedData, reportName, companyName, selectedBranch, submittedFilters, reportData = null, reportId = null) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }
  
  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 10;
    const rightMargin = 10;
    let yPosition = await addStandardPDFHeader(doc, pageWidth, companyName, reportName, selectedBranch, {}, false, false);
    
    if (reportData && reportId) {
      const allParams = getAllParametersForReport(reportData, reportId, submittedFilters);
      if (allParams.length > 0) {
        const paramParts = allParams.map(p => `${p.caption}-${p.value}`);
        const paramText = paramParts.join('  ');
        doc.setFontSize(8);
        doc.text(paramText, leftMargin, yPosition, { align: 'left' });
        yPosition += 7;
      }
    }
    
    const headers = ['Loan A/C', 'Name', 'Days', 'Mobile', 'Out Principle', 'PrincipalDue', 'InterestDue', 'Penalty&Sms', 'Total Due'];
    const tableData = [];
    const { branches } = processedData;
    
    branches.forEach((branch) => {
      tableData.push([
        { content: `Branch Name: ${branch.branchName}`, colSpan: 9, styles: { 
          fillColor: [64, 64, 64], 
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11,
          halign: 'left',
          textDecoration: 'underline'
        }}
      ]);
      
      branch.officers.forEach((officer) => {
        tableData.push([
          { content: `Loan Officer: ${officer.officerName}`, colSpan: 9, styles: { 
            fillColor: [96, 96, 96], 
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10,
            halign: 'left',
            textDecoration: 'underline'
          }}
        ]);
        
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
          
          tableData.push([
            record.AccountID || '',
            record.Name || '',
            record.DueDays || 0,
            record.Mobile || '',
            formatCurrency(record.OutTPrincipal || 0),
            formatCurrency(record.PrinDueToDate || 0),
            formatCurrency(record.IntDueToDate || 0),
            formatCurrency(record.PenaltyAmount || 0),
            formatCurrency(record.TotDueToDate || 0)
          ]);
        });
        
        tableData.push([
          { content: 'Total By Loan Officer', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
          officerTotals.count,
          '',
          formatCurrency(officerTotals.outPrinciple),
          formatCurrency(officerTotals.principalDue),
          formatCurrency(officerTotals.interestDue),
          formatCurrency(officerTotals.penaltySms),
          formatCurrency(officerTotals.totalDue)
        ]);
        tableData.push(new Array(9).fill(''));
      });
      
      tableData.push([
        { content: 'Total By Branch', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [173, 216, 230] } },
        branch.totals.count,
        '',
        formatCurrency(branch.totals.outPrinciple),
        formatCurrency(branch.totals.principalDue),
        formatCurrency(branch.totals.interestDue),
        formatCurrency(branch.totals.penaltySms),
        formatCurrency(branch.totals.totalDue)
      ]);
      tableData.push(new Array(9).fill(''));
    });
    
    autoTable(doc, {
      startY: yPosition,
      head: [headers],
      body: tableData,
      theme: 'plain',
      showHead: 'firstPage',
      margin: { left: leftMargin, right: leftMargin, bottom: 25 },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        cellWidth: 'wrap',
        lineWidth: 0,
        lineColor: [200, 200, 200]
      },
      headStyles: {
        fillColor: [224, 224, 224],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        lineWidth: 0
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'left' },
        1: { cellWidth: 40, halign: 'left' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 25, halign: 'left' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' },
        6: { cellWidth: 30, halign: 'right' },
        7: { cellWidth: 30, halign: 'right' },
        8: { cellWidth: 30, halign: 'right' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.row.index < tableData.length) {
          const rowData = tableData[data.row.index];
          if (rowData && Array.isArray(rowData) && rowData.length > 0) {
            const firstCell = rowData[0];
            if (firstCell && typeof firstCell === 'object' && firstCell.content) {
              const colSpan = firstCell.colSpan || 9;
              if (data.column.index === 0) {
                if (firstCell.styles) {
                  data.cell.styles.fillColor = firstCell.styles.fillColor || [64, 64, 64];
                  data.cell.styles.textColor = firstCell.styles.textColor || [255, 255, 255];
                  data.cell.styles.fontStyle = firstCell.styles.fontStyle || 'bold';
                  data.cell.styles.fontSize = firstCell.styles.fontSize || 11;
                  data.cell.styles.halign = firstCell.styles.halign || 'left';
                }
                data.cell.text = firstCell.content;
                data.cell.colSpan = colSpan;
              } else if (data.column.index < colSpan) {
                data.cell.styles.fillColor = firstCell.styles?.fillColor || [64, 64, 64];
                data.cell.styles.textColor = firstCell.styles?.textColor || [255, 255, 255];
                data.cell.text = '';
              }
            }
          }
        }
      },
      didDrawCell: function(data) {
        if (data.section === 'body' || data.section === 'head') {
          const { x, y, width, height } = data.cell;
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.1);
          doc.setLineDash([2, 2]);
          doc.rect(x, y, width, height);
          doc.setLineDash([]);
        }
      },
      didDrawPage: function(data) {
        yPosition = data.cursor.y;
      }
    });
    
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addPDFFooter(doc, pageHeight, leftMargin, pageWidth, i, totalPages);
    }
    
    doc.save(generateFilename(reportName, 'pdf'));
    console.log('Loan Arrears Detailed PDF export successful');
  } catch (error) {
    console.error('Error exporting Loan Arrears Detailed to PDF:', error);
    throw error;
  }
};

export const exportFixedDepositStatementToPDF = async (exportData, reportName, companyName, selectedBranch, submittedFilters) => {
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
  
  return exportFixedDepositStatementDataPDF(processedData, reportName, companyName, selectedBranch, submittedFilters);
};

const exportFixedDepositStatementDataPDF = async (processedData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }

  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 14;
    const rightMargin = pageWidth - 14;

    const { accountInfo, deposits } = processedData;
    const loggedInBranch = getBranchName();

    let yPosition = await addStandardPDFHeader(doc, pageWidth, companyName, reportName, selectedBranch, submittedFilters, false, false);
    
    yPosition += 5;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const branchAccountLine = `Branch ID-${accountInfo.branchId || submittedFilters?.OurBranchID || ''}    AccountID-${accountInfo.accountId || ''}`;
    doc.text(branchAccountLine, leftMargin, yPosition);
    yPosition += 5;
    
    doc.setFontSize(8);
    const accountDetails = [
      [`Account ID : ${accountInfo.accountId || ''}`, `Freezed Amount : ${formatCurrency(accountInfo.freezedAmount)}`, `Available Amount ${formatCurrency(accountInfo.availableAmount)}`],
      [`Client Name : ${accountInfo.clientName || ''}`, `Closing Balance : ${formatCurrency(accountInfo.closingBalance)}`, '']
    ];
    
    accountDetails.forEach(row => {
      let xPos = leftMargin;
      row.forEach((text, index) => {
        if (text) {
          doc.text(text, xPos, yPosition);
          xPos += 70;
        }
      });
      yPosition += 5;
    });
    
    yPosition += 5;
    const tableHeaders = [['ReceiptID', 'SerialID', 'FixedAmount', 'Closing balance', 'Rate', 'StartDate', 'Term', 'EndDate', 'InterestPaid', 'TaxCharged', 'NetInterestPaid', 'InterestPaidOn', 'Status']];
    const tableData = deposits.map(deposit => [
      deposit.receiptId || '',
      deposit.serialId || '',
      formatCurrency(deposit.fixedAmount),
      formatCurrency(deposit.closingBalance),
      deposit.rate ? deposit.rate.toFixed(2) : '0.00',
      formatDate(deposit.startDate),
      deposit.term || '',
      formatDate(deposit.endDate),
      formatCurrency(deposit.interestPaid),
      deposit.taxCharged || '-',
      deposit.netInterestPaid || '-',
      deposit.interestPaidOn ? formatDate(deposit.interestPaidOn) : '-',
      deposit.status || ''
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      headStyles: {
        fillColor: [224, 224, 224],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center' },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 15, halign: 'right' },
        5: { cellWidth: 25, halign: 'center' },
        6: { cellWidth: 15, halign: 'center' },
        7: { cellWidth: 25, halign: 'center' },
        8: { cellWidth: 25, halign: 'right' },
        9: { cellWidth: 20, halign: 'right' },
        10: { cellWidth: 25, halign: 'right' },
        11: { cellWidth: 25, halign: 'center' },
        12: { cellWidth: 30, halign: 'left' }
      },
      margin: { left: leftMargin, right: leftMargin, bottom: 25 },
      didDrawPage: function(data) {
        yPosition = data.cursor.y;
      }
    });
    
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addPDFFooter(doc, pageHeight, leftMargin, pageWidth, i, totalPages);
    }
    
    doc.save(generateFilename(reportName, 'pdf'));
    console.log('Fixed Deposit Statement PDF export successful');
  } catch (error) {
    console.error('Error exporting Fixed Deposit Statement to PDF:', error);
    throw error;
  }
};

export const exportFixedDepositMemberStatementToPDF = async (exportData, reportName, companyName, selectedBranch, submittedFilters) => {
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
  
  return exportFixedDepositMemberStatementDataPDF(processedData, reportName, companyName, selectedBranch, submittedFilters);
};

const exportFixedDepositMemberStatementDataPDF = async (processedData, reportName, companyName, selectedBranch, submittedFilters) => {
  if (!processedData) {
    console.error('No processed data to export');
    return;
  }

  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 14;
    const rightMargin = pageWidth - 14;

    const { depositInfo, maturityInfo } = processedData;
    const loggedInBranch = getBranchName();

    let yPosition = await addStandardPDFHeader(doc, pageWidth, companyName, 'Fixed Deposit Member Statement', selectedBranch, submittedFilters, false, false);
    
    yPosition += 5;
    doc.setFillColor(96, 96, 96);
    doc.rect(leftMargin, yPosition - 3, rightMargin - leftMargin, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const identificationLine = `Branch ID-${depositInfo.branchId || ''}    AccountID-${depositInfo.accountId || ''}    ReceiptID-${depositInfo.receiptId || ''}`;
    doc.text(identificationLine, leftMargin + 2, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 10;
    
    doc.setFontSize(9);
    const details = [
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

    details.forEach(([label, value]) => {
      doc.setFont(undefined, 'bold');
      doc.text(label, leftMargin, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(String(value), leftMargin + 50, yPosition);
      yPosition += 6;
    });
    
    yPosition += 5;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('Transaction at Maturity:', leftMargin, yPosition);
    yPosition += 6;
    
    doc.setFontSize(8);
    const maturityDetails = [
      ['Maturity value before withholding tax:', formatCurrency(maturityInfo.maturityValueBeforeTax), true],
      ['Withholding Tax %:', maturityInfo.withholdingTaxPercent !== null ? maturityInfo.withholdingTaxPercent.toFixed(2) : '', false],
      ['Withholding Tax:', formatCurrency(maturityInfo.withholdingTax), false],
      ['Maturity value after withholding tax:', formatCurrency(maturityInfo.maturityValueAfterTax), true]
    ];
    
    maturityDetails.forEach(([label, value, isBold]) => {
      doc.setFont(undefined, isBold ? 'bold' : 'normal');
      doc.text(label, leftMargin, yPosition);
      doc.text(String(value), rightMargin - 40, yPosition, { align: 'right' });
      yPosition += 6;
    });
    
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addPDFFooter(doc, pageHeight, leftMargin, pageWidth, i, totalPages);
    }
    
    doc.save(generateFilename(reportName, 'pdf'));
    console.log('Fixed Deposit Member Statement PDF export successful');
  } catch (error) {
    console.error('Error exporting Fixed Deposit Member Statement to PDF:', error);
    throw error;
  }
};