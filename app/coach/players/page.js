'use client';

import { useState, useEffect } from 'react';
import { SPORTS } from '@/lib/config';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';

export default function CoachPlayersPage() {
  const toast = useToast();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Player Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    age: '',
    sport: SPORTS[0],
    email: '',
    password: '',
  });
  const [addErrors, setAddErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Edit Player Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editPlayerId, setEditPlayerId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    age: '',
    sport: SPORTS[0],
  });
  const [editErrors, setEditErrors] = useState({});

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/players');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPlayers(data);
      }
    } catch {
      toast('Failed to load players', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add Player submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!addForm.name.trim()) errors.name = 'Name is required';
    const ageNum = parseInt(addForm.age, 10);
    if (isNaN(ageNum) || ageNum < 5 || ageNum > 60) errors.age = 'Age must be between 5 and 60';
    if (!addForm.email.trim()) errors.email = 'Login email is required';
    if (!addForm.password || addForm.password.length < 6) errors.password = 'Password must be at least 6 characters';

    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name.trim(),
          age: ageNum,
          sport: addForm.sport,
          email: addForm.email.trim(),
          password: addForm.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Failed to add player', 'error');
        setIsSaving(false);
        return;
      }

      toast('Player created successfully!', 'success');
      setIsAddOpen(false);
      setAddForm({ name: '', age: '', sport: SPORTS[0], email: '', password: '' });
      setAddErrors({});
      fetchPlayers();
    } catch {
      toast('Network error saving player', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Edit Modal
  const openEdit = (player) => {
    setEditPlayerId(player._id);
    setEditForm({
      name: player.name,
      age: player.age,
      sport: player.sport,
    });
    setEditErrors({});
    setIsEditOpen(true);
  };

  // Edit Player submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!editForm.name.trim()) errors.name = 'Name is required';
    const ageNum = parseInt(editForm.age, 10);
    if (isNaN(ageNum) || ageNum < 5 || ageNum > 60) errors.age = 'Age must be between 5 and 60';

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/players/${editPlayerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          age: ageNum,
          sport: editForm.sport,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Failed to update player', 'error');
        setIsSaving(false);
        return;
      }

      toast('Player updated successfully!', 'success');
      setIsEditOpen(false);
      fetchPlayers();
    } catch {
      toast('Network error updating player', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Player confirm
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/players/${deleteTarget._id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        toast('Failed to delete player', 'error');
        return;
      }
      toast('Player deleted', 'success');
      setDeleteTarget(null);
      fetchPlayers();
    } catch {
      toast('Network error deleting player', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header with + Add Player */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Players Directory</h1>
          <p className="text-stone-600 mt-1">Manage all roster athletes and their portal logins</p>
        </div>
        <button
          onClick={() => {
            setAddErrors({});
            setIsAddOpen(true);
          }}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-50 font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          + Add Player
        </button>
      </div>

      {/* Players Table Card */}
      <div className="bg-amber-50/90 backdrop-blur-md border border-stone-300/70 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-stone-500 font-medium">Loading players...</div>
          ) : players.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-stone-500 font-medium mb-3">No players enrolled yet.</p>
              <button
                onClick={() => setIsAddOpen(true)}
                className="text-amber-800 font-semibold hover:underline"
              >
                + Add your first player
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-200/50 text-stone-700 text-xs font-bold uppercase tracking-wider border-b border-stone-300/60">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Age</th>
                  <th className="py-4 px-6">Sport</th>
                  <th className="py-4 px-6">Login Email</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/60 text-sm">
                {players.map((p) => (
                  <tr key={p._id} className="hover:bg-amber-100/40 transition-colors">
                    <td className="py-4 px-6 font-semibold text-stone-900">{p.name}</td>
                    <td className="py-4 px-6 text-stone-700">{p.age}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-200/80 text-stone-800">
                        {p.sport}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-stone-600 font-mono text-xs">{p.loginEmail || '—'}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-200/80 hover:bg-stone-300 rounded-lg transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Player Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Player">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Player Name
            </label>
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              placeholder="e.g. Rahul Kumar"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {addErrors.name && <p className="text-xs text-rose-600 mt-1">{addErrors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Age (5 - 60)
            </label>
            <input
              type="number"
              min="5"
              max="60"
              value={addForm.age}
              onChange={(e) => setAddForm({ ...addForm, age: e.target.value })}
              placeholder="e.g. 18"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {addErrors.age && <p className="text-xs text-rose-600 mt-1">{addErrors.age}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Sport
            </label>
            <select
              value={addForm.sport}
              onChange={(e) => setAddForm({ ...addForm, sport: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Login Email
            </label>
            <input
              type="email"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              placeholder="p4@academy.test"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {addErrors.email && <p className="text-xs text-rose-600 mt-1">{addErrors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Login Password
            </label>
            <input
              type="password"
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {addErrors.password && <p className="text-xs text-rose-600 mt-1">{addErrors.password}</p>}
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-stone-300/60">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-stone-700 bg-stone-200/80 hover:bg-stone-300 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Player Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Player">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Player Name
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {editErrors.name && <p className="text-xs text-rose-600 mt-1">{editErrors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Age (5 - 60)
            </label>
            <input
              type="number"
              min="5"
              max="60"
              value={editForm.age}
              onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {editErrors.age && <p className="text-xs text-rose-600 mt-1">{editErrors.age}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Sport
            </label>
            <select
              value={editForm.sport}
              onChange={(e) => setEditForm({ ...editForm, sport: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-stone-300/60">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-stone-700 bg-stone-200/80 hover:bg-stone-300 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Player"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This will remove their user account, attendance records, and match scores.`}
      />
    </div>
  );
}

