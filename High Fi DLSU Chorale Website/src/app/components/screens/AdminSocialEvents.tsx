import { useState, useRef } from 'react';
import { useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Icon } from '../ui/Icon';
import { Chip } from '../ui/Chip';

declare global {
  interface Window {
    SOCIAL_EVENTS: any[];
  }
}

function PhotoPicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const { theme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
        Event Photo
      </label>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Preview */}
        <div
          style={{
            width: 100,
            height: 68,
            borderRadius: 8,
            border: `1px solid ${theme.line}`,
            background: value ? `url(${value}) center/cover` : theme.cream,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!value && <Icon name="image" size={22} stroke={theme.dim} />}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            Upload photo
          </Button>
          <input
            value={value.startsWith('data:') ? '' : value}
            onChange={e => onChange(e.target.value)}
            placeholder="…or paste image URL"
            style={{
              padding: '8px 12px',
              border: `1px solid ${theme.lineDark}`,
              borderRadius: 8,
              fontSize: 12.5,
              fontFamily: FONTS.sans,
              background: theme.paper,
              color: theme.ink,
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          {value && (
            <button
              onClick={() => onChange('')}
              style={{ background: 'transparent', border: 'none', color: theme.red, fontSize: 12, cursor: 'pointer', textAlign: 'left', padding: 0 }}
            >
              Remove photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SocialEventModal({ event, onClose, onSave, onDelete }: any) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState(
    event || { name: '', date: '', time: '', venue: '', description: '', slots: 50, photo: '' }
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: theme.paper, borderRadius: 14, width: '100%', maxWidth: 650, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${theme.line}` }}
      >
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: 0, fontWeight: 500 }}>
            {event ? 'Edit Social Event' : 'Create Social Event'}
          </h3>
        </div>

        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field
            label="Event Name"
            value={formData.name}
            onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Christmas Party 2026"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Date" type="date" value={formData.date} onChange={(e: any) => setFormData({ ...formData, date: e.target.value })} />
            <Field label="Time" type="time" value={formData.time} onChange={(e: any) => setFormData({ ...formData, time: e.target.value })} />
          </div>

          <Field label="Venue" value={formData.venue} onChange={(e: any) => setFormData({ ...formData, venue: e.target.value })} placeholder="e.g. Green Court, DLSU Manila" />
          <Field label="Available Slots" type="number" value={formData.slots} onChange={(e: any) => setFormData({ ...formData, slots: Number(e.target.value) })} placeholder="e.g. 50" />

          <div>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Brief description of the event..."
              style={{ ...modalInput, resize: 'vertical' }}
            />
          </div>

          <PhotoPicker value={formData.photo || ''} onChange={url => setFormData({ ...formData, photo: url })} />
        </div>

        <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', justifyContent: 'space-between', gap: 10, background: theme.cream }}>
          <div>
            {event && (
              <Button variant="outline" onClick={() => { onDelete(event.id); onClose(); }} style={{ color: theme.red, borderColor: theme.red }}>
                Delete Event
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { onSave(formData); onClose(); }} disabled={!formData.name || !formData.date || !formData.venue}>
              {event ? 'Update' : 'Create'} Event
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminSocialEvents() {
  const { theme } = useTheme();
  const app = useApp();
  const [socialEvents, setSocialEvents] = useState<any[]>(window.SOCIAL_EVENTS || []);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const handleSave = (data: any) => {
    if (editingEvent) {
      const updated = socialEvents.map(e => e.id === editingEvent.id ? { ...e, ...data } : e);
      setSocialEvents(updated);
      window.SOCIAL_EVENTS = updated;
      app.showToast('Social event updated');
    } else {
      const next = [...socialEvents, { ...data, id: `s${Date.now()}`, signedUp: 0, mySignup: false }];
      setSocialEvents(next);
      window.SOCIAL_EVENTS = next;
      app.showToast('Social event created');
    }
    setEditingEvent(null);
  };

  const handleDelete = (id: string) => {
    const next = socialEvents.filter(e => e.id !== id);
    setSocialEvents(next);
    window.SOCIAL_EVENTS = next;
    app.showToast('Social event deleted', 'error');
  };

  window.SOCIAL_EVENTS = socialEvents;

  return (
    <>
      <PageHeader
        eyebrow="Admin Console"
        title="Social Events"
        subtitle="Create and manage social events, team building activities, and gatherings."
        actions={
          <Button icon="plus" onClick={() => { setEditingEvent(null); setShowModal(true); }}>
            Create Social Event
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {socialEvents.map((event: any) => (
          <Card key={event.id} pad={0} style={{ overflow: 'hidden' }}>
            {/* Photo header */}
            {event.photo ? (
              <div
                style={{
                  height: 160,
                  background: `linear-gradient(0deg, rgba(8,50,24,0.5), transparent), url(${event.photo}) center/cover`,
                  position: 'relative',
                }}
              />
            ) : (
              <div
                style={{
                  height: 100,
                  background: `linear-gradient(135deg, ${theme.greenDark}, ${theme.green})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="heart" size={32} stroke="rgba(255,255,255,0.4)" />
              </div>
            )}

            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <h3 style={{ fontFamily: FONTS.serif, fontSize: 18, margin: 0, fontWeight: 500 }}>{event.name}</h3>
                  <div style={{ fontSize: 12, color: theme.dim, marginTop: 4, fontFamily: FONTS.mono }}>
                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <Chip tone="blue">Social</Chip>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {event.time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <Icon name="clock" size={14} stroke={theme.dim} />
                    <span>{event.time}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <Icon name="mapPin" size={14} stroke={theme.dim} />
                  <span>{event.venue}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <Icon name="users" size={14} stroke={theme.dim} />
                  <span>{event.signedUp} / {event.slots} signed up</span>
                </div>
              </div>

              {event.description && (
                <p style={{ fontSize: 13, color: theme.dim, lineHeight: 1.6, margin: '0 0 14px' }}>{event.description}</p>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" size="sm" icon="edit" onClick={() => { setEditingEvent(event); setShowModal(true); }}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(event.id)} style={{ color: theme.red, borderColor: theme.red }}>
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {socialEvents.length === 0 && (
          <Card style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60 }}>
            <Icon name="heart" size={48} stroke={theme.dim} />
            <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: '16px 0 8px', color: theme.dim }}>No social events yet</h3>
            <p style={{ color: theme.dim, marginBottom: 20 }}>Create your first social event to start building community!</p>
            <Button icon="plus" onClick={() => { setEditingEvent(null); setShowModal(true); }}>Create Social Event</Button>
          </Card>
        )}
      </div>

      {showModal && (
        <SocialEventModal
          event={editingEvent}
          onClose={() => { setShowModal(false); setEditingEvent(null); }}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
