import React, { useMemo, useEffect } from 'react';

const ProfitLossView = ({ data }) => {
  const formatNumber = (num) => {
    if (num === null || num === undefined || num === 0) return '0.00';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(num));
  };

  const groupedData = useMemo(() => {
    if (!data || data.length === 0) return null;

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
// dtermining the main category if income or expense
      const category = accountType.includes('INCOME') ? 'income' : 'expense';
// checks if type group exists a new one is created
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
  }, [data]);

  if (!groupedData) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-gray-500">No profit and loss data available</p>
      </div>
    );
  }

  const netProfit = groupedData.income.total - groupedData.expense.total;

  const renderSection = (sectionData, isExpense = false) => {
    return Object.entries(sectionData.sections).map(([typeKey, typeGroup]) => (
      <div key={typeKey} className="mb-4">
        <div className="bg-gray-200 px-4 py-2 font-bold text-sm border-t border-b border-gray-400">
          {typeGroup.name.toUpperCase()}
        </div>
        {Object.entries(typeGroup.subGroups).map(([subKey, subGroup]) => (
          <div key={subKey} className="ml-4">
            <div className="bg-gray-100 px-4 py-1.5 font-semibold text-xs border-b border-gray-300 mt-1">
              {subGroup.name}
            </div>
            {subGroup.items.map((item, idx) => (
              <div key={idx} className="flex justify-between px-4 py-1 text-xs border-b border-dotted border-gray-300">
                <span className="ml-4">{item.description}</span>
                <span>{formatNumber(item.balance)}</span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-1.5 bg-blue-50 font-semibold text-xs border-b border-gray-400">
              <span className="ml-2">TOTAL {subGroup.name.toUpperCase()}</span>
              <span>{formatNumber(subGroup.total)}</span>
            </div>
          </div>
        ))}
        <div className="flex justify-between px-4 py-2 bg-gray-300 font-bold text-sm border-b-2 border-gray-500">
          <span>TOTAL {typeGroup.name.toUpperCase()}</span>
          <span>{formatNumber(typeGroup.total)}</span>
        </div>
      </div>
    ));
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-auto">
      <div className="flex-1 p-6">
        <div className="mb-6">
          <div className="bg-gray-800 text-white px-4 py-2 font-bold text-base border-b-2 border-black">
            {groupedData.income.title}
          </div>
          {renderSection(groupedData.income)}
          <div className="flex justify-between px-4 py-3 bg-gray-700 text-white font-bold text-base border-y-2 border-black">
            <span>TOTAL INCOME</span>
            <span>{formatNumber(groupedData.income.total)}</span>
          </div>
        </div>
        <div className="mb-6">
          <div className="bg-gray-800 text-white px-4 py-2 font-bold text-base border-b-2 border-black mt-8">
            {groupedData.expense.title}
          </div>
          {renderSection(groupedData.expense, true)}
          <div className="flex justify-between px-4 py-3 bg-gray-700 text-white font-bold text-base border-y-2 border-black">
            <span>TOTAL EXPENSE</span>
            <span>{formatNumber(groupedData.expense.total)}</span>
          </div>
        </div>
        <div className="flex justify-between px-4 py-3 bg-black text-white font-bold text-lg border-y-4 border-black mt-6">
          <span>Net Profit / (Loss)</span>
          <span>{formatNumber(netProfit)}</span>
        </div>
      </div>
    </div>
  );
};

export default ProfitLossView;