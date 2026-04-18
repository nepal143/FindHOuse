'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getProperties, deleteProperty } from '@/lib/storage';

function stars(rating) {
  return '★'.repeat(rating || 0) + '☆'.repeat(5 - (rating || 0));
}

export default function Home() {
  const [properties, setProperties] = useState([]);

  const reload = useCallback(() => setProperties(getProperties()), []);

  useEffect(() => {
    reload();
    // Refresh when user comes back to this tab / page
    window.addEventListener('focus', reload);
    return () => window.removeEventListener('focus', reload);
  }, [reload]);

  const handleDelete = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Delete this flat? This cannot be undone.')) {
      deleteProperty(id);
      reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 pt-14 pb-6 shadow-md">
        <h1 className="text-2xl font-bold tracking-tight">🏠 FlatTracker</h1>
        <p className="text-indigo-200 text-sm mt-1">
          {properties.length === 0
            ? 'Start tracking flats you visit today'
            : `${properties.length} flat${properties.length !== 1 ? 's' : ''} tracked`}
        </p>
      </div>

      {/* List */}
      <div className="px-4 mt-5">
        {properties.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-7xl mb-4">🏘️</div>
            <h2 className="text-xl font-semibold text-gray-700">No flats yet</h2>
            <p className="text-gray-400 mt-2 text-sm">
              Tap the <span className="font-bold text-indigo-600">+</span> button below to track your first flat
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((prop) => (
              <Link key={prop.id} href={`/property/${prop.id}`} className="block">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex hover:shadow-md transition-shadow">
                  {/* Thumbnail */}
                  <div className="w-28 h-28 bg-gray-100 flex-shrink-0">
                    {prop.photos && prop.photos.length > 0 ? (
                      <img
                        src={prop.photos[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🏢</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                        {prop.name || 'Unnamed Flat'}
                      </h3>
                      <button
                        onClick={(e) => handleDelete(prop.id, e)}
                        aria-label="Delete"
                        className="text-gray-300 hover:text-red-400 text-2xl leading-none flex-shrink-0 -mt-1 min-h-0"
                      >
                        ×
                      </button>
                    </div>

                    {prop.address && (
                      <p className="text-gray-400 text-xs mt-0.5 truncate">📍 {prop.address}</p>
                    )}

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {prop.rent && (
                        <span className="text-indigo-600 font-bold text-sm">
                          ₹{Number(prop.rent).toLocaleString()}/mo
                        </span>
                      )}
                      {prop.type && (
                        <span className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full">
                          {prop.type}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      {prop.rating > 0 && (
                        <span className="text-yellow-400 text-sm">{stars(prop.rating)}</span>
                      )}
                      {prop.photos && prop.photos.length > 1 && (
                        <span className="text-gray-300 text-xs ml-auto">
                          📷 {prop.photos.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl">
        <div className="max-w-lg mx-auto flex items-end">
          <Link
            href="/"
            className="flex-1 flex flex-col items-center py-3 text-indigo-600 min-h-0"
          >
            <span className="text-2xl leading-none">🏠</span>
            <span className="text-xs mt-1 font-medium">Properties</span>
          </Link>

          <Link href="/add" className="flex-shrink-0 -mt-5 px-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg text-white text-4xl leading-none font-light">
              +
            </div>
          </Link>

          <Link
            href="/compare"
            className="flex-1 flex flex-col items-center py-3 text-gray-400 min-h-0"
          >
            <span className="text-2xl leading-none">⚖️</span>
            <span className="text-xs mt-1">Compare</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
