import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFieldValidation } from '../../hooks/useFormValidation';
import { ValidationRules } from '../../services/formValidation';
import { searchCities, getAllCities, getCitiesByState, IndianCity } from '../../constants/indianCities';

interface ValidatedCitySelectProps {
  label?: string;
  validationRules: ValidationRules;
  fieldName: string;
  value: string;
  onValueChange: (value: string) => void;
  onCitySelect?: (city: IndianCity) => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  wrapperClassName?: string;
  showValidationIcon?: boolean;
  state?: string; // Filter cities by state
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const ValidatedCitySelect: React.FC<ValidatedCitySelectProps> = ({
  label,
  validationRules,
  fieldName,
  value,
  onValueChange,
  onCitySelect,
  validateOnChange = true,
  validateOnBlur = true,
  wrapperClassName,
  showValidationIcon = true,
  state,
  placeholder = "Type to search cities...",
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  const { error, touched, handleBlur, clearError } = useFieldValidation(
    fieldName,
    value,
    validationRules,
    { validateOnChange, validateOnBlur }
  );

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Get all cities or filter by state
  const allCities = useMemo(() => {
    return state ? getCitiesByState(state) : getAllCities();
  }, [state]);

  // Find the selected city
  const selectedCity = useMemo(() => {
    return allCities.find(city => city.name === value);
  }, [allCities, value]);

  // Filter cities based on search term
  const filteredCities = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    return searchCities(searchTerm, state).slice(0, 15); // Limit to 15 results
  }, [searchTerm, state]);

  // Update search term when value changes externally
  useEffect(() => {
    if (selectedCity && !isFocused) {
      setSearchTerm(selectedCity.name);
    } else if (!value && !isFocused) {
      setSearchTerm('');
    }
  }, [selectedCity, value, isFocused]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        if (selectedCity) {
          setSearchTerm(selectedCity.name);
        } else {
          setSearchTerm('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCity]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredCities.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCities.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredCities.length) {
          handleCitySelect(filteredCities[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setIsOpen(newSearchTerm.length >= 2);
    setHighlightedIndex(-1);
    
    // Clear selection if search term doesn't match selected city
    if (selectedCity && !selectedCity.name.toLowerCase().includes(newSearchTerm.toLowerCase())) {
      onValueChange('');
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    if (searchTerm.length >= 2) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    handleBlur();
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  const handleCitySelect = (city: IndianCity) => {
    onValueChange(city.name);
    setSearchTerm(city.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
    
    if (onCitySelect) {
      onCitySelect(city);
    }
  };

  // Determine validation state
  const hasError = touched && error;
  const isValid = touched && !error && value !== '' && value !== null && value !== undefined;
  const isPending = isFocused && !touched;

  // Get validation icon
  const getValidationIcon = () => {
    if (!showValidationIcon || !touched) return null;
    
    if (hasError) {
      return (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
    
    if (isValid) {
      return (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
    
    return null;
  };

  const getDisplayValue = () => {
    if (selectedCity) {
      return selectedCity.name;
    }
    return searchTerm;
  };

  return (
    <div className={`relative ${wrapperClassName}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={getDisplayValue()}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`peer block w-full rounded-lg shadow-sm py-3 px-3 bg-white border transition-colors duration-200 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
            hasError 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500 animate-shake' 
              : 'border-gray-300 focus:border-indigo-600 focus:ring-indigo-600'
          } ${isPending ? 'ring-2 ring-blue-200' : ''} ${
            isValid ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''
          } ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''} ${className}`}
          {...props}
        />
        
        {label && (
          <label
            className={`absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 left-1 peer-focus:px-2 peer-focus:text-indigo-600 ${
              hasError ? 'peer-focus:text-red-600 text-red-600' : ''
            } ${
              !getDisplayValue() ? 'peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2' : ''
            } peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4`}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {getValidationIcon()}
      </div>

      {isOpen && filteredCities.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredCities.map((city, index) => (
            <li
              key={`${city.name}-${city.state}`}
              className={`px-3 py-2 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 ${
                index === highlightedIndex 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleCitySelect(city)}
            >
              <div className="flex flex-col">
                <div className="font-medium text-gray-900">
                  {city.name}
                  {city.isCapital && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Capital
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {city.state}
                  {city.category !== 'capital' && city.category !== 'major' && (
                    <span className="ml-1 capitalize">• {city.category}</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isOpen && searchTerm.length >= 2 && filteredCities.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3 text-sm text-gray-500">
          No cities found matching "{searchTerm}"
        </div>
      )}

      {hasError && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};
