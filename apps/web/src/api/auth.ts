import { supabase } from '@/lib/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export function getCurrentSession() {
	return supabase.auth.getSession();
}

export function onAuthStateChange(handleChange: (event: AuthChangeEvent, session: Session | null) => Promise<void>) {
	return supabase.auth.onAuthStateChange(handleChange);
}

export function signInWithPassword(email: string, password: string) {
	return supabase.auth.signInWithPassword({
		email,
		password
	});
}

export function signOut() {
	return supabase.auth.signOut();
}
