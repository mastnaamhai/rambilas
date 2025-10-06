import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { numberingService, type NumberingConfig, type NumberingConfigDto } from '../services/numberingService';

export const NumberingSettings: React.FC = () => {
  const [configs, setConfigs] = useState<NumberingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      setError('');
      await numberingService.loadConfigs();
      setConfigs(numberingService.getAllConfigs());
    } catch (err: any) {
      setError(err.message || 'Failed to load numbering configurations');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (type: 'lr' | 'invoice', config: NumberingConfigDto) => {
    try {
      setSaving(true);
      setError('');
      await numberingService.saveConfig(config);
      await loadConfigs();
      setSuccess(`${type.toUpperCase()} numbering configuration saved successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const syncConfigs = async () => {
    try {
      setSyncing(true);
      setError('');
      const result = await numberingService.syncNumberingConfigs();
      setConfigs(numberingService.getAllConfigs());
      setSuccess(`Numbering configurations synced successfully! ${result.message}`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to sync numbering configurations');
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = (type: 'lr' | 'invoice', e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const config: NumberingConfigDto = {
      type,
      prefix: formData.get('prefix') as string,
      startNumber: parseInt(formData.get('startNumber') as string, 10),
      endNumber: parseInt(formData.get('endNumber') as string, 10),
      allowManualEntry: formData.get('allowManualEntry') === 'on',
      allowOutsideRange: formData.get('allowOutsideRange') === 'on',
    };

    if (config.startNumber > config.endNumber) {
      setError('Start number must be less than or equal to end number');
      return;
    }

    saveConfig(type, config);
  };

  const getConfig = (type: 'lr' | 'invoice'): NumberingConfig | undefined => {
    return configs.find(c => c.type === type);
  };

  if (loading) {
    return <div className="text-center py-8">Loading numbering settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">Numbering Configuration</h3>
        <div className="flex gap-2">
          <Button onClick={syncConfigs} variant="primary" disabled={syncing || loading}>
            {syncing ? 'Syncing...' : 'Sync'}
          </Button>
          <Button onClick={loadConfigs} variant="secondary" disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LR Numbering Configuration */}
        <Card title="Lorry Receipt (LR) Numbering">
          <form onSubmit={(e) => handleSubmit('lr', e)} className="space-y-4">
            <Input
              label="Prefix"
              name="prefix"
              defaultValue={getConfig('lr')?.prefix || 'LR'}
              placeholder="e.g., LR, LORRY"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Number"
                name="startNumber"
                type="number"
                defaultValue={getConfig('lr')?.startNumber || 1}
                min="1"
                required
              />
              <Input
                label="End Number"
                name="endNumber"
                type="number"
                defaultValue={getConfig('lr')?.endNumber || 999999}
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="allowManualEntry"
                  defaultChecked={getConfig('lr')?.allowManualEntry ?? true}
                />
                <span className="text-sm text-gray-700">Allow manual entry of LR numbers</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="allowOutsideRange"
                  defaultChecked={getConfig('lr')?.allowOutsideRange ?? false}
                />
                <span className="text-sm text-gray-700">Allow numbers outside range when exhausted</span>
              </label>
            </div>
            <div className="pt-2">
              <div className="text-sm text-gray-600">
                <strong>Current Number:</strong> {getConfig('lr')?.currentNumber || 'Not set'}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Next Number:</strong> {getConfig('lr') ? `${getConfig('lr')?.prefix}${(getConfig('lr')?.currentNumber || 1).toString().padStart(6, '0')}` : 'Not set'}
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save LR Configuration'}
            </Button>
          </form>
        </Card>

        {/* Invoice Numbering Configuration */}
        <Card title="Invoice Numbering">
          <form onSubmit={(e) => handleSubmit('invoice', e)} className="space-y-4">
            <Input
              label="Prefix"
              name="prefix"
              defaultValue={getConfig('invoice')?.prefix || 'INV'}
              placeholder="e.g., INV, INVOICE"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Number"
                name="startNumber"
                type="number"
                defaultValue={getConfig('invoice')?.startNumber || 1}
                min="1"
                required
              />
              <Input
                label="End Number"
                name="endNumber"
                type="number"
                defaultValue={getConfig('invoice')?.endNumber || 999999}
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="allowManualEntry"
                  defaultChecked={getConfig('invoice')?.allowManualEntry ?? true}
                />
                <span className="text-sm text-gray-700">Allow manual entry of invoice numbers</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="allowOutsideRange"
                  defaultChecked={getConfig('invoice')?.allowOutsideRange ?? false}
                />
                <span className="text-sm text-gray-700">Allow numbers outside range when exhausted</span>
              </label>
            </div>
            <div className="pt-2">
              <div className="text-sm text-gray-600">
                <strong>Current Number:</strong> {getConfig('invoice')?.currentNumber || 'Not set'}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Next Number:</strong> {getConfig('invoice') ? `${getConfig('invoice')?.prefix}${(getConfig('invoice')?.currentNumber || 1).toString().padStart(6, '0')}` : 'Not set'}
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Invoice Configuration'}
            </Button>
          </form>
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">How it works:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Numbers are generated sequentially within the specified range</li>
          <li>• Format: [PREFIX][6-digit number] (e.g., LR000001, INV000001)</li>
          <li>• Manual entry allows users to input custom numbers when needed</li>
          <li>• Outside range option allows continuation beyond the end number</li>
          <li>• Current number tracks the next number to be assigned</li>
        </ul>
      </div>
    </div>
  );
};
