// Enhanced Export Service with multiple formats and advanced features

export interface ExportOptions {
    format: 'csv' | 'xlsx' | 'json' | 'pdf' | 'zip';
    filename: string;
    includeHeaders?: boolean;
    dateRange?: {
        start: Date;
        end: Date;
    };
    filters?: Record<string, any>;
    customFields?: string[];
    template?: string;
    compression?: boolean;
}

export interface ExportProgress {
    stage: 'preparing' | 'processing' | 'generating' | 'compressing' | 'uploading' | 'completed' | 'error';
    progress: number; // 0-100
    message: string;
    estimatedTime?: number; // seconds
}

export interface ExportTemplate {
    id: string;
    name: string;
    description: string;
    dataTypes: ('customers' | 'lorryReceipts' | 'invoices' | 'truckHiringNotes' | 'payments')[];
    fields: string[];
    format: 'csv' | 'json' | 'xlsx' | 'zip';
    filters: Record<string, any>;
    isDefault?: boolean;
}

// CSV Conversion
const convertToCSV = (data: object[]): string => {
    if (!data || data.length === 0) {
        return '';
    }
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
        const values = headers.map(header => {
            let cell = (row as any)[header];
            if (cell === null || cell === undefined) {
                cell = '';
            } else {
                cell = String(cell);
            }
            // Escape quotes by doubling them and wrap in quotes if it contains a comma, quote, or newline
            if (cell.includes('"') || cell.includes(',') || cell.includes('\n')) {
                cell = `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
};

// JSON Conversion
const convertToJSON = (data: object[]): string => {
    return JSON.stringify(data, null, 2);
};

// Excel Conversion (simplified - will be enhanced later)
const convertToExcel = async (data: object[]): Promise<Blob> => {
    try {
        // For now, return CSV as Excel - will be enhanced with proper Excel support
        const csvString = convertToCSV(data);
        return new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    } catch (error) {
        console.error('Excel conversion failed:', error);
        const csvString = convertToCSV(data);
        return new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    }
};

// ZIP Creation (simplified - will be enhanced later)
const createZip = async (files: { name: string; content: Blob }[]): Promise<Blob> => {
    try {
        // For now, return the first file - will be enhanced with proper ZIP support
        if (files.length > 0) {
            return files[0].content;
        }
        throw new Error('No files to create ZIP from');
    } catch (error) {
        console.error('ZIP creation failed:', error);
        if (files.length > 0) {
            return files[0].content;
        }
        throw new Error('ZIP creation failed and no files to fallback to');
    }
};

// File Download Utility
const downloadFile = (blob: Blob, filename: string, mimeType: string): void => {
        const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Progress Callback Type
export type ProgressCallback = (progress: ExportProgress) => void;

// Enhanced Export Function
export const exportData = async (
    data: object[], 
    options: ExportOptions, 
    onProgress?: ProgressCallback
): Promise<void> => {
    if (!data || data.length === 0) {
        throw new Error("No data available to export.");
    }

    try {
        onProgress?.({
            stage: 'preparing',
            progress: 10,
            message: 'Preparing data for export...'
        });

        // Apply filters if provided
        let filteredData = data;
        if (options.filters) {
            filteredData = data.filter(item => {
                return Object.entries(options.filters).every(([key, value]) => {
                    if (value === null || value === undefined) return true;
                    return (item as any)[key] === value;
                });
            });
        }

        // Apply date range filter if provided
        if (options.dateRange) {
            filteredData = filteredData.filter(item => {
                const itemDate = new Date((item as any).date);
                return itemDate >= options.dateRange!.start && itemDate <= options.dateRange!.end;
            });
        }

        // Select custom fields if provided
        if (options.customFields && options.customFields.length > 0) {
            filteredData = filteredData.map(item => {
                const filteredItem: any = {};
                options.customFields!.forEach(field => {
                    filteredItem[field] = (item as any)[field];
                });
                return filteredItem;
            });
        }

        onProgress?.({
            stage: 'processing',
            progress: 30,
            message: 'Processing data...'
        });

        let blob: Blob;
        let mimeType: string;
        let extension: string;

        switch (options.format) {
            case 'csv':
                const csvString = convertToCSV(filteredData);
                blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                mimeType = 'text/csv';
                extension = 'csv';
                break;

            case 'json':
                const jsonString = convertToJSON(filteredData);
                blob = new Blob([jsonString], { type: 'application/json' });
                mimeType = 'application/json';
                extension = 'json';
                break;

            case 'xlsx':
                onProgress?.({
                    stage: 'generating',
                    progress: 50,
                    message: 'Generating Excel file...'
                });
                blob = await convertToExcel(filteredData);
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                extension = 'xlsx';
                break;

            case 'pdf':
                // This would integrate with your existing PDF service
                throw new Error('PDF export not implemented yet');

            case 'zip':
                onProgress?.({
                    stage: 'compressing',
                    progress: 60,
                    message: 'Creating compressed archive...'
                });
                const files = [{
                    name: `${options.filename}.csv`,
                    content: new Blob([convertToCSV(filteredData)], { type: 'text/csv' })
                }];
                blob = await createZip(files);
                mimeType = 'application/zip';
                extension = 'zip';
                break;

            default:
                throw new Error(`Unsupported export format: ${options.format}`);
        }

        onProgress?.({
            stage: 'completed',
            progress: 100,
            message: 'Export completed successfully!'
        });

        const finalFilename = `${options.filename}.${extension}`;
        downloadFile(blob, finalFilename, mimeType);

    } catch (error) {
        onProgress?.({
            stage: 'error',
            progress: 0,
            message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        throw error;
    }
};

// Legacy CSV Export (for backward compatibility)
export const exportToCsv = (filename: string, data: object[]) => {
    exportData(data, {
        format: 'csv',
        filename,
        includeHeaders: true
    }).catch(error => {
        console.error('CSV export failed:', error);
        alert("Export failed. Please try again.");
    });
};

// Bulk Export Function
export const exportBulkData = async (
    dataSets: { name: string; data: object[]; options: Partial<ExportOptions> }[],
    masterOptions: ExportOptions,
    onProgress?: ProgressCallback
): Promise<void> => {
    const files: { name: string; content: Blob }[] = [];
    
    for (let i = 0; i < dataSets.length; i++) {
        const dataSet = dataSets[i];
        const options = { ...masterOptions, ...dataSet.options };
        
        onProgress?.({
            stage: 'processing',
            progress: (i / dataSets.length) * 80,
            message: `Processing ${dataSet.name}...`
        });

        let blob: Blob;
        switch (options.format) {
            case 'csv':
                blob = new Blob([convertToCSV(dataSet.data)], { type: 'text/csv' });
                break;
            case 'json':
                blob = new Blob([convertToJSON(dataSet.data)], { type: 'application/json' });
                break;
            case 'xlsx':
                blob = await convertToExcel(dataSet.data);
                break;
            default:
                throw new Error(`Unsupported format for bulk export: ${options.format}`);
        }

        files.push({
            name: `${dataSet.name}.${options.format === 'xlsx' ? 'xlsx' : options.format}`,
            content: blob
        });
    }

    onProgress?.({
        stage: 'compressing',
        progress: 90,
        message: 'Creating archive...'
    });

    const zipBlob = await createZip(files);
    downloadFile(zipBlob, `${masterOptions.filename}.zip`, 'application/zip');

    onProgress?.({
        stage: 'completed',
        progress: 100,
        message: 'Bulk export completed!'
    });
};

// Export Templates
export const getExportTemplates = (): ExportTemplate[] => [
    {
        id: 'all-data',
        name: 'Complete Data Export',
        description: 'Export all data types in a single archive',
        dataTypes: ['customers', 'lorryReceipts', 'invoices', 'truckHiringNotes', 'payments'],
        fields: ['*'],
        format: 'zip',
        filters: {},
        isDefault: true
    },
    {
        id: 'financial-summary',
        name: 'Financial Summary',
        description: 'Export financial data with summaries',
        dataTypes: ['invoices', 'payments'],
        fields: ['date', 'amount', 'status', 'customer'],
        format: 'xlsx',
        filters: {}
    },
    {
        id: 'lorry-receipts-detailed',
        name: 'Detailed Lorry Receipts',
        description: 'Export LRs with all related information',
        dataTypes: ['lorryReceipts'],
        fields: ['*'],
        format: 'xlsx',
        filters: {}
    },
    {
        id: 'customer-ledger',
        name: 'Customer Ledger',
        description: 'Export customer-wise transaction ledger',
        dataTypes: ['lorryReceipts', 'invoices', 'payments'],
        fields: ['date', 'customer', 'type', 'amount', 'balance'],
        format: 'xlsx',
        filters: {}
    }
];

// Data Validation
export const validateExportData = (data: object[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!data || data.length === 0) {
        errors.push('No data to export');
        return { isValid: false, errors };
    }

    // Check for required fields
    const requiredFields = ['date', 'id'];
    const sampleItem = data[0];
    const missingFields = requiredFields.filter(field => !(field in sampleItem));
    
    if (missingFields.length > 0) {
        errors.push(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Check for data consistency
    const dateFields = data.filter(item => {
        const date = (item as any).date;
        return date && isNaN(new Date(date).getTime());
    });
    
    if (dateFields.length > 0) {
        errors.push(`${dateFields.length} records have invalid dates`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};