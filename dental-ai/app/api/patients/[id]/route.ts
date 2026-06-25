import { NextRequest, NextResponse } from 'next/server';
import { getClinicId } from '@/lib/auth';
import { updatePatient, deletePatient } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const clinicId = await getClinicId(req);
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const fields: { name?: string; email?: string | null; notes?: string | null } = {};
  if (body.name  !== undefined) fields.name  = body.name.trim();
  if (body.email !== undefined) fields.email = body.email?.trim() || null;
  if (body.notes !== undefined) fields.notes = body.notes?.trim() || null;

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  try {
    await updatePatient(params.id, clinicId, fields);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const clinicId = await getClinicId(req);
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await deletePatient(params.id, clinicId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
