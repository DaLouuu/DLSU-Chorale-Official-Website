export function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="container mx-auto text-center text-muted-foreground">
        <p style={{ fontFamily: 'var(--font-serif)' }} className="text-lg mb-2">
          DLSU Chorale
        </p>
        <p className="text-sm">
          © {new Date().getFullYear()} De La Salle University Chorale. All rights reserved.
        </p>
        <p className="text-sm mt-2">
          2401 Taft Avenue, Manila 1004, Philippines
        </p>
      </div>
    </footer>
  );
}
