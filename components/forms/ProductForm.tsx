import React, { useState } from 'react';
import { db, Product } from '../../lib/db';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TAX_RATES } from '../../lib/constants';

interface ProductFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Product;
}

export default function ProductForm({ onSuccess, onCancel, initialData }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>(
    initialData || { name: '', hsn: '', price: 0, taxRate: 18, stock: 0 }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData?.id) {
        await db.products.update(initialData.id, formData);
      } else {
        await db.products.add(formData as Product);
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save product", error);
      alert("Error saving product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="name"
        label="Product Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="hsn"
          label="HSN Code"
          value={formData.hsn}
          onChange={(e) => setFormData({ ...formData, hsn: e.target.value })}
          required
        />
        <Input
          id="stock"
          label="Stock Qty"
          type="number"
          value={formData.stock}
          onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="price"
          label="Base Price (₹)"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
          required
        />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">GST Rate (%)</label>
          <select
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            value={formData.taxRate}
            onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
          >
            {TAX_RATES.map((rate) => (
              <option key={rate} value={rate}>{rate}%</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (initialData ? 'Update Product' : 'Add Product')}
        </Button>
      </div>
    </form>
  );
}