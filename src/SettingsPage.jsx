import { useState, useRef } from 'react'
import { userAPI } from './services/api'
import './SettingsPage.css'

const API_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

// Helper to get full avatar URL
const getAvatarUrl = (avatar) => {
  if (!avatar) return null
  if (avatar.startsWith('data:') || avatar.startsWith('http')) return avatar
  return `${API_URL}${avatar}`
}

function SettingsPage({ user, onLogout, onNavigate, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || ''
  })
  const [profileImage, setProfileImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(getAvatarUrl(user?.avatar))
  const fileInputRef = useRef(null)
  
  const [preferences, setPreferences] = useState({
    darkMode: true,
    notifications: true,
    soundEnabled: true,
    emailNotifications: false,
    showOnlineStatus: true,
    readReceipts: true
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'everyone',
    lastSeenVisibility: 'contacts',
    photoVisibility: 'everyone',
    statusVisibility: 'everyone'
  })

  const [notifications, setNotifications] = useState({
    messageNotifications: true,
    groupNotifications: true,
    mentionNotifications: true,
    soundAlerts: true,
    desktopNotifications: true,
    emailDigest: 'daily'
  })

  const [successMessage, setSuccessMessage] = useState('')
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setProfileImage(null)
    setPreviewImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      let updatedUser = { ...user }
      
      // Upload profile picture if changed
      if (profileImage) {
        const formData = new FormData()
        formData.append('avatar', profileImage)
        const avatarResponse = await userAPI.uploadAvatar(formData)
        if (avatarResponse.user) {
          updatedUser = { ...updatedUser, avatar: avatarResponse.user.avatar }
          setPreviewImage(getAvatarUrl(avatarResponse.user.avatar))
          setProfileImage(null) // Clear the file input
        }
      }
      
      // Update profile data
      const response = await userAPI.updateProfile({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website
      })
      
      if (response.user && onUpdateUser) {
        onUpdateUser({ ...response.user, avatar: updatedUser.avatar || response.user.avatar })
      }
      
      setSuccessMessage('Profile updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
      setSuccessMessage('Failed to save profile. Please try again.')
      setTimeout(() => setSuccessMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreferenceChange = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handlePrivacyChange = (key, value) => {
    setPrivacy(prev => ({ ...prev, [key]: value }))
  }

  const handleNotificationChange = (key, value) => {
    if (typeof value === 'boolean') {
      setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
    } else {
      setNotifications(prev => ({ ...prev, [key]: value }))
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswords(prev => ({ ...prev, [name]: value }))
  }

  const handleChangePassword = (e) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('Passwords do not match!')
      return
    }
    setSuccessMessage('Password changed successfully!')
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="settings-section">
            <h2>Profile Settings</h2>
            <p className="section-description">Manage your personal information and profile details</p>
            
            <div className="profile-photo-section">
              <div className="photo-preview">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" />
                ) : (
                  <div className="photo-placeholder">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              <div className="photo-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button 
                  className="upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📷 Upload Photo
                </button>
                {previewImage && (
                  <button className="remove-btn" onClick={handleRemoveImage}>
                    🗑️ Remove
                  </button>
                )}
                <p className="photo-hint">JPG, PNG or GIF. Max 5MB</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={profileData.location}
                    onChange={handleProfileChange}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleProfileChange}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              <div className="form-group full-width">
                <label>Website</label>
                <input
                  type="url"
                  name="website"
                  value={profileData.website}
                  onChange={handleProfileChange}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <button type="submit" className="save-btn">
                💾 Save Changes
              </button>
            </form>
          </div>
        )

      case 'account':
        return (
          <div className="settings-section">
            <h2>Account Settings</h2>
            <p className="section-description">Manage your account security and password</p>

            <div className="account-info-card">
              <div className="info-icon">🔐</div>
              <div className="info-content">
                <h3>Change Password</h3>
                <p>Update your password to keep your account secure</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="password-form">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                />
              </div>
              <button type="submit" className="save-btn">
                🔒 Update Password
              </button>
            </form>

            <div className="danger-zone">
              <h3>⚠️ Danger Zone</h3>
              <div className="danger-actions">
                <div className="danger-item">
                  <div>
                    <h4>Deactivate Account</h4>
                    <p>Temporarily disable your account</p>
                  </div>
                  <button className="deactivate-btn">Deactivate</button>
                </div>
                <div className="danger-item">
                  <div>
                    <h4>Delete Account</h4>
                    <p>Permanently delete your account and all data</p>
                  </div>
                  <button className="delete-btn">Delete Account</button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'privacy':
        return (
          <div className="settings-section">
            <h2>Privacy Settings</h2>
            <p className="section-description">Control who can see your information</p>

            <div className="privacy-options">
              <div className="privacy-item">
                <div className="privacy-info">
                  <h4>Profile Visibility</h4>
                  <p>Who can see your profile</p>
                </div>
                <select 
                  value={privacy.profileVisibility}
                  onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">Contacts Only</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div className="privacy-item">
                <div className="privacy-info">
                  <h4>Last Seen</h4>
                  <p>Who can see when you were last online</p>
                </div>
                <select 
                  value={privacy.lastSeenVisibility}
                  onChange={(e) => handlePrivacyChange('lastSeenVisibility', e.target.value)}
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">Contacts Only</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div className="privacy-item">
                <div className="privacy-info">
                  <h4>Profile Photo</h4>
                  <p>Who can see your profile photo</p>
                </div>
                <select 
                  value={privacy.photoVisibility}
                  onChange={(e) => handlePrivacyChange('photoVisibility', e.target.value)}
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">Contacts Only</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div className="privacy-item">
                <div className="privacy-info">
                  <h4>Status</h4>
                  <p>Who can see your status updates</p>
                </div>
                <select 
                  value={privacy.statusVisibility}
                  onChange={(e) => handlePrivacyChange('statusVisibility', e.target.value)}
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">Contacts Only</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>
            </div>

            <div className="blocked-section">
              <h3>Blocked Users</h3>
              <p>Manage your blocked contacts</p>
              <button className="manage-blocked-btn">Manage Blocked Users</button>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="settings-section">
            <h2>Notification Settings</h2>
            <p className="section-description">Customize how you receive notifications</p>

            <div className="notification-options">
              <div className="notification-item">
                <div className="notification-info">
                  <h4>Message Notifications</h4>
                  <p>Get notified when you receive new messages</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.messageNotifications}
                    onChange={() => handleNotificationChange('messageNotifications', true)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <h4>Group Notifications</h4>
                  <p>Get notified about group activities</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.groupNotifications}
                    onChange={() => handleNotificationChange('groupNotifications', true)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <h4>Mention Notifications</h4>
                  <p>Get notified when someone mentions you</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.mentionNotifications}
                    onChange={() => handleNotificationChange('mentionNotifications', true)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <h4>Sound Alerts</h4>
                  <p>Play sounds for notifications</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.soundAlerts}
                    onChange={() => handleNotificationChange('soundAlerts', true)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <h4>Desktop Notifications</h4>
                  <p>Show notifications on your desktop</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.desktopNotifications}
                    onChange={() => handleNotificationChange('desktopNotifications', true)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <h4>Email Digest</h4>
                  <p>Receive email summaries of your activity</p>
                </div>
                <select 
                  value={notifications.emailDigest}
                  onChange={(e) => handleNotificationChange('emailDigest', e.target.value)}
                >
                  <option value="never">Never</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 'appearance':
        return (
          <div className="settings-section">
            <h2>Appearance Settings</h2>
            <p className="section-description">Customize how TALKSPACE looks</p>

            <div className="appearance-options">
              <div className="appearance-item">
                <div className="appearance-info">
                  <h4>🌙 Dark Mode</h4>
                  <p>Use dark theme for the interface</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.darkMode}
                    onChange={() => handlePreferenceChange('darkMode')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="theme-preview">
                <h4>Theme Colors</h4>
                <div className="color-options">
                  <button className="color-btn active" style={{background: 'linear-gradient(135deg, #7e22ce, #a855f7)'}}></button>
                  <button className="color-btn" style={{background: 'linear-gradient(135deg, #2563eb, #3b82f6)'}}></button>
                  <button className="color-btn" style={{background: 'linear-gradient(135deg, #059669, #10b981)'}}></button>
                  <button className="color-btn" style={{background: 'linear-gradient(135deg, #dc2626, #ef4444)'}}></button>
                  <button className="color-btn" style={{background: 'linear-gradient(135deg, #d97706, #f59e0b)'}}></button>
                  <button className="color-btn" style={{background: 'linear-gradient(135deg, #db2777, #ec4899)'}}></button>
                </div>
              </div>

              <div className="font-size-option">
                <h4>Chat Font Size</h4>
                <div className="font-size-buttons">
                  <button className="font-btn">A-</button>
                  <span>Medium</span>
                  <button className="font-btn">A+</button>
                </div>
              </div>

              <div className="appearance-item">
                <div className="appearance-info">
                  <h4>💬 Chat Bubbles</h4>
                  <p>Use rounded chat bubble style</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="appearance-item">
                <div className="appearance-info">
                  <h4>✨ Animations</h4>
                  <p>Enable UI animations</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="settings-container">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="brand-icon">💬</span>
          <span className="brand-text">TALKSPACE</span>
        </div>
        <div className="nav-links">
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>Home</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('messages'); }}>Messages</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('contacts'); }}>Contacts</a>
          <a href="#" className="nav-link active">Settings</a>
        </div>
        <div className="nav-user">
          <div className="user-avatar">
            {previewImage ? (
              <img src={previewImage} alt="Profile" className="avatar-image" />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : 'U'
            )}
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </nav>

      {successMessage && (
        <div className="success-toast">
          ✅ {successMessage}
        </div>
      )}

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <div className="sidebar-header">
            <h2>⚙️ Settings</h2>
          </div>
          <nav className="settings-nav">
            <button 
              className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className="nav-icon">👤</span>
              <span>Profile</span>
            </button>
            <button 
              className={`settings-nav-item ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <span className="nav-icon">🔐</span>
              <span>Account</span>
            </button>
            <button 
              className={`settings-nav-item ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              <span className="nav-icon">🛡️</span>
              <span>Privacy</span>
            </button>
            <button 
              className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <span className="nav-icon">🔔</span>
              <span>Notifications</span>
            </button>
            <button 
              className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <span className="nav-icon">🎨</span>
              <span>Appearance</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <p>TALKSPACE v1.0.0</p>
            <a href="#">Help & Support</a>
          </div>
        </aside>

        <main className="settings-content">
          {renderTabContent()}
        </main>
      </div>
    </div>
  )
}

export default SettingsPage
