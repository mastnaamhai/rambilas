import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import Customer from '../models/customer';
import LorryReceipt from '../models/lorryReceipt';
import Invoice from '../models/invoice';

// Zod schema for customer creation
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  gstin: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pin: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
});

// Zod schema for customer update
const updateCustomerSchema = createCustomerSchema.partial();

// @desc    Get all customers
// @route   GET /api/customers
// @access  Public
export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
  const customers = await Customer.find({});
  res.json(customers);
});

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Public
export const getCustomerById = asyncHandler(async (req: Request, res: Response) => {
  const customer = await Customer.findById(req.params.id);

  if (customer) {
    res.json(customer);
  } else {
    res.status(404);
    throw new Error('Customer not found');
  }
});

// @desc    Create a customer
// @route   POST /api/customers
// @access  Public
export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customerData = createCustomerSchema.parse(req.body);
  const customer = new Customer(customerData);
  const createdCustomer = await customer.save();
  res.status(201).json(createdCustomer);
});

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Public
export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customerData = updateCustomerSchema.parse(req.body);
  const customer = await Customer.findById(req.params.id);

  if (customer) {
    customer.name = customerData.name || customer.name;
    customer.gstin = customerData.gstin || customer.gstin;
    customer.address = customerData.address || customer.address;
    customer.city = customerData.city || customer.city;
    customer.state = customerData.state || customer.state;
    customer.pin = customerData.pin || customer.pin;
    customer.phone = customerData.phone || customer.phone;
    customer.email = customerData.email || customer.email;

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } else {
    res.status(404);
    throw new Error('Customer not found');
  }
});

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Public
export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await Customer.findById(req.params.id);

  if (customer) {
    // Optional: Check if the customer is associated with other documents (e.g., invoices)
    const hasLorryReceipts = await LorryReceipt.exists({ 'customer.id': customer._id });
    const hasInvoices = await Invoice.exists({ 'customer.id': customer._id });

    if (hasLorryReceipts || hasInvoices) {
      res.status(400);
      throw new Error('Cannot delete customer with existing lorry receipts or invoices.');
    }

    await customer.deleteOne();
    res.json({ message: 'Customer removed' });
  } else {
    res.status(404);
    throw new Error('Customer not found');
  }
});
