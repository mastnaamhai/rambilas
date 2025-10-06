import React from 'react';

interface FilterSectionProps {
  children: React.ReactNode;
  onApplyFilters?: () => void;
  onClearFilters?: () => void;
  className?: string;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  children,
  onApplyFilters,
  onClearFilters,
  className = ''
}) => {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-blue-900 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </h3>
        {(onApplyFilters || onClearFilters) && (
          <div className="flex gap-2">
            {onClearFilters && (
              <button
                onClick={onClearFilters}
                className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors duration-200"
              >
                Clear
              </button>
            )}
            {onApplyFilters && (
              <button
                onClick={onApplyFilters}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
              >
                Apply Filters
              </button>
            )}
          </div>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};
