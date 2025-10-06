import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Invoice, LorryReceipt, Customer, CompanyInfo } from '../types';
import { GstType, InvoiceStatus } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { LrFilterPanel } from './ui/LrFilterPanel';
import { LrPreviewCard } from './ui/LrPreviewCard';
import { CustomerCreationModal } from './ui/CustomerCreationModal';
import { validateForm, commonRules } from '../services/formValidation';
import { numberToWords, getCurrentDate } from '../services/utils';
import { getUnbilledLorryReceipts, type UnbilledLrFilters } from '../services/lorryReceiptService';

interface InvoiceFormProps {
  onSave: (invoice: Partial<Invoice>) => void;
  onCancel: () => void;
  availableLrs: LorryReceipt[];
  customers: Customer[];
  existingInvoice?: Invoice;
  preselectedLr?: LorryReceipt;
  onSaveCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer>;
  companyInfo?: CompanyInfo;
}

const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; }> = ({ label, checked, onChange, disabled }) => (
    <label className="flex items-center cursor-pointer">
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} />
            <div className={`block w-12 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-6' : ''}`}></div>
        </div>
        <div className="ml-3 text-sm font-medium text-gray-700">{label}</div>
    </label>
);

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ 
    onSave, 
    onCancel, 
    availableLrs, 
    customers, 
    existingInvoice, 
    preselectedLr,
    onSaveCustomer,
    companyInfo
}) => {
    const [invoice, setInvoice] = useState<Partial<Invoice>>(
        existingInvoice
        ? { ...existingInvoice }
        : {
            date: getCurrentDate(),
            customerId: preselectedLr ? (preselectedLr.consignorId || preselectedLr.consigneeId) : '',
            lorryReceipts: preselectedLr ? [preselectedLr] : [],
            totalAmount: 0,
            remarks: '',
            gstType: GstType.IGST,
            cgstRate: 9,
            sgstRate: 9,
            igstRate: 18,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            grandTotal: 0,
            isRcm: false,
            isManualGst: false,
            status: InvoiceStatus.UNPAID,
        }
    );

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSaving, setIsSaving] = useState(false);
    const [allowCustomInvoiceNumber, setAllowCustomInvoiceNumber] = useState(false);
    const [customInvoiceNumber, setCustomInvoiceNumber] = useState('');
    const [unbilledLrs, setUnbilledLrs] = useState<LorryReceipt[]>([]);
    const [isLoadingUnbilledLrs, setIsLoadingUnbilledLrs] = useState(false);
    const [enableMultipleSelection, setEnableMultipleSelection] = useState(false);
    const [lrFilters, setLrFilters] = useState<UnbilledLrFilters>({});
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);

    // Calculate totals
    const calculateTotals = useCallback(() => {
        const totalAmount = invoice.lorryReceipts?.reduce((sum, lr) => sum + (lr.totalAmount || 0), 0) || 0;
        
        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;
        let gstAmount = 0;
        
        // If RCM is enabled, GST is 0
        if (invoice.isRcm) {
            gstAmount = 0;
        } else if (invoice.isManualGst) {
            // Use manually entered GST amounts
            cgstAmount = invoice.cgstAmount || 0;
            sgstAmount = invoice.sgstAmount || 0;
            igstAmount = invoice.igstAmount || 0;
            gstAmount = cgstAmount + sgstAmount + igstAmount;
        } else {
            // Auto-calculate GST
            const gstRate = invoice.gstType === GstType.CGST_SGST ? (invoice.cgstRate || 0) + (invoice.sgstRate || 0) : (invoice.igstRate || 0);
            gstAmount = (totalAmount * gstRate) / 100;
            
            if (invoice.gstType === GstType.CGST_SGST) {
                cgstAmount = gstAmount / 2;
                sgstAmount = gstAmount / 2;
            } else {
                igstAmount = gstAmount;
            }
        }
        
        const grandTotal = totalAmount + gstAmount;
        
        setInvoice(prev => ({
            ...prev,
            totalAmount,
            cgstAmount,
            sgstAmount,
            igstAmount,
            grandTotal
        }));
    }, [invoice.lorryReceipts, invoice.gstType, invoice.cgstRate, invoice.sgstRate, invoice.igstRate, invoice.isRcm, invoice.isManualGst, invoice.cgstAmount, invoice.sgstAmount, invoice.igstAmount]);

    useEffect(() => {
        calculateTotals();
    }, [calculateTotals]);

    // Load unbilled LRs when customer or filters change
    useEffect(() => {
        const loadUnbilledLrs = async () => {
            if (invoice.customerId) {
                setIsLoadingUnbilledLrs(true);
                try {
                    const filters: UnbilledLrFilters = {
                        customerId: invoice.customerId,
                        ...lrFilters
                    };
                    const unbilled = await getUnbilledLorryReceipts(filters);
                    setUnbilledLrs(unbilled);
                } catch (error) {
                    console.error('Failed to load unbilled LRs:', error);
                    setUnbilledLrs([]);
                } finally {
                    setIsLoadingUnbilledLrs(false);
                }
            } else {
                setUnbilledLrs([]);
            }
        };

        loadUnbilledLrs();
    }, [invoice.customerId, lrFilters]);

    // Auto-select all unbilled LRs when multiple selection is enabled
    useEffect(() => {
        if (enableMultipleSelection && unbilledLrs.length > 0 && invoice.customerId) {
            setInvoice(prev => ({
                ...prev,
                lorryReceipts: unbilledLrs
            }));
        }
    }, [enableMultipleSelection, unbilledLrs, invoice.customerId]);

    // Validation rules
    const validationRules = {
        date: commonRules.required,
        customerId: commonRules.required,
        'lorryReceipts': {
            custom: (value: LorryReceipt[]) => {
                if (!value || value.length === 0) {
                    return 'At least one lorry receipt must be selected';
                }
                return null;
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        setInvoice(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleManualGstChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numValue = parseFloat(value) || 0;
        
        setInvoice(prev => ({
            ...prev,
            [name]: numValue,
        }));
    };

    const handleLrToggle = (lr: LorryReceipt) => {
        setInvoice(prev => {
            const currentLrs = prev.lorryReceipts || [];
            const isSelected = currentLrs.some(selectedLr => selectedLr._id === lr._id);
            
            if (isSelected) {
                return {
                    ...prev,
                    lorryReceipts: currentLrs.filter(selectedLr => selectedLr._id !== lr._id)
                };
            } else {
                return {
                    ...prev,
                    lorryReceipts: [...currentLrs, lr]
                };
            }
        });
    };

    const handleSelectAllUnbilled = () => {
        setInvoice(prev => ({
            ...prev,
            lorryReceipts: unbilledLrs
        }));
    };

    const handleDeselectAll = () => {
        setInvoice(prev => ({
            ...prev,
            lorryReceipts: []
        }));
    };

    const handleFiltersChange = (newFilters: UnbilledLrFilters) => {
        setLrFilters(newFilters);
    };

    const handleClearFilters = () => {
        setLrFilters({});
    };

    const handleCustomerSelect = (customer: Customer) => {
        setInvoice(prev => ({
            ...prev,
            customerId: customer._id
        }));
        setShowCustomerModal(false);
    };

    // Auto-populate invoice fields based on selected LRs
    useEffect(() => {
        if (invoice.lorryReceipts && invoice.lorryReceipts.length > 0) {
            // Auto-populate customer if not set
            if (!invoice.customerId) {
                const lr = invoice.lorryReceipts[0];
                const customerId = lr.consignorId || lr.consigneeId;
                if (customerId) {
                    setInvoice(prev => ({
                        ...prev,
                        customerId
                    }));
                }
            }

            // Auto-populate remarks if not set and all LRs have same route
            if (!invoice.remarks && invoice.lorryReceipts.length > 1) {
                const firstLr = invoice.lorryReceipts[0];
                const allSameRoute = invoice.lorryReceipts.every(lr => 
                    lr.from === firstLr.from && lr.to === firstLr.to
                );
                if (allSameRoute) {
                    setInvoice(prev => ({
                        ...prev,
                        remarks: `Consolidated invoice for ${firstLr.from} to ${firstLr.to}`
                    }));
                }
            }
        }
    }, [invoice.lorryReceipts]);

    // Auto-determine GST type based on customer state
    useEffect(() => {
        if (invoice.customerId && customers.length > 0 && companyInfo) {
            const selectedCustomer = customers.find(c => c._id === invoice.customerId);
            if (selectedCustomer) {
                // Get company state from company info
                const companyState = companyInfo.state;
                const customerState = selectedCustomer.state;
                
                const shouldUseIGST = customerState !== companyState;
                const newGstType = shouldUseIGST ? GstType.IGST : GstType.CGST_SGST;
                
                if (invoice.gstType !== newGstType) {
                    setInvoice(prev => ({
                        ...prev,
                        gstType: newGstType
                    }));
                }
            }
        }
    }, [invoice.customerId, customers, companyInfo]);

    // Auto-populate customer when preselected LR is provided
    useEffect(() => {
        if (preselectedLr && !invoice.customerId) {
            const customerId = preselectedLr.consignorId || preselectedLr.consigneeId;
            if (customerId) {
                setInvoice(prev => ({
                    ...prev,
                    customerId
                }));
            }
        }
    }, [preselectedLr, invoice.customerId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const formErrors = validateForm(invoice, validationRules);
        
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            // Focus on first error field
            const firstErrorField = Object.keys(formErrors)[0];
            const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
            element?.focus();
            return;
        }

        setIsSaving(true);
        try {
            onSave(invoice);
        } catch (error) {
            console.error('Failed to save invoice', error);
        } finally {
            setIsSaving(false);
        }
    };

    const selectedCustomer = customers.find(c => c._id === invoice.customerId);
    
    // Create a comprehensive list of LRs to display
    const filteredLrs = useMemo(() => {
        if (!selectedCustomer) return [];
        
        // Start with unbilled LRs from API
        let lrsToShow = [...unbilledLrs];
        
        // Add preselected LR if it exists and isn't already in the list
        if (preselectedLr && !lrsToShow.some(lr => lr._id === preselectedLr._id)) {
            lrsToShow.unshift(preselectedLr);
        }
        
        // Add any selected LRs that might not be in unbilled list
        if (invoice.lorryReceipts) {
            invoice.lorryReceipts.forEach(selectedLr => {
                if (!lrsToShow.some(lr => lr._id === selectedLr._id)) {
                    lrsToShow.push(selectedLr);
                }
            });
        }
        
        // If no unbilled LRs from API, fall back to availableLrs filtered by customer
        if (unbilledLrs.length === 0 && lrsToShow.length === 0) {
            lrsToShow = availableLrs.filter(lr => {
                const isCustomerLr = lr.consignorId === selectedCustomer._id || lr.consigneeId === selectedCustomer._id;
                return isCustomerLr;
            });
        }
        
        // Remove duplicates and sort by LR number
        const uniqueLrs = lrsToShow.filter((lr, index, self) => 
            index === self.findIndex(t => t._id === lr._id)
        );
        
        return uniqueLrs.sort((a, b) => b.lrNumber - a.lrNumber);
    }, [unbilledLrs, preselectedLr, invoice.lorryReceipts, selectedCustomer, availableLrs]);

    return (
        <div className="fixed inset-0 bg-gray-100 z-50 flex justify-center items-start p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl my-4 sm:my-8 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-4 sm:p-6">
                        {/* Header */}
                        <h1 className="text-3xl font-bold text-gray-800 mb-8">Create Invoice</h1>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Invoice Details */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Invoice Details</h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="block text-sm font-medium text-gray-700">Customer</label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowCustomerModal(true)}
                                                >
                                                    + Add New
                                                </Button>
                                            </div>
                                            <Select 
                                                name="customerId" 
                                                value={invoice.customerId || ''} 
                                                onChange={handleChange} 
                                                required 
                                                error={errors.customerId}
                                            >
                                                <option value="">Select Customer</option>
                                                {customers.map(customer => (
                                                    <option key={customer._id} value={customer._id}>
                                                        {customer.name} {customer.gstin ? `(${customer.gstin})` : ''}
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Invoice Date</label>
                                            <Input 
                                                name="date" 
                                                type="date" 
                                                value={invoice.date || ''} 
                                                onChange={handleChange} 
                                                required 
                                                error={errors.date}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {!allowCustomInvoiceNumber ? (
                                            <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                                <p className="text-sm font-medium text-green-800">
                                                    Auto-generated: INV000112
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Custom Invoice Number</label>
                                                <Input 
                                                    name="customInvoiceNumber" 
                                                    type="text" 
                                                    value={customInvoiceNumber} 
                                                    onChange={(e) => setCustomInvoiceNumber(e.target.value)}
                                                    placeholder="Enter custom invoice number"
                                                />
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="customInvoiceNumber"
                                                checked={allowCustomInvoiceNumber}
                                                onChange={(e) => setAllowCustomInvoiceNumber(e.target.checked)}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="customInvoiceNumber" className="ml-2 text-sm text-gray-700">
                                                Enter custom invoice number
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Select Lorry Receipts */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-gray-800">Select Lorry Receipts for Invoice</h2>
                                        <div className="flex items-center space-x-4">
                                            <ToggleSwitch
                                                label="Multiple Selection"
                                                checked={enableMultipleSelection}
                                                onChange={setEnableMultipleSelection}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                            >
                                                {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    {/* Advanced Filters */}
                                    {showAdvancedFilters && selectedCustomer && (
                                        <div className="mb-6">
                                            <LrFilterPanel
                                                filters={lrFilters}
                                                onFiltersChange={handleFiltersChange}
                                                onClearFilters={handleClearFilters}
                                                isLoading={isLoadingUnbilledLrs}
                                            />
                                        </div>
                                    )}
                                    
                                    {selectedCustomer && (
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleSelectAllUnbilled}
                                                    disabled={isLoadingUnbilledLrs || filteredLrs.length === 0}
                                                >
                                                    Select All Unbilled ({filteredLrs.length})
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleDeselectAll}
                                                    disabled={!invoice.lorryReceipts?.length}
                                                >
                                                    Deselect All
                                                </Button>
                                            </div>
                                            
                                            {/* Quick Stats */}
                                            <div className="text-sm text-gray-600">
                                                {filteredLrs.length > 0 && (
                                                    <span>
                                                        Total Value: ₹{filteredLrs.reduce((sum, lr) => sum + (lr.totalAmount || 0), 0).toLocaleString('en-IN')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="min-h-[300px] max-h-[500px] overflow-y-auto">
                                        {!selectedCustomer ? (
                                            <div className="text-center py-12">
                                                <div className="text-gray-400 text-4xl mb-4">📋</div>
                                                <p className="text-gray-500 text-lg">Please select a customer to see available Lorry Receipts</p>
                                                <p className="text-gray-400 text-sm mt-2">Choose a customer from the dropdown above to load their unbilled LRs</p>
                                            </div>
                                        ) : isLoadingUnbilledLrs ? (
                                            <div className="text-center py-12">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                                <p className="text-gray-500">Loading unbilled lorry receipts...</p>
                                            </div>
                                        ) : filteredLrs.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="text-gray-400 text-4xl mb-4">📭</div>
                                                <p className="text-gray-500 text-lg">No unbilled lorry receipts found</p>
                                                <p className="text-gray-400 text-sm mt-2">
                                                    {Object.keys(lrFilters).length > 0 
                                                        ? 'Try adjusting your filters or clear them to see all LRs'
                                                        : 'This customer has no unbilled lorry receipts'
                                                    }
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {filteredLrs.map(lr => {
                                                    const isSelected = invoice.lorryReceipts?.some(selectedLr => selectedLr._id === lr._id) || false;
                                                    return (
                                                        <LrPreviewCard
                                                            key={lr._id}
                                                            lr={lr}
                                                            isSelected={isSelected}
                                                            onToggle={handleLrToggle}
                                                            showSelection={true}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Selected LRs Display */}
                                    {invoice.lorryReceipts && invoice.lorryReceipts.length > 0 && (
                                        <div className="mt-4">
                                            <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Lorry Receipts</h3>
                                            <div className="space-y-2">
                                                {invoice.lorryReceipts.map(lr => (
                                                    <LrPreviewCard
                                                        key={lr._id}
                                                        lr={lr}
                                                        isSelected={true}
                                                        onToggle={handleLrToggle}
                                                        showSelection={true}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Selection Summary */}
                                    {invoice.lorryReceipts && invoice.lorryReceipts.length > 0 && (
                                        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-blue-900">
                                                        <strong>{invoice.lorryReceipts.length}</strong> lorry receipt{invoice.lorryReceipts.length !== 1 ? 's' : ''} selected
                                                    </p>
                                                    <p className="text-xs text-blue-700 mt-1">
                                                        Total Amount: ₹{invoice.lorryReceipts.reduce((sum, lr) => sum + (lr.totalAmount || 0), 0).toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-blue-600">
                                                        Avg: ₹{Math.round(invoice.lorryReceipts.reduce((sum, lr) => sum + (lr.totalAmount || 0), 0) / invoice.lorryReceipts.length).toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* GST Details */}
                                {!invoice.isRcm && (
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <h2 className="text-lg font-semibold text-gray-800 mb-4">GST Details</h2>
                                        
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-6">
                                                <ToggleSwitch
                                                    label="Enable Reverse Charge (RCM)"
                                                    checked={invoice.isRcm || false}
                                                    onChange={(checked) => setInvoice(prev => ({ ...prev, isRcm: checked }))}
                                                />
                                                <ToggleSwitch
                                                    label="Manual GST Entry"
                                                    checked={invoice.isManualGst || false}
                                                    onChange={(checked) => setInvoice(prev => ({ ...prev, isManualGst: checked }))}
                                                />
                                            </div>

                                            {!invoice.isManualGst && (
                                                <>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">GST Type</label>
                                                            <p className="text-sm text-blue-600 font-medium">
                                                                {invoice.gstType === GstType.CGST_SGST ? 'CGST + SGST (Auto-selected based on customer state)' : 'IGST (Auto-selected based on customer state)'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {invoice.gstType === GstType.CGST_SGST ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="block text-sm font-medium text-gray-700">
                                                                    CGST Rate (%)
                                                                </label>
                                                                <Input 
                                                                    name="cgstRate" 
                                                                    type="number" 
                                                                    value={invoice.cgstRate || 0} 
                                                                    onChange={handleChange} 
                                                                    min="0"
                                                                    max="100"
                                                                    step="0.01"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="block text-sm font-medium text-gray-700">
                                                                    SGST Rate (%)
                                                                </label>
                                                                <Input 
                                                                    name="sgstRate" 
                                                                    type="number" 
                                                                    value={invoice.sgstRate || 0} 
                                                                    onChange={handleChange} 
                                                                    min="0"
                                                                    max="100"
                                                                    step="0.01"
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-medium text-gray-700">
                                                                IGST Rate (%)
                                                            </label>
                                                            <Input 
                                                                name="igstRate" 
                                                                type="number" 
                                                                value={invoice.igstRate || 0} 
                                                                onChange={handleChange} 
                                                                min="0"
                                                                max="100"
                                                                step="0.01"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            {invoice.gstType === GstType.CGST_SGST ? 'CGST Amount' : 'IGST Amount'}
                                                        </label>
                                                        <Input 
                                                            name={invoice.gstType === GstType.CGST_SGST ? 'cgstAmount' : 'igstAmount'}
                                                            type="number" 
                                                            value={invoice.gstType === GstType.CGST_SGST ? (invoice.cgstAmount || 0) : (invoice.igstAmount || 0)} 
                                                            onChange={handleChange} 
                                                            disabled
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {invoice.isManualGst && (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-medium text-gray-700">
                                                                CGST Amount (₹)
                                                            </label>
                                                            <Input 
                                                                name="cgstAmount" 
                                                                type="number" 
                                                                value={invoice.cgstAmount || 0} 
                                                                onChange={handleManualGstChange} 
                                                                min="0"
                                                                step="0.01"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-medium text-gray-700">
                                                                SGST Amount (₹)
                                                            </label>
                                                            <Input 
                                                                name="sgstAmount" 
                                                                type="number" 
                                                                value={invoice.sgstAmount || 0} 
                                                                onChange={handleManualGstChange} 
                                                                min="0"
                                                                step="0.01"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            IGST Amount (₹)
                                                        </label>
                                                        <Input 
                                                            name="igstAmount" 
                                                            type="number" 
                                                            value={invoice.igstAmount || 0} 
                                                            onChange={handleManualGstChange} 
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* RCM Notice */}
                                {invoice.isRcm && (
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <h2 className="text-lg font-semibold text-gray-800 mb-4">GST Details</h2>
                                        
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-6">
                                                <ToggleSwitch
                                                    label="Enable Reverse Charge (RCM)"
                                                    checked={invoice.isRcm || false}
                                                    onChange={(checked) => setInvoice(prev => ({ ...prev, isRcm: checked }))}
                                                />
                                                <ToggleSwitch
                                                    label="Manual GST Entry"
                                                    checked={invoice.isManualGst || false}
                                                    onChange={(checked) => setInvoice(prev => ({ ...prev, isManualGst: checked }))}
                                                />
                                            </div>

                                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                                <p className="text-sm text-yellow-800">
                                                    GST is set to ₹0. The invoice will state that GST is payable under Reverse Charge.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Additional Information */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h2>
                                    
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Remarks</label>
                                        <Textarea 
                                            name="remarks" 
                                            value={invoice.remarks || ''} 
                                            onChange={handleChange} 
                                            rows={3}
                                            placeholder="Remarks"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Financial Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Summary</h3>
                                    
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Subtotal:</span>
                                            <span className="font-medium">₹{(invoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        
                                        {!invoice.isRcm && (
                                            <>
                                                {invoice.gstType === GstType.CGST_SGST && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">CGST ({(invoice.cgstRate || 0)}%):</span>
                                                            <span className="font-medium">+ ₹{(invoice.cgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">SGST ({(invoice.sgstRate || 0)}%):</span>
                                                            <span className="font-medium">+ ₹{(invoice.sgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                    </>
                                                )}
                                                
                                                {invoice.gstType === GstType.IGST && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">IGST ({(invoice.igstRate || 0)}%):</span>
                                                        <span className="font-medium">+ ₹{(invoice.igstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        
                                        <div className="border-t border-gray-200 pt-3">
                                            <div className="flex justify-between">
                                                <span className="text-lg font-bold text-gray-800">Grand Total:</span>
                                                <span className="text-lg font-bold text-gray-800">₹{(invoice.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                                            <p className="text-sm text-gray-600">
                                                In words: {numberToWords(Math.round(invoice.grandTotal || 0))} Only /-
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-8">
                            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Invoice'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
            
            {/* Customer Creation Modal */}
            <CustomerCreationModal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onSave={onSaveCustomer}
                onSelect={handleCustomerSelect}
            />
        </div>
    );
};