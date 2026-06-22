import { supabase } from '@/lib/supabase';
import { DateTime } from 'luxon';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CallDetail({ params }: { params: { callSid: string } }) {
  const { data: call } = await supabase
    .from('calls')
    .select('*')
    .eq('call_sid', params.callSid)
    .single();

  if (!call) return <div className="p-8">Not found</div>;

  const conversation = (call.conversation as any[]) || [];

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard-7k3x" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold mt-4 mb-2">Call {call.call_sid}</h1>
        <p className="text-sm text-slate-500 mb-6">
          {DateTime.fromISO(call.created_at).toFormat("EEEE, MMMM d 'at' h:mm a")} · From {call.from_number || 'unknown'} · Ended: {call.ended_reason || 'unknown'}
        </p>

        <div className="space-y-3">
          {conversation.filter((m: any) => m.role !== 'system').map((m: any, i: number) => (
            <div key={i} className={`p-4 rounded-lg ${
              m.role === 'user' ? 'bg-blue-50 ml-12' :
              m.role === 'assistant' ? 'bg-white border mr-12' :
              'bg-amber-50 text-xs font-mono'
            }`}>
              <div className="text-xs uppercase text-slate-500 mb-1">{m.role}</div>
              <div className="text-sm whitespace-pre-wrap">
                {typeof m.content === 'string' ? m.content : JSON.stringify(m, null, 2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
