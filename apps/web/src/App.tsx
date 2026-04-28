import { useEffect, useState } from 'react';

type HealthResponse = {
  status: string;
  timestamp: string;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    void fetch(`${apiBaseUrl}/health`)
      .then(async (response) => response.json() as Promise<HealthResponse>)
      .then((data) => setHealth(data))
      .catch(() => setHealth(null));
  }, []);

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">pnpm workspace</p>
        <h1>Sulack Monorepo Starter</h1>
        <p className="description">
          NestJS API, Vite + React + TypeScript web app, and shared lint/format tooling are wired
          together.
        </p>
        <div className="status-card">
          <span>API Health</span>
          <strong>{health?.status ?? 'disconnected'}</strong>
          <small>{health?.timestamp ?? 'Start the API server to see live status.'}</small>
        </div>
      </section>
    </main>
  );
}

export default App;
