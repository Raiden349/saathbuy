export default function PublicLoading() {
  return (
    <main aria-busy="true" aria-label="Loading page" className="route-loading home-main">
      <span className="sr-only">Loading SaathBuy page…</span>
      <div className="loading-line loading-title" />
      <div className="loading-line loading-copy" />
      <div className="loading-card" />
      <div className="loading-grid"><div className="loading-card" /><div className="loading-card" /></div>
    </main>
  );
}
