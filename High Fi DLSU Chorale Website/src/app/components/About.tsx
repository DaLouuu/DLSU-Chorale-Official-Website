export function About() {
  return (
    <section id="about" className="py-24 px-6 bg-muted/30">
      <div className="container mx-auto max-w-4xl">
        <h2
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-5xl md:text-6xl mb-12 text-center"
        >
          About Us
        </h2>
        <div className="space-y-6 text-lg leading-relaxed">
          <p>
            The De La Salle University Chorale stands as one of the Philippines' most distinguished choral ensembles,
            renowned for its unwavering commitment to musical excellence and artistic innovation.
          </p>
          <p>
            Since our establishment in 1981, we have dedicated ourselves to the highest standards of choral artistry,
            performing a diverse repertoire that spans from Renaissance polyphony to contemporary Filipino compositions.
          </p>
          <p>
            Our members are carefully selected students from De La Salle University who share a passion for music
            and a dedication to preserving and advancing the choral tradition. Through rigorous training and
            countless hours of rehearsal, we strive to create performances that inspire, move, and unite audiences.
          </p>
          <p>
            The DLSU Chorale has represented the Philippines in international competitions and festivals,
            earning accolades and recognition for our technical precision, emotional depth, and distinctive sound.
          </p>
        </div>
      </div>
    </section>
  );
}
