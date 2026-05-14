export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Intentionally bare — no ConnectionBanner, no shared nav.
  // Admin is a completely separate surface.
  return <>{children}</>;
}
