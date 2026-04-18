import { getDb } from '@/lib/db';

export async function GET(_, { params }) {
  const { id } = await params;
  const db = getDb();
  const { data, error } = await db
    .from('properties')
    .select('data')
    .eq('id', id)
    .single();
  if (error || !data) return Response.json(null, { status: 404 });
  return Response.json(data.data);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const db = getDb();
  const updates = await request.json();

  const { data: row } = await db
    .from('properties')
    .select('data')
    .eq('id', id)
    .single();

  const merged = {
    ...(row?.data || {}),
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const { error } = await db
    .from('properties')
    .update({ data: merged })
    .eq('id', id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(merged);
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  const db = getDb();
  await db.from('properties').delete().eq('id', id);
  return Response.json({ ok: true });
}
