import React, { useState } from 'react';
import { db, Party } from '../../lib/db';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { INDIAN_STATES } from '../../lib/constants';

interface PartyFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Party;
}

export default function PartyForm({ onSuccess, onCancel, initialData }: PartyFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Party>>(
    initialData || { name: '', gstin: '', mobile: '', address: '', state: 'Gujarat' }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData?.id) {
        await db.parties.update(initialData.id, formData);
      } else {
        await db.parties.add(formData as Party);
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save party", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="name"
        label="Party / Business Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="gstin"
          label="GSTIN"
          value={formData.gstin}
          onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
          maxLength={15}
          placeholder="24ABCDE1234F1Z5"
        />
        <Input
          id="mobile"
          label="Mobile Number"
          value={formData.mobile}
          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
          required
        />
      </div>

      <Input
        id="address"
        label="Address"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
      />

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">State</label>
        <select
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
          value={formData.state}
          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
        >
          {INDIAN_STATES.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (initialData ? 'Update Party' : 'Add Party')}
        </Button>
      </div>
    </form>
  );
}