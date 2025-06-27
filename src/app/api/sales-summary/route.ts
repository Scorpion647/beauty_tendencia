// app/api/sales-summary/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filterType, day, week, month, year, userId } = body;

    const { data, error } = await supabaseAdmin.rpc('get_sales_summary', {
      selected_user_id: userId ?? null,
      filter_date: day ?? null,
      filter_week: week ?? null,
      filter_month: month ?? null,
      filter_year: year ?? null,
      limit_count: 100,
      offset_count: 0,
      filter_type: filterType,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
  const error = err instanceof Error ? err : new Error('Unknown error');

  return new Response(JSON.stringify({ 
    error: 'Unexpected error', 
    details: error.message 
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}

}
