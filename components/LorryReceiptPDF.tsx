import React, { useState, useEffect } from 'react';
import type { LorryReceipt, CompanyInfo, RiskBearer } from '../types';
import { generateMultiPagePdf, printDocument } from '../services/pdfService';
import { Button } from './ui/Button';
import { Logo } from './ui/Logo';
import { PrintStyles } from './ui/PrintStyles';
import { PDFViewer, usePDFViewer } from './ui/PDFViewer';
import { PDFActionBar } from './ui/PDFActionBar';
import { formatDate, numberToWords } from '../services/utils';
import { Card } from './ui/Card';
import { BottomSheet } from './ui/BottomSheet';
import { LorryReceiptCopySelector, CopySelection } from './ui/LorryReceiptCopySelector';
import { MobileActionButton } from './ui/MobileActionButton';
import { MobilePDFStyles } from './ui/MobilePDFStyles';
import { LorryReceiptCopyTabs } from './ui/LorryReceiptCopyTabs';
import { LorryReceiptCopyPreview } from './ui/LorryReceiptCopyPreview';

interface LorryReceiptPDFProps {
  lorryReceipt: LorryReceipt;
  companyInfo: CompanyInfo;
  onBack: () => void;
}

interface LorryReceiptViewProps {
    lorryReceipt: LorryReceipt;
    companyInfo: CompanyInfo;
    copyType?: string;
    hideCharges?: boolean;
}

const copyTypes = [
  'Original for Consignor',
  'Duplicate for Transporter',
  'Triplicate for Consignee',
  'Office Copy'
];

export const LorryReceiptView: React.FC<LorryReceiptViewProps> = ({ lorryReceipt, companyInfo, copyType = 'PREVIEW', hideCharges = true }) => {
    const { consignor, consignee } = lorryReceipt;

    const charges = [
        { label: 'Freight', value: lorryReceipt.charges?.freight || 0 },
        { label: 'AOC', value: lorryReceipt.charges?.aoc || 0 },
        { label: 'Hamali', value: lorryReceipt.charges?.hamali || 0 },
        { label: 'B. Ch.', value: lorryReceipt.charges?.bCh || 0 },
        { label: 'Tr. Ch.', value: lorryReceipt.charges?.trCh || 0 },
        { label: 'Detention Ch.', value: lorryReceipt.charges?.detentionCh || 0 },
    ];

    // Determine if this is a copy (not original)
    const isCopy = copyType && !copyType.includes('ORIGINAL') && copyType !== 'PREVIEW';

    return (
        <div className="bg-white p-4 text-xs font-mono break-inside-avoid shadow-lg relative" style={{ width: '210mm', minHeight:'297mm', fontFamily: 'monospace', lineHeight: '1.2' }}>
            {/* Watermark for copies */}
            {isCopy && (
                <div className="absolute inset-0 pointer-events-none z-10">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="text-6xl font-bold text-gray-300 opacity-30 transform rotate-45 select-none">
                            {copyType.toUpperCase()}
                        </div>
                    </div>
                </div>
            )}

            <div className="border-2 border-black p-2 relative z-20">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-2">
                    {/* Left - Logo */}
                    <div className="flex items-center">
                        <Logo
                            size="xl"
                            showText={false}
                            companyLogo={companyInfo.logo}
                            companyName={companyInfo.name}
                        />
                    </div>
                    
                    {/* Center - Religious Invocations and Company Name */}
                    <div className="flex-grow text-center">
                        <div className="mb-1">
                            <p className="text-sm font-semibold italic">!! Jai Bajarang Bali !!</p>
                            <p className="text-sm font-semibold italic">!! Jai Dada Nath !!</p>
                        </div>
                        <h1 className="text-4xl font-bold tracking-wider text-red-600 mb-1">{companyInfo.name}</h1>
                        <p className="text-sm">{companyInfo.address}</p>
                        <p className="text-sm">E-mail: {companyInfo.email} / Web.: {companyInfo.website}</p>
                    </div>
                    
                    {/* Right - Contact Numbers */}
                    <div className="text-right text-sm whitespace-nowrap">
                        <p className="font-semibold">Mob.: {companyInfo.phone1}</p>
                        <p className="font-semibold">{companyInfo.phone2}</p>
                    </div>
                </div>

                {/* Sub-Header Section - 3 Column Grid */}
                <div className="grid grid-cols-3 gap-1 mb-1">
                    {/* Left Box - Demurrage Charges */}
                    <div className="border border-black p-1">
                        <h3 className="font-bold text-center underline text-xs">SCHEDULE OF DEMURRAGE CHARGES</h3>
                        <p className="text-[8px] text-gray-600">Demurrage chargeable after 15 days from today @ Rs.1/- per day per Quintal on weight charged.</p>
                    </div>

                    {/* Center Box - Copy Type and Risk Declaration */}
                    <div className="border border-black p-1">
                        <h3 className="font-bold text-center text-red-600 text-sm mb-2">CONSIGNEE COPY</h3>
                        <div className="mb-2">
                            <p className="text-xs font-bold">AT CARRIER'S / OWNER'S RISK</p>
                            <p className="text-[8px] text-gray-600">(Delete Whichever is inapplicable)</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold">INSURANCE</p>
                            <p className="text-[8px]">The Customer has stated that:</p>
                            <div className="text-[8px] space-y-1">
                                <p>□ He has not insured the Consignment</p>
                                <p>□ He has insured the Consignment OR</p>
                                <p>Company: _________________</p>
                                <p>Policy No: _______________</p>
                                <p>Date: ___________________</p>
                                <p>Amount: _________________</p>
                                <p>Risk: ___________________</p>
                                <p>Invoice No.: _____________</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Box - PAN/GSTIN and Caution */}
                    <div className="border border-black p-1">
                        <div className="text-center mb-2">
                            <p className="text-[10px]">PAN No.: {companyInfo.pan}</p>
                            <p className="text-[10px]">GSTIN: {companyInfo.gstin}</p>
                        </div>
                        <div className="border border-gray-400 p-1">
                            <h3 className="font-bold text-center underline text-xs">CAUTION</h3>
                            <p className="text-[8px] text-gray-600">This Consignment will not be detained, diverted, re-routed or re-booked without Consignee Bank's written permission. We will be delivered at the destination.</p>
                        </div>
                    </div>
                </div>

                {/* Information Boxes Section - 3 Column Grid */}
                <div className="grid grid-cols-3 gap-1 mb-1">
                    {/* Left Box - Notice */}
                    <div className="border border-black p-1">
                        <h3 className="font-bold text-center underline text-xs">NOTICE</h3>
                        <p className="text-[8px] text-gray-600">The consignments covered by this Lorry Receipt shall be stored at the destination under the control of the Transport Operator and shall be delivered to or to the order of the Consignee Bank whose name is mentioned in the Lorry Receipt. It will under no circumstances by delivered to anyone without the written authority from the Consignee Bank or its order, endorsed on the Consignee copy or on a separate letter of Authority.</p>
                    </div>

                    {/* Center Box - Risk Declaration */}
                    <div className="border border-black p-1">
                        <h3 className="font-bold text-center underline text-xs">RISK DECLARATION</h3>
                        <p className="text-[8px] text-gray-600">Goods are accepted for carriage at owner's risk. Please ensure proper insurance coverage for your consignment.</p>
                    </div>

                    {/* Right Box - Caution */}
                    <div className="border border-black p-1">
                        <h3 className="font-bold text-center underline text-xs">CAUTION</h3>
                        <p className="text-[8px] text-gray-600">This Consignment will not be detained, diverted, re-routed or re-booked without Consignee Bank's written permission. We will be delivered at the destination.</p>
                    </div>
                </div>

                {/* Main Body Section - 5 Column Grid (3+2 split) */}
                <div className="grid grid-cols-5 gap-1 mb-1">
                    {/* Left Side - Consignment Note and Addresses (3 columns) */}
                    <div className="col-span-3">
                        {/* Consignment Note */}
                        <div className="border border-black p-1 mb-1">
                            <h3 className="font-bold text-center underline text-xs">CONSIGNMENT NOTE</h3>
                            <p className="text-center text-lg font-bold">No. {lorryReceipt.lrNumber}</p>
                            <p className="text-center text-sm">Date: {formatDate(lorryReceipt.date)}</p>
                        </div>
                        
                        {/* Consignor's Name & Address */}
                        <div className="border border-black p-1 mb-1">
                            <h3 className="font-bold text-center underline text-xs">CONSIGNOR'S NAME & ADDRESS</h3>
                            <div className="text-[10px] space-y-1">
                                <p><strong>Name:</strong> {consignor?.name || 'N/A'}</p>
                                <p><strong>Address:</strong> {consignor?.address || 'N/A'}</p>
                                <p><strong>City:</strong> {consignor?.city || 'N/A'}</p>
                                <p><strong>State:</strong> {consignor?.state || 'N/A'}</p>
                                <p><strong>PIN:</strong> {consignor?.pin || 'N/A'}</p>
                                <p><strong>Phone:</strong> {consignor?.phone || 'N/A'}</p>
                                <p><strong>GSTIN:</strong> {consignor?.gstin || 'N/A'}</p>
                            </div>
                        </div>
                        
                        {/* Consignee's Name & Address */}
                        <div className="border border-black p-1">
                            <h3 className="font-bold text-center underline text-xs">CONSIGNEE'S NAME & ADDRESS</h3>
                            <div className="text-[10px] space-y-1">
                                <p><strong>Name:</strong> {consignee?.name || 'N/A'}</p>
                                <p><strong>Address:</strong> {consignee?.address || 'N/A'}</p>
                                <p><strong>City:</strong> {consignee?.city || 'N/A'}</p>
                                <p><strong>State:</strong> {consignee?.state || 'N/A'}</p>
                                <p><strong>PIN:</strong> {consignee?.pin || 'N/A'}</p>
                                <p><strong>Phone:</strong> {consignee?.phone || 'N/A'}</p>
                                <p><strong>GSTIN:</strong> {consignee?.gstin || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - GST, Insurance, and Route Details (2 columns) */}
                    <div className="col-span-2">
                        {/* GST Payable By */}
                        <div className="border border-black p-1 mb-1">
                            <h3 className="font-bold text-center underline text-xs">GST PAYABLE BY</h3>
                            <div className="text-[10px] space-y-1">
                                <p>□ Consignor ( )</p>
                                <p>□ Consignee ( )</p>
                                <p>□ Transporter ( )</p>
                            </div>
                        </div>
                        
                        {/* Insurance Details */}
                        <div className="border border-black p-1 mb-1">
                            <h3 className="font-bold text-center underline text-xs">INSURANCE DETAILS</h3>
                            <div className="text-[8px] space-y-1">
                                <p>Company: {lorryReceipt.insurance?.company || '_________________'}</p>
                                <p>Policy No: {lorryReceipt.insurance?.policyNo || '_________________'}</p>
                                <p>Date: {lorryReceipt.insurance?.date || '_________________'}</p>
                                <p>Amount: {lorryReceipt.insurance?.amount || '_________________'}</p>
                                <p>Risk: {lorryReceipt.insurance?.risk || '_________________'}</p>
                                <p>Invoice No: {lorryReceipt.insurance?.invoiceNo || '_________________'}</p>
                            </div>
                        </div>
                        
                        {/* Seal No */}
                        <div className="border border-black p-1 mb-1">
                            <h3 className="font-bold text-center underline text-xs">SEAL NO.</h3>
                            <p className="text-center text-sm">{lorryReceipt.sealNo || 'N/A'}</p>
                        </div>
                        
                        {/* Vehicle No */}
                        <div className="border border-black p-1 mb-1">
                            <h3 className="font-bold text-center underline text-xs">VEHICLE NO.</h3>
                            <p className="text-center text-sm">{lorryReceipt.vehicleNumber}</p>
                        </div>
                        
                        {/* From */}
                        <div className="border border-black p-1 mb-1">
                            <h3 className="font-bold text-center underline text-xs">FROM</h3>
                            <p className="text-center text-sm">{lorryReceipt.from}</p>
                        </div>
                        
                        {/* To */}
                        <div className="border border-black p-1">
                            <h3 className="font-bold text-center underline text-xs">TO</h3>
                            <p className="text-center text-sm">{lorryReceipt.to}</p>
                        </div>
                    </div>
                </div>



                {/* Packages and Charges Tables Section */}
                <div className="grid grid-cols-12 gap-1 mb-1">
                    {/* Left Side - Packages Table */}
                    <div className="col-span-8">
                        {/* Package Table Header */}
                        <div className="grid grid-cols-6 text-center font-bold border-2 border-black bg-gray-50 h-[3.5rem]">
                            <div className="col-span-1 border-r border-black p-2 flex items-center justify-center text-xs">No. of Pkgs.</div>
                            <div className="col-span-1 border-r border-black p-2 flex items-center justify-center text-xs">Method of Packing</div>
                            <div className="col-span-1 border-r border-black p-2 flex items-center justify-center text-xs">DESCRIPTION (Said to Contain)</div>
                            <div className="col-span-1 border-r border-black p-2 flex items-center justify-center text-xs">WEIGHT</div>
                            <div className="col-span-1 border-r border-black p-2 flex items-center justify-center text-xs">Actual</div>
                            <div className="col-span-1 p-2 flex items-center justify-center text-xs">Charged</div>
                        </div>

                        {/* Package Table Body */}
                        <div className="min-h-[5rem] border-l-2 border-r-2 border-b-2 border-black">
                            {lorryReceipt.packages && lorryReceipt.packages.length > 0 ? (
                                lorryReceipt.packages.map((pkg, index) => (
                                    <div key={index} className="grid grid-cols-6 border-b border-black h-[2.5rem] items-center hover:bg-gray-50 last:border-b-0">
                                        <div className="col-span-1 border-r border-black p-2 text-center h-full flex items-center justify-center text-xs">{pkg.count || ''}</div>
                                        <div className="col-span-1 border-r border-black p-2 text-center h-full flex items-center justify-center text-xs">{pkg.packingMethod || ''}</div>
                                        <div className="col-span-1 border-r border-black p-2 text-center h-full flex items-center justify-center text-xs">{pkg.description || ''}</div>
                                        <div className="col-span-1 border-r border-black p-2 text-center h-full flex items-center justify-center text-xs"></div>
                                        <div className="col-span-1 border-r border-black p-2 text-center h-full flex items-center justify-center text-xs">{pkg.actualWeight || ''}</div>
                                        <div className="col-span-1 p-2 text-center h-full flex items-center justify-center text-xs">{pkg.chargedWeight || ''}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="grid grid-cols-6 h-[2.5rem] items-center">
                                    <div className="col-span-1 border-r border-black h-full"></div>
                                    <div className="col-span-1 border-r border-black h-full"></div>
                                    <div className="col-span-1 border-r border-black h-full"></div>
                                    <div className="col-span-1 border-r border-black h-full"></div>
                                    <div className="col-span-1 border-r border-black h-full"></div>
                                    <div className="col-span-1 h-full"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side - Charges Table */}
                    {!hideCharges && (
                        <div className="col-span-4">
                            {/* Charges Header */}
                            <div className="grid grid-cols-4 text-center font-bold border-2 border-black bg-gray-50 h-[3.5rem]">
                                <div className="col-span-2 border-r border-black p-2 flex items-center justify-center">RATE</div>
                                <div className="col-span-2 p-2 text-xs flex items-center justify-center">AMOUNT TO PAY / PAID</div>
                            </div>
                            {/* Charges Sub Header */}
                            <div className="grid grid-cols-4 text-center font-bold border-b border-black bg-gray-50 h-[2.5rem]">
                                <div className="col-span-2 border-r border-black p-2 text-xs flex items-center justify-center"></div>
                                <div className="col-span-1 border-r border-black p-2 text-xs flex items-center justify-center">Rs.</div>
                                <div className="col-span-1 p-2 text-xs flex items-center justify-center">P.</div>
                            </div>
                            {/* Charges Body */}
                            <div className="min-h-[5rem] border-l-2 border-r-2 border-b-2 border-black">
                                {charges.filter(charge => charge.value > 0).map(charge => (
                                    <div key={charge.label} className="grid grid-cols-4 border-b border-black h-[2.5rem] items-center hover:bg-gray-50 last:border-b-0">
                                        <div className="col-span-2 border-r border-black pl-2 h-full flex items-center text-xs">{charge.label}</div>
                                        <div className="col-span-1 border-r border-black pr-2 text-right h-full flex items-center text-xs">{charge.value.toFixed(2)}</div>
                                        <div className="col-span-1 h-full"></div>
                                    </div>
                                ))}
                                {/* Show empty row if no charges */}
                                {charges.filter(charge => charge.value > 0).length === 0 && (
                                    <div className="grid grid-cols-4 h-[2.5rem] items-center">
                                        <div className="col-span-2 border-r border-black h-full"></div>
                                        <div className="col-span-1 border-r border-black h-full"></div>
                                        <div className="col-span-1 h-full"></div>
                                    </div>
                                )}
                            </div>
                            {/* Charges Total */}
                            <div className="grid grid-cols-4 font-bold border-2 border-black bg-gray-100">
                                <div className="col-span-2 border-r border-black p-2 text-xs">TOTAL</div>
                                <div className="col-span-1 border-r border-black p-2 text-right text-xs">{(lorryReceipt.totalAmount || 0).toFixed(2)}</div>
                                <div className="col-span-1 p-2"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="grid grid-cols-12 gap-1 mt-2">
                    {/* Left Side - E-Way Bill and Value */}
                    <div className="col-span-6">
                        <div className="grid grid-cols-2 gap-1 mb-1">
                            <div className="border border-black p-1">
                                <h3 className="font-bold text-xs underline">E-WAY BILL NO.</h3>
                                <p className="text-[10px]">{lorryReceipt.eWayBillNo || 'N/A'}</p>
                            </div>
                            <div className="border border-black p-1">
                                <h3 className="font-bold text-xs underline">VALUE OF GOODS Rs.</h3>
                                <p className="text-[10px]">{lorryReceipt.valueGoods || 0}</p>
                            </div>
                        </div>
                        <div className="text-[8px] text-gray-500 italic">
                            <p>Goods accepted for carriage on the terms and conditions printed overleaf.</p>
                        </div>
                    </div>
                    
                    {/* Right Side - Signature */}
                    <div className="col-span-6 flex flex-col justify-end items-center">
                        <p className="font-bold mt-8 pt-4 border-t-2 border-black w-full text-center">Signature of the Transport Operator</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export const LorryReceiptPDF: React.FC<LorryReceiptPDFProps> = ({ lorryReceipt, companyInfo, onBack }) => {
    return (
        <LorryReceiptCopyPreview
            lorryReceipt={lorryReceipt}
            companyInfo={companyInfo}
            onBack={onBack}
        />
    );
}

