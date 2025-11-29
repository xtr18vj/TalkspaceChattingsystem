import { useState, useEffect } from 'react'
import './MainPage.css'

function MainPage({ user, onLogout, onNavigate }) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="main-container">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="brand-icon">💬</span>
          <span className="brand-text">TALKSPACE</span>
        </div>
        <div className="nav-links">
          <a href="#" className="nav-link active">Home</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('messages'); }}>Messages</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('contacts'); }}>Contacts</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('settings'); }}>Settings</a>
        </div>
        <div className="nav-user">
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        <div className="welcome-section">
          <h1>{getGreeting()}, {user?.name || 'User'}! 👋</h1>
          <p className="welcome-subtitle">Welcome to TALKSPACE - Your space to connect and communicate</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card" onClick={() => onNavigate('messages')} style={{cursor: 'pointer'}}>
            <div className="stat-icon">💬</div>
            <div className="stat-info">
              <h3>Messages</h3>
              <p className="stat-number">0</p>
              <span className="stat-label">Start a conversation</span>
            </div>
          </div>
          <div className="stat-card" onClick={() => onNavigate('contacts')} style={{cursor: 'pointer'}}>
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Contacts</h3>
              <p className="stat-number">0</p>
              <span className="stat-label">Add your first contact</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔔</div>
            <div className="stat-info">
              <h3>Notifications</h3>
              <p className="stat-number">0</p>
              <span className="stat-label">All caught up!</span>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-card" onClick={() => onNavigate('messages')}>
              <span className="action-icon">✉️</span>
              <span className="action-text">New Message</span>
            </button>
            <button className="action-card" onClick={() => onNavigate('contacts')}>
              <span className="action-icon">👤</span>
              <span className="action-text">Add Contact</span>
            </button>
            <button className="action-card" onClick={() => onNavigate('createGroup')}>
              <span className="action-icon">👥</span>
              <span className="action-text">Create Group</span>
            </button>
            <button className="action-card" onClick={() => onNavigate('settings')}>
              <span className="action-icon">⚙️</span>
              <span className="action-text">Settings</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="main-footer">
        <p>© 2025 TALKSPACE. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default MainPage
