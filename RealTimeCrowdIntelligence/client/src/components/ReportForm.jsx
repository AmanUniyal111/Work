import { useState } from 'react';
import { MapPin, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { categories, severities } from '../lib/constants';

const initialForm = {
  title: '',
  description: '',
  category: 'crowd',
  severity: 'medium',
  address: '',
  latitude: '28.6139',
  longitude: '77.2090',
  densityScore: 5
};

export default function ReportForm({ onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/reports', form);
      onCreated?.(data.report);
      setForm((current) => ({ ...initialForm, latitude: current.latitude, longitude: current.longitude }));
      toast.success(data.alert ? 'Report submitted and alert generated' : 'Report submitted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not submit report');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel p-4">
      <div className="mb-4 flex items-center gap-2">
        <MapPin size={18} className="text-civic" />
        <h2 className="text-sm font-extrabold text-ink">Submit crowd report</h2>
      </div>
      <div className="space-y-3">
        <label className="block">
          <span className="label">Title</span>
          <input className="input mt-1" name="title" value={form.title} onChange={updateField} required maxLength={120} />
        </label>
        <label className="block">
          <span className="label">Description</span>
          <textarea className="input mt-1 min-h-20 resize-none" name="description" value={form.description} onChange={updateField} required />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label">Category</span>
            <select className="input mt-1 capitalize" name="category" value={form.category} onChange={updateField}>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">Severity</span>
            <select className="input mt-1 capitalize" name="severity" value={form.severity} onChange={updateField}>
              {severities.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="label">Address</span>
          <input className="input mt-1" name="address" value={form.address} onChange={updateField} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label">Latitude</span>
            <input className="input mt-1" name="latitude" type="number" step="any" value={form.latitude} onChange={updateField} required />
          </label>
          <label className="block">
            <span className="label">Longitude</span>
            <input className="input mt-1" name="longitude" type="number" step="any" value={form.longitude} onChange={updateField} required />
          </label>
        </div>
        <label className="block">
          <span className="label">Crowd density: {form.densityScore}</span>
          <input className="mt-2 w-full accent-civic" name="densityScore" type="range" min="1" max="10" value={form.densityScore} onChange={updateField} />
        </label>
      </div>
      <button disabled={loading} className="mt-4 flex w-full items-center justify-center gap-2 bg-civic px-4 py-3 text-sm font-extrabold text-white transition hover:bg-teal-800 disabled:opacity-60">
        <Send size={17} />
        {loading ? 'Submitting' : 'Broadcast report'}
      </button>
    </form>
  );
}
