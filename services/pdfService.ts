// Enhanced PDF Service with printing, downloading, and viewing capabilities

export interface PDFOptions {
  fileName: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'a3' | 'letter';
  quality?: 'low' | 'medium' | 'high';
  useTextContent?: boolean;
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface PrintOptions {
  orientation?: 'portrait' | 'landscape';
  scale?: 'actual-size' | 'fit' | 'shrink-to-fit';
  margins?: 'minimum' | 'default' | 'custom';
  customMargins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// Wait for libraries to load
const waitForLibraries = (): Promise<{ jsPDF: any; html2canvas: any }> => {
  return new Promise((resolve, reject) => {
    const maxAttempts = 50; // 5 seconds max wait
    let attempts = 0;

    const checkLibraries = () => {
      attempts++;
      
      if (typeof (window as any).jspdf !== 'undefined' && typeof (window as any).html2canvas !== 'undefined') {
        resolve({
          jsPDF: (window as any).jspdf.jsPDF,
          html2canvas: (window as any).html2canvas
        });
      } else if (attempts >= maxAttempts) {
        reject(new Error('PDF libraries failed to load within timeout period'));
      } else {
        setTimeout(checkLibraries, 100);
      }
    };

    checkLibraries();
  });
};

// Generate descriptive filename
const generateFileName = (baseName: string | number, documentType: string, documentNumber?: string | number, date?: string): string => {
  const timestamp = date || new Date().toISOString().split('T')[0];
  const cleanBaseName = String(baseName).replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanDocNumber = documentNumber ? String(documentNumber).replace(/[^a-zA-Z0-9_-]/g, '_') : '';
  
  return `${documentType}_${cleanDocNumber ? cleanDocNumber + '_' : ''}${timestamp}.pdf`;
};

// Get quality settings based on option
const getQualitySettings = (quality: 'low' | 'medium' | 'high') => {
  switch (quality) {
    case 'low':
      return { scale: 1, jpegQuality: 0.6, compression: 'FAST' };
    case 'medium':
      return { scale: 1.5, jpegQuality: 0.75, compression: 'MEDIUM' };
    case 'high':
    default:
      return { scale: 2, jpegQuality: 0.85, compression: 'SLOW' };
  }
};

// Enhanced PDF generation with better quality and file size control
export const generatePdf = async (elementId: string, options: PDFOptions): Promise<void> => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  try {
    const { jsPDF, html2canvas } = await waitForLibraries();
    const qualitySettings = getQualitySettings(options.quality || 'high');
    
    // Enhanced canvas options for better quality and performance
    const canvas = await html2canvas(input, {
      scale: qualitySettings.scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: input.scrollWidth,
      height: input.scrollHeight,
      windowWidth: input.scrollWidth,
      windowHeight: input.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0
    });
    
    // Use JPEG with optimized quality for file size control
    const imgData = canvas.toDataURL('image/jpeg', qualitySettings.jpegQuality);
    
    // Create PDF with specified options
    const pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'pt',
      format: options.format || 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;

    // Apply margins
    const margins = options.margins || { top: 20, right: 20, bottom: 20, left: 20 };
    const contentWidth = pdfWidth - margins.left - margins.right;
    const contentHeight = pdfHeight - margins.top - margins.bottom;

    let imgWidth = contentWidth;
    let imgHeight = imgWidth / ratio;

    // Fit to page while maintaining aspect ratio
    if (imgHeight > contentHeight) {
      imgHeight = contentHeight;
      imgWidth = imgHeight * ratio;
    }

    const x = margins.left + (contentWidth - imgWidth) / 2;
    const y = margins.top + (contentHeight - imgHeight) / 2;

    pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight, undefined, qualitySettings.compression);
    
    // Generate descriptive filename
    const fileName = generateFileName(options.fileName, 'Document');
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Enhanced multi-page PDF generation
export const generateMultiPagePdf = async (elementId: string, options: PDFOptions): Promise<void> => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  try {
    const { jsPDF, html2canvas } = await waitForLibraries();
    const qualitySettings = getQualitySettings(options.quality || 'high');
    
    const canvas = await html2canvas(input, {
      scale: qualitySettings.scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: input.scrollWidth,
      height: input.scrollHeight,
      windowWidth: input.scrollWidth,
      windowHeight: input.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0
    });

    const imgData = canvas.toDataURL('image/jpeg', qualitySettings.jpegQuality);
    const pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'pt',
      format: options.format || 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;

    // Apply margins
    const margins = options.margins || { top: 20, right: 20, bottom: 20, left: 20 };
    const contentWidth = pdfWidth - margins.left - margins.right;
    const contentHeight = pdfHeight - margins.top - margins.bottom;

    const imgWidth = contentWidth;
    const imgHeight = imgWidth / ratio;

    let heightLeft = imgHeight;
    let position = 0;
    
    // Add first page
    pdf.addImage(imgData, 'JPEG', margins.left, margins.top + position, imgWidth, imgHeight, undefined, qualitySettings.compression);
    heightLeft -= contentHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margins.left, margins.top + position, imgWidth, imgHeight, undefined, qualitySettings.compression);
      heightLeft -= contentHeight;
    }

    const fileName = generateFileName(options.fileName, 'MultiPage');
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating multi-page PDF:', error);
    throw new Error(`Failed to generate multi-page PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Enhanced printing functionality
export const printDocument = async (elementId: string, options: PrintOptions = {}): Promise<void> => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow popups for this site.');
    }

    // Clone the element and its styles
    const clonedElement = input.cloneNode(true) as HTMLElement;
    
    // Get all stylesheets
    const stylesheets = Array.from(document.styleSheets);
    let stylesText = '';
    
    for (const stylesheet of stylesheets) {
      try {
        if (stylesheet.href) {
          stylesText += `@import url("${stylesheet.href}");\n`;
        } else if (stylesheet.ownerNode && stylesheet.ownerNode.textContent) {
          stylesText += stylesheet.ownerNode.textContent + '\n';
        }
      } catch (e) {
        // Skip stylesheets that can't be accessed due to CORS
        console.warn('Could not access stylesheet:', e);
      }
    }

    // Add print-specific styles
    const printStyles = `
      @page {
        size: ${options.orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
        margin: ${options.margins === 'minimum' ? '0.5in' : 
                 options.margins === 'custom' && options.customMargins ? 
                 `${options.customMargins.top}in ${options.customMargins.right}in ${options.customMargins.bottom}in ${options.customMargins.left}in` : 
                 '0.75in'};
      }
      
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.4;
        color: #000;
        background: white;
      }
      
      .print-container {
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 0;
        transform: none !important;
        scale: none !important;
      }
      
      @media print {
        .no-print {
          display: none !important;
        }
        
        .print-break-before {
          page-break-before: always;
        }
        
        .print-break-after {
          page-break-after: always;
        }
        
        .print-break-inside-avoid {
          page-break-inside: avoid;
        }
        
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }
    `;

    // Write the HTML content
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Document</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>${stylesText}</style>
          <style>${printStyles}</style>
        </head>
        <body>
          <div class="print-container">
            ${clonedElement.outerHTML}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        
        // Close the window after printing (optional)
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 500);
    };

  } catch (error) {
    console.error('Error printing document:', error);
    throw new Error(`Failed to print document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Generate PDF for specific document types with optimized settings
export const generateDocumentPdf = async (
  elementId: string, 
  documentType: 'invoice' | 'lorry-receipt' | 'truck-hiring-note' | 'ledger',
  documentNumber: string | number,
  date?: string
): Promise<void> => {
  const baseFileName = documentNumber;
  const fileName = generateFileName(baseFileName, documentType, documentNumber, date);
  
  // Document-specific optimizations
  const options: PDFOptions = {
    fileName,
    quality: 'high',
    useTextContent: true,
    margins: { top: 20, right: 20, bottom: 20, left: 20 }
  };

  // Set orientation based on document type
  if (documentType === 'invoice') {
    options.orientation = 'landscape';
    options.format = 'a4';
  } else {
    options.orientation = 'portrait';
    options.format = 'a4';
  }

  await generatePdf(elementId, options);
};

// Legacy function for backward compatibility
export const generatePdfLegacy = async (elementId: string, fileName: string): Promise<void> => {
  await generatePdf(elementId, {
    fileName,
    quality: 'high',
    orientation: 'portrait',
    format: 'a4'
  });
};

// Legacy function for backward compatibility
export const generateMultiPagePdfLegacy = async (elementId: string, fileName: string): Promise<void> => {
  await generateMultiPagePdf(elementId, {
    fileName,
    quality: 'high',
    orientation: 'portrait',
    format: 'a4'
  });
};