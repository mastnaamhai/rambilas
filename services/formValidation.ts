export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
    message?: string;
}

export interface ValidationRules {
    [key: string]: ValidationRule;
}

export interface ValidationErrors {
    [key: string]: string;
}

export const validateField = (value: any, rules: ValidationRule): string | null => {
    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
        return rules.message || 'This field is required';
    }

    // Skip other validations if value is empty and not required
    if (!value && !rules.required) {
        return null;
    }

    // String length validations
    if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
            return rules.message || `Must be at least ${rules.minLength} characters`;
        }
        if (rules.maxLength && value.length > rules.maxLength) {
            return rules.message || `Must be no more than ${rules.maxLength} characters`;
        }
    }

    // Number validations
    if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
            return rules.message || `Must be at least ${rules.min}`;
        }
        if (rules.max !== undefined && value > rules.max) {
            return rules.message || `Must be no more than ${rules.max}`;
        }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        return rules.message || 'Invalid format';
    }

    // Custom validation
    if (rules.custom) {
        return rules.custom(value);
    }

    return null;
};

export const validateForm = (data: any, rules: ValidationRules): ValidationErrors => {
    const errors: ValidationErrors = {};

    for (const [field, fieldRules] of Object.entries(rules)) {
        const error = validateField(data[field], fieldRules);
        if (error) {
            errors[field] = error;
        }
    }

    return errors;
};

// Common validation rules
export const commonRules = {
    required: { required: true },
    email: { 
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
        message: 'Invalid email address' 
    },
    phone: { 
        pattern: /^[6-9]\d{9}$/, 
        message: 'Invalid phone number' 
    },
    gstin: { 
        pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 
        message: 'Invalid GSTIN format' 
    },
    pan: { 
        pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 
        message: 'Invalid PAN format' 
    },
    positiveNumber: { 
        min: 0, 
        message: 'Must be a positive number' 
    },
    // Note: Backend validation with Zod schemas is the source of truth
};

// Date validation helpers
export const validateDateRange = (startDate: string, endDate: string): string | null => {
    if (!startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
        return 'End date cannot be before start date';
    }
    
    return null;
};

// GST validation
export const validateGstRate = (rate: number): string | null => {
    if (rate < 0 || rate > 100) {
        return 'GST rate must be between 0 and 100';
    }
    return null;
};

// Weight validation
export const validateWeight = (weight: number): string | null => {
    if (weight <= 0) {
        return 'Weight must be greater than 0';
    }
    if (weight > 100000) {
        return 'Weight seems too high. Please verify.';
    }
    return null;
};
