
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
// The API key should be configured in the environment variables
const GSTIN_API_KEY = (() => {
    const envKey = import.meta.env.VITE_GSTIN_API_KEY;
    // If the environment key is too short (truncated) or contains the variable name, use fallback
    if (!envKey || envKey.length < 32 || envKey.includes('$VITE_GSTIN_API_KEY')) {
        return 'f7491e49e622cbbb8189f5f2de661fb6';
    }
    return envKey;
})();

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

export const fetchGstDetails = async (gstin: string): Promise<Omit<Customer, 'id'>> => {
    console.log(`Fetching details for GSTIN: ${gstin}`);
    console.log(`API Key present: ${!!GSTIN_API_KEY}`);
    console.log(`API Key length: ${GSTIN_API_KEY?.length || 0}`);
    console.log(`Environment: ${import.meta.env.MODE}`);
    console.log(`All env vars:`, import.meta.env);

    if (!GSTIN_API_KEY || GSTIN_API_KEY.trim() === '') {
        throw new Error('GSTIN API Key is not configured. Please configure VITE_GSTIN_API_KEY in your deployment environment.');
    }

    // Validate GSTIN format (15 characters, alphanumeric)
    if (!gstin || gstin.length !== 15 || !/^[A-Z0-9]{15}$/.test(gstin)) {
        throw new Error('Please enter a valid 15-digit GSTIN.');
    }

    // Use proxy in development mode to avoid CORS issues
    const isDevelopment = import.meta.env.DEV;
    const baseUrl = isDevelopment ? '/gst-api' : 'https://sheet.gstincheck.co.in';
    const apiUrl = `${baseUrl}/check/${GSTIN_API_KEY}/${gstin}`;
    console.log(`API URL: ${apiUrl}`);
    console.log(`Development mode: ${isDevelopment}`);

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            // Add timeout to prevent hanging requests
            signal: AbortSignal.timeout(30000) // 30 second timeout
        });
        
        console.log(`Response status: ${response.status}`);
        console.log(`Response headers:`, [...response.headers.entries()]);

        if (!response.ok) {
            // Handle HTTP errors (e.g., 404, 401, 500)
            const errorText = await response.text();
            console.error(`HTTP Error: ${response.status} - ${errorText}`);
            
            if (response.status === 401) {
                throw new Error('GST API authentication failed. Please check API key configuration.');
            } else if (response.status === 429) {
                throw new Error('GST API rate limit exceeded. Please try again later.');
            } else if (response.status >= 500) {
                throw new Error('GST API server error. Please try again later.');
            } else {
                throw new Error(`API call failed with status ${response.status}: ${errorText}`);
            }
        }

        const data = await response.json();
        console.log('API Response:', data);

        // Check if the API returned an error
        if (!data.flag) {
            const errorMessage = data.message || 'GSTIN not found or invalid';
            console.error('GST API Error:', errorMessage);
            throw new Error(errorMessage);
        }

        // The API response structure might be different from your Customer type.
        // You'll need to map the API response data to your Customer type.
        const apiData = data.data; // The actual details are nested under a 'data' key

        if (!apiData) {
            throw new Error(data.message || 'GSTIN data not found in response.');
        }

        console.log('API Data:', apiData);

        // Build address from the response structure
        const addressComponents = [
            apiData.pradr?.addr?.bno,
            apiData.pradr?.addr?.bnm,
            apiData.pradr?.addr?.st,
            apiData.pradr?.addr?.loc,
            apiData.pradr?.addr?.dst,
        ].filter(Boolean); // Filter out empty/null/undefined parts

        // Use the full address from pradr.adr if available, otherwise build from components
        const fullAddress = apiData.pradr?.adr || addressComponents.join(', ') + (apiData.pradr?.addr?.pncd ? ` - ${apiData.pradr.addr.pncd}` : '');

        const customerDetails: Omit<Customer, 'id'> = {
            name: apiData.lgnm || '',
            tradeName: apiData.tradeNam || '',
            address: fullAddress,
            state: apiData.pradr?.addr?.stcd || apiData.stj?.split(',')[0]?.replace('State - ', '') || '',
            gstin: apiData.gstin || gstin,
            contactPerson: '',
            contactPhone: '',
            contactEmail: '',
        };

        console.log('Parsed customer details:', customerDetails);
        return customerDetails;

    } catch (error: any) {
        console.error("Error fetching GSTIN details:", error);
        
        // In development mode, use mock data as fallback
        if (import.meta.env.DEV) {
            console.log('Development mode: Using mock data as fallback');
            return getMockCustomerDetails(gstin);
        }
        
        // Handle different types of errors
        if (error.name === 'AbortError') {
            throw new Error('Request timeout. GST API is taking too long to respond. Please try again.');
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error. Please check your internet connection and try again.');
        } else if (error.message.includes('GSTIN not found') || error.message.includes('GST Number not found')) {
            throw new Error('GSTIN not found. Please verify the GSTIN number or enter customer details manually.');
        } else if (error.message.includes('server error') || error.message.includes('500')) {
            throw new Error('GST API is temporarily unavailable. Please enter customer details manually.');
        } else if (error.message.includes('API Key') || error.message.includes('authentication')) {
            throw new Error('GST API configuration issue. Please contact administrator.');
        } else if (error.message.includes('rate limit')) {
            throw new Error('Too many requests. Please wait a moment and try again.');
        } else {
            throw new Error(`Failed to fetch GSTIN details: ${error.message}`);
        }
    }
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