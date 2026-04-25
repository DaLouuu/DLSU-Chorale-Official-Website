import b2b1 from '../../imports/choir-b2b-1.png';
import b2b2 from '../../imports/choir-b2b-2.png';
import bcfc from '../../imports/choir-bcfc.png';
import lpep from '../../imports/choir-lpep.png';
import tcc from '../../imports/choir-tcc.png';
import tet from '../../imports/choir-tet.png';

const images = [
  { src: b2b1, alt: 'DLSU Chorale Performance 1' },
  { src: b2b2, alt: 'DLSU Chorale Performance 2' },
  { src: bcfc, alt: 'DLSU Chorale at BCFC' },
  { src: lpep, alt: 'DLSU Chorale at LPEP' },
  { src: tcc, alt: 'DLSU Chorale at TCC' },
  { src: tet, alt: 'DLSU Chorale at TET' },
];

export function Gallery() {
  return (
    <section id="gallery" className="py-24 px-6">
      <div className="container mx-auto">
        <h2
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-5xl md:text-6xl mb-12 text-center"
        >
          Gallery
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-lg group aspect-[4/3]"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
