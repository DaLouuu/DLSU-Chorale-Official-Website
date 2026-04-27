import { useState, useEffect } from 'react';
import { useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Icon } from '../ui/Icon';

declare global {
  interface Window {
    MUSIC_LIBRARY: any[];
    EVENTS: any[];
  }
}

function MusicItemModal({ item, category, onClose, onSave, onDelete }: any) {
  const { theme } = useTheme();
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = vw < 768;
  const [formData, setFormData] = useState(
    item || {
      title: '',
      type: 'Score',
      link: '',
      notes: '',
      eventId: '',
    }
  );

  const modalInput = {
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${theme.lineDark}`,
    borderRadius: 10,
    fontSize: 14,
    fontFamily: FONTS.sans,
    background: theme.paper,
    color: theme.ink,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,32,26,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.paper,
          borderRadius: 14,
          width: isMobile ? '100%' : 650,
          maxHeight: '85vh',
          overflowY: 'auto',
          border: `1px solid ${theme.line}`,
        }}
      >
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: 0, fontWeight: 500 }}>
            {item ? 'Edit Music Item' : 'Add Music Item'}
          </h3>
          <p style={{ fontSize: 13, color: theme.dim, margin: '6px 0 0' }}>
            Category: {category}
          </p>
        </div>

        <div style={{ padding: isMobile ? 18 : 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field
            label="Title"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Pamugun (F. Buencamino)"
          />

          <div>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
              Type
            </label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              style={modalInput}
            >
              <option value="Score">Score</option>
              <option value="PDF">PDF</option>
              <option value="MP3">MP3</option>
              <option value="Folder">Folder</option>
            </select>
          </div>

          <Field
            label="Link (Google Drive URL)"
            value={formData.link}
            onChange={e => setFormData({ ...formData, link: e.target.value })}
            placeholder="https://drive.google.com/file/d/..."
          />

          <Field
            label="Notes"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. SATB arrangement"
          />

          <div>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
              Associated Event (Optional)
            </label>
            <select
              value={formData.eventId || ''}
              onChange={e => setFormData({ ...formData, eventId: e.target.value })}
              style={modalInput}
            >
              <option value="">None</option>
              {window.EVENTS?.map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', justifyContent: 'space-between', gap: 10, background: theme.cream }}>
          <div>
            {item && (
              <Button
                variant="outline"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                style={{ color: theme.red, borderColor: theme.red }}
              >
                Delete
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onSave(formData);
                onClose();
              }}
              disabled={!formData.title || !formData.link}
            >
              {item ? 'Update' : 'Add'} Item
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryModal({ category, onClose, onSave, onDelete }: any) {
  const { theme } = useTheme();
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = vw < 640;
  const [name, setName] = useState(category?.category || '');

  const modalInput = {
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${theme.lineDark}`,
    borderRadius: 10,
    fontSize: 14,
    fontFamily: FONTS.sans,
    background: theme.paper,
    color: theme.ink,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,32,26,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.paper,
          borderRadius: 14,
          width: isMobile ? '100%' : 500,
          border: `1px solid ${theme.line}`,
        }}
      >
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: 0, fontWeight: 500 }}>
            {category ? 'Edit Category' : 'Add Category'}
          </h3>
        </div>

        <div style={{ padding: 28 }}>
          <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
            Category Name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Current Repertoire"
            style={modalInput}
          />
        </div>

        <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', justifyContent: 'space-between', gap: 10, background: theme.cream }}>
          <div>
            {category && (
              <Button
                variant="outline"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                style={{ color: theme.red, borderColor: theme.red }}
              >
                Delete Category
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onSave(name);
                onClose();
              }}
              disabled={!name}
            >
              {category ? 'Update' : 'Add'} Category
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminMusicLibrary() {
  const { theme } = useTheme();
  const app = useApp();
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = vw < 768;
  const [musicLibrary, setMusicLibrary] = useState(window.MUSIC_LIBRARY || []);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

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

  const handleSaveItem = (data: any) => {
    const categoryIndex = musicLibrary.findIndex((c: any) => c.category === selectedCategory);
    if (categoryIndex === -1) return;

    if (editingItem) {
      const updatedLibrary = [...musicLibrary];
      const itemIndex = updatedLibrary[categoryIndex].items.findIndex((i: any) => i === editingItem);
      updatedLibrary[categoryIndex].items[itemIndex] = data;
      setMusicLibrary(updatedLibrary);
      window.MUSIC_LIBRARY = updatedLibrary;
      app.showToast('Music item updated');
    } else {
      const updatedLibrary = [...musicLibrary];
      updatedLibrary[categoryIndex].items.push(data);
      setMusicLibrary(updatedLibrary);
      window.MUSIC_LIBRARY = updatedLibrary;
      app.showToast('Music item added');
    }
    setEditingItem(null);
  };

  const handleDeleteItem = () => {
    const categoryIndex = musicLibrary.findIndex((c: any) => c.category === selectedCategory);
    if (categoryIndex === -1) return;

    const updatedLibrary = [...musicLibrary];
    updatedLibrary[categoryIndex].items = updatedLibrary[categoryIndex].items.filter((i: any) => i !== editingItem);
    setMusicLibrary(updatedLibrary);
    window.MUSIC_LIBRARY = updatedLibrary;
    app.showToast('Music item deleted', 'error');
    setEditingItem(null);
  };

  const handleSaveCategory = (name: string) => {
    if (editingCategory) {
      const updatedLibrary = musicLibrary.map((c: any) =>
        c.id === editingCategory.id ? { ...c, category: name } : c
      );
      setMusicLibrary(updatedLibrary);
      window.MUSIC_LIBRARY = updatedLibrary;
      app.showToast('Category updated');
    } else {
      const newCategory = {
        id: `m${Date.now()}`,
        category: name,
        items: [],
      };
      setMusicLibrary([...musicLibrary, newCategory]);
      window.MUSIC_LIBRARY = [...musicLibrary, newCategory];
      app.showToast('Category added');
    }
    setEditingCategory(null);
  };

  const handleDeleteCategory = () => {
    const updatedLibrary = musicLibrary.filter((c: any) => c.id !== editingCategory.id);
    setMusicLibrary(updatedLibrary);
    window.MUSIC_LIBRARY = updatedLibrary;
    app.showToast('Category deleted', 'error');
    setEditingCategory(null);
  };

  window.MUSIC_LIBRARY = musicLibrary;

  return (
    <>
      <PageHeader
        eyebrow="Admin Console"
        title="Music Library Management"
        subtitle="Organize sheet music, practice tracks, and study materials."
        actions={
          <Button
            icon="plus"
            onClick={() => {
              setEditingCategory(null);
              setShowCategoryModal(true);
            }}
          >
            Add Category
          </Button>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {musicLibrary.map((cat: any) => (
          <div key={cat.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 10, marginBottom: 14 }}>
              <div>
                <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: 0, fontWeight: 500 }}>
                  {cat.category}
                </h3>
                <div style={{ fontSize: 12, color: theme.dim, marginTop: 4, fontFamily: FONTS.mono }}>
                  {cat.items.length} {cat.items.length === 1 ? 'item' : 'items'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button
                  size="sm"
                  variant="outline"
                  icon="plus"
                  onClick={() => {
                    setSelectedCategory(cat.category);
                    setEditingItem(null);
                    setShowItemModal(true);
                  }}
                >
                  Add Item
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon="edit"
                  onClick={() => {
                    setEditingCategory(cat);
                    setShowCategoryModal(true);
                  }}
                >
                  Edit Category
                </Button>
              </div>
            </div>

            <Card pad={0}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {cat.items.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: theme.dim }}>
                    No items in this category yet. Click "Add Item" to get started.
                  </div>
                ) : (
                  cat.items.map((item: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr auto auto auto',
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

                      <button
                        onClick={() => {
                          setSelectedCategory(cat.category);
                          setEditingItem(item);
                          setShowItemModal(true);
                        }}
                        style={{
                          padding: 8,
                          background: 'transparent',
                          border: `1px solid ${theme.line}`,
                          borderRadius: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          color: theme.ink,
                        }}
                      >
                        <Icon name="edit" size={16} />
                      </button>

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
                  ))
                )}
              </div>
            </Card>
          </div>
        ))}
      </div>

      {showItemModal && (
        <MusicItemModal
          item={editingItem}
          category={selectedCategory}
          onClose={() => {
            setShowItemModal(false);
            setEditingItem(null);
          }}
          onSave={handleSaveItem}
          onDelete={handleDeleteItem}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onSave={handleSaveCategory}
          onDelete={handleDeleteCategory}
        />
      )}
    </>
  );
}
