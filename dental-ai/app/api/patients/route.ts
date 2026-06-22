import { NextRequest, NextResponse } from 'next/server';
import { getClinicId } from '@/lib/auth';
import { listPatients, insertPatient } from '@/lib/db';

export async function GET(req: NextRequest) {
  const clinicId = await getClinicId(req);
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const patients = await listPatients(clinicId);
    return NextResponse.json(patients);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const clinicId = await getClinicId(req);
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, phone, email, notes } = body;

  if (!name?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: 'name and phone are required' }, { status: 400 });
  }

  try {
    const patient = await insertPatient({
      clinic_id: clinicId,
      name: name.trim(),
      phone: phone.replace(/\D/g, ''),
      email: email?.trim() || null,
      notes: notes?.trim() || null,
    });
    return NextResponse.json(patient, { status: 201 });
  } catch (e: any) {
    const isDupe = e.message?.includes('unique') || e.message?.includes('duplicate');
    return NextResponse.json(
      { error: isDupe ? 'A patient with this phone number already exists.' : e.message },
      { status: isDupe ? 409 : 500 }
    );
  }
}
