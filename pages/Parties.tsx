import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Party } from '../lib/db';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import PartyForm from '../components/forms/PartyForm';
import { Plus, Edit2, Trash2, Search, Users } from 'lucide-react';
import { Input } from '../components/ui/Input';

export default function PartiesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | undefined>(undefined);
  const [search, setSearch] = useState("");

  const parties = useLiveQuery(async () => {
    if (!search) return await db.parties.toArray();
    return await db.parties
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.mobile.includes(search))
      .toArray();
  }, [search]);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this party?')) {
      await db.parties.delete(id);
    }
  };

  const handleEdit = (party: Party) => {
    setEditingParty(party);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingParty(undefined);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parties</h1>
          <p className="text-gray-500">Manage customers and suppliers.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Party
        </Button>
      </div>

      {isFormOpen && (
        <Card className="border-blue-100 bg-blue-50/50">
          <CardHeader>
            <CardTitle>{editingParty ? 'Edit Party' : 'Add New Party'}</CardTitle>
          </CardHeader>
          <CardContent>
            <PartyForm 
              onSuccess={handleCloseForm} 
              onCancel={handleCloseForm}
              initialData={editingParty} 
            />
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            className="pl-9" 
            placeholder="Search parties..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-md border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">GSTIN</th>
                <th className="px-6 py-3">Mobile</th>
                <th className="px-6 py-3">State</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parties?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    No parties found.
                  </td>
                </tr>
              )}
              {parties?.map((party) => (
                <tr key={party.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div>{party.name}</div>
                    <div className="text-xs text-gray-500">{party.address}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{party.gstin || 'N/A'}</td>
                  <td className="px-6 py-4">{party.mobile}</td>
                  <td className="px-6 py-4">{party.state}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleEdit(party)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(party.id!)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}