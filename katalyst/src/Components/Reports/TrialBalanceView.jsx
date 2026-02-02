import React, { useMemo, useEffect } from 'react'; 
import DataTable from 'react-data-table-component';

const TrialBalanceView = ({ data, companyInfo, selectedBranch, submittedFilters, onProcessedDataChange }) => {
  const calculateRowBalances = (item) => {
    let openingDr = 0;
    let openingCr = 0;
    
    if (item.OpeningBalance !== 0) {
      if (item.OpeningBalance < 0) {
        openingDr = Math.abs(item.OpeningBalance);
      } else {
        openingCr = item.OpeningBalance;
      }
    }
    const debitAmt = Math.abs(item.DebitAmount || 0);
    const creditAmt = Math.abs(item.CreditAmount || 0);
    const x = openingCr + creditAmt;
    const y = openingDr + debitAmt;
    const z = x - y;
    const closingDr = z < 0 ? Math.abs(z) : 0;
    const closingCr = z > 0 ? z : 0;

    return { openingDr, openingCr, debitAmt, creditAmt, closingDr, closingCr };
  };

  const processedRows = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(item => {
      const balances = calculateRowBalances(item);
      return {
        id: item.AccountID,
        accountId: item.AccountID,
        description: item.Description,
        openingDr: balances.openingDr,
        openingCr: balances.openingCr,
        debitAmt: balances.debitAmt,
        creditAmt: balances.creditAmt,
        closingDr: balances.closingDr,
        closingCr: balances.closingCr
      };
    });
  }, [data]);

  const totals = useMemo(() => {
    if (!processedRows || processedRows.length === 0) return {
      openingDr: 0,
      openingCr: 0,
      debitAmt: 0,
      creditAmt: 0,
      closingDr: 0,
      closingCr: 0
    };

    return processedRows.reduce((acc, row) => {
      acc.openingDr += row.openingDr;
      acc.openingCr += row.openingCr;
      acc.debitAmt += row.debitAmt;
      acc.creditAmt += row.creditAmt;
      acc.closingDr += row.closingDr;
      acc.closingCr += row.closingCr;
      return acc;
    }, {
      openingDr: 0,
      openingCr: 0,
      debitAmt: 0,
      creditAmt: 0,
      closingDr: 0,
      closingCr: 0
    });
  }, [processedRows]);
  useEffect(() => {
    if (onProcessedDataChange && processedRows.length > 0) {
      onProcessedDataChange({
        rows: processedRows,
        totals
      });
    }
  }, [processedRows, totals, onProcessedDataChange]);

  const formatNumber = (num) => {
    if (num === null || num === undefined || num === 0) return '0';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const columns = [
    {
      name: 'Account',
      selector: row => row.accountId,
      sortable: true,
      width: '120px',
      cell: row => <div style={{ fontSize: '11px', fontWeight: '500' }}>{row.accountId}</div>
    },
    {
      name: 'Description',
      selector: row => row.description,
      sortable: true,
      grow: 2,
      cell: row => <div style={{ fontSize: '11px' }}>{row.description}</div>
    },
    {
      name: 'OpeningDr',
      selector: row => row.openingDr,
      sortable: true,
      right: true,
      width: '130px',
      cell: row => <div style={{  fontSize: '11px' }}>{formatNumber(row.openingDr)}</div>
    },
    {
      name: 'OpeningCr',
      selector: row => row.openingCr,
      sortable: true,
      right: true,
      width: '130px',
      cell: row => <div style={{ fontSize: '11px' }}>{formatNumber(row.openingCr)}</div>
    },
    {
      name: 'Debit Amt',
      selector: row => row.debitAmt,
      sortable: true,
      right: true,
      width: '130px',
      cell: row => <div style={{ fontSize: '11px' }}>{formatNumber(row.debitAmt)}</div>
    },
    {
      name: 'Credit Amt',
      selector: row => row.creditAmt,
      sortable: true,
      right: true,
      width: '130px',
      cell: row => <div style={{ fontSize: '11px' }}>{formatNumber(row.creditAmt)}</div>
    },
    {
      name: 'ClosingDr',
      selector: row => row.closingDr,
      sortable: true,
      right: true,
      width: '130px',
      cell: row => <div style={{ fontSize: '11px' }}>{formatNumber(row.closingDr)}</div>
    },
    {
      name: 'ClosingCr',
      selector: row => row.closingCr,
      sortable: true,
      right: true,
      width: '130px',
      cell: row => <div style={{ fontSize: '11px' }}>{formatNumber(row.closingCr)}</div>
    }
  ];
  const CustomHeader = () => (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '120px 2fr 260px 260px 260px',
      backgroundColor: '#f9fafb',
      borderBottom: '2px solid #e5e7eb'
    }}>
      <div style={{ 
        padding: '12px 8px',
        fontSize: '11px',
        fontWeight: '600',
        color: '#374151',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        borderRight: '1px solid #e5e7eb'
      }}>
        Account
      </div>
      <div style={{ 
        padding: '12px 8px',
        fontSize: '11px',
        fontWeight: '600',
        color: '#374151',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        borderRight: '1px solid #e5e7eb'
      }}>
        Description
      </div>
      <div style={{ 
        textAlign: 'center',
        padding: '8px',
        fontSize: '11px',
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
        borderRight: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        INITIAL BALANCE
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr',
          marginTop: '8px'
        }}>
          <div style={{ 
            padding: '4px',
            borderRight: '1px solid #e5e7eb'
          }}>OpeningDr</div>
          <div style={{ padding: '4px' }}>OpeningCr</div>
        </div>
      </div>
      <div style={{ 
        textAlign: 'center',
        padding: '8px',
        fontSize: '11px',
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
        borderRight: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        MOVEMENT
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr',
          marginTop: '8px'
        }}>
          <div style={{ 
            padding: '4px',
            borderRight: '1px solid #e5e7eb'
          }}>Debit Amt</div>
          <div style={{ padding: '4px' }}>Credit Amt</div>
        </div>
      </div>
      <div style={{ 
        textAlign: 'center',
        padding: '8px',
        fontSize: '11px',
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
        borderBottom: '1px solid #e5e7eb'
      }}>
        BALANCE
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr',
          marginTop: '8px'
        }}>
          <div style={{ 
            padding: '4px',
            borderRight: '1px solid #e5e7eb'
          }}>ClosingDr</div>
          <div style={{ padding: '4px' }}>ClosingCr</div>
        </div>
      </div>
    </div>
  );

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-gray-500">No trial balance data available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <style>{`
        .totals-row {
          background-color: #e5e7eb;
          font-weight: 700;
          border-top: 2px solid #9ca3af;
          border-bottom: 2px solid #9ca3af;
          padding: 12px;
        }
        .totals-grid {
          display: grid;
          grid-template-columns: 120px 2fr 130px 130px 130px 130px 130px 130px;
          gap: 8px;
          align-items: center;
        }
        .totals-label {
          font-size: 13px;
          font-weight: 700;
          color: #1f2937;
          grid-column: span 2;
        }
        .totals-value {
          text-align: right;
          font-size: 12px;
          font-weight: 700;
          color: #1f2937;
        }
        .rdt_TableHeadRow {
          display: none !important;
        }
      `}</style>

      <CustomHeader />

      <div style={{ flex: 1, overflow: 'auto' }}>
        <DataTable
          columns={columns}
          data={processedRows}
          pagination
          paginationPerPage={25}
          paginationRowsPerPageOptions={[10, 25, 50, 100, 200, 500]}
          customStyles={{
            table: {
              style: {
                minWidth: '100%',
              },
            },
            rows: {
              style: {
                minHeight: '36px',
                fontSize: '11px',
                '&:nth-of-type(odd)': {
                  backgroundColor: '#ffffff',
                },
                '&:nth-of-type(even)': {
                  backgroundColor: '#f9fafb',
                },
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                  cursor: 'default'
                }
              }
            },
            cells: {
              style: {
                paddingLeft: '8px',
                paddingRight: '8px',
                paddingTop: '8px',
                paddingBottom: '8px'
              }
            },
            pagination: {
              style: {
                borderTop: '1px solid #e5e7eb',
                minHeight: '56px',
              },
            }
          }}
          highlightOnHover
          fixedHeaderScrollHeight="calc(100vh - 420px)"
        />
      </div>
      <div className="totals-row">
        <div className="totals-grid">
          <div className="totals-label">TOTAL</div>
          <div className="totals-value">{formatNumber(totals.openingDr)}</div>
          <div className="totals-value">{formatNumber(totals.openingCr)}</div>
          <div className="totals-value">{formatNumber(totals.debitAmt)}</div>
          <div className="totals-value">{formatNumber(totals.creditAmt)}</div>
          <div className="totals-value">{formatNumber(totals.closingDr)}</div>
          <div className="totals-value">{formatNumber(totals.closingCr)}</div>
        </div>
      </div>
    </div>
  );
};

export default TrialBalanceView;