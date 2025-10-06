import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GstPayableBy, RiskBearer } from '../types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { getCurrentDate } from '../services/utils';
import { Card } from './ui/Card';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { AutocompleteInput } from './ui/AutocompleteInput';
import { commonCities, commonPackingMethods } from '../constants/formData';
import { indianStates } from '../constants';
import { fetchGstDetails } from '../services/utils';
import { numberingService } from '../services/numberingService';
import { useLorryReceiptFormState } from '../hooks/useLorryReceiptFormState';

import type { LorryReceipt, Customer, TruckHiringNote } from '../types';

interface LorryReceiptFormProps {
  onSave: (lr: Partial<LorryReceipt>) => Promise<void>;
  onCancel: () => void;
  customers: Customer[];
  truckHiringNotes: TruckHiringNote[];
  existingLr?: LorryReceipt;
  onSaveCustomer: (customer: Omit<Customer, 'id' | '_id'> & { _id?: string }) => Promise<Customer>;
  lorryReceipts: LorryReceipt[];
}

type LorryReceiptFormData = Omit<LorryReceipt, '_id' | 'id' | 'status' | 'consignor' | 'consignee' | 'vehicleId' | 'vehicle'> & {
    remarks?: string;
};

export const LorryReceiptForm: React.FC<LorryReceiptFormProps> = ({ 
    onSave, 
    onCancel, 
    customers, 
    truckHiringNotes, 
    existingLr, 
    onSaveCustomer, 
    lorryReceipts
}) => {
    // Use the custom hook for state management
    const {
        lr,
        setLr,
        errors,
        setErrors,
        isSaving,
        setIsSaving,
        allowManualLr,
        setAllowManualLr,
        gstinConsignor,
        setGstinConsignor,
        gstinConsignee,
        setGstinConsignee,
        isVerifyingConsignor,
        setIsVerifyingConsignor,
        isVerifyingConsignee,
        setIsVerifyingConsignee,
        verifyStatus,
        setVerifyStatus,
        showConsignorManual,
        setShowConsignorManual,
        showConsigneeManual,
        setShowConsigneeManual,
        manualConsignor,
        setManualConsignor,
        manualConsignee,
        setManualConsignee,
        manualConsignorErrors,
        setManualConsignorErrors,
        manualConsigneeErrors,
        setManualConsigneeErrors,
        showLoadingAddress,
        setShowLoadingAddress,
        showDeliveryAddress,
        setShowDeliveryAddress,
        updateFormData,
        handleCheckboxChange,
        addPackage,
        removePackage,
        clearFormState,
        resetForm,
        getInitialState
    } = useLorryReceiptFormState(existingLr);

    // Get unique vehicle numbers from THN for autocomplete
    const getVehicleSuggestions = useCallback(() => {
        const vehicleNumbers = truckHiringNotes
            .map(thn => thn.truckNumber)
            .filter((number, index, self) => number && self.indexOf(number) === index)
            .sort();
        return vehicleNumbers;
    }, [truckHiringNotes]);

    // Format LR number according to numbering configuration
    const formatLrNumber = useCallback((number: number) => {
        const lrConfig = numberingService.getConfig('lr');
        if (!lrConfig) return `LR${String(number).padStart(6, '0')}`;
        
        const { prefix = 'LR' } = lrConfig;
        // Calculate padding based on endNumber to determine required digits
        const padding = Math.max(6, String(lrConfig.endNumber || 999999).length);
        const formattedNumber = String(number).padStart(padding, '0');
        
        return `${prefix}${formattedNumber}`;
    }, []);

    // Get unique locations from existing LRs
    const uniqueLocations = useMemo(() => {
        const locations = new Set<string>();
        lorryReceipts.forEach(lr => {
            if (lr.from) locations.add(lr.from.trim());
            if (lr.to) locations.add(lr.to.trim());
        });
        return Array.from(locations).sort();
    }, [lorryReceipts]);

    // Memoize city suggestions to prevent re-renders
    const citySuggestions = useMemo(() => [...commonCities, ...uniqueLocations], [uniqueLocations]);

    // Calculate total amount
    const calculateTotal = useCallback(() => {
        if (!lr.charges) return 0;
        const { freight = 0, aoc = 0, hamali = 0, bCh = 0, trCh = 0, detentionCh = 0 } = lr.charges;
        return freight + aoc + hamali + bCh + trCh + detentionCh;
    }, [lr.charges]);

    // Update total when charges change
    useEffect(() => {
        const total = calculateTotal();
        setLr(prev => ({ ...prev, totalAmount: total }));
    }, [calculateTotal]);

    // Load numbering configuration and get next LR number
    useEffect(() => {
        const loadNumberingConfig = async () => {
            try {
                await numberingService.loadConfigs();
                const lrConfig = numberingService.getConfig('lr');
                if (lrConfig) {
                    setAllowManualLr(lrConfig.allowManualEntry);
                    // Get the next LR number if not editing existing LR
                    if (!existingLr) {
                        const nextNumber = await numberingService.getNextNumber('lr');
                        setLr(prev => ({ ...prev, lrNumber: nextNumber }));
                    }
                }
                // Set current date if not already set
                if (!lr.date) {
                    setLr(prev => ({ ...prev, date: getCurrentDate() }));
                }
            } catch (error) {
                console.error('Failed to load numbering configuration:', error);
            }
        };
        loadNumberingConfig();
    }, [existingLr, lr.date, setLr, setAllowManualLr]);

    // Initialize checkbox states when editing existing LR
    useEffect(() => {
        if (existingLr) {
            setShowLoadingAddress(!!existingLr.loadingAddress);
            setShowDeliveryAddress(!!existingLr.deliveryAddress);
        }
    }, [existingLr]);

    // GSTIN verification functions
    const handleVerifyGstinConsignor = async () => {
        if (!gstinConsignor || gstinConsignor.length !== 15) {
            setVerifyStatus({ message: 'Please enter a valid 15-digit GSTIN.', type: 'error' });
            return;
        }
        setIsVerifyingConsignor(true);
        setVerifyStatus(null);
        try {
            const details = await fetchGstDetails(gstinConsignor);
            const newCustomer = await onSaveCustomer(details);
            setLr(prev => ({ ...prev, consignorId: newCustomer._id }));
            setVerifyStatus({ message: 'Consignor details fetched and added successfully.', type: 'success' });
        } catch (error: any) {
            setVerifyStatus({ message: error.message || 'Verification failed.', type: 'error' });
        } finally {
            setIsVerifyingConsignor(false);
        }
    };

    const handleVerifyGstinConsignee = async () => {
        if (!gstinConsignee || gstinConsignee.length !== 15) {
            setVerifyStatus({ message: 'Please enter a valid 15-digit GSTIN.', type: 'error' });
            return;
        }
        setIsVerifyingConsignee(true);
        setVerifyStatus(null);
        try {
            const details = await fetchGstDetails(gstinConsignee);
            const newCustomer = await onSaveCustomer(details);
            setLr(prev => ({ ...prev, consigneeId: newCustomer._id }));
            setVerifyStatus({ message: 'Consignee details fetched and added successfully.', type: 'success' });
        } catch (error: any) {
            setVerifyStatus({ message: error.message || 'Verification failed.', type: 'error' });
        } finally {
            setIsVerifyingConsignee(false);
        }
    };

    const handleManualConsignorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setManualConsignor(prev => ({ ...prev, [name]: value }));
        setManualConsignorErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleManualConsigneeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setManualConsignee(prev => ({ ...prev, [name]: value }));
        setManualConsigneeErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleAddManualConsignor = async () => {
        const newErrors: { [key: string]: string } = {};
        if (!manualConsignor.name) newErrors.name = 'Name is required';
        if (!manualConsignor.address) newErrors.address = 'Address is required';
        if (!manualConsignor.state) newErrors.state = 'State is required';
        if (Object.keys(newErrors).length > 0) {
            setManualConsignorErrors(newErrors);
            return;
        }
        try {
            if (manualConsignor.name && manualConsignor.address && manualConsignor.state) {
                const newCustomer = await onSaveCustomer(manualConsignor as Omit<Customer, 'id'>);
                setLr(prev => ({ ...prev, consignorId: newCustomer._id }));
                setShowConsignorManual(false);
                setManualConsignor(getInitialState().consignorId as any); // Reset manual form
                setVerifyStatus({ message: 'Consignor added manually and selected.', type: 'success' });
            }
        } catch (error: any) {
            setVerifyStatus({ message: error.message || 'Failed to add consignor manually.', type: 'error' });
        }
    };

    const handleAddManualConsignee = async () => {
        const newErrors: { [key: string]: string } = {};
        if (!manualConsignee.name) newErrors.name = 'Name is required';
        if (!manualConsignee.address) newErrors.address = 'Address is required';
        if (!manualConsignee.state) newErrors.state = 'State is required';
        if (Object.keys(newErrors).length > 0) {
            setManualConsigneeErrors(newErrors);
            return;
        }
        try {
            if (manualConsignee.name && manualConsignee.address && manualConsignee.state) {
                const newCustomer = await onSaveCustomer(manualConsignee as Omit<Customer, 'id'>);
                setLr(prev => ({ ...prev, consigneeId: newCustomer._id }));
                setShowConsigneeManual(false);
                setManualConsignee(getInitialState().consigneeId as any); // Reset manual form
                setVerifyStatus({ message: 'Consignee added manually and selected.', type: 'success' });
            }
        } catch (error: any) {
            setVerifyStatus({ message: error.message || 'Failed to add consignee manually.', type: 'error' });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        updateFormData(name, value, type);
    };

    const handleCheckboxChangeEvent = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        handleCheckboxChange(name, checked);
    };

    const validateFormData = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        
        if (!lr.date) newErrors.date = 'Date is required';
        if (!lr.consignorId) newErrors.consignorId = 'Consignor is required';
        if (!lr.consigneeId) newErrors.consigneeId = 'Consignee is required';
        if (!lr.vehicleNumber) newErrors.vehicleNumber = 'Vehicle number is required';
        if (!lr.from) newErrors.from = 'From location is required';
        if (!lr.to) newErrors.to = 'To location is required';
        if (!lr.packages?.[0]?.description) newErrors['packages.0.description'] = 'Package description is required';
        if (!lr.packages?.[0]?.actualWeight || lr.packages[0].actualWeight <= 0) newErrors['packages.0.actualWeight'] = 'Actual weight is required';
        if (lr.charges?.freight === undefined || lr.charges.freight < 0) newErrors.freight = 'Freight amount is required';
        
        // Validate custom LR number format if manual entry is enabled
        if (allowManualLr && lr.lrNumber) {
            const lrConfig = numberingService.getConfig('lr');
            if (lrConfig) {
                const { prefix = 'LR' } = lrConfig;
                const padding = Math.max(6, String(lrConfig.endNumber || 999999).length);
                const expectedFormat = new RegExp(`^${prefix}\\d{${padding}}$`);
                if (!expectedFormat.test(String(lr.lrNumber))) {
                    newErrors.lrNumber = `LR number must follow format: ${prefix}${'0'.repeat(padding)}`;
                }
            }
        }
        if (!lr.gstPayableBy) newErrors.gstPayableBy = 'GST Payable By is required';
        if (!lr.riskBearer) newErrors.riskBearer = 'Risk Bearer is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateFormData()) {
            // Focus on first error field
            const firstErrorField = Object.keys(errors)[0];
            if (firstErrorField) {
            const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
            element?.focus();
            }
            return;
        }

        setIsSaving(true);
        try {
            // Prepare LR data for submission
            const lrData = { ...lr };
            
            // Handle LR number based on manual entry setting
            if (allowManualLr) {
                // Manual entry enabled - only send lrNumber if user provided a valid value
                if (!lrData.lrNumber || lrData.lrNumber <= 0) {
                    delete lrData.lrNumber; // Let backend generate it
                }
            } else {
                // Auto-generated - ensure we have a valid LR number
                if (!lrData.lrNumber) {
                    const nextNumber = await numberingService.getNextNumber('lr');
                    lrData.lrNumber = nextNumber; // getNextNumber now returns a number
                }
            }
            
            await onSave(lrData);
            resetForm(); // Reset form state on successful save
            onCancel(); // Close form on successful save
        } catch (error) {
            console.error('Failed to save Lorry Receipt', error);
        } finally {
            setIsSaving(false);
        }
    };



    const amountInWords = (num: number) => {
        const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
        const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

        const regex = /^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/; // Supports up to 99,99,99,999 (99 Crore)

        const numToString = (n: number) => {
            if (n < 20) return a[n];
            if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10];
            return '';
        };

        let n = num.toFixed(2).split('.');
        let rupee = parseInt(n[0]);
        let cents = parseInt(n[1]);

        let str = '';
        let inr = rupee.toString();
        let parts = regex.exec(inr);

        if (parts === null) {
            return 'Amount too large';
        }

        let [, H, G, F, E, D] = parts;

        str += (numToString(parseInt(H, 10)) !== '') ? numToString(parseInt(H, 10)) + 'crore ' : '';
        str += (numToString(parseInt(G, 10)) !== '') ? numToString(parseInt(G, 10)) + 'lakh ' : '';
        str += (numToString(parseInt(F, 10)) !== '') ? numToString(parseInt(F, 10)) + 'thousand ' : '';
        str += (numToString(parseInt(E, 10)) !== '') ? numToString(parseInt(E, 10)) + 'hundred ' : '';
        str += (numToString(parseInt(D, 10)) !== '') ? numToString(parseInt(D, 10)) : '';

        let result = str.trim();
        if (result === '') result = 'Zero';
        result += ' Rupees';

        if (cents > 0) {
            result += ' and ' + numToString(cents) + ' Paise';
        }

        return result.trim() + ' Only';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl my-4 sm:my-8 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <Card>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {existingLr ? `Edit Lorry Receipt #${existingLr.lrNumber}` : 'Create New Lorry Receipt'}
                            </h2>
                            <div className="text-xl font-bold text-green-600">
                                Total: ₹{lr.totalAmount?.toFixed(2) || '0.00'}
                            </div>
                        </div>

                        {/* Shipment Details */}
                        <div className="space-y-4 mb-6 p-4 border border-gray-200 rounded-lg">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Shipment Details</h3>
                                <div className="border-t border-gray-300"></div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            LR Number
                                        </label>
                                        {!allowManualLr ? (
                                            <div className="w-full px-3 py-3 border border-green-200 rounded-md bg-green-50 text-green-800 text-base h-12 flex items-center">
                                                Auto-generated: {formatLrNumber(lr.lrNumber || 0)}
                                            </div>
                                        ) : (
                                            <input
                                                name="lrNumber"
                                                type="text"
                                                value={lr.lrNumber || ''}
                                                onChange={handleChange}
                                                placeholder="Enter LR number or leave empty for auto-generation"
                                                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 h-12"
                                            />
                                        )}
                                        {errors.lrNumber && <p className="text-red-500 text-xs mt-1">{errors.lrNumber}</p>}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Date <span className="text-red-500">*</span>
                                        </label>
                                    <Input 
                                        name="date" 
                                        type="date" 
                                        value={lr.date || ''} 
                                        onChange={handleChange} 
                                        required 
                                        error={errors.date}
                                            className="h-12"
                                        />
                                        <p className="text-xs text-gray-500">Format: DD/MM/YYYY</p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <AutocompleteInput
                                            name="vehicleNumber" 
                                            value={lr.vehicleNumber || ''} 
                                        onChange={handleChange} 
                                            required 
                                            error={errors.vehicleNumber}
                                            suggestions={getVehicleSuggestions()}
                                            placeholder="e.g., MH-12-AB-1234"
                                            helpText="Start typing to see suggestions from Truck Hiring Notes"
                                            className="h-12"
                                            label="Vehicle No."
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="customLrCheckbox"
                                        checked={allowManualLr}
                                        onChange={(e) => setAllowManualLr(e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="customLrCheckbox" className="text-sm text-gray-700">
                                        Enter custom LR number
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                From
                                            </label>
                                    <AutocompleteInput
                                        name="from"
                                        value={lr.from || ''}
                                        onChange={handleChange}
                                        suggestions={citySuggestions}
                                        placeholder="From"
                                        required
                                        error={errors.from}
                                        helpText="Start typing to see city suggestions"
                                        className="h-12"
                                    />
                                </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                To
                                            </label>
                                    <AutocompleteInput
                                        name="to"
                                        value={lr.to || ''}
                                        onChange={handleChange}
                                        suggestions={citySuggestions}
                                        placeholder="To"
                                        required
                                        error={errors.to}
                                        helpText="Start typing to see city suggestions"
                                        className="h-12"
                                    />
                                </div>
                            </div>

                            {/* Optional Address Fields */}
                            <div className="space-y-4 mt-12 pt-6 border-t border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-800 mb-4">Optional Address Details</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            id="showLoadingAddress"
                                            checked={showLoadingAddress}
                                            onChange={(e) => setShowLoadingAddress(e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded flex-shrink-0"
                                        />
                                        <label htmlFor="showLoadingAddress" className="text-sm text-gray-700 leading-relaxed">
                                            Add Loading Address (different from consignor address)
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            id="showDeliveryAddress"
                                            checked={showDeliveryAddress}
                                            onChange={(e) => setShowDeliveryAddress(e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded flex-shrink-0"
                                        />
                                        <label htmlFor="showDeliveryAddress" className="text-sm text-gray-700 leading-relaxed">
                                            Add Delivery Address (different from consignee address)
                                        </label>
                                    </div>
                                </div>

                                {showLoadingAddress && (
                                    <div className="space-y-2 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Loading Address
                                        </label>
                                        <Textarea
                                            name="loadingAddress"
                                            value={lr.loadingAddress || ''}
                                            onChange={handleChange}
                                            rows={3}
                                            placeholder="Enter specific loading address if different from consignor address"
                                            className="w-full"
                                        />
                                    </div>
                                )}

                                {showDeliveryAddress && (
                                    <div className="space-y-2 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Delivery Address
                                        </label>
                                        <Textarea
                                            name="deliveryAddress"
                                            value={lr.deliveryAddress || ''}
                                            onChange={handleChange}
                                            rows={3}
                                            placeholder="Enter specific delivery address if different from consignee address"
                                            className="w-full"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Consignor Details */}
                        <div className="space-y-4 mb-6 p-4 border border-gray-200 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Consignor Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Select Consignor <span className="text-red-500">*</span>
                                    </label>
                                        <Select 
                                            name="consignorId" 
                                            value={lr.consignorId || ''} 
                                            onChange={handleChange} 
                                            required 
                                            error={errors.consignorId}
                                        >
                                            <option value="">Select Consignor</option>
                                            {customers.map(customer => (
                                                <option key={customer._id} value={customer._id}>
                                                {customer.name} {customer.gstin ? `(${customer.gstin})` : ''}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Consignor GSTIN
                                    </label>
                                    <div className="flex items-end space-x-2">
                                        <Input 
                                            name="gstinConsignor" 
                                            value={gstinConsignor} 
                                            onChange={(e) => setGstinConsignor(e.target.value)} 
                                            placeholder="Enter 15-digit GSTIN"
                                            maxLength={15}
                                            className="flex-grow"
                                        />
                                        <Button 
                                            type="button" 
                                            variant="secondary" 
                                            onClick={handleVerifyGstinConsignor} 
                                            disabled={isVerifyingConsignor || !gstinConsignor || gstinConsignor.length !== 15}
                                            size="sm"
                                        >
                                            {isVerifyingConsignor ? 'Verifying...' : 'Fetch'}
                                        </Button>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={() => setShowConsignorManual(!showConsignorManual)}
                                            size="sm"
                                        >
                                            {showConsignorManual ? 'Hide Manual' : 'Add Manually'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            {showConsignorManual && (
                                <div className="border border-gray-300 p-4 rounded-lg bg-gray-50 space-y-3 mt-4">
                                    <h4 className="text-md font-medium text-gray-700">Manual Consignor Entry</h4>
                                    <Input label="Name" name="name" value={manualConsignor.name || ''} onChange={handleManualConsignorChange} error={manualConsignorErrors.name} required />
                                    <Textarea label="Address" name="address" value={manualConsignor.address || ''} onChange={handleManualConsignorChange} error={manualConsignorErrors.address} required />
                                    <Select label="State" name="state" value={manualConsignor.state || ''} onChange={handleManualConsignorChange} error={manualConsignorErrors.state} required options={indianStates.map(s => ({ value: s, label: s }))} />
                                    <Input label="GSTIN" name="gstin" value={manualConsignor.gstin || ''} onChange={handleManualConsignorChange} error={manualConsignorErrors.gstin} maxLength={15} />
                                    <Input label="Contact Person" name="contactPerson" value={manualConsignor.contactPerson || ''} onChange={handleManualConsignorChange} />
                                    <Input label="Contact Phone" name="contactPhone" value={manualConsignor.contactPhone || ''} onChange={handleManualConsignorChange} />
                                    <Input label="Contact Email" name="contactEmail" value={manualConsignor.contactEmail || ''} onChange={handleManualConsignorChange} />
                                    <Button type="button" onClick={handleAddManualConsignor} className="w-full">Add Consignor</Button>
                                </div>
                            )}
                            {verifyStatus && verifyStatus.type === 'error' && (isVerifyingConsignor || isVerifyingConsignee) && (
                                <div className={`mt-2 p-2 rounded text-sm bg-red-100 text-red-800 border border-red-200`}>
                                    {verifyStatus.message}
                                </div>
                            )}
                        </div>

                        {/* Consignee Details */}
                        <div className="space-y-4 mb-6 p-4 border border-gray-200 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Consignee Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Select Consignee <span className="text-red-500">*</span>
                                    </label>
                                        <Select 
                                            name="consigneeId" 
                                            value={lr.consigneeId || ''} 
                                            onChange={handleChange} 
                                            required 
                                            error={errors.consigneeId}
                                        >
                                            <option value="">Select Consignee</option>
                                            {customers.map(customer => (
                                                <option key={customer._id} value={customer._id}>
                                                {customer.name} {customer.gstin ? `(${customer.gstin})` : ''}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Consignee GSTIN
                                    </label>
                                    <div className="flex items-end space-x-2">
                                        <Input 
                                            name="gstinConsignee" 
                                            value={gstinConsignee} 
                                            onChange={(e) => setGstinConsignee(e.target.value)} 
                                            placeholder="Enter 15-digit GSTIN"
                                            maxLength={15}
                                            className="flex-grow"
                                        />
                                        <Button 
                                            type="button" 
                                            variant="secondary" 
                                            onClick={handleVerifyGstinConsignee} 
                                            disabled={isVerifyingConsignee || !gstinConsignee || gstinConsignee.length !== 15}
                                            size="sm"
                                        >
                                            {isVerifyingConsignee ? 'Verifying...' : 'Fetch'}
                                        </Button>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={() => setShowConsigneeManual(!showConsigneeManual)}
                                            size="sm"
                                        >
                                            {showConsigneeManual ? 'Hide Manual' : 'Add Manually'}
                                        </Button>
                                </div>
                            </div>
                            </div>
                            {showConsigneeManual && (
                                <div className="border border-gray-300 p-4 rounded-lg bg-gray-50 space-y-3 mt-4">
                                    <h4 className="text-md font-medium text-gray-700">Manual Consignee Entry</h4>
                                    <Input label="Name" name="name" value={manualConsignee.name || ''} onChange={handleManualConsigneeChange} error={manualConsigneeErrors.name} required />
                                    <Textarea label="Address" name="address" value={manualConsignee.address || ''} onChange={handleManualConsigneeChange} error={manualConsigneeErrors.address} required />
                                    <Select label="State" name="state" value={manualConsignee.state || ''} onChange={handleManualConsigneeChange} error={manualConsigneeErrors.state} required options={indianStates.map(s => ({ value: s, label: s }))} />
                                    <Input label="GSTIN" name="gstin" value={manualConsignee.gstin || ''} onChange={handleManualConsigneeChange} error={manualConsigneeErrors.gstin} maxLength={15} />
                                    <Input label="Contact Person" name="contactPerson" value={manualConsignee.contactPerson || ''} onChange={handleManualConsigneeChange} />
                                    <Input label="Contact Phone" name="contactPhone" value={manualConsignee.contactPhone || ''} onChange={handleManualConsigneeChange} />
                                    <Input label="Contact Email" name="contactEmail" value={manualConsignee.contactEmail || ''} onChange={handleManualConsigneeChange} />
                                    <Button type="button" onClick={handleAddManualConsignee} className="w-full">Add Consignee</Button>
                                </div>
                            )}
                            {verifyStatus && verifyStatus.type === 'error' && (isVerifyingConsignor || isVerifyingConsignee) && (
                                <div className={`mt-2 p-2 rounded text-sm bg-red-100 text-red-800 border border-red-200`}>
                                    {verifyStatus.message}
                                </div>
                            )}
                                </div>

                        {/* Package Details */}
                        <div className="space-y-4 mb-6 p-4 border border-gray-200 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Package Details</h3>
                                    {lr.packages?.map((pkg, index) => (
                                <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-md font-medium text-gray-700">Package {index + 1}</h4>
                                                {lr.packages && lr.packages.length > 1 && (
                                                    <Button 
                                                        type="button" 
                                                variant="destructive" 
                                                size="sm" 
                                                        onClick={() => removePackage(index)}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Count <span className="text-red-500">*</span>
                                            </label>
                                                <Input 
                                                    name={`packages.${index}.count`} 
                                                    type="number" 
                                                    value={pkg.count || 0} 
                                                    onChange={handleChange} 
                                                    required 
                                                    min="1"
                                                    error={errors[`packages.${index}.count`]}
                                                />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Packing Method <span className="text-red-500">*</span>
                                            </label>
                                            <Select
                                                    name={`packages.${index}.packingMethod`}
                                                    value={pkg.packingMethod || ''}
                                                    onChange={handleChange}
                                                options={commonPackingMethods.map(method => ({ value: method, label: method }))}
                                                required
                                                error={errors[`packages.${index}.packingMethod`]}
                                                />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Description of contents <span className="text-red-500">*</span>
                                            </label>
                                                <Input 
                                                name={`packages.${index}.description`} 
                                                value={pkg.description || ''} 
                                                onChange={handleChange} 
                                                required 
                                                error={errors[`packages.${index}.description`]}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Actual Weight (kg) <span className="text-red-500">*</span>
                                            </label>
                                            <Input 
                                                    name={`packages.${index}.actualWeight`} 
                                                    type="number" 
                                                    value={pkg.actualWeight || 0} 
                                                    onChange={handleChange} 
                                                    required 
                                                min="0.01"
                                                step="0.01"
                                                    error={errors[`packages.${index}.actualWeight`]}
                                                />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Charged Weight (kg) <span className="text-red-500">*</span>
                                            </label>
                                                <Input 
                                                    name={`packages.${index}.chargedWeight`} 
                                                    type="number" 
                                                    value={pkg.chargedWeight || 0} 
                                                    onChange={handleChange} 
                                                    required 
                                                min="0.01"
                                                step="0.01"
                                                    error={errors[`packages.${index}.chargedWeight`]}
                                                />
                                            </div>
                                            </div>
                                        </div>
                                    ))}
                            <Button type="button" variant="outline" onClick={addPackage} className="w-full">
                                        + Add Another Package
                                    </Button>
                            </div>

                        {/* Charges & Financial Details */}
                        <div className="space-y-4 mb-6 p-4 border border-gray-200 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Charges & Financial Details</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Freight Charges (₹) <span className="text-red-500">*</span>
                                    </label>
                                        <Input 
                                            name="charges.freight" 
                                            type="number" 
                                            value={lr.charges?.freight || 0} 
                                            onChange={handleChange} 
                                            required 
                                            min="0"
                                            step="0.01"
                                            error={errors.freight}
                                        />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        AOC (Other Charges) (₹)
                                    </label>
                                        <Input 
                                            name="charges.aoc" 
                                            type="number" 
                                            value={lr.charges?.aoc || 0} 
                                            onChange={handleChange} 
                                            min="0"
                                            step="0.01"
                                        />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Hamali (Loading/Unloading) (₹)
                                    </label>
                                        <Input 
                                            name="charges.hamali" 
                                            type="number" 
                                            value={lr.charges?.hamali || 0} 
                                            onChange={handleChange} 
                                            min="0"
                                            step="0.01"
                                        />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        B.Ch (Booking Charges) (₹)
                                    </label>
                                        <Input 
                                            name="charges.bCh" 
                                            type="number" 
                                            value={lr.charges?.bCh || 0} 
                                            onChange={handleChange} 
                                            min="0"
                                            step="0.01"
                                        />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tr.Ch (Transit Charges) (₹)
                                    </label>
                                        <Input 
                                            name="charges.trCh" 
                                            type="number" 
                                            value={lr.charges?.trCh || 0} 
                                            onChange={handleChange} 
                                            min="0"
                                            step="0.01"
                                        />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Detention Charges (₹)
                                    </label>
                                        <Input 
                                            name="charges.detentionCh" 
                                            type="number" 
                                            value={lr.charges?.detentionCh || 0} 
                                            onChange={handleChange} 
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center mt-6">
                                <h4 className="text-xl font-bold text-green-800">Total Amount: ₹{lr.totalAmount?.toFixed(2) || '0.00'}</h4>
                                <p className="text-sm text-green-700 mt-1">{amountInWords(lr.totalAmount || 0)}</p>
                                            </div>
                                        </div>

                        {/* GST Payable By Section (Yellow) */}
                        <div className="space-y-4 mb-6 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">GST Payable By</h3>
                            <div className="flex flex-wrap gap-4">
                                {Object.values(GstPayableBy).map(type => (
                                    <label key={type} className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="gstPayableBy"
                                            value={type}
                                            checked={lr.gstPayableBy === type}
                                            onChange={handleChange} 
                                            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{type}</span>
                                    </label>
                                ))}
                                    </div>
                            {errors.gstPayableBy && <p className="text-red-500 text-xs mt-1">{errors.gstPayableBy}</p>}
                            </div>

                        {/* Risk Bearer Section (Purple) */}
                        <div className="space-y-4 mb-6 p-4 border border-purple-200 rounded-lg bg-purple-50">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Risk Bearer</h3>
                            <div className="flex flex-wrap gap-4">
                                {Object.values(RiskBearer).map(bearer => (
                                    <label key={bearer} className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="riskBearer"
                                            value={bearer}
                                            checked={lr.riskBearer === bearer}
                                        onChange={handleChange} 
                                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{bearer}</span>
                                    </label>
                                ))}
                                </div>
                            {errors.riskBearer && <p className="text-red-500 text-xs mt-1">{errors.riskBearer}</p>}
                                </div>

                        {/* Insurance Details Section (Blue) */}
                        <div className="space-y-4 mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Insurance Details</h3>
                            <div className="flex items-center mb-4">
                                            <input
                                                type="checkbox"
                                                id="hasInsured"
                                    name="insurance.hasInsured"
                                                checked={lr.insurance?.hasInsured || false}
                                    onChange={handleCheckboxChangeEvent}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                <label htmlFor="hasInsured" className="ml-2 block text-sm text-gray-900">
                                    The Customer has stated that
                                            </label>
                                        </div>
                                        
                                        {lr.insurance?.hasInsured && (
                                <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input 
                                                    label="Insurance Company" 
                                                    name="insurance.company" 
                                                    value={lr.insurance?.company || ''} 
                                            onChange={handleChange} 
                                                />
                                                <Input 
                                                    label="Policy Number" 
                                                    name="insurance.policyNo" 
                                                    value={lr.insurance?.policyNo || ''} 
                                            onChange={handleChange} 
                                                />
                                                <Input 
                                            label="Policy Date" 
                                                    name="insurance.date" 
                                                    type="date" 
                                                    value={lr.insurance?.date || ''} 
                                            onChange={handleChange} 
                                                />
                                                <Input 
                                            label="Amount (₹)" 
                                                    name="insurance.amount" 
                                                    type="number" 
                                                    value={lr.insurance?.amount || 0} 
                                            onChange={handleChange} 
                                                    min="0"
                                                    step="0.01"
                                                />
                                        <Input 
                                            label="Risk" 
                                            name="insurance.risk" 
                                            value={lr.insurance?.risk || ''} 
                                            onChange={handleChange} 
                                        />
                                            </div>
                            </div>
                        )}
                        </div>

                        {/* Other Details */}
                        <div className="space-y-4 mb-6 p-4 border border-gray-200 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Other Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        E-Way Bill No
                                    </label>
                                    <Input 
                                        name="eWayBillNo" 
                                        value={lr.eWayBillNo || ''} 
                                        onChange={handleChange} 
                                        placeholder="Enter E-Way Bill number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Value of Goods (₹)
                                    </label>
                                    <Input 
                                        name="valueGoods" 
                                        type="number" 
                                        value={lr.valueGoods || 0} 
                                        onChange={handleChange} 
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Invoice No
                                    </label>
                                    <Input 
                                        name="invoiceNo" 
                                        value={lr.invoiceNo || ''} 
                                        onChange={handleChange} 
                                        placeholder="Enter invoice number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Seal No
                                    </label>
                                    <Input 
                                        name="sealNo" 
                                        value={lr.sealNo || ''} 
                                        onChange={handleChange} 
                                        placeholder="Enter seal number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Reporting Date
                                    </label>
                                    <Input 
                                        name="reportingDate" 
                                        type="date" 
                                        value={lr.reportingDate || ''} 
                                        onChange={handleChange} 
                                    />
                                    <p className="text-xs text-gray-500">Format: DD/MM/YYYY</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Delivery Date
                                    </label>
                                    <Input 
                                        name="deliveryDate" 
                                        type="date" 
                                        value={lr.deliveryDate || ''} 
                                        onChange={handleChange} 
                                    />
                                    <p className="text-xs text-gray-500">Format: DD/MM/YYYY</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Remarks
                                </label>
                                <Textarea 
                                    name="remarks" 
                                    value={(lr as any).remarks || ''} 
                                    onChange={handleChange} 
                                    rows={3}
                                    placeholder="Additional notes or remarks for this lorry receipt"
                                />
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-between pt-6 border-t border-gray-200">
                            <div className="flex space-x-2">
                                {!existingLr && (
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={clearFormState}
                                        disabled={isSaving}
                                        className="text-red-600 border-red-300 hover:bg-red-50"
                                    >
                                        Clear All Fields
                                    </Button>
                                )}
                            </div>
                            <div className="flex space-x-4">
                                <Button 
                                    type="button" 
                                    variant="secondary" 
                                    onClick={onCancel}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save Lorry Receipt'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </form>
            </div>
        </div>
    );
};