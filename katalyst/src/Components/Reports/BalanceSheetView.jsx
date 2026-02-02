import React, { useMemo } from 'react';

const BalanceSheetView = ({ data, companyInfo, selectedBranch, submittedFilters }) => {
  // Group data hierarchically
  const groupedData = useMemo(() => {
    const result = {};
    
    data.forEach(item => {
      const accountType = item.GLAccountType || 'Uncategorized';
      const typeGroup = item.GLTypeGroup || 'Uncategorized';
      const subAccountType = item.GLSubAccountType || 'Uncategorized';
      
      // GLAccountType
      if (!result[accountType]) {
        result[accountType] = {
          name: accountType,
          total: 0,
          groups: {}
        };
      }
      //GLTypeGroup 
      if (!result[accountType].groups[typeGroup]) {
        result[accountType].groups[typeGroup] = {
          name: typeGroup,
          total: 0,
          subGroups: {}
        };
      } 
      // GLSubAccountType 
      if (!result[accountType].groups[typeGroup].subGroups[subAccountType]) {
        result[accountType].groups[typeGroup].subGroups[subAccountType] = {
          name: subAccountType,
          total: 0,
          items: []
        };
      }
    //   Adding the individual items
      const localBalance = parseFloat(item.LocalBalance) || 0;
      result[accountType].groups[typeGroup].subGroups[subAccountType].items.push({
        description: item.Description || '',
        localBalance: localBalance
      });
      
      // Update total balances at each part
      result[accountType].groups[typeGroup].subGroups[subAccountType].total += localBalance;
      result[accountType].groups[typeGroup].total += localBalance;
      result[accountType].total += localBalance;
    });
    
    return result;
  }, [data]);
// adds separators and formarts currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
      <div className="p-6">
        {Object.entries(groupedData).map(([accountType, accountData]) => (
          <div key={accountType} className="mb-8">
            <div className="bg-gray-800 text-white px-4 py-3 font-bold text-lg mb-2">
              {accountData.name}
            </div>
            {Object.entries(accountData.groups).map(([typeGroup, groupData]) => (
              <div key={typeGroup} className="ml-4 mb-4">
                <div className="bg-gray-200 px-4 py-2 font-semibold text-base mb-2">
                  {groupData.name}
                </div>
                {Object.entries(groupData.subGroups).map(([subAccountType, subGroupData]) => (
                  <div key={subAccountType} className="ml-4 mb-3">
                    <div className="bg-gray-100 px-4 py-2 font-medium text-sm mb-1 border-l-4 border-blue-500">
                      {subGroupData.name}
                    </div>
                    <div className="ml-4">
                      {subGroupData.items.map((item, index) => (
                        <div 
                          key={index} 
                          className="flex justify-between px-4 py-2 border-b border-gray-200 hover:bg-gray-50"
                        >
                          <span className="text-gray-700 text-sm">{item.description}</span>
                          <span className="text-gray-900 font-medium text-sm">
                            {formatCurrency(item.localBalance)}
                          </span>
                        </div>
                      ))}
                      {/* displaying sub total */}
                      <div className="flex justify-between px-4 py-2 bg-blue-50 border-t-2 border-blue-300 font-semibold">
                        <span className="text-sm">Total {subGroupData.name}</span>
                        <span className="text-sm">{formatCurrency(subGroupData.total)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* TypeGroup Total */}
                <div className="flex justify-between px-4 py-2 bg-gray-300 font-bold ml-4 mt-2">
                  <span>Total {groupData.name}</span>
                  <span>{formatCurrency(groupData.total)}</span>
                </div>
              </div>
            ))}
            
            {/* AccountType Total */}
            <div className="flex justify-between px-4 py-3 bg-gray-700 text-white font-bold text-lg">
              <span>Total {accountData.name}</span>
              <span>{formatCurrency(accountData.total)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BalanceSheetView;