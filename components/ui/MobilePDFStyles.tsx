import React from 'react';

export const MobilePDFStyles: React.FC = () => {
  return (
    <style>{`
      @media (max-width: 768px) {
        .pdf-container {
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        
        .pdf-content {
          font-size: 12px !important;
          line-height: 1.3 !important;
        }
        
        .pdf-table {
          font-size: 10px !important;
        }
        
        .pdf-header {
          padding: 8px !important;
        }
        
        .pdf-footer {
          padding: 8px !important;
        }
      }
    `}</style>
  );
};
