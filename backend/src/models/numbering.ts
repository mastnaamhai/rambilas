import { Schema, model, Document } from 'mongoose';

export interface INumberingConfig extends Document {
  type: 'lr' | 'invoice' | 'lorryReceiptId' | 'invoiceId' | 'truckHiringNoteId';
  prefix: string;
  startNumber: number;
  endNumber: number;
  currentNumber: number;
  allowManualEntry: boolean;
  allowOutsideRange: boolean;
}

const NumberingConfigSchema = new Schema({
  type: { type: String, required: true, enum: ['lr', 'invoice', 'lorryReceiptId', 'invoiceId', 'truckHiringNoteId'] },
  prefix: { type: String, required: true },
  startNumber: { type: Number, required: true },
  endNumber: { type: Number, required: true },
  currentNumber: { type: Number, required: true },
  allowManualEntry: { type: Boolean, default: true },
  allowOutsideRange: { type: Boolean, default: false },
});

export default model<INumberingConfig>('NumberingConfig', NumberingConfigSchema);


