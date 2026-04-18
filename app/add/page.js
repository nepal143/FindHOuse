'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addProperty } from '@/lib/storage';
import { compressImage } from '@/lib/imageUtils';

const FLAT_TYPES = ['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Studio', 'Villa', 'Other'];
const FURNISHING = ['Unfurnished', 'Semi-Furnished', 'Fully Furnished'];

const PRO_TAGS = [
  'Good location', 'Spacious rooms', 'Natural light', 'Good ventilation',
  'New building', 'Clean society', 'Good security', 'Near metro/bus',
  'Near market', 'Quiet area', 'Ample parking', 'Big kitchen',
  'Great views', 'Near schools', 'Low deposit', 'Vastu friendly',
];

const CON_TAGS = [
  'Far from work', 'Small rooms', 'Dark/damp rooms', 'Old building',
  'Noisy area', 'No parking', 'High deposit', 'Water shortage',
  'No lift', 'Small kitchen', 'Road facing', 'Top floor (no lift)',
  'Leaking walls', 'Tiny balcony', 'Maintenance issues',
];

// Your two offices
const OFFICES = [
  { key: 'mastercard', label: 'Mastercard New Tech Hub', emoji: '🏢', lat: 18.5486, lng: 73.9024 },
  { key: 'zs', label: 'ZS Associates (WTC, Kharadi)', emoji: '🏙️', lat: 18.5512, lng: 73.9433 },
];

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcDistances(lat, lng) {
  const result = {};
  OFFICES.forEach((o) => {
    result[o.key] = parseFloat(haversineKm(lat, lng, o.lat, o.lng).toFixed(1));
  });
  return result;
}

const EMPTY_FORM = {
  rent: '', deposit: '', type: '', area: '', floor: '',
  furnishing: '', parking: false,
  rating: 0, pros: [], cons: [], notes: '', location: null, distances: null,
};

export default function AddFlat() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [locating, setLocating] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const toggleTag = (field, tag) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(tag)
        ? f[field].filter((t) => t !== tag)
        : [...f[field], tag],
    }));
  };

  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      const compressed = await Promise.all(files.map((f) => compressImage(f)));
      setPhotos((prev) => [...prev, ...compressed]);
    } catch {
      alert('Failed to process one of the images. Try again.');
    }
    e.target.value = '';
  };

  const getLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported on this browser.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const distances = calcDistances(lat, lng);
        setForm((f) => ({ ...f, location: { lat, lng }, distances }));
        setLocating(false);
      },
      () => {
        alert('Could not get location. Check browser permissions.');
        setLocating(false);
      },
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const now = new Date();
    const autoName = `Flat – ${now.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short',
    })} ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    try {
      await addProperty({ ...form, name: autoName, photos });
      router.push('/');
    } catch (err) {
      alert(err.message || 'Failed to save. Try removing some photos.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-14 pb-4 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
        <button
          onClick={() => router.back()}
          className="text-gray-500 text-3xl leading-none font-light min-h-0"
        >
          ‹
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Add New Flat</h1>
      </div>

      <div className="px-4 space-y-5 mt-5">

        {/* ── Photos ── */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Photos</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative flex-shrink-0">
                <img src={photo} alt="" className="w-24 h-24 rounded-xl object-cover" />
                <button
                  onClick={() => setPhotos((p) => p.filter((_, i) => i !== idx))}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center shadow min-h-0 leading-none"
                >
                  ×
                </button>
              </div>
            ))}
            {/* Camera capture */}
            <label className="w-24 h-24 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 flex flex-col items-center justify-center cursor-pointer flex-shrink-0">
              <span className="text-2xl">📷</span>
              <span className="text-xs text-indigo-500 mt-1 font-medium">Camera</span>
              <input type="file" accept="image/*" multiple capture="environment" onChange={handlePhotos} className="hidden" />
            </label>
            {/* Gallery picker */}
            <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center cursor-pointer flex-shrink-0">
              <span className="text-2xl">🖼️</span>
              <span className="text-xs text-gray-400 mt-1">Gallery</span>
              <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
            </label>
          </div>
        </section>

        {/* ── Location & Distance ── */}
        <section className="bg-white rounded-2xl p-4 space-y-3 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Location</p>

          <button
            type="button"
            onClick={getLocation}
            disabled={locating}
            className={`w-full py-3 rounded-xl text-sm font-medium border transition-colors ${
              form.location
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-gray-50 border-gray-300 text-gray-600'
            } disabled:opacity-60`}
          >
            {locating ? '⏳ Getting location & calculating distances…' : form.location ? '📍 GPS Saved ✓  –  Tap to refresh' : '📍 Save My GPS Location'}
          </button>

          {form.location && (
            <>
              <a
                href={`https://maps.google.com/?q=${form.location.lat},${form.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-500 text-center block"
              >
                Open flat location in Google Maps →
              </a>

              {form.distances && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {OFFICES.map((o) => (
                    <a
                      key={o.key}
                      href={`https://maps.google.com/maps?saddr=${form.location.lat},${form.location.lng}&daddr=${o.lat},${o.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100 block"
                    >
                      <div className="text-2xl">{o.emoji}</div>
                      <div className="text-xs text-gray-500 mt-1 leading-tight">{o.label}</div>
                      <div className="text-indigo-700 font-bold text-xl mt-1">
                        {form.distances[o.key]} km
                      </div>
                      <div className="text-xs text-indigo-400">straight‑line · tap for route</div>
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* ── Price ── */}
        <section className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Price</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1.5">Monthly Rent (₹)</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="e.g. 15000"
                value={form.rent}
                onChange={(e) => set('rent', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1.5">Deposit (₹)</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="e.g. 45000"
                value={form.deposit}
                onChange={(e) => set('deposit', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </section>

        {/* ── Property Details ── */}
        <section className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Property Details</p>

          <div>
            <label className="text-sm text-gray-600 block mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {FLAT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('type', form.type === t ? '' : t)}
                  className={`px-3 py-2 rounded-full text-sm border min-h-0 transition-colors ${
                    form.type === t
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-2">Furnishing</label>
            <div className="flex flex-wrap gap-2">
              {FURNISHING.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('furnishing', form.furnishing === t ? '' : t)}
                  className={`px-3 py-2 rounded-full text-sm border min-h-0 transition-colors ${
                    form.furnishing === t
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1.5">Area (sq.ft)</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="e.g. 850"
                value={form.area}
                onChange={(e) => set('area', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1.5">Floor</label>
              <input
                type="text"
                placeholder="e.g. 3rd / Ground"
                value={form.floor}
                onChange={(e) => set('floor', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.parking}
                onChange={(e) => set('parking', e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded"
              />
              <span className="text-sm text-gray-700">Parking 🚗</span>
            </label>

          </div>
        </section>

        {/* ── Rating ── */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Overall Rating</p>
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => set('rating', form.rating === star ? 0 : star)}
                className={`text-5xl leading-none min-h-0 transition-transform active:scale-90 ${
                  star <= form.rating ? 'text-yellow-400' : 'text-gray-200'
                }`}
              >
                ★
              </button>
            ))}
          </div>
          {form.rating > 0 && (
            <p className="text-center text-sm text-gray-500 mt-2">
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][form.rating]}
            </p>
          )}
        </section>

        {/* ── Pros ── */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">👍 Pros (tap to select)</p>
          <div className="flex flex-wrap gap-2">
            {PRO_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag('pros', tag)}
                className={`px-3 py-2 rounded-full text-sm border min-h-0 transition-colors ${
                  form.pros.includes(tag)
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        {/* ── Cons ── */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">👎 Cons (tap to select)</p>
          <div className="flex flex-wrap gap-2">
            {CON_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag('cons', tag)}
                className={`px-3 py-2 rounded-full text-sm border min-h-0 transition-colors ${
                  form.cons.includes(tag)
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        {/* ── Notes ── */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">📝 Personal Notes</p>
          <textarea
            placeholder="Water pressure, neighbours, society rules, anything else you noticed…"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none"
          />
        </section>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-indigo-600 active:bg-indigo-700 text-white py-4 rounded-2xl font-semibold text-base shadow-lg disabled:opacity-50 transition-colors"
        >
          {saving ? '⏳ Saving…' : '💾 Save Flat'}
        </button>

      </div>
    </div>
  );
}
