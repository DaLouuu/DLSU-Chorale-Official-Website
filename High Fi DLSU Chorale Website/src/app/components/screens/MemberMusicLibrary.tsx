import { useState } from 'react';
import { useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Chip } from '../ui/Chip';

type MusicItem = {
  title: string;
  type: string;
  link: string;
  notes: string;
};

type MusicCategory = {
  id: string;
  category: string;
  items: MusicItem[];
};

declare global {
  interface Window {
    MUSIC_LIBRARY: MusicCategory[];
    EVENTS: any[];
  }
}

export function MemberMusicLibrary() {
  const { theme } = useTheme();
  const app = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');

  const getIcon = (type: string) => {
    if (type === 'Score') return 'file';
    if (type === 'PDF') return 'file';
    if (type === 'MP3') return 'music';
    if (type === 'Folder') return 'folder';
    return 'file';
  };

  const getTypeColor = (type: string) => {
    if (type === 'Score') return theme.green;
    if (type === 'PDF') return theme.blue;
    if (type === 'MP3') return theme.amber;
    if (type === 'Folder') return theme.dim;
    return theme.ink;
  };

  const filterItems = (items: MusicItem[]) => {
    return items.filter(item => {
      const matchesSearch = !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || item.type === typeFilter;

      const matchesEvent = eventFilter === 'all' || (item as any).eventId === eventFilter;

      return matchesSearch && matchesType && matchesEvent;
    });
  };

  const allEvents = window.EVENTS || app.events;
  const allTypes = Array.from(new Set(
    window.MUSIC_LIBRARY.flatMap(cat => cat.items.map(item => item.type))
  ));

  return (
    <>
      <PageHeader
        eyebrow="Module 7"
        title="Music Library"
        subtitle="Access sheet music, practice tracks, and study guides. All files are hosted on Google Drive."
      />

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
              Search
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: theme.cream, border: `1px solid ${theme.line}`, borderRadius: 10 }}>
              <Icon name="search" size={16} stroke={theme.dim} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search music library..."
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: 14,
                  color: theme.ink,
                  fontFamily: FONTS.sans,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    color: theme.dim,
                  }}
                >
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
              Type
            </label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${theme.line}`,
                borderRadius: 10,
                fontSize: 14,
                fontFamily: FONTS.sans,
                background: theme.paper,
                color: theme.ink,
                outline: 'none',
              }}
            >
              <option value="all">All Types</option>
              {allTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
              Event/Repertoire
            </label>
            <select
              value={eventFilter}
              onChange={e => setEventFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${theme.line}`,
                borderRadius: 10,
                fontSize: 14,
                fontFamily: FONTS.sans,
                background: theme.paper,
                color: theme.ink,
                outline: 'none',
              }}
            >
              <option value="all">All Events</option>
              {allEvents.map((event: any) => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {window.MUSIC_LIBRARY.map(cat => {
          const filteredItems = filterItems(cat.items);
          if (filteredItems.length === 0) return null;

          return (
          <div key={cat.id}>
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: 0, fontWeight: 500 }}>{cat.category}</h3>
              <div style={{ fontSize: 12, color: theme.dim, marginTop: 4, fontFamily: FONTS.mono }}>
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                {filteredItems.length !== cat.items.length && ` (filtered from ${cat.items.length})`}
              </div>
            </div>

            <Card pad={0}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {filteredItems.map((item, i) => {
                  const itemEvent = (item as any).eventId ? allEvents.find((e: any) => e.id === (item as any).eventId) : null;
                  return (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto auto auto',
                      gap: 16,
                      alignItems: 'center',
                      padding: '16px 20px',
                      borderTop: i === 0 ? 'none' : `1px solid ${theme.line}`,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: theme.cream,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name={getIcon(item.type) as any} size={20} stroke={getTypeColor(item.type)} />
                    </div>

                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: theme.dim }}>{item.notes}</div>
                      {itemEvent && (
                        <div style={{ marginTop: 4 }}>
                          <Chip tone="neutral" style={{ fontSize: 10, padding: '2px 6px' }}>
                            {itemEvent.name}
                          </Chip>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: FONTS.mono,
                        letterSpacing: 0.5,
                        color: getTypeColor(item.type),
                        textTransform: 'uppercase',
                        background: theme.cream,
                        padding: '4px 10px',
                        borderRadius: 6,
                      }}
                    >
                      {item.type}
                    </div>

                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        fontSize: 13,
                        background: theme.green,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        textDecoration: 'none',
                        fontFamily: FONTS.sans,
                      }}
                    >
                      <Icon name="externalLink" size={14} />
                      Open
                    </a>
                  </div>
                  );
                })}
              </div>
            </Card>
          </div>
          );
        })}

        {window.MUSIC_LIBRARY.every(cat => filterItems(cat.items).length === 0) && (
          <Card style={{ textAlign: 'center', padding: 60 }}>
            <Icon name="search" size={48} stroke={theme.dim} />
            <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: '16px 0 8px', color: theme.dim }}>
              No results found
            </h3>
            <p style={{ color: theme.dim, marginBottom: 20 }}>
              Try adjusting your filters or search query
            </p>
            <Button onClick={() => { setSearchQuery(''); setTypeFilter('all'); setEventFilter('all'); }}>
              Clear Filters
            </Button>
          </Card>
        )}

        <div style={{ padding: 20, background: theme.blueSoft, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <Icon name="info" size={20} stroke={theme.blue} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Google Drive Access</div>
              <div style={{ fontSize: 13, color: theme.dim, lineHeight: 1.6 }}>
                All music files are stored in the DLSU Chorale shared Google Drive. Make sure you're logged in with your DLSU email
                to access the files. If you encounter permission issues, contact the Music committee.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
