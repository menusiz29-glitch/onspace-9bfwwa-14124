import { supabase } from './supabase';

export interface Ustoz {
  id: string;
  username: string;
  full_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// Password hashing (simple implementation)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function registerUstoz(username: string, password: string, fullName: string) {
  // Username mavjudligini tekshirish
  const { data: existing } = await supabase
    .from('ustoz')
    .select('id')
    .eq('username', username)
    .single();

  if (existing) {
    throw new Error('Bu username band');
  }

  const passwordHash = await hashPassword(password);

  const { data, error } = await supabase
    .from('ustoz')
    .insert({
      username,
      password_hash: passwordHash,
      full_name: fullName,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Ustoz;
}

export async function loginUstoz(username: string, password: string) {
  const passwordHash = await hashPassword(password);

  const { data, error } = await supabase
    .from('ustoz')
    .select('*')
    .eq('username', username)
    .eq('password_hash', passwordHash)
    .single();

  if (error || !data) {
    throw new Error('Username yoki parol noto\'g\'ri');
  }

  const ustoz = data as Ustoz;

  if (ustoz.status === 'pending') {
    throw new Error('Hisobingiz hali tasdiqlanmagan. Admin tasdiqlashini kuting.');
  }

  if (ustoz.status === 'rejected') {
    throw new Error('Hisobingiz rad etilgan. Admin bilan bog\'laning.');
  }

  return ustoz;
}

export async function approveUstoz(ustoz_id: string, status: 'approved' | 'rejected') {
  const { error } = await supabase
    .from('ustoz')
    .update({ status })
    .eq('id', ustoz_id);

  if (error) throw error;
}

export async function deleteUstoz(ustoz_id: string) {
  const { error } = await supabase
    .from('ustoz')
    .delete()
    .eq('id', ustoz_id);

  if (error) throw error;
}
