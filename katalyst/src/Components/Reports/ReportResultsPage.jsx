import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import useSecureApi from '../../Hooks/useSecureApi';
import { getCompanyInfo, getBranchName } from './ExportUtility';

const ReportResultsPage = ({ reportName, filterValues, reportId, onBack,reportData }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [storedProcedureName, setStoredProcedureName] = useState('');
  const [companyInfo, setCompanyInfo] = useState({});
  const [selectedBranch, setSelectedBranch] = useState('');
  const { callApi } = useSecureApi();

  useEffect(() => {
    if (reportId && reportData) {
      fetchStoredProcedure();
    }
  }, [reportId, reportData]);

  useEffect(() => {
    if (storedProcedureName) {
      fetchReportData();
    }
  }, [storedProcedureName]);

  useEffect(() => {
    setCompanyInfo(getCompanyInfo());
  }, []);
  useEffect(() => {
    const branchId = filterValues['OurBranchID'] || filterValues['FromBranchID'];
    setSelectedBranch(getBranchName(branchId));
  }, [filterValues]);

  const fetchStoredProcedure = () => {
    try {
      if (!reportData) {
        setError('Report data not available');
        setLoading(false);
        return;
      }
      let reportModule = reportData.ReportModule?.find(
        module => module.ModuleId === reportId
      );
      if (!reportModule && reportData.ReportModule2) {
        reportModule = reportData.ReportModule2.find(
          module => module.ModuleID === reportId
        );
      }
      if (reportModule) {
        const spName = reportModule.DetailSPName || reportModule.DetailSPName;
        if (spName) {
          setStoredProcedureName(spName);
        } else {
          setError('Stored procedure name not found for this report');
          setLoading(false);
        }
      } else {
        setError('Report module not found for this report');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching stored procedure:', err);
      setError('Failed to load report configuration');
      setLoading(false);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const authToken = sessionStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No authentication token found. Please login again.');
      }
      const cleanParameters = { ...filterValues };
      const requestBody = {
        storedProcedureName: storedProcedureName,
        parameters: cleanParameters,
        moduleID: reportId
      };

      console.log('Sending report request:', requestBody);
      const result = await callApi({
        endpoint: '/Report/API/Dynamic',
        method: 'POST',
        body: requestBody,
        requiresAuth: true, 
      });
      if (result.Success && result.Data && result.Data.length > 0) {
        const tableData = result.Data[0];
        if (tableData.Rows && tableData.Rows.length > 0) {
          setData(tableData.Rows);
        } else {
          setData([]);
          setError('No data found for that selected range');
        }
      } else {
        setError(result.ErrorMessage || 'No data returned from the report');
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      let errorMessage = 'Failed to load report data';
      if (err.message) {
        try {
          const jsonMatch = err.message.match(/\{.*\}/);
          if (jsonMatch) {
            const errorJson = JSON.parse(jsonMatch[0]);
            errorMessage = errorJson.ErrorMessage || errorJson.Message || err.message;
          } else {
            errorMessage = err.message;
          }
        } catch (parseError) {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setData([]);
    } finally {
      setLoading(false);
    }
  };
  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const formatCellValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    if (typeof value === 'string' && value.includes('T00:00:00Z')) {
      const date = new Date(value);
      return date.toLocaleDateString();
    }
    
    return value;
  };
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const displayData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const totalPages = Math.ceil(data.length / rowsPerPage);
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to Filters</span>
              </button>
              <div className="h-8 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-800">{reportName}</h1>
            </div>
          </div>
           {Object.keys(filterValues).length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600 font-medium">Applied Filters:</span>
              {Object.entries(filterValues).map(([key, value]) => {
                if (value === null || value === undefined || value === '') return null;
                if (typeof value === 'number' && (value === 0 || value === 1)) return null;
                if (typeof value === 'boolean' && !value) return null;
                
                return (
                  <span
                    key={key}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {key}: {typeof value === 'boolean' ? 'Yes' : value}
                  </span>
                );
              })}
              </div>
            </div>
          )} 
        </div>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg shadow">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 text-lg">Loading report data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No data available for the selected criteria</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-bold text-gray-800">
                    {companyInfo.name}
                  </h2>
                  <h3 className="text-base font-semibold text-gray-700">
                    {reportName}
                  </h3>
                  {selectedBranch && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Branch: </span>
                      <span>{selectedBranch}</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    {filterValues['FromDate'] && filterValues['ToDate'] ? (
                      <>
                        <span className="font-medium">Period: </span>
                        <span>{new Date(filterValues['FromDate']).toLocaleDateString()} - {new Date(filterValues['ToDate']).toLocaleDateString()}</span>
                      </>
                    ) : filterValues['AsOnDate'] ? (
                      <>
                        <span className="font-medium">As On: </span>
                        <span>{new Date(filterValues['AsOnDate']).toLocaleDateString()}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {columns.map((column, index) => (
                      <th
                        key={index}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200 whitespace-nowrap"
                      >
                        {column.replace(/([A-Z])/g, ' $1').trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayData.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={rowIndex % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}
                    >
                      {columns.map((column, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCellValue(row[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={handleChangeRowsPerPage}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, data.length)} of {data.length}
                </span>
                
                <div className="flex gap-1">
                  <button
                    onClick={() => handleChangePage(page - 1)}
                    disabled={page === 0}
                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => handleChangePage(page + 1)}
                    disabled={page >= totalPages - 1}
                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportResultsPage;