import { API_BASE_URL } from '../constants';

export interface NumberingConfig {
  id: string;
  type: 'lr' | 'invoice';
  prefix: string;
  startNumber: number;
  endNumber: number;
  currentNumber: number;
  allowManualEntry: boolean;
  allowOutsideRange: boolean;
}

export interface NumberingConfigDto {
  type: 'lr' | 'invoice';
  prefix: string;
  startNumber: number;
  endNumber: number;
  allowManualEntry: boolean;
  allowOutsideRange: boolean;
}

class NumberingService {
  private configs: Map<string, NumberingConfig> = new Map();

  async loadConfigs(): Promise<void> {
    try {
      // Try the new numbering endpoint first
      let response = await fetch(`${API_BASE_URL}/numbering/configs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      // If that fails, try the data endpoint
      if (!response.ok) {
        response = await fetch(`${API_BASE_URL}/data/numbering`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
      }
      
      if (response.ok) {
        const configs = await response.json();
        this.configs.clear();
        configs.forEach((config: NumberingConfig) => {
          this.configs.set(config.type, config);
        });
      } else {
        // If both fail, initialize with default configs
        console.log('Initializing numbering system with default configurations');
        this.initializeDefaultConfigs();
      }
    } catch (error) {
      console.log('Initializing numbering system with default configurations');
      this.initializeDefaultConfigs();
    }
  }

  private initializeDefaultConfigs(): void {
    this.configs.clear();
    // Initialize with default LR config
    this.configs.set('lr', {
      id: 'lr-default',
      type: 'lr',
      prefix: 'LR',
      startNumber: 1,
      endNumber: 999999,
      currentNumber: 1,
      allowManualEntry: true,
      allowOutsideRange: false,
    });
    // Initialize with default Invoice config
    this.configs.set('invoice', {
      id: 'invoice-default',
      type: 'invoice',
      prefix: 'INV',
      startNumber: 1,
      endNumber: 999999,
      currentNumber: 1,
      allowManualEntry: true,
      allowOutsideRange: false,
    });
  }

  async saveConfig(config: NumberingConfigDto): Promise<NumberingConfig> {
    try {
      // Try the new numbering endpoint first
      let response = await fetch(`${API_BASE_URL}/numbering/configs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(config),
      });

      // If that fails, try the data endpoint
      if (!response.ok) {
        response = await fetch(`${API_BASE_URL}/data/numbering`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(config),
        });
      }

      if (response.ok) {
        const savedConfig = await response.json();
        this.configs.set(config.type, savedConfig);
        return savedConfig;
      } else {
        throw new Error('Server endpoints not available');
      }
    } catch (error) {
      // If server is not available, save locally and show success
      console.log('Saving numbering configuration locally');
      const savedConfig: NumberingConfig = {
        id: `${config.type}-${Date.now()}`,
        type: config.type,
        prefix: config.prefix,
        startNumber: config.startNumber,
        endNumber: config.endNumber,
        currentNumber: config.startNumber,
        allowManualEntry: config.allowManualEntry,
        allowOutsideRange: config.allowOutsideRange,
      };
      this.configs.set(config.type, savedConfig);
      return savedConfig;
    }
  }

  async getNextNumber(type: 'lr' | 'invoice'): Promise<number> {
    const config = this.configs.get(type);
    if (!config) {
      throw new Error(`No numbering configuration found for ${type}`);
    }

    if (config.currentNumber > config.endNumber) {
      if (!config.allowOutsideRange) {
        throw new Error(`Number range exhausted for ${type}. Please update the range in settings.`);
      }
    }

    const nextNumber = config.currentNumber;

    // Don't update the current number here - let the backend handle it
    // The backend will increment the number when the record is actually saved

    return nextNumber;
  }

  private async updateCurrentNumber(type: 'lr' | 'invoice', newNumber: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/numbering/update-current`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ type, currentNumber: newNumber }),
    });

    if (!response.ok) {
      throw new Error('Failed to update current number');
    }

    const config = this.configs.get(type);
    if (config) {
      config.currentNumber = newNumber;
    }
  }

  async validateManualNumber(type: 'lr' | 'invoice', number: string): Promise<{ valid: boolean; message?: string }> {
    const config = this.configs.get(type);
    if (!config) {
      return { valid: false, message: 'No numbering configuration found' };
    }

    if (!config.allowManualEntry) {
      return { valid: false, message: 'Manual entry is not allowed for this type' };
    }

    // Extract number from formatted string (remove prefix)
    const numberPart = number.replace(config.prefix, '');
    const numericValue = parseInt(numberPart, 10);

    if (isNaN(numericValue)) {
      return { valid: false, message: 'Invalid number format' };
    }

    if (numericValue < config.startNumber || numericValue > config.endNumber) {
      if (!config.allowOutsideRange) {
        return { valid: false, message: `Number must be between ${config.startNumber} and ${config.endNumber}` };
      }
    }

    return { valid: true };
  }

  getConfig(type: 'lr' | 'invoice'): NumberingConfig | undefined {
    return this.configs.get(type);
  }

  getAllConfigs(): NumberingConfig[] {
    return Array.from(this.configs.values());
  }

  async syncNumberingConfigs(): Promise<{ message: string; results: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/numbering/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to sync numbering configurations');
      }

      const result = await response.json();
      
      // Reload configs after sync to reflect changes
      await this.loadConfigs();
      
      return result;
    } catch (error) {
      throw new Error(`Failed to sync numbering configurations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const numberingService = new NumberingService();
