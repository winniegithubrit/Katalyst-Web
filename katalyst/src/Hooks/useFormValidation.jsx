import { useState, useCallback } from 'react';

const useFormValidation = (formData, validationRules) => {
  const [errors, setErrors] = useState({});

  const validateForm = useCallback(() => {
    const newErrors = {};

    Object.entries(validationRules).forEach(([field, rules]) => {
      const value = formData[field];

      if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
        newErrors[field] = rules.required;
      } else if (rules.custom) {
        const customError = rules.custom(value);
        if (customError) {
          newErrors[field] = customError;
        }
      }
    });

    setErrors(newErrors);
    return newErrors;
  }, [formData, validationRules]);

  return {
    errors,
    validateForm
  };
};

export default useFormValidation;
