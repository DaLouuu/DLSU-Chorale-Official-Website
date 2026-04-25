import { Mail, Facebook, Instagram } from 'lucide-react';

export function Contact() {
  return (
    <section id="contact" className="py-24 px-6">
      <div className="container mx-auto max-w-4xl text-center">
        <h2
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-5xl md:text-6xl mb-12"
        >
          Get in Touch
        </h2>
        <p className="text-xl mb-12 text-muted-foreground">
          Interested in our performances or want to collaborate? We'd love to hear from you.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <a
            href="mailto:chorale@dlsu.edu.ph"
            className="flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Mail className="h-5 w-5" />
            <span>chorale@dlsu.edu.ph</span>
          </a>
          <a
            href="https://facebook.com/dlsuchorale"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <Facebook className="h-5 w-5" />
            <span>Facebook</span>
          </a>
          <a
            href="https://instagram.com/dlsuchorale"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <Instagram className="h-5 w-5" />
            <span>Instagram</span>
          </a>
        </div>
      </div>
    </section>
  );
}
