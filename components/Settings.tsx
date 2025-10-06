import React, { useState, useMemo } from 'react';
import type { CompanyInfo, LorryReceipt, Invoice, Payment, Customer, TruckHiringNote } from '../types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { LogoUpload } from './ui/LogoUpload';
import { BankAccountManager } from './ui/BankAccountManager';
import { exportToCsv } from '../services/exportService';
import { NumberingSettings } from './NumberingSettings';
import { EnhancedExportInterface } from './EnhancedExportInterface';
import { formatDate } from '../services/utils';
import { indianStates } from '../constants';
import { useCompanyInfo } from '../hooks/useCompanyInfo';

interface SettingsProps {
  lorryReceipts: LorryReceipt[];
  invoices: Invoice[];
  payments: Payment[];
  customers: Customer[];
  truckHiringNotes: TruckHiringNote[];
  onPasswordChange: (currentPassword: string, newPassword: string) => Promise<{success: boolean, message: string}>;
  onResetData: () => Promise<void>;
  onBackup: () => Promise<void>;
  onRestore: (data: any) => Promise<void>;
  onBack: () => void;
}

const CompanyInfoForm: React.FC = () => {
    const { companyInfo, saveCompanyInfo, isLoading, error } = useCompanyInfo();
    const [info, setInfo] = useState<CompanyInfo>(companyInfo || {
        name: '',
        address: '',
        state: '',
        phone1: '',
        phone2: '',
        email: '',
        website: '',
        gstin: '',
        pan: '',
        logo: '',
    });
    const [saved, setSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Update local state when company info changes
    React.useEffect(() => {
        if (companyInfo) {
            setInfo(companyInfo);
        }
    }, [companyInfo]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setInfo(prev => ({ ...prev, [name]: value || undefined }));
    };

    const handleLogoChange = (logo: string | null) => {
        setInfo(prev => ({ ...prev, logo: logo || undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            // Clean the data before sending - remove undefined values and ensure proper types
            const cleanInfo = Object.fromEntries(
                Object.entries(info).map(([key, value]) => {
                    // Handle currentBankAccount specially - only send the ID if it's an object
                    if (key === 'currentBankAccount' && value && typeof value === 'object') {
                        return [key, value._id || value.id];
                    }
                    return [key, value === '' || value === null ? undefined : value];
                })
            );
            
            await saveCompanyInfo(cleanInfo);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Failed to save company info:', error);
            alert('Failed to save company information. Please check the console for details.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="text-center py-8">Loading company information...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Company Details</h3>
                {saved && <span className="text-green-600 bg-green-100 px-3 py-1 rounded-md text-sm font-medium">Saved!</span>}
                {error && <span className="text-red-600 bg-red-100 px-3 py-1 rounded-md text-sm font-medium">{error}</span>}
            </div>
            
            <Card title="Company Information">
                <div className="space-y-6">
                    {/* Logo Upload Section */}
                    <LogoUpload 
                        currentLogo={info.logo} 
                        onLogoChange={handleLogoChange}
                    />
                    
                    {/* Company Information Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Company Name" name="name" value={info.name} onChange={handleChange} required />
                        <Textarea label="Address" name="address" value={info.address} onChange={handleChange} rows={4} wrapperClassName="md:col-span-2" required />
                        <Select label="State" name="state" value={info.state} onChange={handleChange} required>
                            <option value="" disabled>Select State</option>
                            {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                        <Input label="Phone 1" name="phone1" value={info.phone1 || ''} onChange={handleChange} />
                        <Input label="Phone 2" name="phone2" value={info.phone2 || ''} onChange={handleChange} />
                        <Input label="Email" name="email" type="email" value={info.email || ''} onChange={handleChange} />
                        <Input label="Website" name="website" value={info.website || ''} onChange={handleChange} />
                        <Input label="GSTIN" name="gstin" value={info.gstin || ''} onChange={handleChange} />
                        <Input label="PAN" name="pan" value={info.pan || ''} onChange={handleChange} />
                    </div>
                </div>
            </Card>
            
            <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Company Details'}
                </Button>
            </div>
        </form>
    );
};

const BankAccountSection: React.FC = () => {
    const {
        bankAccounts,
        currentBankAccount,
        createBankAccount,
        updateBankAccount,
        deleteBankAccount,
        setCurrentBankAccount,
        toggleBankAccountStatus,
        isLoading,
        error
    } = useCompanyInfo();

    if (isLoading) {
        return <div className="text-center py-8">Loading bank accounts...</div>;
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">
                        <strong>Error:</strong> {error}
                    </p>
                </div>
            )}
            <BankAccountManager
                bankAccounts={bankAccounts}
                currentBankAccount={currentBankAccount}
                onAddBankAccount={createBankAccount}
                onUpdateBankAccount={updateBankAccount}
                onDeleteBankAccount={deleteBankAccount}
                onSetCurrentBankAccount={setCurrentBankAccount}
                onToggleBankAccountStatus={toggleBankAccountStatus}
            />
        </div>
    );
};

const BackupExport: React.FC<Pick<SettingsProps, 'lorryReceipts' | 'invoices' | 'truckHiringNotes'>> = (props) => {

    const handleExportLrs = () => {
        const data = props.lorryReceipts.map(lr => ({
            'LR No': lr.lrNumber, 'Date': formatDate(lr.date), 'Consignor': lr.consignor?.name, 'Consignee': lr.consignee?.name,
             'Vehicle No': lr.vehicle?.number, 'From': lr.from, 'To': lr.to, 'Amount': lr.totalAmount, 'Status': lr.status
        }));
        exportToCsv(data, 'lorry-receipts');
    };

    const handleExportInvoices = () => {
        const data = props.invoices.map(inv => ({
            'Invoice No': inv.invoiceNumber, 'Date': formatDate(inv.date), 'Customer': inv.customer?.name,
            'Amount': inv.totalAmount, 'GST': inv.gstType, 'Grand Total': inv.grandTotal, 'Status': inv.status
        }));
        exportToCsv(data, 'invoices');
    };

    const handleExportTHNs = () => {
        const data = props.truckHiringNotes.map(thn => ({
            'THN No': thn.thnNumber, 'Date': formatDate(thn.date), 'Customer': thn.customer?.name,
            'Vehicle': thn.vehicleNumber, 'From': thn.from, 'To': thn.to, 'Freight': thn.freightRate, 'Status': thn.status
        }));
        exportToCsv(data, 'truck-hiring-notes');
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Export Data</h3>
            <Card title="Export to CSV">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="secondary" onClick={handleExportLrs}>
                        Export Lorry Receipts ({props.lorryReceipts.length})
                    </Button>
                    <Button variant="secondary" onClick={handleExportInvoices}>
                        Export Invoices ({props.invoices.length})
                    </Button>
                    <Button variant="secondary" onClick={handleExportTHNs}>
                        Export THNs ({props.truckHiringNotes.length})
                    </Button>
                </div>
            </Card>
        </div>
    );
};

const ChangePasswordForm: React.FC<{ onPasswordChange: SettingsProps['onPasswordChange'] }> = ({ onPasswordChange }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage('New passwords do not match');
            setIsError(true);
            return;
        }
        setIsLoading(true);
        try {
            const result = await onPasswordChange(currentPassword, newPassword);
            setMessage(result.message);
            setIsError(!result.success);
            if (result.success) {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error) {
            setMessage('An error occurred while changing password');
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Change Password</h3>
            <Card>
                <div className="space-y-4">
                    <Input label="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" required />
                    <Input label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" required />
                    <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
                </div>
            </Card>
            {message && (<p className={`text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>{message}</p>)}
            <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Password'}
                </Button>
            </div>
        </form>
    );
};

const DataManagement: React.FC<{ onResetData: () => void, onBackup: () => void, onRestore: (data: any) => void }> = ({ onResetData, onBackup, onRestore }) => {
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleReset = async () => {
        if (window.confirm('Are you sure you want to reset all application data? This action cannot be undone.')) {
            setIsLoading(true);
            await onResetData();
            setIsLoading(false);
        }
    };

    const handleBackup = async () => {
        setIsLoading(true);
        await onBackup();
        setIsLoading(false);
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const confirmation = window.confirm(
            'This action will delete all existing data and replace it with the uploaded backup. This cannot be undone. Are you sure you want to proceed?'
        );

        if (confirmation) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = e.target?.result;
                    if (typeof content === 'string') {
                        const data = JSON.parse(content);
                        setIsLoading(true);
                        await onRestore(data);
                        setIsLoading(false);
                    }
                } catch (error) {
                    console.error('Error parsing backup file:', error);
                    alert('Error parsing backup file. Please ensure it is a valid JSON file.');
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Data Management</h3>
            <Card title="Backup & Restore">
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={handleBackup} variant="secondary" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Backup'}
                        </Button>
                        <Button onClick={handleRestoreClick} variant="secondary" disabled={isLoading}>
                            {isLoading ? 'Restoring...' : 'Restore from Backup'}
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                    <p className="text-sm text-gray-500">
                        Create a backup of all your data or restore from a previous backup file.
                    </p>
                </div>
            </Card>
            <Card title="Reset Data">
                <div className="pt-4 border-t">
                    <h4 className="font-semibold text-lg text-red-700">Reset Application Data</h4>
                    <p className="text-sm text-gray-500 mb-2">Permanently delete all data from the application, including all clients, lorry receipts, invoices, and payments. This is irreversible.</p>
                    <Button onClick={handleReset} variant="destructive" disabled={isLoading}>
                        {isLoading ? 'Resetting...' : 'Reset All Data'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export const Settings: React.FC<SettingsProps> = (props) => {
  const [activeTab, setActiveTab] = useState('info');

  const tabs = [
      { key: 'info', label: 'Company Info' },
      { key: 'bank', label: 'Bank Accounts' },
      { key: 'export', label: 'Enhanced Export' },
      { key: 'legacy-export', label: 'Legacy Export' },
      { key: 'security', label: 'Security' },
      { key: 'data', label: 'Data Management' },
      { key: 'numbering', label: 'Numbering' },
  ];

  return (
    <Card>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
            <Button variant="secondary" onClick={props.onBack}>Back</Button>
        </div>
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.key ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
        <div className="mt-6">
            {activeTab === 'info' && <CompanyInfoForm />}
            {activeTab === 'bank' && <BankAccountSection />}
            {activeTab === 'export' && <EnhancedExportInterface customers={props.customers} lorryReceipts={props.lorryReceipts} invoices={props.invoices} payments={props.payments} truckHiringNotes={props.truckHiringNotes} />}
            {activeTab === 'legacy-export' && <BackupExport lorryReceipts={props.lorryReceipts} invoices={props.invoices} truckHiringNotes={props.truckHiringNotes} />}
            {activeTab === 'security' && <ChangePasswordForm onPasswordChange={props.onPasswordChange} />}
            {activeTab === 'data' && <DataManagement onResetData={props.onResetData} onBackup={props.onBackup} onRestore={props.onRestore} />}
            {activeTab === 'numbering' && <NumberingSettings />}
        </div>
    </Card>
  );
};