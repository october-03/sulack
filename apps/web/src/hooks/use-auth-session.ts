import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getCurrentSession, onAuthStateChange, signInWithPassword, signOut } from '@/api/auth';

export function useAuthSession() {
	const [session, setSession] = useState<Session | null>(null);
	const [authError, setAuthError] = useState<string | null>(null);
	const [isAuthLoading, setIsAuthLoading] = useState(false);
	const [isSessionLoading, setIsSessionLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;

		void getCurrentSession().then(({ data, error }) => {
			if (!isMounted) {
				return;
			}

			setSession(data.session);
			setAuthError(error?.message ?? null);
			setIsSessionLoading(false);
		});

		const {
			data: { subscription }
		} = onAuthStateChange(async (_event, nextSession) => {
			setSession(nextSession);
			setAuthError(null);
			setIsSessionLoading(false);
		});

		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, []);

	const login = async (email: string, password: string) => {
		setIsAuthLoading(true);
		setAuthError(null);

		const { error } = await signInWithPassword(email, password);

		if (error) {
			setAuthError(error.message);
			setIsAuthLoading(false);
			return false;
		}

		setIsAuthLoading(false);
		return true;
	};

	const logout = async () => {
		setIsAuthLoading(true);
		setAuthError(null);

		const { error } = await signOut();

		if (error) {
			setAuthError(error.message);
			setIsAuthLoading(false);
			return false;
		}

		setIsAuthLoading(false);
		return true;
	};

	return {
		authError,
		isAuthLoading,
		isSessionLoading,
		login,
		logout,
		session,
		setAuthError
	};
}
