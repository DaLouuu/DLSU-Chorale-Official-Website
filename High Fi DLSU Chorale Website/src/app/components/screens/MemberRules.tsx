import { useState, useEffect } from 'react';
import { useTheme } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { supabase } from '../../supabase';

type RuleDoc = {
  id: number;
  title: string;
  category: string;
  body: string;
  effective_date: string | null;
};

export function MemberRules() {
  const { theme } = useTheme();
  const [docs, setDocs] = useState<RuleDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    supabase.from('rules_documents').select('*').order('sort_order', { ascending: true })
      .then(({ data }) => { setDocs((data ?? []) as RuleDoc[]); setLoading(false); });
  }, []);

  const categories = ['All', ...Array.from(new Set(docs.map(d => d.category)))];
  const filtered = category === 'All' ? docs : docs.filter(d => d.category === category);

  return (
    <>
      <PageHeader
        eyebrow="Member Portal"
        title="Rules & Guidelines"
        subtitle="Etiquette, attendance, and policy documents from the Executive Board."
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            style={{
              padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12.5, fontFamily: FONTS.sans,
              border: `1px solid ${category === c ? theme.green : theme.lineDark}`,
              background: category === c ? theme.green : 'transparent',
              color: category === c ? '#fff' : theme.ink,
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <Card><div style={{ padding: 24, textAlign: 'center', color: theme.dim }}>Loading…</div></Card>
      ) : filtered.length === 0 ? (
        <Card><div style={{ padding: 24, textAlign: 'center', color: theme.dim }}>No documents in this category yet.</div></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(d => {
            const open = openId === d.id;
            return (
              <Card key={d.id} pad={0}>
                <button
                  onClick={() => setOpenId(open ? null : d.id)}
                  style={{
                    width: '100%', padding: '18px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontFamily: FONTS.serif, fontSize: 17, fontWeight: 500, color: theme.ink }}>{d.title}</span>
                      <Chip tone="neutral">{d.category}</Chip>
                    </div>
                    {d.effective_date && (
                      <div style={{ fontSize: 11.5, color: theme.dim, fontFamily: FONTS.mono }}>
                        EFFECTIVE {new Date(d.effective_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <Icon name={open ? 'chevronDown' : 'chevronRight'} size={16} stroke={theme.dim} />
                </button>
                {open && (
                  <div style={{ padding: '0 20px 22px', borderTop: `1px solid ${theme.line}`, paddingTop: 18 }}>
                    <div style={{ fontSize: 13.5, color: theme.ink, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{d.body}</div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
