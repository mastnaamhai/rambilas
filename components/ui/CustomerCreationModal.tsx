import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select } from './Select';
import { fetchGstDetails } from '../../services/utils';
import { indianStates } from '../../constants';
import type { Customer } from '../../types';

interface CustomerCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id'>) => Promise<Customer>;
  onSelect: (customer: Customer) => void;
}

export const CustomerCreationModal: React.FC<CustomerCreationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSelect
}) => {
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    address: '',
    state: '',
    gstin: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    city: '',
    pin: '',
    phone: '',
    email: '',
    tradeName: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleVerifyGstin = async () => {
    if (!formData.gstin || formData.gstin.length !== 15) {
      setVerifyStatus({ message: 'Please enter a valid 15-digit GSTIN.', type: 'error' });
      return;
    }
    setIsVerifying(true);
    setVerifyStatus(null);
    setErrors(prev => ({...prev, gstin: undefined}));
    try {
      const details = await fetchGstDetails(formData.gstin);
      setFormData(prev => ({
        ...prev,
        name: details.name, // Legal Name
        tradeName: details.tradeName,
        address: details.address,
        state: details.state,
      }));
      setVerifyStatus({ message: 'GSTIN verified. Name, Address and State pre-filled.', type: 'success' });
    } catch (error: any) {
      setVerifyStatus({ message: error.message || 'Verification failed.', type: 'error' });
    } finally {
      setIsVerifying(false);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (formData.gstin && formData.gstin.length !== 15) {
      newErrors.gstin = 'GSTIN must be 15 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setIsSaving(true);
    try {
      const { _id, ...customerData } = formData as Customer;
      const newCustomer = await onSave(customerData);
      onSelect(newCustomer);
      onClose();
      // Reset form
      setFormData({
        name: '',
        address: '',
        state: '',
        gstin: '',
        contactPerson: '',
        contactPhone: '',
        contactEmail: '',
        city: '',
        pin: '',
        phone: '',
        email: '',
        tradeName: ''
      });
      setErrors({});
      setVerifyStatus(null);
    } catch (error: any) {
      setVerifyStatus({ message: error.message || 'Failed to save customer.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-4 sm:my-8 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Add New Customer</h2>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              size="sm"
            >
              ✕
            </Button>
          </div>

          <div className="space-y-4">
            {/* GSTIN Verification */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                GSTIN (Optional)
              </label>
              <div className="flex items-end space-x-2">
                <Input
                  name="gstin"
                  value={formData.gstin || ''}
                  onChange={handleChange}
                  placeholder="Enter 15-digit GSTIN"
                  maxLength={15}
                  className="flex-grow"
                  error={errors.gstin}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleVerifyGstin}
                  disabled={isVerifying || !formData.gstin || formData.gstin.length !== 15}
                  size="sm"
                >
                  {isVerifying ? 'Verifying...' : 'Fetch Details'}
                </Button>
              </div>
              {verifyStatus && (
                <div className={`text-sm p-2 rounded ${
                  verifyStatus.type === 'success' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {verifyStatus.message}
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Business Name *"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                error={errors.name}
                required
              />
              <Input
                label="Trade Name"
                name="tradeName"
                value={formData.tradeName || ''}
                onChange={handleChange}
              />
            </div>

            <Textarea
              label="Address *"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              error={errors.address}
              required
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="State *"
                name="state"
                value={formData.state || ''}
                onChange={handleChange}
                error={errors.state}
                required
                options={indianStates.map(s => ({ value: s, label: s }))}
              />
              <Input
                label="City"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
              />
              <Input
                label="PIN Code"
                name="pin"
                value={formData.pin || ''}
                onChange={handleChange}
                maxLength={6}
              />
            </div>

            {/* Contact Information */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Contact Person"
                  name="contactPerson"
                  value={formData.contactPerson || ''}
                  onChange={handleChange}
                />
                <Input
                  label="Contact Phone"
                  name="contactPhone"
                  value={formData.contactPhone || ''}
                  onChange={handleChange}
                />
                <Input
                  label="Contact Email"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={handleChange}
                />
                <Input
                  label="Phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save & Select Customer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
