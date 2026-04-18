'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getProperties } from '@/lib/storage';

function stars(rating) {
  return '★'.repeat(rating || 0) + '☆'.repeat(5 - (rating || 0));
}

function fmt(val) {
  return val ? `₹${Number(val).toLocaleString()}` : '—';
}

export default function Compare() {
  const [properties, setProperties] = useState([]);
  const [selected, setSelected] = useState([]);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    setProperties(getProperties());
  }, []);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < 4 ? [...prev, id] : prev,
    );
  };

  const chosen = properties.filter((p) => selected.includes(p.id));

  // Helpers to highlight best values (green = best)
  const minVal = (key) => {
    const vals = chosen.map((p) => Number(p[key])).filter(Boolean);
    return vals.length ? Math.min(...vals) : null;
  };
  const maxVal = (key) => {
    const vals = chosen.map((p) => Number(p[key])).filter(Boolean);
    return vals.length ? Math.max(...vals) : null;
  };

  const bestRent = minVal('rent');
  const bestDeposit = minVal('deposit');
  const bestRating = maxVal('rating');
  const bestArea = maxVal('area');

  const cellClass = (val, best) =>
    best && Number(val) === best
      ? 'bg-green-50 text-green-700 font-bold'
      : 'bg-white text-gray-700';

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-14 pb-4 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">⚖️ Compare Flats</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {selected.length === 0
            ? 'Select 2–4 flats to compare'
            : `${selected.length} selected — ${selected.length >= 2 ? 'tap Compare to proceed' : 'select at least 2'}`}
        </p>
      </div>

      {/* Selection list */}
      {!showTable ? (
        <div className="px-4 mt-5 space-y-3">
          {properties.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🏘️</div>
              <p className="text-gray-500 font-medium">No flats tracked yet</p>
              <Link href="/add" className="inline-block mt-4 bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-semibold">
                + Add First Flat
              </Link>
            </div>
          ) : (
            <>
              {properties.map((prop) => {
                const isSelected = selected.includes(prop.id);
                return (
                  <div
                    key={prop.id}
                    onClick={() => toggle(prop.id)}
                    className={`bg-white rounded-2xl overflow-hidden flex cursor-pointer border-2 transition-all shadow-sm ${
                      isSelected ? 'border-indigo-500 shadow-indigo-100' : 'border-transparent'
                    }`}
                  >
                    <div className="w-20 h-20 bg-gray-100 flex-shrink-0">
                      {prop.photos?.[0] ? (
                        <img src={prop.photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">🏢</div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex items-center justify-between min-w-0">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">{prop.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {prop.rent && <span className="text-indigo-600 text-sm font-medium">₹{Number(prop.rent).toLocaleString()}/mo</span>}
                          {prop.type && <span className="text-gray-400 text-xs">{prop.type}</span>}
                        </div>
                        {prop.rating > 0 && <span className="text-yellow-400 text-xs">{stars(prop.rating)}</span>}
                      </div>
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-2 transition-all ${
                        isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                      }`}>
                        {isSelected && <span className="text-white text-sm font-bold">✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}

              {selected.length >= 2 && (
                <button
                  onClick={() => setShowTable(true)}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-semibold text-base shadow-lg mt-2"
                >
                  Compare {selected.length} Flats →
                </button>
              )}

              {selected.length === 1 && (
                <p className="text-center text-sm text-gray-400 mt-2">Select at least one more flat</p>
              )}
            </>
          )}
        </div>
      ) : (
        /* Comparison table */
        <div className="mt-4">
          <div className="px-4 mb-3 flex items-center justify-between">
            <button onClick={() => setShowTable(false)} className="text-indigo-600 text-sm font-medium min-h-0">
              ← Change selection
            </button>
            <span className="text-xs text-gray-400">🟢 = best value</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-indigo-600 text-white">
                  <th className="px-3 py-3 text-left text-xs font-semibold w-24 sticky left-0 bg-indigo-600">Field</th>
                  {chosen.map((p) => (
                    <th key={p.id} className="px-3 py-2 text-center min-w-[110px]">
                      <div className="text-xs font-semibold leading-tight">{p.name}</div>
                      {p.photos?.[0] && (
                        <img src={p.photos[0]} alt="" className="w-16 h-12 object-cover rounded mx-auto mt-1" />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>

                {/* Rating */}
                <tr className="border-b">
                  <td className="px-3 py-2.5 text-xs text-gray-500 font-medium bg-gray-50 sticky left-0">⭐ Rating</td>
                  {chosen.map((p) => (
                    <td key={p.id} className={`px-3 py-2.5 text-center text-sm ${Number(p.rating) === bestRating ? 'bg-green-50 font-bold text-green-700' : 'bg-white text-gray-700'}`}>
                      {p.rating ? stars(p.rating) : '—'}
                    </td>
                  ))}
                </tr>

                {/* Rent */}
                <tr className="border-b">
                  <td className="px-3 py-2.5 text-xs text-gray-500 font-medium bg-gray-50 sticky left-0">💰 Rent/mo</td>
                  {chosen.map((p) => (
                    <td key={p.id} className={`px-3 py-2.5 text-center text-xs ${cellClass(p.rent, bestRent)}`}>
                      {fmt(p.rent)}
                    </td>
                  ))}
                </tr>

                {/* Deposit */}
                <tr className="border-b">
                  <td className="px-3 py-2.5 text-xs text-gray-500 font-medium bg-gray-50 sticky left-0">🔒 Deposit</td>
                  {chosen.map((p) => (
                    <td key={p.id} className={`px-3 py-2.5 text-center text-xs ${cellClass(p.deposit, bestDeposit)}`}>
                      {fmt(p.deposit)}
                    </td>
                  ))}
                </tr>

                {/* Type */}
                <tr className="border-b">
                  <td className="px-3 py-2.5 text-xs text-gray-500 font-medium bg-gray-50 sticky left-0">🏢 Type</td>
                  {chosen.map((p) => (
                    <td key={p.id} className="px-3 py-2.5 text-center text-xs bg-white text-gray-700">{p.type || '—'}</td>
                  ))}
                </tr>

                {/* Area */}
                <tr className="border-b">
                  <td className="px-3 py-2.5 text-xs text-gray-500 font-medium bg-gray-50 sticky left-0">📐 Area</td>
                  {chosen.map((p) => (
                    <td key={p.id} className={`px-3 py-2.5 text-center text-xs ${cellClass(p.area, bestArea)}`}>
                      {p.area ? `${p.area} sq.ft` : '—'}
                    </td>
                  ))}
                </tr>

                {/* Floor */}
                <tr className="border-b">
                  <td className="px-3 py-2.5 text-xs text-gray-500 font-medium bg-gray-50 sticky left-0">🪜 Floor</td>
                  {chosen.map((p) => (
                    <td key={p.id} className="px-3 py-2.5 text-center text-xs bg-white text-gray-700">{p.floor || '—'}</td>
                  ))}
                </tr>

                {/* Furnishing */}
                <tr className="border-b">
                  <td className="px-3 py-2.5 text-xs text-gray-500 font-medium bg-gray-50 sticky left-0">🛋️ Furnish</td>
                  {chosen.map((p) => (
                    <td key={p.id} className="px-3 py-2.5 text-center text-xs bg-white text-gray-700">{p.furnishing || '—'}</td>
                  ))}
                </tr>

                {/* Parking */}
                <tr className="border-b">
                  <td className="px-3 py-2.5 text-xs text-gray-500 font-medium bg-gray-50 sticky left-0">🚗 Parking</td>
                  {chosen.map((p) => (
                    <td key={p.id} className="px-3 py-2.5 text-center bg-white">{p.parking ? '✅' : '❌'}</td>
                  ))}
                </tr>

                {/* Location */}
                <tr className="border-b">
                  <td className="px-3 py-2.5 text-xs text-gray-500 font-medium bg-gray-50 sticky left-0">📍 Maps</td>
                  {chosen.map((p) => (
                    <td key={p.id} className="px-3 py-2.5 text-center bg-white">
                      {p.location ? (
                        <a href={`https://maps.google.com/?q=${p.location.lat},${p.location.lng}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-blue-500 text-xs underline">View</a>
                      ) : '—'}
                    </td>
                  ))}
                </tr>

                {/* Pros */}
                <tr className="border-b">
                  <td className="px-3 py-2.5 text-xs text-gray-500 font-medium bg-gray-50 sticky left-0 align-top pt-3">👍 Pros</td>
                  {chosen.map((p) => (
                    <td key={p.id} className="px-3 py-2.5 bg-white text-center align-top">
                      {p.pros?.length > 0
                        ? p.pros.map((pro) => (
                            <span key={pro} className="inline-block bg-green-100 text-green-700 text-xs rounded-full px-2 py-0.5 m-0.5">{pro}</span>
                          ))
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  ))}
                </tr>

                {/* Cons */}
                <tr className="border-b">
                  <td className="px-3 py-2.5 text-xs text-gray-500 font-medium bg-gray-50 sticky left-0 align-top pt-3">👎 Cons</td>
                  {chosen.map((p) => (
                    <td key={p.id} className="px-3 py-2.5 bg-white text-center align-top">
                      {p.cons?.length > 0
                        ? p.cons.map((con) => (
                            <span key={con} className="inline-block bg-red-100 text-red-700 text-xs rounded-full px-2 py-0.5 m-0.5">{con}</span>
                          ))
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  ))}
                </tr>

                {/* Broker */}
                <tr>
                  <td className="px-3 py-2.5 text-xs text-gray-500 font-medium bg-gray-50 sticky left-0">👤 Broker</td>
                  {chosen.map((p) => (
                    <td key={p.id} className="px-3 py-2.5 text-center text-xs bg-white">
                      {p.brokerName || '—'}
                      {p.brokerPhone && (
                        <a href={`tel:${p.brokerPhone}`} className="block text-indigo-500 mt-0.5">{p.brokerPhone}</a>
                      )}
                    </td>
                  ))}
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl">
        <div className="max-w-lg mx-auto flex items-end">
          <Link href="/" className="flex-1 flex flex-col items-center py-3 text-gray-400 min-h-0">
            <span className="text-2xl leading-none">🏠</span>
            <span className="text-xs mt-1">Properties</span>
          </Link>
          <Link href="/add" className="flex-shrink-0 -mt-5 px-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg text-white text-4xl leading-none font-light">
              +
            </div>
          </Link>
          <Link href="/compare" className="flex-1 flex flex-col items-center py-3 text-indigo-600 min-h-0">
            <span className="text-2xl leading-none">⚖️</span>
            <span className="text-xs mt-1 font-medium">Compare</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
