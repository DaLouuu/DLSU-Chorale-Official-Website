import { useState, useRef, useEffect } from 'react';
import { useTheme, useApp, useRouter } from '../../App';
import { FONTS } from '../../theme';
import { Icon } from './Icon';
import { Chip } from './Chip';

type Notification = {
  id: string;
  type: 'excuse' | 'payment' | 'announcement' | 'event';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
};

export function NotificationBell() {
  const { theme } = useTheme();
  const app = useApp();
  const { role, go } = useRouter();
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Generate notifications based on context
  const notifications: Notification[] = [];

  if (role === 'admin') {
    const pendingExcuses = app.excuses.filter((e: any) => e.status === 'Pending');
    const pendingPayments = (app.fees as any[]).filter((f: any) => f.status === 'pending');

    if (pendingExcuses.length > 0) {
      notifications.push({
        id: 'excuses',
        type: 'excuse',
        title: `${pendingExcuses.length} Excuse${pendingExcuses.length > 1 ? 's' : ''} Awaiting Review`,
        message: `You have ${pendingExcuses.length} pending excuse request${pendingExcuses.length > 1 ? 's' : ''} to review.`,
        timestamp: '10 min ago',
        read: false,
        link: 'admin-excuses',
      });
    }

    if (pendingPayments.length > 0) {
      notifications.push({
        id: 'payments',
        type: 'payment',
        title: `${pendingPayments.length} Payment${pendingPayments.length > 1 ? 's' : ''} to Verify`,
        message: `${pendingPayments.length} payment submission${pendingPayments.length > 1 ? 's need' : ' needs'} verification.`,
        timestamp: '25 min ago',
        read: false,
        link: 'admin-fees',
      });
    }
  } else {
    // Member notifications
    const myExcuses = app.excuses.filter((e: any) => e.memberId === 12100234);
    const decidedExcuses = myExcuses.filter((e: any) => e.status !== 'Pending' && !e.notified);

    if (decidedExcuses.length > 0) {
      decidedExcuses.forEach((e: any) => {
        notifications.push({
          id: `excuse-${e.id}`,
          type: 'excuse',
          title: `Excuse ${e.status}`,
          message: `Your excuse for ${e.date} has been ${e.status.toLowerCase()} by ${e.approvedBy}.`,
          timestamp: '2h ago',
          read: false,
          link: 'member-excuses',
        });
      });
    }

    const myPendingPayments = (app.fees as any[]).filter((f: any) => f.status === 'pending' && f.memberId === 12100234);
    if (myPendingPayments.length > 0) {
      notifications.push({
        id: 'payment-pending',
        type: 'payment',
        title: 'Payment Submitted',
        message: `Your payment of ₱${myPendingPayments[0].amount} is pending admin verification.`,
        timestamp: '1h ago',
        read: false,
        link: 'member-fees',
      });
    }

    notifications.push({
      id: 'announcement-1',
      type: 'announcement',
      title: 'New Announcement',
      message: 'BCFC callboard — sectional schedules posted',
      timestamp: '3h ago',
      read: false,
      link: 'member-announcements',
    });
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowPanel(false);
      }
    }

    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPanel]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: `1px solid ${theme.line}`,
          background: theme.paper,
          color: theme.ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Icon name="bell" size={18} />
        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: theme.red,
              color: '#fff',
              fontSize: 10,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unreadCount}
          </div>
        )}
      </button>

      {showPanel && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 380,
            maxHeight: 480,
            background: theme.paper,
            border: `1px solid ${theme.line}`,
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
            <div style={{ fontSize: 16, fontWeight: 500, fontFamily: FONTS.serif }}>Notifications</div>
            <div style={{ fontSize: 12, color: theme.dim, marginTop: 2 }}>
              {unreadCount} unread
            </div>
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: theme.dim }}>
                <Icon name="bell" size={36} stroke={theme.dim} />
                <div style={{ marginTop: 12, fontSize: 14 }}>No new notifications</div>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (n.link) go(n.link as any);
                    setShowPanel(false);
                  }}
                  style={{
                    padding: '14px 20px',
                    borderBottom: `1px solid ${theme.line}`,
                    cursor: 'pointer',
                    background: n.read ? theme.paper : theme.cream,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{n.title}</div>
                    {!n.read && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.green, flexShrink: 0, marginLeft: 8, marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ fontSize: 12.5, color: theme.dim, lineHeight: 1.5, marginBottom: 6 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: theme.dim, fontFamily: FONTS.mono }}>{n.timestamp}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
