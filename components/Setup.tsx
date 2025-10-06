import React, { useState } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface SetupProps {
  onSetPassword: (password: string) => void;
}

export const Setup: React.FC<SetupProps> = ({ onSetPassword }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password) {
      setError('Password cannot be empty.');
      return;
    }
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    onSetPassword(password);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Welcome!</h1>
            <p className="text-gray-600 mt-2">Please set a password to secure your application.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            error={error && (error.includes('empty') || error.includes('long')) ? error : undefined}

          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            error={error && error.includes('match') ? error : undefined}
          />
          <Button type="submit" className="w-full !py-3">Set Password and Secure App</Button>
        </form>
      </div>
    </div>
  );
};