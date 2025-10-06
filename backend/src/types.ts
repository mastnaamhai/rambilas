export enum LorryReceiptStatus {
  CREATED = 'Created',
  IN_TRANSIT = 'In Transit',
  DELIVERED = 'Delivered',
  INVOICED = 'Invoiced',
  PAID = 'Paid',
  UNBILLED = 'Unbilled',
}

export enum GstPayableBy {
  CONSIGNOR = 'Consignor',
  CONSIGNEE = 'Consignee',
  TRANSPORTER = 'Transporter',
}

export enum GstType {
    CGST_SGST = 'CGST/SGST',
    IGST = 'IGST',
}

export enum InvoiceStatus {
    UNPAID = 'Unpaid',
    PARTIALLY_PAID = 'Partially Paid',
    PAID = 'Paid',
}

export enum THNStatus {
    UNPAID = 'Unpaid',
    PARTIALLY_PAID = 'Partially Paid',
    PAID = 'Paid',
}

export enum PaymentType {
    ADVANCE = 'Advance',
    RECEIPT = 'Receipt',
    PAYMENT = 'Payment',
}

export enum PaymentMode {
    CASH = 'Cash',
    CHEQUE = 'Cheque',
    NEFT = 'NEFT',
    RTGS = 'RTGS',
    UPI = 'UPI',
}

export enum RiskBearer {
    TRANSPORTER = 'Transporter',
    CARRIER = 'Carrier',
    OWNER = 'Owner',
    CONSIGNOR = 'Consignor',
}

export interface Customer {
  _id: string;
  name: string; // Legal Name of Business
  tradeName?: string;
  address: string;
  state: string;
  gstin?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  city?: string;
  pin?: string;
  phone?: string;
  email?: string;
}


export interface LorryReceipt {
  _id: string;
  lrNumber: number;
  date: string;
  reportingDate?: string;
  deliveryDate?: string;
  consignorId: string;
  consignor?: Customer;
  consigneeId: string;
  consignee?: Customer;
  vehicleNumber: string;
  from: string;
  to: string;
  packages: {
    count: number;
    packingMethod: string;
    description: string;
    actualWeight: number;
    chargedWeight: number;
  }[];
  charges: {
    freight: number;
    aoc: number;
    hamali: number;
    bCh: number;
    trCh: number;
    detentionCh: number;
  };
  totalAmount: number;
  eWayBillNo: string;
  valueGoods: number;
  gstPayableBy: GstPayableBy;
  riskBearer: RiskBearer;
  status: LorryReceiptStatus;
  insurance: {
      hasInsured: boolean;
      company?: string;
      policyNo?: string;
      date?: string;
      amount?: number;
      risk?: string;
  },
  invoiceNo: string;
  sealNo: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: number;
  date: string;
  customerId: string;
  customer?: Customer;
  lorryReceipts: LorryReceipt[];
  totalAmount: number;
  remarks: string;
  gstType: GstType;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
  isRcm: boolean;
  isManualGst: boolean;
  status: InvoiceStatus;
}

export interface CompanyInfo {
    name: string;
    address: string;
    state: string;
    phone1: string;
    phone2: string;
    email: string;
    website: string;
    gstin: string;
    pan: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
}

export interface Payment {
    _id: string;
    invoiceId?: string;
    invoice?: Invoice;
    truckHiringNoteId?: string;
    truckHiringNote?: TruckHiringNote;
    customerId: string;
    customer?: Customer;
    date: string;
    amount: number;
    type: PaymentType;
    mode: PaymentMode;
    referenceNo?: string;
    notes?: string;
}

export interface TruckHiringNote {
  _id: string;
  thnNumber: number;
  date: string;
  truckNumber: string;
  truckType: string;
  vehicleCapacity: number;
  loadingLocation: string;
  unloadingLocation: string;
  loadingDateTime: string;
  expectedDeliveryDate: string;
  goodsType: string;
  agencyName: string;
  truckOwnerName: string;
  truckOwnerContact?: string;
  freightRate: number;
  freightRateType: 'per_trip' | 'per_ton' | 'per_km';
  advanceAmount: number;
  balanceAmount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other';
  paymentTerms: string;
  additionalCharges?: number;
  remarks?: string;
  linkedLR?: string;
  linkedInvoice?: string;
  status: THNStatus;
  paidAmount: number;
  payments: Payment[];
}

// Additional types for components
export interface PromissoryNote {
  _id: string;
  noteNumber: number;
  date: string;
  customerId: string;
  customer?: Customer;
  amount: number;
  dueDate: string;
  status: 'Pending' | 'Paid' | 'Overdue';
  remarks?: string;
}

export interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
}

export interface TruckRental {
  _id: string;
  rentalNumber: number;
  date: string;
  supplierId: string;
  supplier?: Supplier;
  vehicleNumber: string;
  rentalType: 'Daily' | 'Monthly' | 'Trip';
  rate: number;
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Completed' | 'Cancelled';
  remarks?: string;
}

export interface SupplierPayment {
  _id: string;
  paymentNumber: number;
  supplierId: string;
  supplier?: Supplier;
  truckRentalId?: string;
  truckRental?: TruckRental;
  date: string;
  amount: number;
  mode: PaymentMode;
  referenceNo?: string;
  remarks?: string;
}

export enum RentalType {
  DAILY = 'Daily',
  MONTHLY = 'Monthly',
  TRIP = 'Trip',
}
