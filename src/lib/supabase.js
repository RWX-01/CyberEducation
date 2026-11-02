import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xmcareeofixeoldcpaka.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_qQHHKEH3mOms5eid3fZi3Q_ChbqIfp6';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
