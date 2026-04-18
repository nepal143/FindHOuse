import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const { data, error } = await db
    .from('properties')
    .select('data')
    .order('created_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data.map((r) => r.data));
}

export async function POST(request) {
  const property = await request.json();
  const db = getDb();
  const { error } = await db
    .from('properties')
    .insert({ id: property.id, data: property });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(property, { status: 201 });
}
