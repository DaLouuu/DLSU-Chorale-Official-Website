import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import logo from '../../imports/dlsu-chorale-logo.png';

export function Header() {
  const { theme, setTheme } = useTheme();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="DLSU Chorale" className="h-10 w-auto" />
          <span style={{ fontFamily: 'var(--font-serif)' }} className="text-xl">DLSU Chorale</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollToSection('home')} className="hover:text-primary/70 transition-colors">Home</button>
          <button onClick={() => scrollToSection('about')} className="hover:text-primary/70 transition-colors">About</button>
          <button onClick={() => scrollToSection('gallery')} className="hover:text-primary/70 transition-colors">Gallery</button>
          <button onClick={() => scrollToSection('events')} className="hover:text-primary/70 transition-colors">Events</button>
          <button onClick={() => scrollToSection('contact')} className="hover:text-primary/70 transition-colors">Contact</button>
        </div>

        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
      </nav>
    </header>
  );
}
