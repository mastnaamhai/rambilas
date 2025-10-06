import React, { useState, useEffect } from 'react';
import type { Payment, Invoice, TruckHiringNote } from '../types';
import { PaymentMode, PaymentType } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { FormSection } from './ui/ResponsiveForm';
import { validateForm, commonRules } from '../services/formValidation';
import { getCurrentDate } from '../services/utils';

interface UniversalPaymentFormProps {
    invoiceId?: string;
    truckHiringNoteId?: string;
    customerId?: string;
    grandTotal: number;
    balanceDue: number;
    onSave: (payment: Omit<Payment, '_id' | 'customer' | 'invoice' | 'truckHiringNote'>) => Promise<void>;
    onClose: () => void;
    title?: string;
}

export const UniversalPaymentForm: React.FC<UniversalPaymentFormProps> = ({ 
    invoiceId, 
    truckHiringNoteId,
    customerId, 
    grandTotal, 
    balanceDue, 
    onSave, 
    onClose,
    title
}) => {
    console.log('UniversalPaymentForm received customerId:', customerId);
    const totalPaid = grandTotal - balanceDue;
    const isForInvoice = !!invoiceId;
    const isForTHN = !!truckHiringNoteId;

    const [payment, setPayment] = useState({
        invoiceId,
        truckHiringNoteId,
        ...(customerId && { customer: customerId }),
        amount: Math.abs(balanceDue), // Use absolute value for payment amount
        date: getCurrentDate(),
        type: PaymentType.RECEIPT,
        mode: PaymentMode.CASH,
        referenceNo: '',
        notes: '',
    });
    
    console.log('Initial payment state:', JSON.stringify(payment, null, 2));
    
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSaving, setIsSaving] = useState(false);

    // Validation rules
    const validationRules = {
        amount: { 
            required: true, 
            min: 0.01, 
            max: Math.abs(balanceDue),
            message: `Amount must be between ₹0.01 and ₹${Math.abs(balanceDue).toLocaleString('en-IN')}` 
        },
        date: commonRules.required,
        type: commonRules.required,
        mode: commonRules.required,
        referenceNo: {
            custom: (value: string) => {
                if (payment.mode !== PaymentMode.CASH && !value.trim()) {
                    return 'Reference number is required for non-cash payments';
                }
                return null;
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        setPayment(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const formErrors = validateForm(payment, validationRules);
        
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
            console.log('Sending payment data:', JSON.stringify(payment, null, 2));
            await onSave(payment);
            onClose();
        } catch (error) {
            console.error('Failed to save payment', error);
            console.error('Payment data that failed:', JSON.stringify(payment, null, 2));
            setErrors({ general: 'Failed to save payment. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    const quickAmounts = [
        { label: '25%', value: Math.abs(balanceDue) * 0.25 },
        { label: '50%', value: Math.abs(balanceDue) * 0.5 },
        { label: '75%', value: Math.abs(balanceDue) * 0.75 },
        { label: 'Full', value: Math.abs(balanceDue) }
    ];

    const setQuickAmount = (amount: number) => {
        setPayment(prev => ({ ...prev, amount }));
        if (errors.amount) {
            setErrors(prev => ({ ...prev, amount: '' }));
        }
    };

    const getDocumentType = () => {
        if (isForInvoice) return 'Invoice';
        if (isForTHN) return 'Truck Hiring Note';
        return 'Document';
    };

    const getDocumentNumber = () => {
        if (isForInvoice) return `INV-${invoiceId?.slice(-6)}`;
        if (isForTHN) return `THN-${truckHiringNoteId?.slice(-6)}`;
        return 'Unknown';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-4 sm:my-8 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <Card title={title || `Record Payment for ${getDocumentType()} ${getDocumentNumber()}`}>
                        {/* Payment Summary */}
                        <FormSection title="Payment Summary">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                                    <div className="mt-1 p-3 border border-gray-300 rounded-md bg-gray-50 font-semibold">
                                        ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Already Paid</label>
                                    <div className="mt-1 p-3 border border-gray-300 rounded-md bg-green-50 font-semibold text-green-600">
                                        ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Balance Due</label>
                                    <div className="mt-1 p-3 border border-gray-300 rounded-md bg-red-50 font-semibold text-red-600">
                                        ₹{Math.abs(balanceDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        </FormSection>

                        {/* General Error Message */}
                        {errors.general && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                <p className="text-red-600 text-sm">{errors.general}</p>
                            </div>
                        )}

                        {/* Payment Details */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input 
                                    label="Payment Date" 
                                    name="date" 
                                    type="date" 
                                    value={payment.date} 
                                    onChange={handleChange} 
                                    required 
                                    error={errors.date}
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Amount (₹)
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <Input 
                                        name="amount" 
                                        type="number" 
                                        value={payment.amount} 
                                        onChange={handleChange} 
                                        required 
                                        min="0.01"
                                        max={Math.abs(balanceDue)}
                                        step="0.01"
                                        error={errors.amount}
                                        className="w-full text-lg py-3"
                                    />
                                    <div className="flex justify-center space-x-2 mt-3">
                                        {quickAmounts.map((quick, index) => (
                                            <Button
                                                key={index}
                                                type="button"
                                                variant="secondary"
                                                onClick={() => setQuickAmount(quick.value)}
                                                className="text-sm px-3 py-1.5 min-w-[60px]"
                                            >
                                                {quick.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Select 
                                    label="Payment Type" 
                                    name="type" 
                                    value={payment.type} 
                                    onChange={handleChange} 
                                    required 
                                    error={errors.type}
                                >
                                    <option value={PaymentType.RECEIPT}>Receipt</option>
                                    <option value={PaymentType.ADVANCE}>Advance</option>
                                    <option value={PaymentType.PAYMENT}>Payment</option>
                                </Select>
                                <Select 
                                    label="Payment Mode" 
                                    name="mode" 
                                    value={payment.mode} 
                                    onChange={handleChange} 
                                    required 
                                    error={errors.mode}
                                >
                                    <option value={PaymentMode.CASH}>Cash</option>
                                    <option value={PaymentMode.CHEQUE}>Cheque</option>
                                    <option value={PaymentMode.NEFT}>NEFT</option>
                                    <option value={PaymentMode.RTGS}>RTGS</option>
                                    <option value={PaymentMode.UPI}>UPI</option>
                                </Select>
                            </div>

                            {payment.mode !== PaymentMode.CASH && (
                                <Input 
                                    label="Reference Number" 
                                    name="referenceNo" 
                                    value={payment.referenceNo} 
                                    onChange={handleChange} 
                                    required 
                                    error={errors.referenceNo}
                                    placeholder={
                                        payment.mode === PaymentMode.CHEQUE ? "Cheque number" :
                                        payment.mode === PaymentMode.NEFT ? "NEFT reference" :
                                        payment.mode === PaymentMode.RTGS ? "RTGS reference" :
                                        payment.mode === PaymentMode.UPI ? "UPI transaction ID" :
                                        "Reference number"
                                    }
                                />
                            )}

                            <Textarea 
                                label="Notes" 
                                name="notes" 
                                value={payment.notes} 
                                onChange={handleChange} 
                                rows={3}
                                placeholder="Additional payment notes or remarks"
                            />
                        </div>

                        {/* Payment Summary */}
                        <FormSection title="Payment Summary">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Payment Amount</label>
                                    <div className="mt-1 p-3 border border-gray-300 rounded-md bg-white font-semibold text-lg">
                                        ₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Remaining Balance</label>
                                    <div className="mt-1 p-3 border border-gray-300 rounded-md bg-white font-semibold text-lg text-red-600">
                                        ₹{(Math.abs(balanceDue) - payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        </FormSection>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-2 pt-6 mt-6 border-t">
                            <Button 
                                type="button" 
                                variant="secondary" 
                                onClick={onClose} 
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSaving || payment.amount <= 0}
                            >
                                {isSaving ? 'Recording Payment...' : 'Record Payment'}
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </div>
    );
};
