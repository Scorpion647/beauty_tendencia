// pages/api/sales-summary.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ¡Service Role Key!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { filterType, day, week, month, year, userId } = req.body;

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

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ data });
}