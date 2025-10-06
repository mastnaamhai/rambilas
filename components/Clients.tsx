import React, { useState, useMemo } from 'react';
import type { Customer } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { fetchGstDetails } from '../services/utils';
import { indianStates } from '../constants';
import { Pagination } from './ui/Pagination';

interface ClientsProps {
  customers: Customer[];
  onSave: (customer: Omit<Customer, 'id' | '_id'> & { _id?: string }) => Promise<Customer>;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const ClientFormModal: React.FC<{
    client: Partial<Customer> | null;
    onSave: (customer: Partial<Customer>) => Promise<any>;
    onClose: () => void;
}> = ({ client, onSave, onClose }) => {
    if (!client) return null;

    const [formData, setFormData] = useState(client);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear save error when user makes changes
        if (saveError) {
            setSaveError(null);
        }
        
        // Clear field-specific errors
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
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
            console.log('Verifying GSTIN:', formData.gstin);
            const details = await fetchGstDetails(formData.gstin);
            console.log('GST details received:', details);
            setFormData(prev => ({
                ...prev,
                name: details.name, // Legal Name
                tradeName: details.tradeName,
                address: details.address,
                state: details.state,
            }));
            setVerifyStatus({ message: 'GSTIN verified. Name, Address and State pre-filled.', type: 'success' });
        } catch (error: any) {
            console.error('GST verification error:', error);
            setVerifyStatus({ message: error.message || 'Verification failed.', type: 'error' });
        } finally {
            setIsVerifying(false);
        }
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.name.trim()) newErrors.name = 'Client name is required.';
        if (!formData.address.trim()) newErrors.address = 'Address is required.';
        if (!formData.state) newErrors.state = 'State is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveError(null); // Clear any previous errors
        
        if (validate()) {
            setIsSaving(true);
            try {
                console.log('Saving client data:', formData);
                await onSave(formData);
                console.log('Client saved successfully');
                onClose();
            } catch (error: any) {
                console.error("Failed to save client", error);
                const errorMessage = error?.message || 'Failed to save client. Please try again.';
                setSaveError(errorMessage);
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start p-4 overflow-y-auto transition-opacity duration-300 ease-in-out" 
          onClick={onClose}
        >
            <div onClick={e => e.stopPropagation()} className="w-full max-w-2xl my-4 sm:my-8 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto">
                <Card title={formData._id ? 'Edit Client' : 'Add New Client'}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex items-start space-x-2">
                             <Input 
                                label="GSTIN" 
                                name="gstin" 
                                value={formData.gstin || ''} 
                                onChange={handleChange} 
                                wrapperClassName="flex-grow"
                            />
                            <Button type="button" variant="secondary" onClick={handleVerifyGstin} disabled={isVerifying} className="mt-6">
                                {isVerifying ? 'Verifying...' : 'Verify'}
                            </Button>
                        </div>
                        {verifyStatus && (
                            <p className={`text-xs -mt-2 ml-1 ${verifyStatus.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                                {verifyStatus.message}
                            </p>
                        )}
                        {saveError && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
                                <p className="text-sm text-red-600">
                                    <strong>Error:</strong> {saveError}
                                </p>
                            </div>
                        )}
                        <Input label="Legal Name of Business" name="name" value={formData.name} onChange={handleChange} error={errors.name} required />
                        <Input label="Trade Name (Optional)" name="tradeName" value={formData.tradeName || ''} onChange={handleChange} />
                        <Textarea label="Address" name="address" value={formData.address} onChange={handleChange} rows={4} error={errors.address} required />
                        <Select label="State" name="state" value={formData.state} onChange={handleChange} error={errors.state} required>
                            <option value="" disabled>Select State</option>
                            {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                        
                        <div className="pt-4 border-t">
                             <h4 className="text-lg font-semibold text-gray-700 mb-2">Contact Information (Optional)</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Contact Person" name="contactPerson" value={formData.contactPerson || ''} onChange={handleChange} />
                                <Input label="Contact Phone" name="contactPhone" value={formData.contactPhone || ''} onChange={handleChange} />
                                <Input label="Contact Email" type="email" name="contactEmail" value={formData.contactEmail || ''} onChange={handleChange} wrapperClassName="md:col-span-2" />
                             </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
                            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Client'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};


export const Clients: React.FC<ClientsProps> = ({ customers, onSave, onDelete, onBack }) => {
    const [editingClient, setEditingClient] = useState<Partial<Customer> | null>(null);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    
    // Paginated customers
    const paginatedCustomers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return customers.slice(startIndex, startIndex + itemsPerPage);
    }, [customers, currentPage, itemsPerPage]);
    
    const totalPages = Math.ceil(customers.length / itemsPerPage);

    const handleAddNew = () => {
        setEditingClient({ name: '', tradeName: '', address: '', state: '', gstin: '', contactPerson: '', contactPhone: '', contactEmail: '' });
    };

    const handleEdit = (client: Customer) => {
        setEditingClient(client);
    };

    const handleCloseModal = () => {
        setEditingClient(null);
    };

    return (
        <div className="space-y-6">
            {editingClient && <ClientFormModal client={editingClient} onSave={onSave} onClose={handleCloseModal} />}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Manage Clients</h2>
                <div className="space-x-2">
                  <Button onClick={handleAddNew}>Add New Client</Button>
                  <Button variant="secondary" onClick={onBack}>Back</Button>
                </div>
            </div>
            <Card>
                <div className="mb-4">
                    <p className="text-sm text-gray-600">Total Clients: <span className="font-semibold text-gray-800">{customers.length}</span></p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address & State</th>
                                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GSTIN</th>
                                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedCustomers.map(client => (
                                <tr key={client._id} className="hover:bg-slate-50 transition-colors duration-200">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm align-top">
                                        <div className="font-medium text-gray-900">{client.name}</div>
                                        {client.tradeName && <div className="text-gray-500">{client.tradeName}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 align-top">
                                        <p className="whitespace-pre-line">{client.address}</p>
                                        <p className="font-semibold text-gray-700 mt-1">{client.state}</p>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 align-top">{client.gstin || '-'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 align-top">
                                        {client.contactPerson && <div className="font-semibold">{client.contactPerson}</div>}
                                        {client.contactPhone && <div className="text-xs">{client.contactPhone}</div>}
                                        {client.contactEmail && <div className="text-xs">{client.contactEmail}</div>}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2 align-top">
                                        <button onClick={() => handleEdit(client)} className="text-indigo-600 hover:text-indigo-900 transition-colors">Edit</button>
                                        <button onClick={() => onDelete(client._id)} className="text-red-600 hover:text-red-900 transition-colors">Delete</button>
                                    </td>
                                </tr>
                            ))}
                             {customers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">No clients found. Click 'Add New Client' to get started.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={customers.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                    />
                </div>
            </Card>
        </div>
    );
};