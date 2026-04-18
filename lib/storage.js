export async function getProperties() {
  try {
    const res = await fetch('/api/properties');
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getProperty(id) {
  try {
    const res = await fetch(`/api/properties/${id}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function addProperty(property) {
  const newProp = {
    ...property,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  const res = await fetch('/api/properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newProp),
  });
  if (!res.ok) throw new Error('Failed to save. Please try again.');
  return newProp;
}

export async function updateProperty(id, updates) {
  const res = await fetch(`/api/properties/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update. Please try again.');
  return res.json();
}

export async function deleteProperty(id) {
  await fetch(`/api/properties/${id}`, { method: 'DELETE' });
}
