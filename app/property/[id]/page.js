'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getProperty, updateProperty, deleteProperty } from '@/lib/storage';
import { compressImage } from '@/lib/imageUtils';

const FLAT_TYPES = ['1 RK', '1 BK', '1 BHK', '2 BK', '2 BHK', '3 BHK', '4 BHK'];
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

function stars(rating) {
  return '★'.repeat(rating || 0) + '☆'.repeat(5 - (rating || 0));
}

export default function PropertyDetail({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    getProperty(id).then((prop) => {
      if (!prop) { router.push('/'); return; }
      setProperty(prop);
      setPhotos(prop.photos || []);
      setForm({ ...prop });
    });
  }, [id, router]);

  if (!property || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">🏠</div>
      </div>
    );
  }

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const toggleTag = (field, tag) => {
    setForm((f) => ({
      ...f,
      [field]: (f[field] || []).includes(tag)
        ? f[field].filter((t) => t !== tag)
        : [...(f[field] || []), tag],
    }));
  };

  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      const compressed = await Promise.all(files.map((f) => compressImage(f)));
      setPhotos((prev) => [...prev, ...compressed]);
    } catch {
      alert('Failed to process image. Try again.');
    }
    e.target.value = '';
  };

  const removePhoto = (idx) => {
    setPhotos((p) => p.filter((_, i) => i !== idx));
    if (activePhoto >= idx && activePhoto > 0) setActivePhoto((a) => a - 1);
  };

  const getLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const distances = calcDistances(lat, lng);
        setForm((f) => ({ ...f, location: { lat, lng }, distances }));
        setLocating(false);
      },
      () => { alert('Could not get location.'); setLocating(false); },
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateProperty(id, { ...form, photos });
      setProperty(updated);
      setEditing(false);
      setActivePhoto(0);
    } catch (err) {
      alert(err.message || 'Save failed.');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete "${property.name}"? This cannot be undone.`)) {
      await deleteProperty(id);
      router.push('/');
    }
  };

  // ═══════════════════════════════════════════════
  // EDIT MODE
  // ═══════════════════════════════════════════════
  if (editing) {
    return (
      <div className="min-h-screen bg-gray-50 pb-10">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 pt-14 pb-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setEditing(false)} className="text-gray-500 text-3xl leading-none font-light min-h-0">‹</button>
            <h1 className="text-lg font-semibold text-gray-900 truncate">Edit Flat</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50 min-h-0"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div className="px-4 space-y-5 mt-5">

          {/* Photos */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Photos</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative flex-shrink-0">
                  <img src={photo} alt="" className="w-24 h-24 rounded-xl object-cover" />
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center shadow min-h-0 leading-none"
                  >×</button>
                </div>
              ))}
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 flex flex-col items-center justify-center cursor-pointer flex-shrink-0">
                <span className="text-2xl">📷</span>
                <span className="text-xs text-indigo-500 mt-1 font-medium">Camera</span>
                <input type="file" accept="image/*" multiple capture="environment" onChange={handlePhotos} className="hidden" />
              </label>
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center cursor-pointer flex-shrink-0">
                <span className="text-2xl">🖼️</span>
                <span className="text-xs text-gray-400 mt-1">Gallery</span>
                <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
              </label>
            </div>
          </section>

          {/* Location */}
          <section className="bg-white rounded-2xl p-4 space-y-3 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Location</p>
            <button type="button" onClick={getLocation} disabled={locating}
              className={`w-full py-3 rounded-xl text-sm font-medium border transition-colors ${form.location ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-300 text-gray-600'} disabled:opacity-60`}>
              {locating ? '⏳ Getting location & calculating distances…' : form.location ? '📍 GPS Saved ✓  –  Tap to refresh' : '📍 Save GPS Location'}
            </button>
            {form.location && (
              <>
                <a href={`https://maps.google.com/?q=${form.location.lat},${form.location.lng}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-indigo-500 text-center block">Open flat location in Google Maps →</a>
                {form.distances && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {OFFICES.map((o) => (
                      <a key={o.key}
                        href={`https://maps.google.com/maps?saddr=${form.location.lat},${form.location.lng}&daddr=${o.lat},${o.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100 block">
                        <div className="text-2xl">{o.emoji}</div>
                        <div className="text-xs text-gray-500 mt-1 leading-tight">{o.label}</div>
                        <div className="text-indigo-700 font-bold text-xl mt-1">{form.distances[o.key]} km</div>
                        <div className="text-xs text-indigo-400">straight‑line · tap for route</div>
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Price */}
          <section className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Price</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1.5">Monthly Rent (₹)</label>
                <input type="number" inputMode="numeric" value={form.rent || ''} onChange={(e) => set('rent', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1.5">Deposit (₹)</label>
                <input type="number" inputMode="numeric" value={form.deposit || ''} onChange={(e) => set('deposit', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
          </section>

          {/* Details */}
          <section className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Property Details</p>
            <div>
              <label className="text-sm text-gray-600 block mb-2">Type</label>
              <div className="flex flex-wrap gap-2">
                {FLAT_TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => set('type', form.type === t ? '' : t)}
                    className={`px-3 py-2 rounded-full text-sm border min-h-0 ${form.type === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-2">Furnishing</label>
              <div className="flex flex-wrap gap-2">
                {FURNISHING.map((t) => (
                  <button key={t} type="button" onClick={() => set('furnishing', form.furnishing === t ? '' : t)}
                    className={`px-3 py-2 rounded-full text-sm border min-h-0 ${form.furnishing === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1.5">Area (sq.ft)</label>
                <input type="number" inputMode="numeric" value={form.area || ''} onChange={(e) => set('area', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1.5">Floor</label>
                <input type="text" value={form.floor || ''} onChange={(e) => set('floor', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.parking || false} onChange={(e) => set('parking', e.target.checked)} className="w-5 h-5 accent-indigo-600" />
                <span className="text-sm text-gray-700">Parking 🚗</span>
              </label>
            </div>
          </section>

          {/* Rating */}
          <section className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Overall Rating</p>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => set('rating', form.rating === star ? 0 : star)}
                  className={`text-5xl leading-none min-h-0 transition-transform active:scale-90 ${star <= (form.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`}>★</button>
              ))}
            </div>
          </section>

          {/* Pros */}
          <section className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">👍 Pros</p>
            <div className="flex flex-wrap gap-2">
              {PRO_TAGS.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag('pros', tag)}
                  className={`px-3 py-2 rounded-full text-sm border min-h-0 ${(form.pros || []).includes(tag) ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                  {tag}
                </button>
              ))}
            </div>
          </section>

          {/* Cons */}
          <section className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">👎 Cons</p>
            <div className="flex flex-wrap gap-2">
              {CON_TAGS.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag('cons', tag)}
                  className={`px-3 py-2 rounded-full text-sm border min-h-0 ${(form.cons || []).includes(tag) ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                  {tag}
                </button>
              ))}
            </div>
          </section>

          {/* Notes */}
          <section className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">📝 Notes</p>
            <textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={4}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none" />
          </section>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-semibold text-base shadow-lg disabled:opacity-50">
            {saving ? '⏳ Saving…' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // VIEW MODE
  // ═══════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-14 pb-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push('/')} className="text-gray-500 text-3xl leading-none font-light flex-shrink-0 min-h-0">‹</button>
          <h1 className="text-lg font-semibold text-gray-900 truncate">{property.name}</h1>
        </div>
        <button onClick={() => setEditing(true)} className="text-indigo-600 text-sm font-semibold flex-shrink-0 min-h-0 px-1">
          ✏️ Edit
        </button>
      </div>

      {/* Photo Gallery */}
      {photos.length > 0 ? (
        <div>
          <div className="relative bg-gray-900 overflow-hidden" style={{ height: '260px' }}>
            <img src={photos[activePhoto]} alt="" className="w-full h-full object-cover" />
            {photos.length > 1 && (
              <>
                <button onClick={() => setActivePhoto((a) => (a - 1 + photos.length) % photos.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white w-9 h-9 rounded-full flex items-center justify-center text-xl min-h-0">‹</button>
                <button onClick={() => setActivePhoto((a) => (a + 1) % photos.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white w-9 h-9 rounded-full flex items-center justify-center text-xl min-h-0">›</button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((_, i) => (
                    <button key={i} onClick={() => setActivePhoto(i)}
                      className={`w-2 h-2 rounded-full min-h-0 transition-all ${i === activePhoto ? 'bg-white w-5' : 'bg-white/50'}`} />
                  ))}
                </div>
                <div className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded-full">
                  {activePhoto + 1}/{photos.length}
                </div>
              </>
            )}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 px-4 mt-2 overflow-x-auto pb-1">
              {photos.map((photo, i) => (
                <img key={i} src={photo} alt="" onClick={() => setActivePhoto(i)}
                  className={`w-14 h-14 rounded-lg object-cover cursor-pointer flex-shrink-0 border-2 transition-all ${i === activePhoto ? 'border-indigo-500' : 'border-transparent opacity-70'}`} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-100 h-40 flex items-center justify-center text-6xl">🏢</div>
      )}

      <div className="px-4 mt-5 space-y-4">

        {/* Key numbers */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{property.name}</h2>
            </div>
            {property.rating > 0 && (
              <div className="text-right flex-shrink-0 ml-3">
                <div className="text-yellow-400 text-lg">{stars(property.rating)}</div>
                <div className="text-xs text-gray-400">{property.rating}/5</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {property.rent && (
              <div className="bg-indigo-50 rounded-xl p-3">
                <div className="text-xs text-indigo-400 font-medium">Monthly Rent</div>
                <div className="text-indigo-700 font-bold text-lg">₹{Number(property.rent).toLocaleString()}</div>
              </div>
            )}
            {property.deposit && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 font-medium">Deposit</div>
                <div className="text-gray-700 font-bold text-lg">₹{Number(property.deposit).toLocaleString()}</div>
              </div>
            )}
            {property.type && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 font-medium">Type</div>
                <div className="text-gray-700 font-bold">{property.type}</div>
              </div>
            )}
            {property.area && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 font-medium">Area</div>
                <div className="text-gray-700 font-bold">{property.area} sq.ft</div>
              </div>
            )}
            {property.floor && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 font-medium">Floor</div>
                <div className="text-gray-700 font-bold">{property.floor}</div>
              </div>
            )}
            {property.furnishing && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 font-medium">Furnishing</div>
                <div className="text-gray-700 font-bold text-sm">{property.furnishing}</div>
              </div>
            )}
          </div>

          <div className="flex gap-5 mt-4 pt-3 border-t border-gray-100">
            <span className={`text-sm font-medium ${property.parking ? 'text-green-600' : 'text-gray-300'}`}>
              🚗 {property.parking ? 'Parking ✓' : 'No Parking'}
            </span>
          </div>
        </div>

        {/* Location & Distances */}
        {property.location && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">📍 Distance to Offices</p>
              <a href={`https://maps.google.com/?q=${property.location.lat},${property.location.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-500 font-medium">Open in Maps →</a>
            </div>
            {property.distances ? (
              <div className="grid grid-cols-2 gap-3">
                {OFFICES.map((o) => (
                  <a key={o.key}
                    href={`https://maps.google.com/maps?saddr=${property.location.lat},${property.location.lng}&daddr=${o.lat},${o.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100 block">
                    <div className="text-2xl">{o.emoji}</div>
                    <div className="text-xs text-gray-500 mt-1 leading-tight">{o.label}</div>
                    <div className="text-indigo-700 font-bold text-xl mt-1">{property.distances[o.key]} km</div>
                    <div className="text-xs text-indigo-400">straight‑line · tap for route</div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Edit this flat and re-save GPS to calculate distances</p>
            )}
          </div>
        )}

        {/* Pros & Cons */}
        {((property.pros && property.pros.length > 0) || (property.cons && property.cons.length > 0)) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            {property.pros && property.pros.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-green-600 mb-2">👍 Pros</p>
                <div className="flex flex-wrap gap-2">
                  {property.pros.map((pro) => (
                    <span key={pro} className="bg-green-50 text-green-700 text-xs px-3 py-1.5 rounded-full border border-green-100">
                      {pro}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {property.cons && property.cons.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-red-500 mb-2">👎 Cons</p>
                <div className="flex flex-wrap gap-2">
                  {property.cons.map((con) => (
                    <span key={con} className="bg-red-50 text-red-700 text-xs px-3 py-1.5 rounded-full border border-red-100">
                      {con}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {property.notes && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">📝 Notes</p>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{property.notes}</p>
          </div>
        )}

        {/* Meta */}
        <p className="text-center text-xs text-gray-400 py-2">
          Visited on {new Date(property.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>

        {/* Delete */}
        <button onClick={handleDelete}
          className="w-full text-red-500 py-4 rounded-2xl text-sm font-semibold border-2 border-red-200 bg-red-50 active:bg-red-100">
          🗑️ Delete This Flat
        </button>
      </div>
    </div>
  );
}
