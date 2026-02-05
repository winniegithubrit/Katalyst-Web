import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useSecureApi from '../Hooks/useSecureApi';
import useFormData from '../Hooks/useFormData';
import useFormValidation from '../Hooks/useFormValidation';

const Login = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [branchSearch, setBranchSearch] = useState('');
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const { callApi, loading } = useSecureApi();
  useEffect(() => {
    const hasToken = !!sessionStorage.getItem('authToken');
    
    if (hasToken) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const {
    formData,
    handleInputChange,
    setFormData,
  } = useFormData({
    selectedBranch: '',
    username: '',
    password: ''
  });

  const validationRules = {
    username: { required: 'Username is required' },
    password: { required: 'Password is required' },
    selectedBranch: {
      custom: (value) => {
        if (branches.length > 0 && !value) {
          return 'Please select a branch';
        }
        return null; 
      }
    }
  };

  const { errors, validateForm } = useFormValidation(formData, validationRules);
  const [language, setLanguage] = useState('en');
  
  const filteredBranches = useMemo(() => {
    if (!branchSearch.trim()) return branches;
    
    const searchLower = branchSearch.toLowerCase();
    return branches.filter(branch => 
      branch.BranchName.toLowerCase().includes(searchLower) ||
      String(branch.OurBranchId).toLowerCase().includes(searchLower)
    );
  }, [branches, branchSearch]);
  
  const selectedBranchName = useMemo(() => {
    const branch = branches.find(b => b.OurBranchId === formData.selectedBranch);
    return branch ? branch.BranchName : '';
  }, [branches, formData.selectedBranch]);

  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const response = await callApi({
          endpoint: '/System/API/Branch',
          method: 'GET',
          requiresAuth: false
        });
        
        if (response) {
          let branchesArray = [];
          
          if (Array.isArray(response)) {
            branchesArray = response;
          } else if (response.data && Array.isArray(response.data)) {
            branchesArray = response.data;
          } else if (response.branches && Array.isArray(response.branches)) {
            branchesArray = response.branches;
          } else if (response.result && Array.isArray(response.result)) {
            branchesArray = response.result;
          } else {
            const arrayKeys = Object.keys(response).filter(key => Array.isArray(response[key]));
            if (arrayKeys.length > 0) {
              branchesArray = response[arrayKeys[0]];
            }
          }

          if (branchesArray && branchesArray.length > 0) {
            const mappedBranches = branchesArray.map((branch, index) => {
              const possibleIdKeys = [
                'BranchID', 'branchId', 'Id', 'id', 'ID', 'BranchId',
                'OurBranchId', 'OurBranchID', 'SubCodeId', 'SubCodeID',
                'Code', 'BranchCode', 'BranchNo', 'Number'
              ];
              
              const possibleNameKeys = [
                'BranchName', 'branchName', 'Name', 'name', 'Description', 'description',
                'Title', 'title', 'BranchDescription', 'BranchTitle',
                'OurBranchName', 'Location', 'Address', 'City'
              ];
              
              let branchId = null;
              let branchName = null;
              
              for (const key of possibleIdKeys) {
                if (branch[key] !== undefined && branch[key] !== null && branch[key] !== '') {
                  branchId = branch[key];
                  break;
                }
              }
              
              for (const key of possibleNameKeys) {
                if (branch[key] !== undefined && branch[key] !== null && branch[key] !== '') {
                  branchName = branch[key];
                  break;
                }
              }
              
              if (!branchId) {
                branchId = index;
              }
              
              if (!branchName) {
                const stringProperties = Object.keys(branch).filter(
                  key => typeof branch[key] === 'string' && branch[key].length > 0
                );
                if (stringProperties.length > 0) {
                  branchName = branch[stringProperties[0]];
                } else {
                  branchName = `Branch ${index + 1}`;
                }
              }

              return {
                OurBranchId: branchId,
                BranchName: branchName,
                _original: branch
              };
            });
            
            setBranches(mappedBranches);
            sessionStorage.setItem('branches', JSON.stringify(mappedBranches));
          } else {
            setBranches([]);
          }
        } else {
          setBranches([]);
        }
      } catch (error) {
        console.error('Failed to fetch branches:', error);
        toast.error('Failed to load branches. Please refresh the page.');
        setBranches([]);
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, []);

  const handleBranchSelect = (branch) => {
    setFormData(prev => ({
      ...prev,
      selectedBranch: branch.OurBranchId
    }));
    setBranchSearch('');
    setShowBranchDropdown(false);
  };

  const handleUsernameChange = (e) => {
    const { name, value } = e.target;
    handleInputChange({
      target: {
        name,
        value: value.toUpperCase()
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      const credentials = {
        DeviceId: `web-${Date.now()}`,
        branchId: formData.selectedBranch || "01", 
        UserName: formData.username.trim(),
        Password: formData.password
      };

      const response = await callApi({
        endpoint: '/Auth/API/Account',
        method: 'POST',
        body: credentials,
        requiresAuth: false
      });

      const isSuccess = 
        response?.user?.status === 'SUCCESS' ||
        response?.status === 'SUCCESS' || 
        response?.success === true ||
        response?.token ||
        response?.code === 200; 

      if (isSuccess) {
        const token = response.token || 
                     response.user?.token || 
                     response.user?.Token ||
                     response.data?.token ||
                     response.authToken ||
                     response.accessToken ||
                     response.access_token;
        
        if (!token) {
          throw new Error('No authentication token received from server');
        }
        const cachedBranches = sessionStorage.getItem('branches');
        sessionStorage.clear();
        localStorage.clear();
        sessionStorage.setItem('authToken', token);
        window.dispatchEvent(new Event('authChange'));
        localStorage.setItem('loginResponse', JSON.stringify(response));
        localStorage.setItem('username', formData.username.trim());
        sessionStorage.setItem('userData', JSON.stringify(response.user || response));
        
        if (response.bank) {
          sessionStorage.setItem('bankInfo', JSON.stringify(response.bank));
        }
        const userProfile = {
          ...(response.user || response),
          BankName: response.bank?.bankName,
          BankLogo: response.bank?.bankLogo,
          BranchId: response.bank?.branchId
        };
        sessionStorage.setItem('userProfile', JSON.stringify(userProfile));
        if (cachedBranches) {
          sessionStorage.setItem('branches', cachedBranches);
        }
        if (formData.selectedBranch) {
          const selectedBranchData = branches.find(
            branch => branch.OurBranchId === formData.selectedBranch
          );
          if (selectedBranchData) {
            sessionStorage.setItem('selectedBranch', JSON.stringify(selectedBranchData));
          }
        }
        const selectedBranch = response.branch?.find(b => b.ourBranchId === formData.selectedBranch) || response.branch?.[0];
        const branchName = selectedBranch?.branchName || '';
        document.title = `${response.bank?.bankName || 'Katalyst'}[${response.bank?.branchId || ''}-${branchName}][${response.user?.workingDate || ''}][${response.user?.userName || formData.username}]`;
        
        toast.success('Login successful.');
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error('Invalid login credentials');
      }
    } catch (err) {
      toast.error(err.message || 'Invalid login credentials');
      const cachedBranches = sessionStorage.getItem('branches');
      sessionStorage.clear();
      localStorage.clear();
      
      if (cachedBranches) {
        sessionStorage.setItem('branches', cachedBranches);
      }
    }
  };

  return (
    <div className="login-page">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <div className="login-card">
        <div className="login-header">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="login-language-select"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>
        <div className="login-welcome">
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Please sign in to continue</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-fields">
            {loadingBranches ? (
              <div className="flex items-center justify-center py-4">
                <svg 
                  className="w-5 h-5 mr-2 animate-spin" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span className="text-gray-600">Loading branches...</span>
              </div>
            ) : branches.length > 0 && (
              <div className="flex flex-col relative">
                <label htmlFor="selectedBranch" className="login-label">
                  Select Branch
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={selectedBranchName || branchSearch}
                    onChange={(e) => {
                      setBranchSearch(e.target.value);
                      setShowBranchDropdown(true);
                      if (formData.selectedBranch && e.target.value !== selectedBranchName) {
                        setFormData(prev => ({
                          ...prev,
                          selectedBranch: ''
                        }));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && formData.selectedBranch) {
                        setFormData(prev => ({
                          ...prev,
                          selectedBranch: ''
                        }));
                        setBranchSearch('');
                      }
                    }}
                    onFocus={() => setShowBranchDropdown(true)}
                    placeholder="Choose a branch..."
                    className={`login-input ${errors.selectedBranch ? 'login-input-error' : ''}`}
                    disabled={loading}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="login-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {showBranchDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowBranchDropdown(false)}
                    />
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto top-full">
                      {filteredBranches.length > 0 ? (
                        filteredBranches.map(branch => (
                          <div
                            key={branch.OurBranchId}
                            onClick={() => handleBranchSelect(branch)}
                            className={`px-4 py-2.5 cursor-pointer hover:bg-gray-100 ${
                              formData.selectedBranch === branch.OurBranchId ? 'bg-blue-50' : ''
                            }`}
                          >
                            {branch.BranchName}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2.5 text-gray-500">
                          No branches found
                        </div>
                      )}
                    </div>
                  </>
                )}
                {errors.selectedBranch && (
                  <p className="text-red-500 text-sm mt-1 font-normal">{errors.selectedBranch}</p>
                )}
              </div>
            )}
            
            <div className="flex flex-col">
              <label htmlFor="username" className="login-label">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={formData.username}
                onChange={handleUsernameChange}
                className={`login-input login-input-uppercase ${errors.username ? 'login-input-error' : ''}`}
                placeholder="ENTER YOUR USERNAME"
                disabled={loading || (branches.length > 0 && !formData.selectedBranch)}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1 font-normal">{errors.username}</p>
              )}
            </div>
            
            <div className="flex flex-col">
              <label htmlFor="password" className="login-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleInputChange}
                className={`login-input ${errors.password ? 'login-input-error' : ''}`}
                placeholder="Enter your password"
                disabled={loading || (branches.length > 0 && !formData.selectedBranch)}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1 font-normal">{errors.password}</p>
              )}
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading || loadingBranches || (branches.length > 0 && !formData.selectedBranch)}
                className="login-button"
              >
                {loading ? (
                  <>
                    <svg 
                      className="login-spinner" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign in'}
              </button>
            </div>
          </div>
        </form>
      </div>
      <style>{`
        .login-page {
          min-height: 100vh;
          background-color: #282c34;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .login-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
          padding: 2rem;
          width: 100%;
          max-width: 460px;
        }
        .login-header {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 1.5rem;
        }
        .login-language-select {
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 0.5rem 2rem 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: white;
          color: #374151;
          cursor: pointer;
        }
        .login-welcome {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .login-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.25rem 0;
        }
        .login-subtitle {
          font-size: 0.9375rem;
          color: #6b7280;
          margin: 0;
          font-weight: 400;
        }
        .login-form {
          width: 100%;
        }
        .login-fields {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .login-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.375rem;
          display: block;
        }
        .login-input {
          width: 100%;
          padding: 0.625rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          outline: none;
          background: white;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .login-input:focus {
          border-color: #3b82f6;
        }
        .login-input::placeholder {
          color: #9ca3af;
        }
        .login-input:disabled {
          background-color: #f9fafb;
          cursor: not-allowed;
        }
        .login-input-error {
          border-color: #ef4444;
        }
        .login-input-uppercase {
          text-transform: uppercase;
        }
        .login-button {
          width: 100%;
          padding: 0.75rem 1rem;
          margin-top: 0.5rem;
          background-color: #4a5568;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-button:hover:not(:disabled) {
          background-color: #374151;
        }
        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .login-chevron {
          width: 16px;
          height: 16px;
          color: #9ca3af;
        }
        .login-spinner {
          width: 16px;
          height: 16px;
          margin-right: 0.5rem;
          display: inline-block;
          animation: login-spin 1s linear infinite;
        }
        @keyframes login-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .login-card svg {
          max-width: 24px;
          max-height: 24px;
        }
      `}</style>
    </div>
  );
};

export default Login;