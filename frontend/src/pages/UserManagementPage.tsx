import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { User, RoleItem, CreateUserPayload } from '../types';
import { fetchUsers, fetchRoles, registerUser, assignRole, deactivateUser, removeUser } from '../services/admin';

interface UserManagementPageProps {
  token: string;
  user: User | null;
  onLogout: () => void;
}

const defaultRoles: RoleItem[] = [
  { id: 1, name: 'Admin', description: 'Administrator with full access' },
  { id: 2, name: 'Supervisor', description: 'Supervisor with limited access' },
  { id: 3, name: 'Worker', description: 'Worker with basic access' },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    Admin: { bg: '#ecfdf5', color: '#065f46', border: '#6ee7b7' },
    Supervisor: { bg: '#eff6ff', color: '#1e40af', border: '#93c5fd' },
    Worker: { bg: '#f9fafb', color: '#374151', border: '#d1d5db' },
  };
  const style = map[role] ?? map.Worker;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 500,
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      letterSpacing: '0.01em',
    }}>
      {role}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const colors = [
    { bg: '#e0e7ff', color: '#4338ca' },
    { bg: '#fce7f3', color: '#9d174d' },
    { bg: '#d1fae5', color: '#065f46' },
    { bg: '#fef3c7', color: '#92400e' },
    { bg: '#ede9fe', color: '#5b21b6' },
  ];
  const idx = name.charCodeAt(0) % colors.length;
  const c = colors[idx];
  return (
    <div style={{
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: c.bg,
      color: c.color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      fontWeight: 600,
      flexShrink: 0,
    }}>
      {getInitials(name)}
    </div>
  );
}

export default function UserManagementPage({ user, onLogout }: UserManagementPageProps) {
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'Admin') return <Navigate to="/dashboard" replace />;

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserPayload>({ username: '', email: '', password: '', role: 'Worker' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [usersRes, rolesRes] = await Promise.all([fetchUsers(), fetchRoles()]);
        setUsers(usersRes);
        setRoles(rolesRes.length ? rolesRes : defaultRoles);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Unable to load user data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredUsers = useMemo(
    () => users.filter((item) => {
      const match = [item.username, item.email, item.role].join(' ').toLowerCase().includes(searchValue.toLowerCase());
      const roleMatch = roleFilter === 'All' || item.role === roleFilter;
      return match && roleMatch;
    }),
    [users, searchValue, roleFilter],
  );

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleSaveUser = async () => {
    setError(''); setSuccess('');
    try {
      const created = await registerUser(newUser);
      setUsers((prev) => [created, ...prev]);
      setSuccess('User created successfully.');
      setDialogOpen(false);
      setNewUser({ username: '', email: '', password: '', role: 'Worker' });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to create user.');
    }
  };

  const handleRoleChange = async (id: number, roleId: number) => {
    setError(''); setSuccess('');
    try {
      const updated = await assignRole(id, roleId);
      setUsers((prev) => prev.map((item) => item.id === id ? { ...item, role: updated.role, roleId: updated.roleId } : item));
      setSuccess('Role updated.');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to assign role.');
    }
  };

  const handleDeactivate = async (id: number) => {
    setError(''); setSuccess('');
    try {
      await deactivateUser(id);
      setUsers((prev) => prev.map((item) => item.id === id ? { ...item, isActive: false } : item));
      setSuccess('User deactivated.');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to deactivate user.');
    }
  };

  const handleRemove = async (id: number) => {
    setError(''); setSuccess('');
    try {
      await removeUser(id);
      setUsers((prev) => prev.filter((item) => item.id !== id));
      setSuccess('User removed.');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to remove user.');
    }
  };

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #9ca3af; }
        input:focus, select:focus { outline: none; border-color: #111827 !important; box-shadow: 0 0 0 3px rgba(17,24,39,0.07); }
        button:hover { opacity: 0.85; }
        .row-hover:hover { background: #f9fafb !important; }
        .action-btn:hover { background: #f3f4f6 !important; }
        .kebab-btn:hover { background: #f3f4f6 !important; }
        input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: #111827; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
      `}</style>

      <div style={s.pageContent}>
        {/* Alerts */}
        {error && (
          <div style={{ ...s.alert, ...s.alertError }}>{error}</div>
        )}
        {success && (
          <div style={{ ...s.alert, ...s.alertSuccess }}>{success}</div>
        )}

        {/* Table card */}
        <div style={s.tableCard}>
          {/* Table toolbar */}
          <div style={s.toolbar}>
            <div style={s.toolbarLeft}>
              <span style={s.totalLabel}>All users <span style={s.totalCount}>{users.length}</span></span>
            </div>
            <div style={s.toolbarRight}>
              <div style={s.searchWrapper}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={s.searchIcon}>
                  <circle cx="7" cy="7" r="5" stroke="#9ca3af" strokeWidth="1.5" />
                  <path d="M11 11l2.5 2.5" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search"
                  style={s.searchInput}
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={s.filterSelect}
              >
                <option value="All">All roles</option>
                {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
              <button onClick={() => setDialogOpen(true)} style={s.addBtn}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Add user
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr style={s.theadRow}>
                  <th style={{ ...s.th, width: 44 }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={toggleAll}
                    />
                  </th>
                  <th style={{ ...s.th, textAlign: 'left' }}>User name</th>
                  <th style={{ ...s.th, textAlign: 'left' }}>Role</th>
                  <th style={{ ...s.th, textAlign: 'left' }}>Status</th>
                  <th style={{ ...s.th, textAlign: 'left' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      Date added
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 8L3 5h6L6 8z" fill="#6b7280" />
                      </svg>
                    </span>
                  </th>
                  <th style={{ ...s.th, textAlign: 'left' }}>Change role</th>
                  <th style={{ ...s.th, width: 44 }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
                      Loading…
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
                      No users match this filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((item) => (
                    <tr key={item.id} className="row-hover" style={s.tbodyRow}>
                      <td style={s.td}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                        />
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={item.username || item.email} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                              {item.username || '—'}
                            </div>
                            <div style={{ fontSize: 13, color: '#6b7280' }}>{item.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={s.td}>
                        <RoleBadge role={item.role ?? 'Worker'} />
                      </td>
                      <td style={s.td}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 13,
                          color: item.isActive ? '#065f46' : '#6b7280',
                        }}>
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: item.isActive ? '#10b981' : '#d1d5db',
                            display: 'inline-block',
                          }} />
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ ...s.td, color: '#6b7280', fontSize: 13 }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td style={s.td}>
                        <select
                          value={item.roleId ?? 0}
                          onChange={(e) => handleRoleChange(item.id, Number(e.target.value))}
                          style={s.roleSelect}
                        >
                          {roles.map((r) => (
                            <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                          ))}
                        </select>
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="action-btn"
                            disabled={!item.isActive}
                            onClick={() => handleDeactivate(item.id)}
                            title="Deactivate"
                            style={{
                              ...s.iconBtn,
                              color: item.isActive ? '#dc2626' : '#d1d5db',
                              cursor: item.isActive ? 'pointer' : 'not-allowed',
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                              <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M5 7.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                          <button
                            className="action-btn"
                            onClick={() => handleRemove(item.id)}
                            title="Remove"
                            style={{ ...s.iconBtn, color: '#6b7280' }}
                          >
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                              <path d="M2 4h11M6 4V2.5h3V4M5.5 4l.5 8M9.5 4l-.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div style={s.tableFooter}>
            <span style={{ color: '#6b7280', fontSize: 13 }}>
              Showing {filteredUsers.length} of {users.length} accounts
            </span>
          </div>
        </div>
      </div>

      {/* Create user dialog */}
      {dialogOpen && (
        <div style={s.overlay}>
          <div style={s.dialog}>
            <div style={s.dialogHeader}>
              <h2 style={s.dialogTitle}>Add new user</h2>
              <button onClick={() => setDialogOpen(false)} style={s.dialogClose}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div style={s.dialogBody}>
              {[
                { label: 'Username', key: 'username', type: 'text', placeholder: 'john_doe' },
                { label: 'Email address', key: 'email', type: 'email', placeholder: 'john@company.com' },
                { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
              ].map((field) => (
                <div key={field.key} style={s.dialogField}>
                  <label style={s.dialogLabel}>{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(newUser as any)[field.key]}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    style={s.dialogInput}
                  />
                </div>
              ))}
              <div style={s.dialogField}>
                <label style={s.dialogLabel}>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
                  style={s.dialogInput}
                >
                  {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
            </div>

            <div style={s.dialogFooter}>
              <button onClick={() => setDialogOpen(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={handleSaveUser} style={s.createBtn}>Create user</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline MenuItem alias for select options (non-MUI)
function MenuItem({ children, value, key }: { children: React.ReactNode; value: any; key?: any }) {
  return <option value={value}>{children}</option>;
}

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: '#f9f8f6',
    fontFamily: "'DM Sans', sans-serif",
    color: '#111827',
  },
  topbar: {
    height: 56,
    background: 'white',
    borderBottom: '1px solid #f0ede8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  topbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 32,
    height: 32,
    background: '#111827',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111827',
  },
  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    height: 34,
    padding: '0 14px',
    background: 'transparent',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  logoutBtn: {
    height: 34,
    padding: '0 14px',
    background: '#111827',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    color: 'white',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  pageContent: {
    maxWidth: 1100,
    margin: '0 auto',
    // padding: '40px 32px 64px',
  },
  pageHeader: {
    marginBottom: 32,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 600,
    color: '#111827',
    letterSpacing: '-0.4px',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  alert: {
    padding: '12px 16px',
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
  },
  alertError: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
  },
  alertSuccess: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#16a34a',
  },
  tableCard: {
    background: 'white',
    borderRadius: 12,
    border: '1px solid #f0ede8',
    overflow: 'hidden',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #f3f4f6',
    gap: 12,
    flexWrap: 'wrap' as const,
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  totalCount: {
    fontSize: 13,
    fontWeight: 500,
    background: '#f3f4f6',
    color: '#374151',
    padding: '1px 8px',
    borderRadius: 20,
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  searchWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute' as const,
    left: 10,
    pointerEvents: 'none' as const,
  },
  searchInput: {
    height: 36,
    padding: '0 12px 0 34px',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 14,
    color: '#111827',
    fontFamily: "'DM Sans', sans-serif",
    width: 200,
    transition: 'border-color 0.15s',
  },
  filterSelect: {
    height: 36,
    padding: '0 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 14,
    color: '#374151',
    fontFamily: "'DM Sans', sans-serif",
    background: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  addBtn: {
    height: 36,
    padding: '0 16px',
    background: '#111827',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  theadRow: {
    background: '#f9fafb',
    borderBottom: '1px solid #f3f4f6',
  },
  th: {
    padding: '10px 16px',
    fontSize: 12,
    fontWeight: 500,
    color: '#6b7280',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap' as const,
  },
  tbodyRow: {
    borderBottom: '1px solid #f9fafb',
    background: 'white',
    transition: 'background 0.1s',
  },
  td: {
    padding: '14px 16px',
    verticalAlign: 'middle' as const,
  },
  roleSelect: {
    height: 30,
    padding: '0 8px',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    fontSize: 13,
    color: '#374151',
    fontFamily: "'DM Sans', sans-serif",
    background: 'white',
    cursor: 'pointer',
  },
  iconBtn: {
    width: 28,
    height: 28,
    background: 'transparent',
    border: 'none',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  tableFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #f3f4f6',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    backdropFilter: 'blur(2px)',
  },
  dialog: {
    background: 'white',
    borderRadius: 14,
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  dialogHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px 0',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#111827',
  },
  dialogClose: {
    width: 32,
    height: 32,
    background: '#f3f4f6',
    border: 'none',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  dialogBody: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  dialogField: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  dialogLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
  },
  dialogInput: {
    height: 40,
    padding: '0 12px',
    border: '1.5px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 14,
    color: '#111827',
    fontFamily: "'DM Sans', sans-serif",
    background: 'white',
    width: '100%',
    transition: 'border-color 0.15s',
  },
  dialogFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    padding: '0 24px 20px',
  },
  cancelBtn: {
    height: 38,
    padding: '0 18px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  createBtn: {
    height: 38,
    padding: '0 18px',
    background: '#111827',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: 'white',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
};