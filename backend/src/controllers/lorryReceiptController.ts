import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import LorryReceipt from '../models/lorryReceipt';
import { getNextSequenceValue } from '../utils/sequence';
import { lrListQuerySchema, createLrSchema, updateLrSchema } from '../utils/validation';
import { LorryReceiptStatus } from '../types';

export const getLorryReceipts = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', ...filters } = lrListQuerySchema.parse(req.query);

  const query: any = {};
  if (filters.startDate) query.date = { ...query.date, $gte: new Date(filters.startDate) };
  if (filters.endDate) query.date = { ...query.date, $lte: new Date(filters.endDate) };
  if (filters.customerId) query['consignor.id'] = filters.customerId;
  if (filters.status) query.status = filters.status;
  if (filters.search) {
    query.$or = [
      { lrNumber: { $regex: filters.search, $options: 'i' } },
      { 'consignor.name': { $regex: filters.search, $options: 'i' } },
      { 'consignee.name': { $regex: filters.search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const items = await LorryReceipt.find(query)
    .populate('consignor')
    .populate('consignee')
    .sort({ lrNumber: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await LorryReceipt.countDocuments(query);

  res.json({ items, total, page: pageNum, limit: limitNum });
});

export const getLorryReceiptById = asyncHandler(async (req: Request, res: Response) => {
  const lorryReceipt = await LorryReceipt.findById(req.params.id)
    .populate('consignor')
    .populate('consignee');

  if (lorryReceipt) {
    res.json(lorryReceipt);
  } else {
    res.status(404);
    throw new Error('Lorry Receipt not found');
  }
});

export const createLorryReceipt = asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('Received LR data:', JSON.stringify(req.body, null, 2));
    
            // Transform frontend data format to backend format before validation
            const transformedData = {
              ...req.body,
              consignor: req.body.consignorId || req.body.consignor,
              consignee: req.body.consigneeId || req.body.consignee,
              vehicleNumber: req.body.vehicleNumber,
            };

            // Remove frontend-specific fields
            delete transformedData.consignorId;
            delete transformedData.consigneeId;
    
    console.log('Transformed data:', JSON.stringify(transformedData, null, 2));
    
    const lrData = createLrSchema.parse(transformedData);
    console.log('Validated data:', JSON.stringify(lrData, null, 2));
    
    // Use custom LR number if provided, otherwise generate one
    const lrNumber = lrData.lrNumber || await getNextSequenceValue('lr');
    console.log('Using LR number:', lrNumber);
    
    const lorryReceipt = new LorryReceipt({
      ...lrData,
      lrNumber,
    });

    const createdLorryReceipt = await lorryReceipt.save();
    console.log('Saved LR:', createdLorryReceipt._id);
    res.status(201).json(createdLorryReceipt);
  } catch (error) {
    console.error('Error creating LR:', error);
    
    // Handle validation errors specifically
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationErrors: { [key: string]: string[] } = {};
      if ((error as any).errors) {
        Object.keys((error as any).errors).forEach(key => {
          validationErrors[key] = [(error as any).errors[key].message];
        });
      }
      
      res.status(400).json({
        message: 'Validation failed',
        errors: {
          fieldErrors: validationErrors
        }
      });
      return;
    }
    
    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const zodErrors: { [key: string]: string[] } = {};
      if ((error as any).issues) {
        (error as any).issues.forEach((issue: any) => {
          const field = issue.path.join('.');
          if (!zodErrors[field]) zodErrors[field] = [];
          zodErrors[field].push(issue.message);
        });
      }
      
      res.status(400).json({
        message: 'Validation failed',
        errors: {
          fieldErrors: zodErrors
        }
      });
      return;
    }
    
    res.status(500).json({ 
      message: 'Failed to create lorry receipt', 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    });
  }
});

export const updateLorryReceipt = asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('=== LR UPDATE START ===');
    console.log('LR ID:', req.params.id);
    console.log('Update data:', JSON.stringify(req.body, null, 2));
    
    // For status-only updates, use a more flexible approach
    if (Object.keys(req.body).length === 1 && req.body.status) {
      console.log('Status-only update detected');
      const lorryReceipt = await LorryReceipt.findById(req.params.id);
      
      if (!lorryReceipt) {
        res.status(404);
        throw new Error('Lorry Receipt not found');
      }
      
      lorryReceipt.status = req.body.status;
      const updatedLorryReceipt = await lorryReceipt.save();
      console.log('Status updated successfully');
      res.json(updatedLorryReceipt);
      return;
    }
    
    // For full updates, use the existing validation
    console.log('Full update detected, using validation');
    
    // Transform frontend data format to backend format before validation
    const transformedData = {
      ...req.body,
      consignor: req.body.consignorId || req.body.consignor,
      consignee: req.body.consigneeId || req.body.consignee,
      vehicle: req.body.vehicleId || req.body.vehicle,
    };
    
    // Remove frontend-specific fields
    delete transformedData.consignorId;
    delete transformedData.consigneeId;
    delete transformedData.vehicleId;
    
    const lrData = updateLrSchema.parse(transformedData);
    const lorryReceipt = await LorryReceipt.findById(req.params.id);

    if (lorryReceipt) {
      Object.assign(lorryReceipt, lrData);
      const updatedLorryReceipt = await lorryReceipt.save();
      console.log('Full update completed successfully');
      res.json(updatedLorryReceipt);
    } else {
      res.status(404);
      throw new Error('Lorry Receipt not found');
    }
  } catch (error) {
    console.error('=== LR UPDATE ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Full error object:', JSON.stringify(error, null, 2));
    throw error;
  }
});

export const deleteLorryReceipt = asyncHandler(async (req: Request, res: Response) => {
  const lorryReceipt = await LorryReceipt.findById(req.params.id);

  if (lorryReceipt) {
    if (lorryReceipt.status === LorryReceiptStatus.INVOICED) {
      res.status(400);
      throw new Error('Cannot delete an invoiced lorry receipt.');
    }
    await lorryReceipt.deleteOne();
    res.json({ message: 'Lorry Receipt removed' });
  } else {
    res.status(404);
    throw new Error('Lorry Receipt not found');
  }
});

export const getUnbilledLorryReceipts = asyncHandler(async (req: Request, res: Response) => {
  const { 
    customerId, 
    status, 
    startDate, 
    endDate, 
    minAmount, 
    maxAmount,
    search 
  } = req.query;
  
  // Get all LRs that are not invoiced or paid
  const query: any = {
    status: { $nin: [LorryReceiptStatus.INVOICED, LorryReceiptStatus.PAID] }
  };
  
  // If customerId is provided, filter by consignor or consignee
  if (customerId) {
    query.$or = [
      { consignor: customerId },
      { consignee: customerId }
    ];
  }
  
  // Filter by status if provided
  if (status) {
    query.status = status;
  }
  
  // Filter by date range
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate as string);
    if (endDate) query.date.$lte = new Date(endDate as string);
  }
  
  // Filter by amount range
  if (minAmount || maxAmount) {
    query.totalAmount = {};
    if (minAmount) query.totalAmount.$gte = parseFloat(minAmount as string);
    if (maxAmount) query.totalAmount.$lte = parseFloat(maxAmount as string);
  }
  
  // Search functionality
  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };
    query.$and = [
      {
        $or: [
          { lrNumber: { $regex: search, $options: 'i' } },
          { from: searchRegex },
          { to: searchRegex },
          { 'consignor.name': searchRegex },
          { 'consignee.name': searchRegex }
        ]
      }
    ];
  }
  
  const lorryReceipts = await LorryReceipt.find(query)
    .populate('consignor')
    .populate('consignee')
    .sort({ lrNumber: -1 });
  
  res.json(lorryReceipts);
});
