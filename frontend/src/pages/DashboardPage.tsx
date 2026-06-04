import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ImageItem, RoleItem } from '../types';
import { fetchUserImages, uploadImage, deleteImage } from '../services/image';
import { fetchUsers, fetchRoles } from '../services/admin';
import UserManagementPage from './UserManagementPage';

interface DashboardPageProps {
  token: string;
  user: User | null;
  onLogout: () => void;
}

const defaultRoles = [
  { id: 1, name: 'Admin', description: 'Administrator with full access' },
  { id: 2, name: 'Supervisor', description: 'Supervisor with limited access' },
  { id: 3, name: 'Worker', description: 'Worker with basic access' },
];

type Section = 'home' | 'capture' | 'my-images' | 'admin';

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const colors = ['#e0e7ff:#4338ca', '#fce7f3:#9d174d', '#d1fae5:#065f46', '#fef3c7:#92400e', '#ede9fe:#5b21b6'];
  const [bg, fg] = colors[name.charCodeAt(0) % colors.length].split(':');
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 600, flexShrink: 0,
    }}>{initials}</div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '9px 12px',
        border: 'none',
        borderRadius: 8,
        background: active ? '#111827' : 'transparent',
        color: active ? 'white' : '#6b7280',
        fontSize: 14,
        fontWeight: active ? 500 : 400,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'all 0.15s',
      }}
    >
      <span style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #f0ede8',
      borderRadius: 10,
      padding: '20px 24px',
    }}>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, color: '#111827', letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage({ token, user, onLogout }: DashboardPageProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [section, setSection] = useState<Section>('home');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  
  // Mobile responsive sidebar toggle state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'Admin';
  const isSupervisor = user?.role === 'Supervisor';
  const isWorker = user?.role === 'Worker';

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setLoading(true);
      try {
        const imgs = await fetchUserImages();
        if (isMounted) setImages(imgs);
        if (isAdmin || isSupervisor) {
          const [usrs, rls] = await Promise.all([fetchUsers(), fetchRoles()]);
          if (isMounted) {
            setUsers(usrs);
            setRoles(rls.length ? rls : defaultRoles);
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err?.response?.data?.message ?? 'Unable to load dashboard data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    init();
    return () => { isMounted = false; };
  }, [isAdmin, isSupervisor]);

  useEffect(() => {
    if (section !== 'capture') {
      setCameraReady(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Media devices API not supported in this environment.');
      return;
    }

    let dynamicStream: MediaStream | null = null;

    navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
      .then((stream) => {
        dynamicStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.log("Playback interrupted", e));
          setCameraReady(true);
        }
      })
      .catch((err) => {
        console.error("Camera access error:", err);
        setCameraReady(false);
      });

    return () => {
      if (dynamicStream) {
        dynamicStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [section]);

  const handleUploadFile = async (file: File) => {
    setError(''); setCapturing(true);
    try {
      const uploaded = await uploadImage(file);
      setImages((prev) => [uploaded, ...prev]);
      setSuccess('Image uploaded successfully.');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to upload image.');
    } finally {
      setCapturing(false);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setError(''); setCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot render capture framework context.');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.95));
      if (!blob) throw new Error('Cannot capture image data stream.');
      await handleUploadFile(new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to capture photo.');
    } finally {
      setCapturing(false);
    }
  };

  const handleDeleteImage = async (id: number) => {
    setError('');
    try {
      await deleteImage(id);
      setImages((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to delete image.');
    }
  };

 const navItems: { key: Section; label: string; icon: React.ReactNode }[] = [
  ...(isAdmin ? [{
    key: 'home' as Section, 
    label: 'Overview', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
    )
  }] : []),
  // Adding the explicit array type mapping here keeps the TS compiler perfectly happy
  ...((isAdmin || isSupervisor || isWorker) ? [{
    key: 'capture' as Section, 
    label: 'Capture Image', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" /><circle cx="8" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" /><path d="M5 4l1-2h4l1 2" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
    )
  }] : []),
  ...((isAdmin|| isSupervisor || isWorker) ? [{
    key: 'my-images' as Section, 
    label: 'My Images', 
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" /><path d="M1 11l4-4 3 3 2-2 5 4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><circle cx="5.5" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" /></svg>
    )
  }] : [])
];

  const handleNavClick = (key: Section) => {
    setSection(key);
    setMobileMenuOpen(false); // Close responsive drawer layout upon navigation selection
  };

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder, textarea::placeholder { color: #9ca3af; }
        input:focus, select:focus { outline: none; border-color: #111827 !important; box-shadow: 0 0 0 3px rgba(17,24,39,0.07); }
        .img-card:hover .img-overlay { opacity: 1 !important; }
        button:focus-visible { outline: 2px solid #111827; outline-offset: 2px; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Responsive Screen Overrides */
        @media (max-width: 768px) {
          .responsive-sidebar {
            position: fixed !important;
            left: 0;
            top: 0;
            bottom: 0;
            transform: translateX(${mobileMenuOpen ? '0' : '-100%'});
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 100;
            box-shadow: ${mobileMenuOpen ? '4px 0 24px rgba(0,0,0,0.15)' : 'none'};
          }
          .responsive-main {
            padding: 20px 16px 40px !important;
          }
          .responsive-header {
            flex-direction: column-reverse;
            gap: 16px;
            align-items: flex-start !important;
          }
          .responsive-menu-btn {
            display: flex !important;
          }
          .responsive-backdrop {
            display: ${mobileMenuOpen ? 'block' : 'none'} !important;
          }
          .responsive-card {
            padding: 20px !important;
          }
        }
      `}</style>

      {/* Mobile Drawer Overlay Backdrop */}
      <div 
        className="responsive-backdrop"
        onClick={() => setMobileMenuOpen(false)}
        style={{
          display: 'none',
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 99
        }}
      />

      {/* Sidebar Layout */}
      <aside className="responsive-sidebar" style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.logo}>
            <div style={s.logoMark}>
              <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                <rect width="12" height="12" rx="3" fill="white" fillOpacity="0.9" />
                <rect x="16" width="12" height="12" rx="3" fill="white" fillOpacity="0.5" />
                <rect y="16" width="12" height="12" rx="3" fill="white" fillOpacity="0.5" />
                <rect x="16" y="16" width="12" height="12" rx="3" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <span style={s.logoText}>Robro System</span>
          </div>
        </div>

        <nav style={s.nav}>
          <div style={s.navSection}>
            <div style={s.navLabel}>Main</div>
            {navItems.map((item) => (
              <NavItem key={item.key} icon={item.icon} label={item.label} active={section === item.key} onClick={() => handleNavClick(item.key)} />
            ))}
          </div>

          {(isAdmin || isSupervisor) && (
            <div style={s.navSection}>
              <div style={s.navLabel}>Admin</div>
              <NavItem
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.4" /><path d="M1 14c0-3 2-5 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M11 9v4M9 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
                label="User Management"
                active={section === 'admin'}
                onClick={() => handleNavClick("admin")}
              />
            </div>
          )}
        </nav>

        <div style={s.sidebarFooter}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, overflow: 'hidden' }}>
            <Avatar name={user?.username || user?.email || 'U'} size={32} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.username || user?.email}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={onLogout} style={s.sidebarLogout} title="Sign out">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M6 13H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 10l3-2.5L10 5M13 7.5H6" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main content body panel */}
      <main className="responsive-main" style={s.main}>
        <div className="responsive-header" style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>
              {section === 'home' && 'Overview'}
              {section === 'capture' && 'Capture Image'}
              {section === 'my-images' && 'My Images'}
              {section === 'admin' && 'User Management'}
            </h1>
            <p style={s.pageSubtitle}>
              Welcome back, <strong>{user?.username || user?.email}</strong> — logged in as {user?.role}
            </p>
          </div>

          {/* Hamburger Menu Mobile Button toggle */}
          <button 
            className="responsive-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              background: 'white',
              border: '1px solid #f0ede8',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

        {error && <div style={{ ...s.alert, ...s.alertError, marginBottom: 24 }}>{error}</div>}
        {success && <div style={{ ...s.alert, ...s.alertSuccess, marginBottom: 24 }}>{success}</div>}

        {/* Home section */}
        {section === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <StatCard label="My images" value={images.length} sub="captured or uploaded" />
              {isAdmin && <StatCard label="Total users" value={users.length} sub="across all roles" />}
              {isAdmin && <StatCard label="Active users" value={users.filter((u) => u.isActive).length} sub="currently active" />}
              <StatCard label="Role" value={user?.role ?? '—'} sub="your access level" />
            </div>

            <div className="responsive-card" style={s.card}>
              <h2 style={s.cardTitle}>What you can do</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 16 }}>
                {[
                  { label: 'Capture or upload images', desc: 'Use your camera or upload files directly.', action: () => setSection('capture'), btnLabel: 'Go to capture' },
                  { label: 'View your images', desc: 'Browse all images you have captured so far.', action: () => setSection('my-images'), btnLabel: 'View images' },
                  ...(isAdmin ? [{ label: 'Manage users', desc: 'Create accounts, assign roles, and control access.', action: () => setSection('admin'), btnLabel: 'User management' }] : []),
                ].map((item) => (
                  <div key={item.label} style={{ background: '#f9f8f6', borderRadius: 10, padding: '20px', border: '1px solid #f0ede8' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>{item.desc}</div>
                    <button onClick={item.action} style={s.secondaryBtn}>{item.btnLabel} →</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Capture section */}
        {section === 'capture' && (
          <div className="responsive-card" style={s.card}>
            <h2 style={s.cardTitle}>Camera</h2>
            <div style={{ borderRadius: 10, overflow: 'hidden', background: '#0a0a0a', marginTop: 16, position: 'relative' }}>
              <video
                ref={videoRef}
                playsInline
                muted
                style={{ width: '100%', display: 'block', maxHeight: 420, objectFit: 'cover' }}
              />
              {!cameraReady && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  color: '#6b7280', padding: 16, textAlign: 'center', gap: 12, background: '#1a1a1a'
                }}>
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect x="2" y="10" width="36" height="24" rx="4" stroke="#374151" strokeWidth="2" />
                    <circle cx="20" cy="22" r="6" stroke="#374151" strokeWidth="2" />
                    <path d="M14 10l2-4h8l2 4" stroke="#374151" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 14 }}>Connecting to camera stream...</span>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} hidden />
            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
              <button
                onClick={handleCapture}
                disabled={!cameraReady || capturing}
                style={{
                  ...s.primaryBtn,
                  opacity: (!cameraReady || capturing) ? 0.6 : 1,
                  cursor: (!cameraReady || capturing) ? 'not-allowed' : 'pointer',
                }}
              >
                {capturing ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    Capturing…
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="3" width="13" height="10" rx="2" stroke="white" strokeWidth="1.4" /><circle cx="7.5" cy="8" r="2.5" stroke="white" strokeWidth="1.4" /><path d="M4 3l1-2h4l1 2" stroke="white" strokeWidth="1.4" strokeLinejoin="round" /></svg>
                    Take Photo
                  </span>
                )}
              </button>
              <label style={s.secondaryBtn as React.CSSProperties}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1v9M4 6l3.5-4L11 6M2 12h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Upload File
                <input hidden accept="image/*" type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadFile(f); }} />
              </label>
            </div>
          </div>
        )}

        {/* My images section */}
        {section === 'my-images' && (
          <div className="responsive-card" style={s.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={s.cardTitle}>My Images ({images.length})</h2>
            </div>
            {images.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: 12, opacity: 0.4 }}>
                  <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M4 34l12-12 8 8 6-6 14 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <circle cx="16" cy="18" r="4" stroke="currentColor" strokeWidth="2" />
                </svg>
                <div style={{ fontSize: 15 }}>No images yet</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>
                  <button onClick={() => setSection('capture')} style={{ ...s.secondaryBtn, marginTop: 16 }}>
                    Capture your first image →
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {images.map((img) => (
                  <div key={img.id} className="img-card" style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #f0ede8', position: 'relative' }}>
                    <img
                      src={`http://localhost:5000/${img.filename}`}
                      alt={img.filename}
                      style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                    />
                    {isAdmin &&
                      <div className="img-overlay" style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.2s',
                      }}>
                        <button
                          onClick={() => handleDeleteImage(img.id)}
                          style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                        >
                          Delete
                        </button>
                      </div>
                    }
                    <div style={{ padding: '12px 14px', background: 'white' }}>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {new Date(img.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin section */}
        {section === 'admin' && (isAdmin || isSupervisor) && <UserManagementPage token={token} user={user} onLogout={onLogout} />}
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: { display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", background: '#f9f8f6', color: '#111827' },
  sidebar: { width: 230, background: 'white', borderRight: '1px solid #f0ede8', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 },
  sidebarTop: { padding: '20px 16px 16px', borderBottom: '1px solid #f0ede8' },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoMark: { width: 32, height: 32, background: '#111827', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoText: { fontSize: 14, fontWeight: 600, color: '#111827' },
  nav: { flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 },
  navSection: { display: 'flex', flexDirection: 'column', gap: 2 },
  navLabel: { fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 12px', marginBottom: 6 },
  sidebarFooter: { padding: '16px', borderTop: '1px solid #f0ede8', display: 'flex', alignItems: 'center', gap: 10 },
  sidebarLogout: { width: 30, height: 30, background: 'transparent', border: '1px solid #f0ede8', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  main: { flex: 1, padding: '40px 40px 64px', overflowY: 'auto', minWidth: 0 }, // minWidth: 0 prevents flex child text components from breaking grids
  pageHeader: { marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: 26, fontWeight: 600, color: '#111827', letterSpacing: '-0.4px', marginBottom: 6 },
  pageSubtitle: { fontSize: 14, color: '#6b7280' },
  card: { background: 'white', border: '1px solid #f0ede8', borderRadius: 12, padding: '28px 32px' },
  cardTitle: { fontSize: 16, fontWeight: 600, color: '#111827' },
  alert: { padding: '12px 16px', borderRadius: 8, fontSize: 14 },
  alertError: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' },
  alertSuccess: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' },
  alertInfo: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' },
  input: { height: 40, padding: '0 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, color: '#111827', fontFamily: "'DM Sans', sans-serif", background: 'white', width: '100%', transition: 'border-color 0.15s' },
  primaryBtn: { height: 40, padding: '0 20px', background: '#111827', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'opacity 0.15s' },
  secondaryBtn: { height: 36, padding: '0 16px', background: 'transparent', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'background 0.15s', textDecoration: 'none' },
};