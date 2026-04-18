const STORAGE_KEY = 'flat-tracker-v1';

export function getProperties() {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveProperties(properties) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
  } catch {
    throw new Error('Storage is full. Try deleting some photos from existing flats.');
  }
}

export function getProperty(id) {
  return getProperties().find((p) => p.id === id) || null;
}

export function addProperty(property) {
  const properties = getProperties();
  const newProp = {
    ...property,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  properties.unshift(newProp);
  saveProperties(properties);
  return newProp;
}

export function updateProperty(id, updates) {
  const properties = getProperties();
  const idx = properties.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  properties[idx] = { ...properties[idx], ...updates, updatedAt: new Date().toISOString() };
  saveProperties(properties);
  return properties[idx];
}

export function deleteProperty(id) {
  saveProperties(getProperties().filter((p) => p.id !== id));
}
