
import type { Customer, LorryReceipt } from '../types';

export function numberToWords(num: number): string {
    const a = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = [
        '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
    ];

    const inWords = (n: number): string => {
        if (n < 20) return a[n];
        let digit = n % 10;
        let ten = Math.floor(n / 10);
        return `${b[ten]} ${a[digit]}`.trim();
    }

    const toWords = (n: number): string => {
        let str = '';
        if (n > 9999999) {
            str += toWords(Math.floor(n / 10000000)) + ' Crore ';
            n %= 10000000;
        }
        if (n > 99999) {
            str += toWords(Math.floor(n / 100000)) + ' Lakh ';
            n %= 100000;
        }
        if (n > 999) {
            str += toWords(Math.floor(n / 1000)) + ' Thousand ';
            n %= 1000;
        }
        if (n > 99) {
            str += toWords(Math.floor(n / 100)) + ' Hundred ';
            n %= 100;
        }
        if (n > 0) {
            str += inWords(n);
        }
        return str.trim();
    }

    if (num === 0) return 'Zero';
    const result = toWords(num);
    return result.split(' ').filter(Boolean).join(' ');
}

export const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

export const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Function to fetch customer details from a GSTIN API
// The API key should be configured in the environment variables or database
const getGstApiKey = async (): Promise<string> => {
    try {
        // Try to get API key from database first
        const { getApiKeyValue } = await import('./apiKeyService');
        const apiKeyData = await getApiKeyValue('gstin', '');
        return apiKeyData.keyValue;
    } catch (error) {
        console.log('Could not fetch API key from database, using environment fallback');
        // Fallback to environment variable
        const envKey = import.meta.env.VITE_GSTIN_API_KEY;
        if (!envKey || envKey.length < 32 || envKey.includes('$VITE_GSTIN_API_KEY')) {
            return 'c1cc01d4e40144bf607b6a4fe5be83c6';
        }
        return envKey;
    }
};

// Mock function for testing when API is not available
const getMockCustomerDetails = (gstin: string): Omit<Customer, 'id'> => {
    console.log('Using mock data for GSTIN:', gstin);
    return {
        name: 'Sample Business Name',
        tradeName: 'Sample Trade Name',
        address: 'Sample Address, Sample City, Sample State - 123456',
        state: 'Sample State',
        gstin: gstin,
        contactPerson: '',
        contactPhone: '',
        contactEmail: '',
    };
}; 


/**
 * Determines the origin location text for invoice based on Lorry Receipt data
 * @param lorryReceipts Array of Lorry Receipt objects
 * @returns Formatted origin location text
 */
export const getOriginLocationText = (lorryReceipts: LorryReceipt[]): string => {
    if (!lorryReceipts || lorryReceipts.length === 0) {
        return 'Freight charges due to us on following consignments carried from various locations.';
    }

    // Extract unique origin locations from all LRs
    // Normalize by trimming whitespace and converting to lowercase for comparison
    const normalizedOrigins = lorryReceipts
        .map(lr => lr.from?.trim())
        .filter(Boolean)
        .map(origin => origin.toLowerCase());
    
    // Get unique origins while preserving original case from first occurrence
    const uniqueOrigins = [...new Set(normalizedOrigins)]
        .map(normalizedOrigin => {
            // Find the first occurrence with original case
            const originalOrigin = lorryReceipts.find(lr => lr.from?.trim().toLowerCase() === normalizedOrigin)?.from?.trim();
            return originalOrigin || normalizedOrigin;
        });
    
    if (uniqueOrigins.length === 0) {
        return 'Freight charges due to us on following consignments carried from various locations.';
    }
    
    if (uniqueOrigins.length === 1) {
        return `Freight charges due to us on following consignments carried from ${uniqueOrigins[0]}.`;
    }
    
    // Multiple origins - join them with commas
    const originsText = uniqueOrigins.join(', ');
    return `Freight charges due to us on following consignments carried from ${originsText}.`;
};