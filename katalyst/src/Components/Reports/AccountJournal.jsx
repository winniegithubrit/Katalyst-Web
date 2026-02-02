import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { ChevronDown, ChevronRight } from 'lucide-react';

const AccountJournal = ({ 
  data, 
  companyInfo, 
  selectedBranch, 
  submittedFilters,
  onProcessedDataChange 
}) => {
  const [groupedData, setGroupedData] = useState({});
  const [expandedBranches, setExpandedBranches] = useState(new Set());

  useEffect(() => {
      
      if (data && data.length > 0) {
        const grouped = groupByBranch(data);
        setGroupedData(grouped);
        const allBranches = new Set(Object.keys(grouped));
        setExpandedBranches(allBranches);
        if (onProcessedDataChange) {
          onProcessedDataChange({ grouped, raw: data });
        }
      } else {
        console.log('No data empty data array');
      }
    }, [data]);

  const groupByBranch = (transactions) => {
      const grouped = {};
      
      transactions.forEach((transaction, index) => {
          if (index === 0) {
            console.log('OurBranchID:', transaction.OurBranchID);
          }
          const branchKey = transaction.TrxBranchName || transaction.TrxBranchID || transaction.OurBranchID || 'Unknown Branch';
        
        if (!grouped[branchKey]) {
          grouped[branchKey] = {
            branchName: branchKey,
            transactions: []
          };
        }
        grouped[branchKey].transactions.push(transaction);
      });
      return grouped;
    };

  const toggleBranch = (branchKey) => {
    setExpandedBranches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(branchKey)) {
        newSet.delete(branchKey);
      } else {
        newSet.add(branchKey);
      }
      return newSet;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatCurrency = (value) => {
    if (!value || value === 0) return '0';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };
  const columns = [
      {
          name: 'Batch ID',
          selector: row => row.TrxBatchID || '-',
          sortable: false,
          width: '100px',
          cell: row => <div style={{ fontSize: '11px' }}>{row.TrxBatchID || '-'}</div>
      },
      {
          name: 'Serial ID',
          selector: row => row.SerialID || '-',
          sortable: false,
          width: '100px',
          cell: row => <div style={{ fontSize: '11px' }}>{row.SerialID || '-'}</div>
      },
      {
          name: 'Branch',
          selector: row => row.TrxBranchID || '-',
          sortable: false,
          width: '80px',
          cell: row => <div style={{ fontSize: '11px' }}>{row.TrxBranchID || '-'}</div>
      },
      {
          name: 'Date',
          selector: row => row.TrxDate,
          sortable: false,
          width: '120px',
          cell: row => <div style={{ fontSize: '11px' }}>{formatDate(row.TrxDate)}</div>
      },
      {
          name: 'Account Number',
          selector: row => row.GLAccountID || '-',
          sortable: false,
          width: '140px',
          cell: row => <div style={{ fontSize: '11px' }}>{row.GLAccountID || '-'}</div>
      },
      {
          name: "Customer's Acc",
          selector: row => row.CustomerAccountID || '-',
          sortable: false,
          width: '140px',
          cell: row => <div style={{ fontSize: '11px' }}>{row.CustomerAccountID || '-'}</div>
      },
      {
          name: 'Account Name',
          selector: row => row.GLAccountName || '-',
          sortable: false,
          width: '200px',
          wrap: true,
          cell: row => <div style={{ fontSize: '11px' }}>{row.GLAccountName || '-'}</div>
      },
      {
          name: 'Description of Transaction',
          selector: row => row.TrxDescription || '-',
          sortable: false,
          width: '250px',
          wrap: true,
          cell: row => <div style={{ fontSize: '11px' }}>{row.TrxDescription || '-'}</div>
      },
      {
          name: 'Debit',
          selector: row => row.Debit || 0,
          sortable: false,
          width: '120px',
          cell: row => <div style={{ fontSize: '11px', fontWeight: '500', textAlign: 'right' }}>{formatCurrency(row.Debit)}</div>
      },
      {
          name: 'Credit',
          selector: row => row.Credit || 0,
          sortable: false,
          width: '120px',
          cell: row => <div style={{ fontSize: '11px', fontWeight: '500', textAlign: 'right' }}>{formatCurrency(row.Credit)}</div>
      },
      {
          name: 'Customer Name',
          selector: row => row.CustomerName || '-',
          sortable: false,
          width: '180px',
          wrap: true,
          cell: row => <div style={{ fontSize: '11px' }}>{row.CustomerName || '-'}</div>
      },
      {
          name: 'Operator ID',
          selector: row => row.CreatedBy || '-',
          sortable: false,
          width: '120px',
          cell: row => <div style={{ fontSize: '11px' }}>{row.CreatedBy || '-'}</div>
      }
  ];
  const customStyles = {
    table: {
      style: {
        minWidth: '100%',
      },
    },
    headRow: {
      style: {
        backgroundColor: '#F3F4F6',
        borderBottom: '2px solid #E5E7EB',
        minHeight: '45px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      },
    },
    headCells: {
      style: {
        fontSize: '11px',
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
        paddingLeft: '8px',
        paddingRight: '8px',
      },
    },
    cells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
      },
    },
    rows: {
      style: {
        minHeight: '40px',
        '&:nth-of-type(odd)': {
          backgroundColor: '#FFFFFF',
        },
        '&:nth-of-type(even)': {
          backgroundColor: '#F9FAFB',
        },
        borderBottom: '1px dotted #D1D5DB',
      },
    },
  };
  return (
    <div className="account-journal-container" style={{ 
      minHeight: '400px',
      height: '100%', 
      width: '100%',
      overflow: 'auto',
      padding: '16px'
    }}>
      {Object.keys(groupedData).length > 0 ? (
        Object.entries(groupedData).map(([branchKey, branchData]) => {
          const isExpanded = expandedBranches.has(branchKey);
          
          return (
            <div key={branchKey} className="branch-section mb-4">
              <div 
                className="branch-header bg-gray-700 text-white px-4 py-3 cursor-pointer flex items-center justify-between"
                onClick={() => toggleBranch(branchKey)}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span className="font-bold text-sm">
                    {branchData.branchName}
                  </span>
                  <span className="text-xs opacity-75">
                    ({branchData.transactions.length} transactions)
                  </span>
                </div>
              </div>
              
              {isExpanded && (
                <div className="branch-content bg-white shadow-sm">
                  <DataTable
                    columns={columns}
                    data={branchData.transactions}
                    customStyles={customStyles}
                    dense
                    noHeader
                    pagination
                    paginationPerPage={100}
                    paginationRowsPerPageOptions={[50, 100, 200, 500, 1000]}
                    progressPending={false}
                    progressComponent={<div>Loading...</div>}
                    noDataComponent={
                      <div className="text-center py-8 text-gray-500">
                        No transactions for this branch
                      </div>
                    }
                  />
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="text-center py-12 text-gray-500">
          No data available 
        </div>
      )}
    </div>
  );
};

export default AccountJournal;