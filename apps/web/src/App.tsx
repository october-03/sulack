import { FormEvent, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

type HealthResponse = {
	status: string;
	timestamp: string;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

function App() {
	const [health, setHealth] = useState<HealthResponse | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [authError, setAuthError] = useState<string | null>(null);
	const [isAuthLoading, setIsAuthLoading] = useState(false);
	const [isSessionLoading, setIsSessionLoading] = useState(true);

	useEffect(() => {
		void fetch(`${apiBaseUrl}/health`)
			.then(async (response) => response.json() as Promise<HealthResponse>)
			.then((data) => setHealth(data))
			.catch(() => setHealth(null));
	}, []);

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
		} else {
			setPassword('');
		}

		setIsAuthLoading(false);
	};

	const handleLogout = async () => {
		setIsAuthLoading(true);
		setAuthError(null);

		const { error } = await supabase.auth.signOut();

		if (error) {
			setAuthError(error.message);
		}

		setIsAuthLoading(false);
	};

	const userEmail = session?.user.email ?? 'unknown user';
	const lastSeen = health?.timestamp ?? 'Start the API server to see live status.';

	return (
		<main className="app-shell">
			<section className="hero">
				<p className="eyebrow">Supabase Auth</p>
				<h1>Sulack Access Portal</h1>
				<p className="description">
					이메일 기반 로그인으로 세션을 유지하고, 이후 API 요청에 Supabase access token을 연결할 준비를 마친 상태입니다.
				</p>

				<div className="panel-grid">
					<section className="auth-card">
						<div className="card-heading">
							<span className="card-kicker">Authentication</span>
							<h2>{session ? 'Signed in' : 'Sign in'}</h2>
						</div>

						{isSessionLoading ? (
							<p className="helper-text">기존 세션을 확인하는 중입니다...</p>
						) : session ? (
							<div className="session-stack">
								<div className="session-summary">
									<span>Current user</span>
									<strong>{userEmail}</strong>
									<small>User ID: {session.user.id}</small>
								</div>
								<button
									className="primary-button secondary-tone"
									type="button"
									onClick={() => void handleLogout()}
									disabled={isAuthLoading}
								>
									{isAuthLoading ? 'Signing out...' : 'Log out'}
								</button>
							</div>
						) : (
							<form className="auth-form" onSubmit={(event) => void handleLogin(event)}>
								<label className="field">
									<span>Email</span>
									<input
										type="email"
										autoComplete="email"
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										placeholder="alice@company.com"
										required
									/>
								</label>

								<label className="field">
									<span>Password</span>
									<input
										type="password"
										autoComplete="current-password"
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										placeholder="Enter your password"
										required
									/>
								</label>

								<button className="primary-button" type="submit" disabled={isAuthLoading}>
									{isAuthLoading ? 'Signing in...' : 'Log in'}
								</button>
							</form>
						)}

						{authError ? <p className="error-message">{authError}</p> : null}
					</section>

					<aside className="status-card">
						<span>API Health</span>
						<strong>{health?.status ?? 'disconnected'}</strong>
						<small>{lastSeen}</small>
						<div className="status-divider" />
						<span>Session Status</span>
						<strong>{isSessionLoading ? 'checking' : session ? 'authenticated' : 'signed out'}</strong>
						<small>
							{session
								? 'Ready to attach the access token to protected API requests.'
								: 'Sign in to continue with channel, DM, and message features.'}
						</small>
					</aside>
				</div>
			</section>
		</main>
	);
}

export default App;
