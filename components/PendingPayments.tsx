import React, { useMemo, useState } from 'react';
import type { Invoice, Payment } from '../types';
import { InvoiceStatus } from '../types';
import { formatDate } from '../services/utils';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { UniversalPaymentForm } from './UniversalPaymentForm';
import type { View } from '../App';

interface PendingPaymentsProps {
  invoices: Invoice[];
  onSavePayment: (payment: Omit<Payment, '_id' | 'customer' | 'invoice'>) => Promise<void>;
  onBack: () => void;
  onViewChange: (view: View) => void;
}

export const PendingPayments: React.FC<PendingPaymentsProps> = ({ invoices, onSavePayment, onBack, onViewChange }) => {
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const pendingInvoices = useMemo(() => {
    return invoices
      .filter(inv => inv.status === InvoiceStatus.UNPAID || inv.status === InvoiceStatus.PARTIALLY_PAID)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [invoices]);

  const handleOpenPaymentForm = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {isPaymentFormOpen && selectedInvoice && (
        <UniversalPaymentForm
          invoiceId={selectedInvoice._id}
          customerId={selectedInvoice.customerId}
          grandTotal={selectedInvoice.grandTotal}
          balanceDue={selectedInvoice.balanceDue || selectedInvoice.grandTotal}
          onSave={onSavePayment}
          onClose={() => setIsPaymentFormOpen(false)}
          title={`Add Payment for Invoice #${selectedInvoice.invoiceNumber}`}
        />
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Pending Payments</h2>
        <Button variant="secondary" onClick={onBack}>Back</Button>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance Due</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingInvoices.map(invoice => (
                <tr 
                  key={invoice._id} 
                  className="hover:bg-slate-50 cursor-pointer transition-colors duration-200"
                  onClick={() => onViewChange({ name: 'VIEW_INVOICE', id: invoice._id })}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{`INV-${invoice.invoiceNumber}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(invoice.date)}</td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-red-600">₹{(invoice.balanceDue || invoice.grandTotal).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-center text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      invoice.status === InvoiceStatus.UNPAID ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                   <td className="px-6 py-4 text-right text-sm">
                      <Button 
                        variant="secondary" 
                        onClick={(e) => { e.stopPropagation(); handleOpenPaymentForm(invoice); }}
                      >
                        Add Payment
                      </Button>
                   </td>
                </tr>
              ))}
              {pendingInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">No pending payments.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
