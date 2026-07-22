import { useEffect, useMemo, useState } from 'react';
import {
  changeUserStatus,
  createAdminUser,
  getAdminUsers,
  getCurrentUser,
  loginUser,
  removeUser,
} from './api.js';

const TOKEN_KEY = 'novaauth_token';

function Logo() {
  return (
    <div className="logo" aria-label="NovaAuth">
      <span className="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 3.5 19 7v5c0 4.2-2.7 7.6-7 8.8C7.7 19.6 5 16.2 5 12V7l7-3.5Z" />
          <path d="m9.2 12 1.8 1.8 3.9-4" />
        </svg>
      </span>
      <span>NovaAuth</span>
    </div>
  );
}

function EyeIcon({ hidden }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 3 18 18" />
      <path d="M10.7 10.7a2 2 0 0 0 2.6 2.6" />
      <path d="M9.9 4.3A10.7 10.7 0 0 1 12 4c5.4 0 9 5.4 9 5.4a16.6 16.6 0 0 1-2.3 2.8" />
      <path d="M6.6 6.6C4.3 8.2 3 10.4 3 10.4S6.6 16 12 16c1 0 2-.2 2.8-.5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12s3.6-5.6 9-5.6S21 12 21 12s-3.6 5.6-9 5.6S3 12 3 12Z" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value));
}

function AuthPage({ onAuthenticated }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (message) setMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setMessage('Please enter a valid email address.');
      return;
    }

    if (!form.password) {
      setMessage('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const result = await loginUser(form);
      localStorage.setItem(TOKEN_KEY, result.token);
      onAuthenticated(result.user, result.token);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="auth-card">
        <aside className="brand-panel">
          <Logo />
          <div className="brand-copy">
            <span className="eyebrow">Admin-controlled access</span>
            <h1>Secure access.<br />Managed centrally.</h1>
            <p>
              Only accounts created by the administrator can sign in. Public registration
              is disabled to keep your workspace private and controlled.
            </p>
          </div>

          <div className="feature-list">
            <div className="feature-item"><span className="check">✓</span><div><strong>Admin-created users</strong><small>No public account registration</small></div></div>
            <div className="feature-item"><span className="check">✓</span><div><strong>Role-based dashboards</strong><small>Separate admin and user access</small></div></div>
            <div className="feature-item"><span className="check">✓</span><div><strong>Account controls</strong><small>Enable, disable, or delete users</small></div></div>
          </div>

          <div className="brand-footer">
            <span className="shield-chip">RBAC</span>
            <span>Protected by JWT and password hashing</span>
          </div>
        </aside>

        <div className="form-panel">
          <div className="mobile-logo"><Logo /></div>
          <div className="form-heading">
            <span className="status-pill"><i /> Private workspace</span>
            <h2>Welcome back</h2>
            <p>Sign in using credentials provided by your administrator.</p>
          </div>

          <div className="access-note">
            <span>i</span>
            <p>New accounts cannot be created from this page. Contact your administrator for access.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span>Email address</span>
              <div className="input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
                <input name="email" type="email" value={form.email} onChange={updateField} placeholder="you@example.com" autoComplete="email" required />
              </div>
            </label>

            <label className="field">
              <span>Password</span>
              <div className="input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} placeholder="Enter your password" autoComplete="current-password" required />
                <button className="password-toggle" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  <EyeIcon hidden={showPassword} />
                </button>
              </div>
            </label>

            {message && <div className="form-message error" role="alert"><span>!</span>{message}</div>}

            <button className="primary-button" type="submit" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? 'Signing in...' : 'Sign in to dashboard'}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <div className="demo-box">
            <span>Default admin</span>
            <code>admin@example.com</code>
            <code>Admin@123</code>
          </div>

          <p className="terms">Access is restricted to authorized users only.</p>
        </div>
      </section>
    </main>
  );
}

function DashboardHeader({ user, onLogout, admin = false }) {
  return (
    <header className="dashboard-nav">
      <Logo />
      <div className="nav-actions">
        {admin && <span className="role-badge">Administrator</span>}
        <div className="mini-profile">
          <span>{getInitials(user.name)}</span>
          <div><strong>{user.name}</strong><small>{user.email}</small></div>
        </div>
        <button className="logout-button" onClick={onLogout}>Log out</button>
      </div>
    </header>
  );
}

function UserDashboard({ user, onLogout }) {
  const firstName = user.name.split(' ')[0];
  const joinedDate = useMemo(() => formatDate(user.createdAt), [user.createdAt]);

  return (
    <main className="dashboard-shell">
      <DashboardHeader user={user} onLogout={onLogout} />
      <section className="dashboard-content">
        <div className="welcome-card">
          <div>
            <span className="eyebrow">Access approved by administrator</span>
            <h1>Welcome, {firstName}.</h1>
            <p>Your account is active and this page is protected by a verified JWT.</p>
          </div>
          <div className="success-orb" aria-hidden="true">✓</div>
        </div>

        <div className="stats-grid">
          <article className="stat-card"><span>Account status</span><strong className="status-value"><i /> Active</strong><small>Your administrator has enabled access</small></article>
          <article className="stat-card"><span>Member since</span><strong>{joinedDate}</strong><small>Account creation date</small></article>
          <article className="stat-card"><span>Account role</span><strong>User</strong><small>Standard workspace permissions</small></article>
        </div>

        <div className="dashboard-grid">
          <article className="profile-card">
            <div className="card-title"><div><span>Profile details</span><h2>Your account</h2></div><span className="large-avatar">{getInitials(user.name)}</span></div>
            <dl>
              <div><dt>Full name</dt><dd>{user.name}</dd></div>
              <div><dt>Email address</dt><dd>{user.email}</dd></div>
              <div><dt>Account ID</dt><dd>{user.id}</dd></div>
            </dl>
          </article>

          <article className="activity-card">
            <div className="card-title"><div><span>Recent activity</span><h2>Security timeline</h2></div></div>
            <div className="timeline">
              <div><i className="timeline-dot" /><section><strong>Signed in successfully</strong><small>Just now · Current browser</small></section></div>
              <div><i className="timeline-dot muted" /><section><strong>Administrator access approved</strong><small>Your account is currently active</small></section></div>
              <div><i className="timeline-dot muted" /><section><strong>Account created</strong><small>{joinedDate}</small></section></div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

function CreateUserForm({ onCreated, onCancel, loading }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setMessage('');
  }

  async function submit(event) {
    event.preventDefault();
    if (form.name.trim().length < 2) return setMessage('Please enter the user’s full name.');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setMessage('Please enter a valid email address.');
    if (form.password.length < 8) return setMessage('Password must be at least 8 characters.');
    await onCreated(form, setMessage);
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="create-user-title">
        <div className="modal-heading">
          <div><span className="eyebrow">Administrator action</span><h2 id="create-user-title">Create user account</h2><p>The user can sign in immediately after creation.</p></div>
          <button className="icon-button" onClick={onCancel} aria-label="Close">×</button>
        </div>

        <form onSubmit={submit}>
          <label className="field"><span>Full name</span><div className="input-wrap"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3" /><path d="M5 20c.4-4 2.7-6 7-6s6.6 2 7 6" /></svg><input name="name" value={form.name} onChange={updateField} placeholder="Alex Johnson" autoFocus /></div></label>
          <label className="field"><span>Email address</span><div className="input-wrap"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg><input name="email" type="email" value={form.email} onChange={updateField} placeholder="alex@example.com" /></div></label>
          <label className="field"><span>Temporary password</span><div className="input-wrap"><svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg><input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} placeholder="Minimum 8 characters" /><button className="password-toggle" type="button" onClick={() => setShowPassword((current) => !current)}><EyeIcon hidden={showPassword} /></button></div></label>
          <p className="password-hint">Share this temporary password securely with the user.</p>
          {message && <div className="form-message error"><span>!</span>{message}</div>}
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={onCancel}>Cancel</button><button className="primary-button compact" disabled={loading}>{loading && <span className="spinner" />}{loading ? 'Creating...' : 'Create user'}</button></div>
        </form>
      </section>
    </div>
  );
}

function AdminPanel({ user, token, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [search, setSearch] = useState('');

  async function loadUsers() {
    try {
      setLoading(true);
      const result = await getAdminUsers(token);
      setUsers(result.users);
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  const normalUsers = users.filter((item) => item.role === 'user');
  const activeCount = normalUsers.filter((item) => item.status === 'active').length;
  const disabledCount = normalUsers.filter((item) => item.status === 'disabled').length;
  const filteredUsers = normalUsers.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(search.toLowerCase()));

  async function handleCreate(payload, setFormMessage) {
    try {
      setActionLoading('create');
      const result = await createAdminUser(token, payload);
      setUsers((current) => [result.user, ...current]);
      setShowCreate(false);
      setNotice({ type: 'success', text: `${result.user.name}'s account was created successfully.` });
    } catch (error) {
      setFormMessage(error.message);
    } finally {
      setActionLoading('');
    }
  }

  async function handleStatus(target) {
    const nextStatus = target.status === 'active' ? 'disabled' : 'active';
    try {
      setActionLoading(target.id);
      const result = await changeUserStatus(token, target.id, nextStatus);
      setUsers((current) => current.map((item) => item.id === target.id ? result.user : item));
      setNotice({ type: 'success', text: `${target.name}'s account is now ${nextStatus}.` });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setActionLoading('');
    }
  }

  async function handleDelete(target) {
    const confirmed = window.confirm(`Delete ${target.name}'s account permanently?`);
    if (!confirmed) return;

    try {
      setActionLoading(target.id);
      await removeUser(token, target.id);
      setUsers((current) => current.filter((item) => item.id !== target.id));
      setNotice({ type: 'success', text: `${target.name}'s account was deleted.` });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setActionLoading('');
    }
  }

  return (
    <main className="dashboard-shell admin-shell">
      <DashboardHeader user={user} onLogout={onLogout} admin />
      <section className="admin-content">
        <div className="admin-hero">
          <div><span className="eyebrow">User access management</span><h1>Admin dashboard</h1><p>Create and control every account that can access your application.</p></div>
          <button className="primary-button create-button" onClick={() => setShowCreate(true)}><span>＋</span>Create new user</button>
        </div>

        {notice.text && <div className={`notice ${notice.type}`}><span>{notice.type === 'success' ? '✓' : '!'}</span><p>{notice.text}</p><button onClick={() => setNotice({ type: '', text: '' })}>×</button></div>}

        <div className="admin-stats">
          <article><span className="metric-icon purple">◎</span><div><small>Total users</small><strong>{normalUsers.length}</strong><p>Accounts created by admin</p></div></article>
          <article><span className="metric-icon green">✓</span><div><small>Active users</small><strong>{activeCount}</strong><p>Can currently sign in</p></div></article>
          <article><span className="metric-icon orange">—</span><div><small>Disabled users</small><strong>{disabledCount}</strong><p>Login access is blocked</p></div></article>
        </div>

        <section className="users-card">
          <div className="users-toolbar">
            <div><span className="eyebrow">Account directory</span><h2>Managed users</h2></div>
            <label className="search-box"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" /></label>
          </div>

          {loading ? (
            <div className="table-state"><span className="spinner dark" /><p>Loading users...</p></div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state"><span>＋</span><h3>{normalUsers.length ? 'No matching users' : 'No users created yet'}</h3><p>{normalUsers.length ? 'Try a different search.' : 'Create the first account to allow someone to sign in.'}</p>{!normalUsers.length && <button className="primary-button compact" onClick={() => setShowCreate(true)}>Create first user</button>}</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>User</th><th>Status</th><th>Created</th><th>Role</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredUsers.map((item) => (
                    <tr key={item.id}>
                      <td><div className="user-cell"><span>{getInitials(item.name)}</span><div><strong>{item.name}</strong><small>{item.email}</small></div></div></td>
                      <td><span className={`status-badge ${item.status}`}><i />{item.status}</span></td>
                      <td>{formatDate(item.createdAt)}</td>
                      <td><span className="plain-role">User</span></td>
                      <td><div className="row-actions"><button disabled={actionLoading === item.id} className="action-button" onClick={() => handleStatus(item)}>{item.status === 'active' ? 'Disable' : 'Enable'}</button><button disabled={actionLoading === item.id} className="action-button danger" onClick={() => handleDelete(item)}>Delete</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {showCreate && <CreateUserForm onCreated={handleCreate} onCancel={() => setShowCreate(false)} loading={actionLoading === 'create'} />}
    </main>
  );
}

function LoadingScreen() {
  return <main className="loading-screen"><span className="spinner dark" /><p>Checking your session...</p></main>;
}

export default function App() {
  const [session, setSession] = useState({ loading: true, user: null, token: null });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setSession({ loading: false, user: null, token: null });
      return;
    }

    getCurrentUser(token)
      .then(({ user }) => setSession({ loading: false, user, token }))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setSession({ loading: false, user: null, token: null });
      });
  }, []);

  function handleAuthenticated(user, token) {
    setSession({ loading: false, user, token });
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setSession({ loading: false, user: null, token: null });
  }

  if (session.loading) return <LoadingScreen />;
  if (!session.user) return <AuthPage onAuthenticated={handleAuthenticated} />;
  if (session.user.role === 'admin') return <AdminPanel user={session.user} token={session.token} onLogout={handleLogout} />;
  return <UserDashboard user={session.user} onLogout={handleLogout} />;
}
