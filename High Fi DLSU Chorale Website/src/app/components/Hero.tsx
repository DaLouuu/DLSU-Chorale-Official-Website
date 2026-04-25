import logo from '../../imports/dlsu-chorale-logo.png';

export function Hero() {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center pt-20 px-6">
      <div className="container mx-auto text-center">
        <img src={logo} alt="DLSU Chorale Logo" className="w-40 h-40 mx-auto mb-8 object-contain" />
        <h1
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-6xl md:text-7xl lg:text-8xl mb-6"
        >
          DLSU Chorale
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12">
          A legacy of musical excellence, artistry, and passion since 1981
        </p>
        <button
          onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Discover Our Story
        </button>
      </div>
    </section>
  );
}
