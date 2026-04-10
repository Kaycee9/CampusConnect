import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// ── Temporary placeholder pages (replaced in Stage 1) ─────────────────────

function Home() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-16)', textAlign: 'center' }}>
      <h1 style={{ marginBottom: 'var(--space-4)' }}>CampusConnect</h1>
      <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)' }}>
        Your campus. Your crew.
      </p>
      <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
        Trusted services, right where you are.
      </p>
      <div style={{
        marginTop: 'var(--space-8)',
        padding: 'var(--space-4)',
        background: 'var(--color-primary-50)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-primary-100)',
        display: 'inline-block',
      }}>
        <p style={{ color: 'var(--color-primary-600)', fontWeight: 'var(--font-medium)' }}>
          Stage 0 complete — project scaffolded successfully
        </p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-16)', textAlign: 'center' }}>
      <h1>404</h1>
      <p>Page not found</p>
    </div>
  );
}

export default App;
