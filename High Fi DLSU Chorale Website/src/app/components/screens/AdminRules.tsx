import { useState, useEffect } from 'react';
import { useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { supabase } from '../../supabase';

type RuleDoc = {
  id: number;
  title: string;
  category: string;
  body: string;
  effective_date: string | null;
  sort_order: number;
  updated_at: string;
};

function inputStyle(theme: any) {
  return {
    width: '100%', padding: '10px 12px', border: `1px solid ${theme.lineDark}`,
    borderRadius: 8, fontSize: 13.5, fontFamily: FONTS.sans, background: theme.paper,
    color: theme.ink, outline: 'none', boxSizing: 'border-box' as const,
  };
}

function RuleDocModal({
  doc, onClose, onSave, onDelete,
}: { doc: RuleDoc | null; onClose: () => void; onSave: (data: Partial<RuleDoc>) => Promise<void>; onDelete?: () => Promise<void> }) {
  const { theme } = useTheme();
  const [title, setTitle] = useState(doc?.title ?? '');
  const [category, setCategory] = useState(doc?.category ?? '');
  const [effectiveDate, setEffectiveDate] = useState(doc?.effective_date ?? new Date().toISOString().slice(0, 10));
  const [body, setBody] = useState(doc?.body ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim() || !category.trim() || !body.trim()) { setError('Title, category, and body are all required.'); return; }
    setError('');
    setSaving(true);
    await onSave({ title: title.trim(), category: category.trim(), effective_date: effectiveDate || null, body: body.trim() });
    setSaving(false);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.paper, color: theme.ink, borderRadius: 14, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${theme.line}` }}>
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Rules & Guidelines</div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: '6px 0 0', fontWeight: 500 }}>{doc ? 'Edit document' : 'Add document'}</h3>
        </div>

        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Rehearsal Etiquette Guidelines" style={inputStyle(theme)} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Category</label>
              <input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Rehearsal Etiquette" style={inputStyle(theme)} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Effective date</label>
            <input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} style={{ ...inputStyle(theme), maxWidth: 220 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Body</label>
            <textarea
              value={body} onChange={e => setBody(e.target.value)} rows={16}
              style={{ ...inputStyle(theme), resize: 'vertical', fontFamily: FONTS.mono, fontSize: 12.5, lineHeight: 1.6 }}
            />
            <div style={{ fontSize: 11, color: theme.dim, marginTop: 4 }}>Line breaks are preserved as written. Use ALL CAPS lines as section headers and "- " for bullet points.</div>
          </div>

          {confirmDelete ? (
            <div style={{ padding: 14, background: theme.redSoft, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5 }}>Delete this document? This can't be undone.</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                <Button size="sm" variant="danger" disabled={deleting} onClick={async () => { setDeleting(true); await onDelete?.(); setDeleting(false); }}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            </div>
          ) : null}

          {error && <div style={{ fontSize: 12, color: theme.red }}>{error}</div>}
        </div>

        <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', justifyContent: 'space-between', gap: 10, background: theme.cream }}>
          <div>
            {doc && onDelete && !confirmDelete && (
              <Button variant="outline" onClick={() => setConfirmDelete(true)} style={{ color: theme.red, borderColor: theme.red }}>Delete</Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button icon="check" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : doc ? 'Save changes' : 'Add document'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminRules() {
  const { theme } = useTheme();
  const app = useApp();
  const [docs, setDocs] = useState<RuleDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDoc, setEditingDoc] = useState<RuleDoc | null | 'new'>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('rules_documents').select('*').order('sort_order', { ascending: true });
    if (error) app.showToast(`Could not load documents: ${error.message}`, 'error');
    setDocs((data ?? []) as RuleDoc[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const handleSave = async (data: Partial<RuleDoc>) => {
    if (editingDoc && editingDoc !== 'new') {
      const { error } = await supabase.from('rules_documents').update(data).eq('id', editingDoc.id);
      if (error) { app.showToast(`Could not save: ${error.message}`, 'error'); return; }
      app.showToast('Document updated');
    } else {
      const { error } = await supabase.from('rules_documents').insert({ ...data, sort_order: docs.length });
      if (error) { app.showToast(`Could not add document: ${error.message}`, 'error'); return; }
      app.showToast('Document added');
    }
    setEditingDoc(null);
    await load();
  };

  const handleDelete = async () => {
    if (!editingDoc || editingDoc === 'new') return;
    const { error } = await supabase.from('rules_documents').delete().eq('id', editingDoc.id);
    if (error) { app.showToast(`Could not delete: ${error.message}`, 'error'); return; }
    app.showToast('Document deleted');
    setEditingDoc(null);
    await load();
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Rules & Guidelines"
        subtitle="Manage the etiquette, attendance, and policy documents members can view."
        actions={<Button icon="plus" onClick={() => setEditingDoc('new')}>Add document</Button>}
      />

      <Card pad={0}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: theme.dim }}>Loading…</div>
        ) : docs.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: theme.dim }}>No documents yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {docs.map((d, i) => (
              <div
                key={d.id}
                onClick={() => setEditingDoc(d)}
                style={{
                  padding: '16px 20px', borderTop: i === 0 ? 'none' : `1px solid ${theme.line}`,
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = theme.cream)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{d.title}</div>
                  <div style={{ fontSize: 11.5, color: theme.dim, marginTop: 2 }}>
                    {d.effective_date ? `Effective ${new Date(d.effective_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No effective date'}
                  </div>
                </div>
                <Chip tone="neutral">{d.category}</Chip>
              </div>
            ))}
          </div>
        )}
      </Card>

      {editingDoc && (
        <RuleDocModal
          doc={editingDoc === 'new' ? null : editingDoc}
          onClose={() => setEditingDoc(null)}
          onSave={handleSave}
          onDelete={editingDoc !== 'new' ? handleDelete : undefined}
        />
      )}
    </>
  );
}
