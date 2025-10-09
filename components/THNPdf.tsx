import React, { useState } from 'react';
import type { TruckHiringNote, CompanyInfo } from '../types';
import { generateDocumentPdf, printDocument } from '../services/pdfService';
import { Button } from './ui/Button';
import { Logo } from './ui/Logo';
import { PrintStyles } from './ui/PrintStyles';
import { PDFViewer, usePDFViewer } from './ui/PDFViewer';
import { PDFActionBar } from './ui/PDFActionBar';
import { formatDate } from '../services/utils';

interface THNPdfProps {
    thn: TruckHiringNote;
    companyInfo: CompanyInfo;
    onBack: () => void;
}

export const THNPdf: React.FC<THNPdfProps> = ({ thn, companyInfo, onBack }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const { openViewer, PDFViewerComponent } = usePDFViewer();

    const handleGeneratePdf = async () => {
        setIsGenerating(true);
        try {
            await generateDocumentPdf(
                'thn-pdf-container', 
                'truck-hiring-note', 
                thn.thnNumber,
                thn.date
            );
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrint = async () => {
        setIsPrinting(true);
        try {
            await printDocument('thn-pdf-container', {
                orientation: 'portrait',
                scale: 'fit',
                margins: 'minimum'
            });
        } catch (error) {
            console.error('Print failed:', error);
            alert('Failed to print. Please try again.');
        } finally {
            setIsPrinting(false);
        }
    };

    const handleViewPdf = async () => {
        try {
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            if (printWindow) {
                const element = document.getElementById('thn-pdf-container');
                if (element) {
                    const clonedElement = element.cloneNode(true) as HTMLElement;
                    printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                            <head>
                                <title>Truck Hiring Note ${thn.thnNumber}</title>
                                <style>
                                    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                                    @page { size: A4 portrait; margin: 0.5in; }
                                </style>
                            </head>
                            <body>
                                ${clonedElement.outerHTML}
                            </body>
                        </html>
                    `);
                    printWindow.document.close();
                }
            }
        } catch (error) {
            console.error('PDF view failed:', error);
            alert('Failed to open PDF viewer. Please try downloading instead.');
        }
    };

    return (
        <div className="space-y-6">
            <PrintStyles documentType="truck-hiring-note" orientation="portrait" />
            <div className="flex justify-between items-center no-print print-controls">
                <h2 className="text-3xl font-bold text-gray-800">Truck Hiring Note #{thn.thnNumber}</h2>
                <PDFActionBar
                    fileName={`THN-${thn.thnNumber}`}
                    onView={handleViewPdf}
                    onPrint={handlePrint}
                    onDownload={handleGeneratePdf}
                    onBack={onBack}
                    isGenerating={isGenerating}
                    isPrinting={isPrinting}
                />
            </div>

            <div id="thn-pdf-container" className="print-container">
                <div id="thn-pdf" className="bg-white p-8 text-sm font-sans shadow-2xl" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'sans-serif', lineHeight: '1.5', margin: '0 auto', border: '1px solid #e5e7eb' }}>
                    <style>{`
                        @media print {
                            .thn-pdf {
                                page-break-inside: avoid;
                                font-size: 12px;
                                width: 100%;
                                box-shadow: none;
                                border: none;
                            }
                            .thn-pdf .section {
                                margin-bottom: 16px;
                            }
                            .thn-pdf .grid-2 {
                                display: grid;
                                grid-template-columns: 1fr 1fr;
                                gap: 20px;
                            }
                            .thn-pdf .grid-3 {
                                display: grid;
                                grid-template-columns: 1fr 1fr 1fr;
                                gap: 16px;
                            }
                            .thn-pdf .grid-4 {
                                display: grid;
                                grid-template-columns: 1fr 1fr 1fr 1fr;
                                gap: 12px;
                            }
                            .thn-pdf .border-section {
                                border: 2px solid #e5e7eb;
                                border-radius: 8px;
                                padding: 16px;
                                margin-bottom: 12px;
                                background: #fafafa;
                            }
                            .thn-pdf .header-bg {
                                background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1d4ed8 100%);
                                color: white;
                                padding: 24px;
                                border-radius: 12px;
                                margin-bottom: 24px;
                                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                            }
                            .thn-pdf .info-row {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 8px 0;
                                border-bottom: 1px solid #e5e7eb;
                                transition: background-color 0.2s;
                            }
                            .thn-pdf .info-row:hover {
                                background-color: #f8fafc;
                            }
                            .thn-pdf .info-row:last-child {
                                border-bottom: none;
                            }
                            .thn-pdf .label {
                                font-weight: 700;
                                color: #374151;
                                min-width: 140px;
                                font-size: 13px;
                            }
                            .thn-pdf .value {
                                color: #111827;
                                text-align: right;
                                font-weight: 500;
                            }
                            .thn-pdf .amount {
                                font-weight: 800;
                                color: #059669;
                                font-size: 14px;
                            }
                            .thn-pdf .balance {
                                font-weight: 800;
                                color: #dc2626;
                                font-size: 14px;
                            }
                            .thn-pdf .section-title {
                                font-size: 16px;
                                font-weight: 800;
                                color: #1f2937;
                                margin-bottom: 12px;
                                padding-bottom: 8px;
                                border-bottom: 3px solid #3b82f6;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                            }
                            .thn-pdf .highlight-box {
                                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                                border: 2px solid #0ea5e9;
                                border-radius: 8px;
                                padding: 16px;
                                margin: 12px 0;
                            }
                            .thn-pdf .signature-section {
                                background: #f8fafc;
                                border: 2px dashed #cbd5e1;
                                border-radius: 8px;
                                padding: 20px;
                                text-align: center;
                            }
                            .thn-pdf .signature-line {
                                height: 2px;
                                background: #374151;
                                margin: 8px 0;
                            }
                            .no-break {
                                page-break-inside: avoid;
                            }
                            .thn-pdf .company-logo {
                                filter: brightness(0) invert(1);
                            }
                        }
                    `}</style>
                
                {/* Professional Header */}
                <div className="header-bg text-center">
                    <div className="flex justify-center items-center mb-4">
                        <Logo 
                            size="lg" 
                            showText={true} 
                            className="justify-center company-logo"
                            companyLogo={companyInfo?.logo}
                            companyName={companyInfo?.name}
                        />
                    </div>
                    <h1 className="text-3xl font-black mb-3 tracking-wide">TRUCK HIRING NOTE</h1>
                    <div className="flex justify-center space-x-12 text-base">
                        <div className="bg-white/20 px-4 py-2 rounded-lg">
                            <span className="font-semibold">THN No: </span>
                            <span className="font-black text-lg">#{thn.thnNumber}</span>
                        </div>
                        <div className="bg-white/20 px-4 py-2 rounded-lg">
                            <span className="font-semibold">Date: </span>
                            <span className="font-black text-lg">{formatDate(thn.date)}</span>
                        </div>
                    </div>
                </div>

                {/* Compact Layout - All sections in one page */}
                <div className="grid-2 no-break">
                    {/* Vehicle & Trip Information */}
                    <div className="border-section">
                        <div className="section-title">🚛 Vehicle & Trip Details</div>
                        <div className="info-row">
                            <span className="label">Truck Number:</span>
                            <span className="value">{thn.truckNumber}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Truck Type:</span>
                            <span className="value">{thn.truckType}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Capacity:</span>
                            <span className="value">{thn.vehicleCapacity} tons</span>
                        </div>
                        <div className="info-row">
                            <span className="label">From:</span>
                            <span className="value">{thn.loadingLocation}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">To:</span>
                            <span className="value">{thn.unloadingLocation}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Loading Date:</span>
                            <span className="value">{formatDate(thn.loadingDateTime)}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Expected Delivery:</span>
                            <span className="value">{formatDate(thn.expectedDeliveryDate)}</span>
                        </div>
                    </div>

                    {/* Party & Cargo Information */}
                    <div className="border-section">
                        <div className="section-title">👥 Party & Cargo Details</div>
                        <div className="info-row">
                            <span className="label">Agency Name:</span>
                            <span className="value">{thn.agencyName}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Owner Name:</span>
                            <span className="value">{thn.truckOwnerName}</span>
                        </div>
                        {thn.truckOwnerContact && (
                            <div className="info-row">
                                <span className="label">Contact:</span>
                                <span className="value">{thn.truckOwnerContact}</span>
                            </div>
                        )}
                        <div className="info-row">
                            <span className="label">Goods Type:</span>
                            <span className="value">{thn.goodsType}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Payment Mode:</span>
                            <span className="value">{thn.paymentMode}</span>
                        </div>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="highlight-box no-break">
                    <div className="section-title">💰 Financial Summary</div>
                    <div className="grid-4">
                        <div className="info-row">
                            <span className="label">Freight Rate:</span>
                            <span className="value amount">₹{thn.freightRate.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Rate Type:</span>
                            <span className="value">{thn.freightRateType.replace('_', ' ')}</span>
                        </div>
                        {thn.additionalCharges > 0 && (
                            <div className="info-row">
                                <span className="label">Additional Charges:</span>
                                <span className="value amount">₹{thn.additionalCharges.toLocaleString('en-IN')}</span>
                            </div>
                        )}
                        <div className="info-row">
                            <span className="label">Advance Paid:</span>
                            <span className="value amount">₹{thn.advanceAmount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                    <div className="grid-2 mt-6 pt-6 border-t-4 border-blue-300">
                        <div className="info-row">
                            <span className="label text-xl font-black">Total Amount:</span>
                            <span className="value amount text-xl font-black">₹{(thn.freightRate + (thn.additionalCharges || 0)).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="info-row">
                            <span className="label text-xl font-black">Balance Amount:</span>
                            <span className="value balance text-xl font-black">₹{thn.balanceAmount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Terms & Additional Info */}
                <div className="grid-2 no-break">
                    <div className="border-section">
                        <div className="section-title">📋 Payment Terms</div>
                        <p className="text-sm text-gray-700 leading-relaxed">{thn.paymentTerms}</p>
                    </div>

                    {(thn.linkedLR || thn.linkedInvoice || thn.remarks) && (
                        <div className="border-section">
                            <div className="section-title">📝 Additional Information</div>
                            {thn.linkedLR && (
                                <div className="info-row">
                                    <span className="label">Linked LR:</span>
                                    <span className="value">{thn.linkedLR}</span>
                                </div>
                            )}
                            {thn.linkedInvoice && (
                                <div className="info-row">
                                    <span className="label">Linked Invoice:</span>
                                    <span className="value">{thn.linkedInvoice}</span>
                                </div>
                            )}
                            {thn.remarks && (
                                <div className="mt-2">
                                    <span className="label">Remarks:</span>
                                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">{thn.remarks}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Signatures */}
                <div className="grid-2 no-break mt-8">
                    <div className="signature-section">
                        <div className="section-title">✍️ Agency Signature</div>
                        <div className="signature-line"></div>
                        <div className="signature-line"></div>
                        <p className="text-base text-gray-700 mt-4 font-bold">{thn.agencyName}</p>
                        <p className="text-sm text-gray-500 mt-1">Authorized Signatory</p>
                    </div>
                    <div className="signature-section">
                        <div className="section-title">✍️ Truck Owner Signature</div>
                        <div className="signature-line"></div>
                        <div className="signature-line"></div>
                        <p className="text-base text-gray-700 mt-4 font-bold">{thn.truckOwnerName}</p>
                        <p className="text-sm text-gray-500 mt-1">Truck Owner</p>
                    </div>
                </div>
                </div>
            </div>
            <PDFViewerComponent />
        </div>
    );
};
