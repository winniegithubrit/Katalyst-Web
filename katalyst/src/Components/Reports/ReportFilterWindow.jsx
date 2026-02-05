import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Filter, Play, ChevronDown, ChevronUp, Menu } from 'lucide-react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem'; 
import useSecureApi from '../../Hooks/useSecureApi'; 
import { toast } from 'react-toastify';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import ExportReport from './ExportReport';

const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

const ReportFilterWindow = ({ reportId, reportName, groupName, onClose, onRunReport, onToggleSidebar,reportResultsData = [], companyInfo = {}, selectedBranch = '', submittedFilters = {}, reportType = 'table' ,reportData = null, trialBalanceProcessedData = null, accountJournalProcessedData = null, generalLedgerProcessedData = null, savingsStatementProcessedData = null, portfolioAtRiskProcessedData = null, expectedRepaymentsProcessedData = null, savingsVsLoanBalanceProcessedData = null, loansDisbursedProcessedData = null, loanAgeingProcessedData = null, loanArrearsDetailedProcessedData = null, fixedDepositStatementProcessedData = null, fixedDepositMemberStatementProcessedData = null}) => {
  const [parameters, setParameters] = useState([]);
  const [filterValues, setFilterValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [autocompleteOptions, setAutocompleteOptions] = useState({});
  const [autocompleteLoading, setAutocompleteLoading] = useState({});
  const [showAutocomplete, setShowAutocomplete] = useState({});
  const [workingDate,setWorkingDate] = useState(null);
  const { callApi } = useSecureApi();

  useEffect(() => {
    const fetchWorkingDate = () => {
      try {
        const userProfile = sessionStorage.getItem('userProfile');
        if (userProfile) {
          const profile = JSON.parse(userProfile);
          if (profile.workingDate) {
            setWorkingDate(profile.workingDate);
          }
        }
      } catch (error) {
        console.error('Error fetching working date:', error);
      }
    };
    fetchWorkingDate();
  }, []);

  useEffect(() => {
    const cachedBranches = sessionStorage.getItem('branches');
    if (cachedBranches) {
      try {
        const parsedBranches = JSON.parse(cachedBranches);
        
        if (parsedBranches && parsedBranches.length > 0) {
          const normalizedBranches = parsedBranches.map((branch, index) => {
            const branchId = branch.OurBranchId || branch.SubCodeId || branch.id || 
                           branch.BranchId || branch.Code || branch.branchId || 
                           branch.ID || branch.SubCodeID || index;
            const branchName = branch.BranchName || branch.Description || branch.Name || 
                             branch.name || branch.description || branch.title ||
                             branch.BranchDescription || branch.OurBranchName || `Branch ${index + 1}`;
            
            return {
              OurBranchId: branchId,
              BranchName: branchName
            };
          });
          
          setBranches(normalizedBranches);
        } else {
          setBranches([]);
        }
      } catch (error) {
        console.error('Error parsing cached branches:', error);
        setBranches([]);
      }
    } else {
      setBranches([]);
    }
  }, []);

  useEffect(() => {
    const loadParameters = () => {
      try {
        setLoading(true);
        if (reportData && reportData.ReportParameter && Array.isArray(reportData.ReportParameter)) {
          const reportParams = reportData.ReportParameter
            .filter(param => {
              // Simple filter - only check ModuleId and ItemSection
              return param.ModuleId === reportId && param.ItemSection === 'I';
            })
            .sort((a, b) => (a.ItemOrder || 0) - (b.ItemOrder || 0));
          
          setParameters(reportParams);
          const initialValues = {};
          const defaultDate = workingDate || new Date().toISOString().split('T')[0];
          
          reportParams.forEach(param => {
            if (param.ItemType === 'CHK') {
              initialValues[param.ItemName] = 0;
            } else if (param.ItemType === 'DAT') {
              initialValues[param.ItemName] = defaultDate;
            } else if (param.IsMandatory === 1) {
              initialValues[param.ItemName] = '';  
            } else {
              initialValues[param.ItemName] = null; 
            }
          });
          
          setFilterValues(initialValues);
        } else {
          console.log('No parameters found for report:', reportId);
          setParameters([]);
          setFilterValues({});
        }
        
      } catch (error) {
        console.error('Error loading parameters:', error);
        setParameters([]);
        setFilterValues({});
      } finally {
        setLoading(false);
      }
    };

    if (reportId && reportData) {
      loadParameters();
    }
  }, [reportId, reportData, workingDate]);
  const handleInputChange = (paramName, value) => {
    setFilterValues(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const fetchAutocompleteOptions = async (param, searchValue) => {
    if (!searchValue || searchValue.length < 2) {
      setAutocompleteOptions(prev => ({ ...prev, [param.ItemName]: [] }));
      return;
    }

    try {
      setAutocompleteLoading(prev => ({ ...prev, [param.ItemName]: true }));
      let branchId = filterValues['OurBranchID'] || filterValues['FromBranchID'];
      if (!branchId) {
        const userProfile = sessionStorage.getItem('userProfile');
        if (userProfile) {
          try {
            const profile = JSON.parse(userProfile);
            branchId = profile.OurBranchId || profile.BranchId;
          } catch (e) {
            console.error('Error parsing user profile:', e);
          }
        }
      }
      if (!branchId && branches.length > 0) {
        branchId = branches[0].OurBranchId;
      }
      if (!branchId) {
        console.error('No branch ID found for autocomplete search');
        setAutocompleteOptions(prev => ({ ...prev, [param.ItemName]: [] }));
        setAutocompleteLoading(prev => ({ ...prev, [param.ItemName]: false }));
        return;
      }

      const result = await callApi({
        endpoint: `/System/API/Search?TableID=${param.HelpSPName}&OurBranchID=${branchId}&SearchValue=${searchValue}`,
        method: 'GET',
        requiresAuth: true,
      });
      if (result && result.record && Array.isArray(result.record)) {
        setAutocompleteOptions(prev => ({ ...prev, [param.ItemName]: result.record }));
      } else if (result && Array.isArray(result)) {
        setAutocompleteOptions(prev => ({ ...prev, [param.ItemName]: result }));
      } else {
        setAutocompleteOptions(prev => ({ ...prev, [param.ItemName]: [] }));
      }
    } catch (error) {
      console.error('Error fetching autocomplete options:', error);
      setAutocompleteOptions(prev => ({ ...prev, [param.ItemName]: [] }));
    } finally {
      setAutocompleteLoading(prev => ({ ...prev, [param.ItemName]: false }));
    }
  };

  const debouncedFetchAutocomplete = useDebounce(fetchAutocompleteOptions, 500);

  const handleRunReport = () => {
    const missingMandatory = parameters.filter(param => {
      if (param.IsMandatory === 1 && param.IsHidden !== 1) {
        const value = filterValues[param.ItemName];
        if (param.ItemType === 'CHK') {
          return value === undefined || value === null;
        }
        return value === '' || value === null || value === undefined;
      }
      return false;
    });

    if (missingMandatory.length > 0) {
      const fieldNames = missingMandatory.map(p => p.ItemCaption || p.ItemName).join(', ');
      toast.error(`Please fill in all mandatory fields: ${fieldNames}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    const cleanedFilters = {};
    parameters.forEach(param => {
      // Only skip if IsHidden === 1
      if (param.IsHidden === 1) {
        return;
      }
      
      const key = param.ItemName;
      const value = filterValues[key];
      
      if (param.ItemType === 'CHK') {
        cleanedFilters[key] = value === 1 ? 1 : 0;
      } else if (param.ItemType === 'DAT') {
        if (value) {
          cleanedFilters[key] = `${value} 00:00:00`;
        } else {
          cleanedFilters[key] = null;
        }
      } else if (param.ItemName.includes('RegionID')) {
        cleanedFilters[key] = value ? String(value).padStart(2, '0') : null;
      } else if (param.ItemName.includes('BranchID')) {
        cleanedFilters[key] = value ? String(value) : null;
        console.log(`BranchID ${key}:`, value, '→', cleanedFilters[key]);
      } else {
        if (value === '' || value === undefined) {
          cleanedFilters[key] = null;
        } else {
          cleanedFilters[key] = value;
        }
      }
    });

    console.log('Cleaned Filters:', cleanedFilters);
    onRunReport(cleanedFilters);
  };

  const isRangeStart = (paramName) => {
    return paramName.startsWith('From');
  };

  const isRangeEnd = (paramName) => {
    return paramName.startsWith('To');
  };

  const getRangePair = (param) => {
    if (isRangeStart(param.ItemName)) {
      const toParamName = param.ItemName.replace('From', 'To');
      return parameters.find(p => p.ItemName === toParamName);
    }
    return null;
  };

  const getPlaceholder = (param) => {
    return param.ItemCaption || param.ItemName;
  };

  const isBranchIdField = (param) => {
    const isBranchField = (
      param.HelpSPName === 'BranchID' || 
      param.ItemName === 'OurBranchID' ||
      param.ItemName === 'FromBranchID' ||
      param.ItemName === 'ToBranchID'
    );
    
    return isBranchField && branches.length > 0;
  };
  const isRegionIdField = (param) => {
    const isRegionField = (
      param.ItemName === 'FromRegionID' ||
      param.ItemName === 'ToRegionID' ||
      param.ItemName.includes('RegionID')
    );
    
    return isRegionField && branches.length > 0;
  };
  const needsAutocomplete = (param) => {
    return (
      param.HelpSPName && 
      param.HelpSPName !== null && 
      param.HelpSPName !== 'BranchID' &&
      (param.ItemType === 'TXT' || param.ItemType === 'CMB')
    );
  };

  const renderInput = (param) => {

    const isMandatory = param.IsMandatory === 1;
    const label = param.ItemCaption || param.ItemName;
      if (isRegionIdField(param)) {
        return (
          <Autocomplete
            options={branches}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;
              return option.BranchName || '';
            }}
            value={branches.find(b => {
              return String(b.OurBranchId).padStart(2, '0') === String(filterValues[param.ItemName]);
            }) || null}
            onChange={(event, newValue) => {
              const regionCode = newValue ? String(newValue.OurBranchId).padStart(2, '0') : '';
              handleInputChange(param.ItemName, regionCode);
            }}
            isOptionEqualToValue={(option, value) => {
              return String(option.OurBranchId).padStart(2, '0') === String(value?.OurBranchId).padStart(2, '0');
            }}
            popupIcon={<ChevronDown size={16} />}
            clearIcon={<X size={16} />}
            sx={{ minWidth: '180px', width: '200px' }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                required={isMandatory}
                size="small"
                placeholder={`Search ${getPlaceholder(param)}`}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.OurBranchId}>
                {option.BranchName}
              </li>
            )}
            noOptionsText="No regions found"
            filterOptions={(options, { inputValue }) => {
              return options.filter(option =>
                option.BranchName.toLowerCase().includes(inputValue.toLowerCase())
              );
            }}
          />
        );
      }
    if (isBranchIdField(param)) {
      return (
        <Autocomplete
          options={branches}
          getOptionLabel={(option) => {
            if (typeof option === 'string') return option;
            return option.BranchName || '';
          }}
          value={branches.find(b => b.OurBranchId === filterValues[param.ItemName]) || null}
          onChange={(event, newValue) => {
            handleInputChange(param.ItemName, newValue ? newValue.OurBranchId : '');
          }}
          isOptionEqualToValue={(option, value) => option.OurBranchId === value?.OurBranchId}
          popupIcon={<ChevronDown size={16} />}
          clearIcon={<X size={16} />}
          sx={{ minWidth: '180px', width: '200px' }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              required={isMandatory}
              size="small"
              placeholder={`Search ${getPlaceholder(param)}`}
              InputLabelProps={{
                shrink: true,
              }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.OurBranchId}>
              {option.BranchName}
            </li>
          )}
          noOptionsText="No branches found"
          filterOptions={(options, { inputValue }) => {
            return options.filter(option =>
              option.BranchName.toLowerCase().includes(inputValue.toLowerCase())
            );
          }}
        />
      );
    }

    switch (param.ItemType) {
      case 'TXT':
        const hasAutocomplete = needsAutocomplete(param);
        
        if (hasAutocomplete) {
          return (
            <Autocomplete
              options={autocompleteOptions[param.ItemName] || []}
              loading={autocompleteLoading[param.ItemName]}
              popupIcon={<ChevronDown size={16} />}
              clearIcon={<X size={16} />}
              forcePopupIcon={true}
              inputValue={filterValues[param.ItemName] || ''}
              onChange={(event, newValue) => {
                let valueToSet = '';
                if (newValue && typeof newValue === 'object') {
                  if (param.HelpSPName === 'ClientID') {
                    valueToSet = newValue.ClientID;
                  } else if (param.HelpSPName === 'Names') {
                    valueToSet = newValue.Name;
                  } else {
                    const firstKey = Object.keys(newValue).find(key => newValue[key] !== null);
                    valueToSet = newValue[firstKey] || '';
                  }
                }
                handleInputChange(param.ItemName, valueToSet);
              }}
              onInputChange={(event, newInputValue) => {
                handleInputChange(param.ItemName, newInputValue);
                if (newInputValue && newInputValue.length >= 2) {
                  debouncedFetchAutocomplete(param, newInputValue);
                }
              }}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                
                if (param.HelpSPName === 'ClientID') {
                  return `${option.ClientID} - ${option.Name}`;
                } else if (param.HelpSPName === 'Names') {
                  return `${option.Name} - ${option.ClientID}`;
                } else {
                  const firstKey = Object.keys(option).find(key => option[key] !== null);
                  return option[firstKey] || '';
                }
              }}
              freeSolo
              sx={{ minWidth: '180px', width: '190px' }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={label}
                  required={isMandatory}
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {autocompleteLoading[param.ItemName] ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              )}
            />
          );
        }
        return (
          <TextField
            label={label}
            value={filterValues[param.ItemName] === null ? '' : filterValues[param.ItemName] || ''}
            onChange={(e) => handleInputChange(param.ItemName, e.target.value)}
            required={isMandatory}
            inputProps={{ maxLength: param.ItemMaxLength }}
            size="small"
            sx={{ minWidth: '180px', width: '190px' }}
          />
        );
      case 'DAT':
        const maxDate = workingDate || new Date().toISOString().split('T')[0];
        return (
          <TextField
            type="date"
            label={label}
            value={filterValues[param.ItemName] || ''}
            onChange={(e) => handleInputChange(param.ItemName, e.target.value)}
            required={isMandatory}
            size="small"
            sx={{ minWidth: '180px', width: '190px' }}
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              max: maxDate
            }}
          />
        );
      case 'CHK':
        return (
          <div className="flex items-center h-10">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={filterValues[param.ItemName] === 1}
              onChange={(e) => handleInputChange(param.ItemName, e.target.checked ? 1 : 0)}
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              {label}{isMandatory && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        );  
      case 'CMB':
          if (!needsAutocomplete(param)) {
            return (
              <TextField
                label={label}
                value={filterValues[param.ItemName] === null ? '' : filterValues[param.ItemName] || ''}
                onChange={(e) => handleInputChange(param.ItemName, e.target.value)}
                required={isMandatory}
                inputProps={{ maxLength: param.ItemMaxLength }}
                size="small"
                sx={{ minWidth: '180px', width: '190px' }}
              />
            );
          }
      default:
        return (
          <TextField
            label={label}
            value={filterValues[param.ItemName] || ''}
            onChange={(e) => handleInputChange(param.ItemName, e.target.value)}
            required={isMandatory}
            inputProps={{ maxLength: param.ItemMaxLength }}
            size="small"
            sx={{ minWidth: '180px', width: '190px' }}
          />
        );
    }
  };

  if (!reportId) return null;

  const allParams = [];
  const processedParams = new Set();
  const filteredParameters = (reportId === 9966 || reportId === 9962)
    ? parameters.filter(param => 
        param.ItemName !== 'IsSummary' && 
        param.ItemName !== 'isSummary' && 
        param.IsHidden !== 1
      )
    : parameters;

  filteredParameters.forEach((param) => {
    if (processedParams.has(param.ItemName)) return;
    if (isRangeStart(param.ItemName)) {
      const toPair = getRangePair(param);
      if (toPair) {
        processedParams.add(param.ItemName);
        processedParams.add(toPair.ItemName);
        allParams.push({ 
          type: 'range', 
          from: param, 
          to: toPair,
          isMandatory: param.IsMandatory === 1 || toPair.IsMandatory === 1
        });
        return;
      }
    }
    if (isRangeEnd(param.ItemName)) {
      const fromParamName = param.ItemName.replace('To', 'From');
      const hasFromPair = filteredParameters.find(p => p.ItemName === fromParamName);
      if (hasFromPair) return;
    }
    processedParams.add(param.ItemName);
    allParams.push({ 
      type: 'single', 
      param,
      isMandatory: param.IsMandatory === 1
    });
  });

  const sortedParams = allParams.sort((a, b) => {
    if (a.isMandatory && !b.isMandatory) return -1;
    if (!a.isMandatory && b.isMandatory) return 1;
    return 0;
  });

  const initialDisplayParams = sortedParams.slice(0, 3);
  const advancedDisplayParams = sortedParams.slice(3);
  const hasMoreFilters = sortedParams.length > 3;

  return (
    <>
      {hasMoreFilters && showAdvancedFilters && (
        <div 
          className="report-adv-backdrop"
          onClick={() => setShowAdvancedFilters(false)}
        />
      )}
      
      <div className="report-filter-panel">
        <div className="report-filter-content">
            <div className="report-filter-header">
              <button
                onClick={onToggleSidebar}
                className="report-filter-toggle"
                aria-label="Toggle sidebar"
              >
                <Menu size={18} />
              </button>
              <Filter className="report-filter-icon" size={18} />
              <div className="report-filter-label">
                {groupName && (
                  <span className="report-filter-group">{groupName}</span>
                )}
                <span className="report-filter-title">Filters for {reportName}:</span>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 flex-1">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-500">Loading filters...</span>
              </div>
            ) : parameters.length === 0 ? (
              <div className="flex-1">
                <span className="text-sm text-gray-500">No filters required</span>
              </div>
            ) : (
              <>
                <div className="report-filter-params-scroll" aria-label="Filter inputs">
                  <div className="report-filter-params">
                    {initialDisplayParams.map((item, index) => (
                      <div key={index} className="report-filter-param">
                        {item.type === 'range' ? (
                          <div className="report-filter-param-range">
                            {renderInput(item.from)}
                            {renderInput(item.to)}
                          </div>
                        ) : (
                          renderInput(item.param)
                        )}
                      </div>
                    ))}
                    {hasMoreFilters && (
                      <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="report-filter-more-btn"
                      >
                        {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {showAdvancedFilters ? 'Fewer Filters' : 'More Filters'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="report-filter-buttons">
                  <button
                    onClick={handleRunReport}
                    disabled={loading}
                    className="report-filter-run-btn"
                  >
                    <Play size={14} />
                    Run Report
                  </button>
                  <ExportReport
                  buttonClassName="report-filter-export-btn"
                  data={reportResultsData}
                  reportName={reportName}
                  disabled={reportResultsData.length === 0}
                  companyInfo={companyInfo}
                  selectedBranch={null}
                  submittedFilters={submittedFilters}
                  reportType={
                    reportType === 'trialbalance' ? 'trialbalance' : 
                    reportType === 'accountjournal' ? 'accountjournal' : 
                    reportType === 'generalledger' ? 'generalledger' : 
                    reportType === 'savingsstatement' ? 'savingsstatement' : 
                    reportType === 'portfolioatrisk' ? 'portfolioatrisk' :
                    reportType === 'expectedrepayments' ? 'expectedrepayments' :
                    reportType === 'savingsvsloanbalance' ? 'savingsvsloanbalance' :
                    reportType === 'loansdisbursed' ? 'loansdisbursed' :
                    reportType === 'loanageing' ? 'loanageing' :
                    reportType === 'loanarrearsdetailed' ? 'loanarrearsdetailed' :
                    reportType === 'fixeddepositstatement' ? 'fixeddepositstatement' :
                    reportType === 'fixeddepositmemberstatement' ? 'fixeddepositmemberstatement' :
                    reportType
                  }
                  processedData={
                    reportType === 'trialbalance' ? trialBalanceProcessedData : 
                    reportType === 'accountjournal' ? accountJournalProcessedData : 
                    reportType === 'generalledger' ? generalLedgerProcessedData : 
                    reportType === 'savingsstatement' ? savingsStatementProcessedData :  
                    reportType === 'portfolioatrisk' ? portfolioAtRiskProcessedData :
                    reportType === 'expectedrepayments' ? (expectedRepaymentsProcessedData || null) :
                    reportType === 'savingsvsloanbalance' ? (savingsVsLoanBalanceProcessedData || null) :
                    reportType === 'loansdisbursed' ? (loansDisbursedProcessedData || null) :
                    reportType === 'loanageing' ? (loanAgeingProcessedData || null) :
                    reportType === 'loanarrearsdetailed' ? (loanArrearsDetailedProcessedData || null) :
                    reportType === 'fixeddepositstatement' ? (fixedDepositStatementProcessedData || null) :
                    reportType === 'fixeddepositmemberstatement' ? (fixedDepositMemberStatementProcessedData || null) :
                    null
                  }
                  fixedDepositStatementProcessedData={fixedDepositStatementProcessedData}
                  fixedDepositMemberStatementProcessedData={fixedDepositMemberStatementProcessedData}
                  accountJournalProcessedData={accountJournalProcessedData}
                  generalLedgerProcessedData={generalLedgerProcessedData}
                  savingsStatementProcessedData={savingsStatementProcessedData}
                  portfolioAtRiskProcessedData={portfolioAtRiskProcessedData}
                  reportData={reportData}
                  reportId={reportId}
                />
                  <button
                    onClick={onClose}
                    className="report-filter-close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </>
            )}
        </div>

        {hasMoreFilters && showAdvancedFilters && (
          <div className="report-adv-popover" role="dialog" aria-label="Additional Filters">
            <div className="report-adv-header">
              <h3 className="report-adv-title">Additional Filters</h3>
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="report-adv-close"
                aria-label="Close additional filters"
              >
                <X size={16} />
              </button>
            </div>
            <div className="report-adv-body">
              <div className="report-adv-grid">
                {advancedDisplayParams.map((item, index) => (
                  <React.Fragment key={index}>
                    {item.type === 'range' ? (
                      <>
                        <div className="report-adv-cell">{renderInput(item.from)}</div>
                        <div className="report-adv-cell">{renderInput(item.to)}</div>
                      </>
                    ) : (
                      <div className="report-adv-cell">{renderInput(item.param)}</div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="report-adv-footer">
              <button
                onClick={() => {
                  setShowAdvancedFilters(false);
                  handleRunReport();
                }}
                disabled={loading}
                className="report-adv-run"
              >
                <Play size={14} />
                Run Report
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .report-filter-panel {
          background: #f3f4f6;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          overflow: visible;
          position: relative;
        }
        .report-filter-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.25rem 1rem; /* extra top space for MUI labels */
          flex-wrap: nowrap;
          overflow: visible;
          min-width: 0;
        }
        .report-filter-params-scroll {
          flex: 1;
          min-width: 0;
          overflow-x: auto;
          overflow-y: hidden;
          padding-top: 10px; /* room for floating labels */
          padding-bottom: 6px; /* room for scrollbar */
        }
        .report-filter-params-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .report-filter-params-scroll::-webkit-scrollbar-track {
          background: #e5e7eb;
          border-radius: 3px;
        }
        .report-filter-params-scroll::-webkit-scrollbar-thumb {
          background: #9ca3af;
          border-radius: 3px;
        }
        .report-filter-params {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: nowrap;
          min-width: max-content;
        }
        .report-filter-param {
          flex-shrink: 0;
        }
        .report-filter-param-range {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }
        .report-filter-buttons {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        /* Prevent MUI field labels from being clipped */
        .report-filter-panel .MuiFormControl-root {
          margin-top: 4px;
        }
        .report-filter-panel .MuiInputLabel-root {
          line-height: 1.1;
        }
        .report-filter-panel .MuiInputBase-root {
          font-size: 0.875rem;
        }
        .report-filter-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: max-content;
        }
        .report-filter-toggle {
          padding: 0.5rem;
          color: #4b5563;
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s, color 0.2s;
        }
        .report-filter-toggle:hover {
          background: #e5e7eb;
          color: #374151;
        }
        .report-filter-icon {
          color: #4b5563;
        }
        .report-filter-label {
          display: flex;
          flex-direction: column;
        }
        .report-filter-group {
          font-size: 0.875rem;
          font-weight: 700;
          color: #374151;
        }
        .report-filter-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          white-space: nowrap;
        }
        .report-filter-more-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #2563eb;
          background: transparent;
          border: 1px solid #93c5fd;
          border-radius: 6px;
          cursor: pointer;
          white-space: nowrap;
          transition: background-color 0.2s, color 0.2s;
        }
        .report-filter-more-btn:hover {
          background: #eff6ff;
          color: #1d4ed8;
        }
        .report-filter-run-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          background: #2563eb;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          white-space: nowrap;
          transition: background-color 0.2s;
        }
        .report-filter-run-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }
        .report-filter-run-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .report-filter-export-btn,
        .export-report-btn.report-filter-export-btn {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          min-height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .report-filter-close {
          padding: 0.5rem;
          color: #6b7280;
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: color 0.2s, background-color 0.2s;
        }
        .report-filter-close:hover {
          color: #374151;
          background: #e5e7eb;
        }

        /* Advanced filters popover (match Image 2) */
        .report-adv-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.25);
          z-index: 40;
        }
        .report-adv-popover {
          position: absolute;
          right: 16px;
          top: calc(100% + 12px);
          width: 560px;
          max-width: calc(100vw - 32px);
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.18);
          z-index: 50;
          overflow: hidden;
        }
        .report-adv-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }
        .report-adv-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #374151;
          margin: 0;
        }
        .report-adv-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
          transition: background-color 0.2s, color 0.2s;
        }
        .report-adv-close:hover {
          background: #f3f4f6;
          color: #374151;
        }
        .report-adv-body {
          padding: 12px;
          max-height: 280px;
          overflow: auto;
        }
        .report-adv-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .report-adv-cell {
          min-width: 0;
        }
        .report-adv-footer {
          display: flex;
          justify-content: flex-end;
          padding: 10px 12px;
          border-top: 1px solid #e5e7eb;
          background: #ffffff;
        }
        .report-adv-run {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #ffffff;
          background: #2563eb;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .report-adv-run:hover:not(:disabled) {
          background: #1d4ed8;
        }
        .report-adv-run:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
};

export default ReportFilterWindow;