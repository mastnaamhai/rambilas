import React, { useState, useMemo, useEffect } from 'react';
import type { LorryReceipt, Customer, CompanyInfo, Invoice } from '../types';
import { LorryReceiptStatus } from '../types';
import type { View } from '../App';
import { formatDate } from '../services/utils';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { LorryReceiptView } from './LorryReceiptPDF';
import { API_BASE_URL } from '../constants';
import { FilterSection } from './ui/FilterSection';
import { Pagination } from './ui/Pagination';
import { StatusBadge, getStatusVariant } from './ui/StatusBadge';


interface LorryReceiptsProps {
  lorryReceipts: LorryReceipt[];
  invoices: Invoice[];
  customers: Customer[];
  companyInfo: CompanyInfo;
  onViewChange: (view: View) => void;
  onUpdateLrStatus: (id: string, status: LorryReceiptStatus) => void;
  onDeleteLr: (id: string) => void;
  onBack: () => void;
  initialFilters?: Partial<Record<keyof LorryReceiptsTableFilters, any>>;
}

interface LorryReceiptsTableFilters {
    searchTerm: string;
    startDate: string;
    endDate: string;
    selectedCustomerId: string;
    selectedStatus: LorryReceiptStatus[];
    ids?: string[];
}

const statusColors: { [key in LorryReceiptStatus]: string } = {
  [LorryReceiptStatus.CREATED]: 'bg-blue-100 text-blue-800',
  [LorryReceiptStatus.IN_TRANSIT]: 'bg-yellow-100 text-yellow-800',
  [LorryReceiptStatus.DELIVERED]: 'bg-green-100 text-green-800',
  [LorryReceiptStatus.INVOICED]: 'bg-purple-100 text-purple-800',
  [LorryReceiptStatus.PAID]: 'bg-pink-100 text-pink-800',
  [LorryReceiptStatus.UNBILLED]: 'bg-orange-100 text-orange-800',
};

const PreviewModal: React.FC<{
  item: { type: 'LR', data: LorryReceipt };
  onClose: () => void;
  companyInfo: CompanyInfo;
}> = ({ item, onClose, companyInfo }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
        onClose();
    }, 300); // Match animation duration
  };

  const modalAnimation = isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100';
  const backdropAnimation = isClosing ? 'opacity-0' : 'opacity-100';


  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out ${backdropAnimation}`}
      onClick={closeModal}
      aria-modal="true"
      role="dialog"
      data-pdf-viewer="true"
    >
      <div
        className={`bg-white rounded-xl shadow-2xl max-h-[95vh] w-full max-w-4xl sm:max-w-6xl overflow-hidden flex flex-col transform transition-all duration-300 ease-in-out ${modalAnimation}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b bg-slate-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-800">{`Preview: Lorry Receipt #${item.data.lrNumber}`}</h2>
          <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto bg-gray-200 flex-1">
           <div className="p-2 sm:p-4 md:p-8 flex justify-center">
             {item.type === 'LR' && item.data.consignor && ( // Ensure data is populated
              <LorryReceiptView
                lorryReceipt={item.data as LorryReceipt}
                companyInfo={companyInfo}
              />
            )}
           </div>
        </div>
      </div>
    </div>
  );
};


export const LorryReceipts: React.FC<LorryReceiptsProps> = ({ lorryReceipts, invoices, customers, companyInfo, onViewChange, onUpdateLrStatus, onDeleteLr, onBack, initialFilters }) => {
  const [searchTerm, setSearchTerm] = useState(initialFilters?.searchTerm || '');
  const [startDate, setStartDate] = useState(initialFilters?.startDate || '');
  const [endDate, setEndDate] = useState(initialFilters?.endDate || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialFilters?.selectedCustomerId || '');
  const [selectedStatus, setSelectedStatus] = useState<LorryReceiptStatus[]>(initialFilters?.selectedStatus || []);
  const [previewItem, setPreviewItem] = useState<{type: 'LR', data: LorryReceipt} | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const filteredLrs = useMemo(() => {
    // Create a set of LR IDs that are included in invoices (billed LRs)
    const invoicedLrIds = new Set(invoices.flatMap(inv => inv.lorryReceipts?.map(lr => lr._id) || []));
    
    return lorryReceipts
      .filter(lr => {
        const consignorName = lr.consignor?.name || '';
        const consigneeName = lr.consignee?.name || '';

        const searchLower = searchTerm.toLowerCase();

        const matchesSearch = searchTerm === '' ||
          lr.lrNumber.toString().includes(searchTerm) ||
          lr.from.toLowerCase().includes(searchLower) ||
          lr.to.toLowerCase().includes(searchLower) ||
          consignorName.toLowerCase().includes(searchLower) ||
          consigneeName.toLowerCase().includes(searchLower);

        const lrDate = new Date(lr.date);
        lrDate.setHours(0, 0, 0, 0);

        const start = startDate ? new Date(startDate) : null;
        if(start) start.setHours(0,0,0,0);
        const end = endDate ? new Date(endDate) : null;
        if(end) end.setHours(0,0,0,0);

        const matchesStartDate = !start || lrDate >= start;
        const matchesEndDate = !end || lrDate <= end;
        const matchesCustomer = selectedCustomerId === '' ||
          lr.consignor?._id === selectedCustomerId ||
          lr.consignee?._id === selectedCustomerId;
        
        // Handle status filtering including the special "unbilled" case
        let matchesStatus = true;
        if (selectedStatus.length > 0) {
          if (selectedStatus.includes(LorryReceiptStatus.UNBILLED)) {
            // If "Unbilled" is selected, show LRs that are not in any invoice
            matchesStatus = !invoicedLrIds.has(lr._id);
          } else {
            // For other statuses, use normal status matching
            matchesStatus = selectedStatus.includes(lr.status);
          }
        }
        
        const matchesId = !initialFilters?.ids || initialFilters.ids.includes(lr._id);

        return matchesSearch && matchesStartDate && matchesEndDate && matchesCustomer && matchesStatus && matchesId;
      })
      .sort((a, b) => b.lrNumber - a.lrNumber); // Sort by new sequential ID
  }, [lorryReceipts, invoices, searchTerm, startDate, endDate, selectedCustomerId, selectedStatus, initialFilters]);

  // Paginated LRs
  const paginatedLrs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLrs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLrs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredLrs.length / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, selectedCustomerId, selectedStatus]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedCustomerId('');
    setSelectedStatus([]);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8">

       {previewItem && (
        <PreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          companyInfo={companyInfo}
        />
      )}
      <Card>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Lorry Receipts</h2>
            <div className="space-x-2">
              <Button onClick={() => onViewChange({ name: 'CREATE_LR' })}>Create New Lorry Receipt</Button>
              <Button onClick={onBack} variant="secondary">Back to Dashboard</Button>
            </div>
        </div>
        
        <FilterSection onClearFilters={handleClearFilters}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Input
              type="text"
              label="Search by LR No, Client, From, To..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              wrapperClassName="lg:col-span-3"
              placeholder="Enter LR number, client name, from/to location..."
            />
            <Input 
              label="Start Date" 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              placeholder="Select start date"
            />
            <Input 
              label="End Date" 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              placeholder="Select end date"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
             <Select
                label="Client"
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
              >
                <option value="">All Clients</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Select>
             <Select
                label="LR Status"
                value={selectedStatus.length > 0 ? selectedStatus[0] : ''}
                onChange={e => setSelectedStatus(e.target.value ? [e.target.value as LorryReceiptStatus] : [])}
              >
                <option value="">All Statuses</option>
                {Object.values(LorryReceiptStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
          </div>
        </FilterSection>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LR No.</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consignor</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consignee</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From / To</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedLrs.map(lr => (
                <tr key={lr._id} onClick={() => setPreviewItem({ type: 'LR', data: lr })} className="hover:bg-slate-50 transition-colors duration-200 cursor-pointer">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{lr.lrNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(lr.date)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{lr.consignor?.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{lr.consignee?.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{lr.from} to {lr.to}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">₹{(lr.totalAmount || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <select
                      value={lr.status}
                      onClick={e => e.stopPropagation()}
                      onChange={(e) => onUpdateLrStatus(lr._id, e.target.value as LorryReceiptStatus)}
                      className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${statusColors[lr.status]} border-0 bg-opacity-80 focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 focus:outline-none`}
                    >
                      {Object.values(LorryReceiptStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {[LorryReceiptStatus.CREATED, LorryReceiptStatus.IN_TRANSIT, LorryReceiptStatus.DELIVERED].includes(lr.status) && (
                        <button onClick={(e) => { e.stopPropagation(); onViewChange({ name: 'CREATE_INVOICE_FROM_LR', lrId: lr._id }); }} className="text-blue-600 hover:text-blue-900 transition-colors">Create Invoice</button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onViewChange({ name: 'VIEW_LR', id: lr._id }); }} className="text-indigo-600 hover:text-indigo-900 transition-colors">View PDF</button>
                    <button onClick={(e) => { e.stopPropagation(); onViewChange({ name: 'EDIT_LR', id: lr._id }); }} className="text-green-600 hover:text-green-900 transition-colors">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteLr(lr._id); }} className="text-red-600 hover:text-red-900 transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredLrs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      </Card>
    </div>
  );
};
