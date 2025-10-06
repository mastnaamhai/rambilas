import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Customer from '../models/customer';
import LorryReceipt from '../models/lorryReceipt';
import Invoice from '../models/invoice';
import TruckHiringNote from '../models/truckHiringNote';
import Payment from '../models/payment';
import Counter from '../models/counter';
import NumberingConfig from '../models/numbering';
import CompanyInfo from '../models/companyInfo';
import BankAccount from '../models/bankAccount';
import { backupDataSchema } from '../utils/validation';

export const resetData = asyncHandler(async (req: Request, res: Response) => {
  await Customer.deleteMany({});
  await LorryReceipt.deleteMany({});
  await Invoice.deleteMany({});
  await TruckHiringNote.deleteMany({});
  await Payment.deleteMany({});
  await Counter.deleteMany({});
  await NumberingConfig.deleteMany({});
  await BankAccount.deleteMany({});
  await CompanyInfo.deleteMany({});
  
  // Recreate company info with real company details
  await CompanyInfo.create({
    name: 'ALL INDIA LOGISTICS CHENNAI',
    address: 'No.51-C, Shri Balaji Nagar, Part-1 Extension, Puzhal, Chennai - 600 066.',
    state: 'Tamil Nadu',
    phone1: '97907 00241',
    phone2: '90030 45541',
    email: 'allindialogisticschennai@gmail.com',
    website: 'www.allindialogisticschennai.in',
    gstin: '33BKTPR6363P1Z3',
    pan: 'BKTPR6363P',
    bankName: 'ICICI BANK',
    accountNumber: '603505016293',
    ifsc: 'ICIC0006035'
  });
  
  res.status(200).json({ message: 'All data has been reset successfully.' });
});

export const backupData = asyncHandler(async (req: Request, res: Response) => {
  const customers = await Customer.find({});
  const lorryReceipts = await LorryReceipt.find({});
  const invoices = await Invoice.find({});
  const truckHiringNotes = await TruckHiringNote.find({});
  const payments = await Payment.find({});
  const counters = await Counter.find({});
  const numberingConfigs = await NumberingConfig.find({});
  const companyInfo = await CompanyInfo.find({});
  const bankAccounts = await BankAccount.find({});

  const backup = {
    customers,
    lorryReceipts,
    invoices,
    truckHiringNotes,
    payments,
    counters,
    numberingConfigs,
    companyInfo,
    bankAccounts,
  };

  res.status(200).json(backup);
});

export const restoreData = asyncHandler(async (req: Request, res: Response) => {
  const backup = backupDataSchema.parse(req.body);
  const { customers, lorryReceipts, invoices, truckHiringNotes, payments, counters, numberingConfigs, companyInfo, bankAccounts } = backup;

  // Clear existing data
  await Customer.deleteMany({});
  await LorryReceipt.deleteMany({});
  await Invoice.deleteMany({});
  await TruckHiringNote.deleteMany({});
  await Payment.deleteMany({});
  await Counter.deleteMany({});
  await NumberingConfig.deleteMany({});
  await BankAccount.deleteMany({});
  await CompanyInfo.deleteMany({});

  // Insert new data
  if (customers) await Customer.insertMany(customers);
  if (lorryReceipts) await LorryReceipt.insertMany(lorryReceipts);
  if (invoices) await Invoice.insertMany(invoices);
  if (truckHiringNotes) await TruckHiringNote.insertMany(truckHiringNotes);
  if (payments) await Payment.insertMany(payments);
  if (counters) await Counter.insertMany(counters);
  if (numberingConfigs) await NumberingConfig.insertMany(numberingConfigs);
  if (bankAccounts) await BankAccount.insertMany(bankAccounts);
  if (companyInfo) await CompanyInfo.insertMany(companyInfo);

  res.status(200).json({ message: 'Data restored successfully.' });
});
