import { FormEvent, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AlertCircle, LockKeyhole, Mail } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from './lib/supabase';

type LoginLocationState = {
	from?: string;
};

function LoginPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const locationState = location.state as LoginLocationState | null;
	const redirectTo = locationState?.from ?? '/';
	const [session, setSession] = useState<Session | null>(null);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [authError, setAuthError] = useState<string | null>(null);
	const [isAuthLoading, setIsAuthLoading] = useState(false);
	const [isSessionLoading, setIsSessionLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;

		void supabase.auth.getSession().then(({ data, error }) => {
			if (!isMounted) {
				return;
			}

			setSession(data.session);
			setAuthError(error?.message ?? null);
			setIsSessionLoading(false);
		});

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, nextSession) => {
			setSession(nextSession);
			setAuthError(null);
			setIsSessionLoading(false);
		});

		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, []);

	useEffect(() => {
		if (!isSessionLoading && session) {
			navigate(redirectTo, { replace: true });
		}
	}, [isSessionLoading, navigate, redirectTo, session]);

	const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsAuthLoading(true);
		setAuthError(null);

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			setAuthError(error.message);
			setIsAuthLoading(false);
			return;
		}

		setPassword('');
		navigate(redirectTo, { replace: true });
		setIsAuthLoading(false);
	};

	return (
		<main className="login-shell">
			<Card className="w-full max-w-[420px] border-white/10 bg-card/95 shadow-2xl shadow-black/30">
				<CardHeader>
					<CardDescription>Sulack</CardDescription>
					<CardTitle className="text-2xl">Sign in</CardTitle>
				</CardHeader>

				<CardContent className="grid gap-5">
					{isSessionLoading ? (
						<p className="text-sm text-muted-foreground">기존 세션을 확인하는 중입니다...</p>
					) : (
						<form className="grid gap-5" onSubmit={(event) => void handleLogin(event)}>
							<div className="grid gap-2">
								<Label htmlFor="email">Email</Label>
								<div className="relative">
									<Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="email"
										type="email"
										autoComplete="email"
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										placeholder="alice@company.com"
										className="pl-8"
										required
									/>
								</div>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="password">Password</Label>
								<div className="relative">
									<LockKeyhole className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="password"
										type="password"
										autoComplete="current-password"
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										placeholder="Enter your password"
										className="pl-8"
										required
									/>
								</div>
							</div>

							<Button type="submit" className="w-full" disabled={isAuthLoading}>
								{isAuthLoading ? 'Signing in...' : 'Log in'}
							</Button>
						</form>
					)}

					{authError ? (
						<Alert variant="destructive">
							<AlertCircle />
							<AlertTitle>Sign in failed</AlertTitle>
							<AlertDescription>{authError}</AlertDescription>
						</Alert>
					) : null}
				</CardContent>
			</Card>
		</main>
	);
}

export default LoginPage;
