import Counter from '../models/counter';
import NumberingConfig from '../models/numbering';

export async function getNextSequenceValue(sequenceName: string): Promise<number> {
  // If a range is configured, use it
  const config = await NumberingConfig.findOne({ type: sequenceName });
  if (config) {
    if (config.currentNumber > config.endNumber) {
      if (config.allowOutsideRange) {
        // Fallback to legacy counter
        const legacy = await Counter.findByIdAndUpdate(
          sequenceName,
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        return legacy.seq;
      }
      throw new Error(`Number range exhausted for ${sequenceName}. Please set a new range in Settings.`);
    }
    const value = config.currentNumber;
    config.currentNumber = config.currentNumber + 1;
    await config.save();
    return value;
  }

  // Legacy behavior
  const sequenceDocument = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequenceDocument.seq;
}
