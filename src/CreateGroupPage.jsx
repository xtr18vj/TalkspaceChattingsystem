import { useState } from 'react'
import './CreateGroupPage.css'

function CreateGroupPage({ user, onLogout, onNavigate }) {
  const [step, setStep] = useState(1)
  const [groupData, setGroupData] = useState({
    name: '',
    description: '',
    type: 'private',
    avatar: null
  })
  const [selectedMembers, setSelectedMembers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [previewImage, setPreviewImage] = useState(null)

  const availableContacts = [
    { id: 1, name: 'John Doe', email: 'john@example.com', avatar: 'J', status: 'online' },
    { id: 2, name: 'Sarah Wilson', email: 'sarah@example.com', avatar: 'S', status: 'online' },
    { id: 3, name: 'Emily Chen', email: 'emily@example.com', avatar: 'E', status: 'offline' },
    { id: 4, name: 'Michael Brown', email: 'michael@example.com', avatar: 'M', status: 'away' },
    { id: 5, name: 'Alex Johnson', email: 'alex@example.com', avatar: 'A', status: 'online' },
    { id: 6, name: 'Lisa Anderson', email: 'lisa@example.com', avatar: 'L', status: 'offline' },
    { id: 7, name: 'David Lee', email: 'david@example.com', avatar: 'D', status: 'online' },
    { id: 8, name: 'Emma Taylor', email: 'emma@example.com', avatar: 'E', status: 'away' },
    { id: 9, name: 'Chris Martin', email: 'chris@example.com', avatar: 'C', status: 'online' },
    { id: 10, name: 'Rachel Green', email: 'rachel@example.com', avatar: 'R', status: 'offline' },
  ]

  const filteredContacts = availableContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setGroupData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setGroupData(prev => ({ ...prev, avatar: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleMember = (contact) => {
    if (selectedMembers.find(m => m.id === contact.id)) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== contact.id))
    } else {
      setSelectedMembers([...selectedMembers, contact])
    }
  }

  const removeMember = (memberId) => {
    setSelectedMembers(selectedMembers.filter(m => m.id !== memberId))
  }

  const handleCreateGroup = () => {
    // In a real app, this would send data to a backend
    console.log('Creating group:', { ...groupData, members: selectedMembers })
    alert(`Group "${groupData.name}" created successfully with ${selectedMembers.length} members!`)
    onNavigate('messages')
  }

  const canProceed = () => {
    if (step === 1) return groupData.name.trim().length > 0
    if (step === 2) return selectedMembers.length > 0
    return true
  }

  return (
    <div className="create-group-container">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="brand-icon">💬</span>
          <span className="brand-text">TALKSPACE</span>
        </div>
        <div className="nav-links">
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>Home</a>
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

      <div className="create-group-content">
        <div className="create-group-card">
          <div className="card-header">
            <button className="back-btn" onClick={() => onNavigate('home')}>
              ← Back
            </button>
            <h1>Create New Group</h1>
            <p>Set up your group chat in a few easy steps</p>
          </div>

          {/* Progress Steps */}
          <div className="progress-steps">
            <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="step-number">{step > 1 ? '✓' : '1'}</div>
              <span>Group Info</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="step-number">{step > 2 ? '✓' : '2'}</div>
              <span>Add Members</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <span>Review</span>
            </div>
          </div>

          {/* Step 1: Group Info */}
          {step === 1 && (
            <div className="step-content">
              <div className="group-avatar-section">
                <div className="group-avatar-preview">
                  {previewImage ? (
                    <img src={previewImage} alt="Group" />
                  ) : (
                    <span className="avatar-placeholder">👥</span>
                  )}
                </div>
                <div className="avatar-upload">
                  <input
                    type="file"
                    id="group-avatar"
                    accept="image/*"
                    onChange={handleImageUpload}
                    hidden
                  />
                  <label htmlFor="group-avatar" className="upload-btn">
                    📷 Upload Photo
                  </label>
                  <p>Optional: Add a group photo</p>
                </div>
              </div>

              <div className="form-group">
                <label>Group Name *</label>
                <input
                  type="text"
                  name="name"
                  value={groupData.name}
                  onChange={handleInputChange}
                  placeholder="Enter group name"
                  maxLength={50}
                />
                <span className="char-count">{groupData.name.length}/50</span>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={groupData.description}
                  onChange={handleInputChange}
                  placeholder="What's this group about?"
                  rows={3}
                  maxLength={200}
                />
                <span className="char-count">{groupData.description.length}/200</span>
              </div>

              <div className="form-group">
                <label>Group Type</label>
                <div className="type-options">
                  <button
                    type="button"
                    className={`type-btn ${groupData.type === 'private' ? 'active' : ''}`}
                    onClick={() => setGroupData(prev => ({ ...prev, type: 'private' }))}
                  >
                    <span className="type-icon">🔒</span>
                    <div>
                      <h4>Private</h4>
                      <p>Only invited members can join</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${groupData.type === 'public' ? 'active' : ''}`}
                    onClick={() => setGroupData(prev => ({ ...prev, type: 'public' }))}
                  >
                    <span className="type-icon">🌐</span>
                    <div>
                      <h4>Public</h4>
                      <p>Anyone can find and join</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Add Members */}
          {step === 2 && (
            <div className="step-content">
              <div className="selected-members">
                <h3>Selected Members ({selectedMembers.length})</h3>
                {selectedMembers.length > 0 ? (
                  <div className="members-chips">
                    {selectedMembers.map(member => (
                      <div key={member.id} className="member-chip">
                        <span className="chip-avatar">{member.avatar}</span>
                        <span>{member.name}</span>
                        <button onClick={() => removeMember(member.id)}>✕</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-members">No members selected yet</p>
                )}
              </div>

              <div className="search-members">
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="contacts-list">
                {filteredContacts.map(contact => (
                  <div
                    key={contact.id}
                    className={`contact-item ${selectedMembers.find(m => m.id === contact.id) ? 'selected' : ''}`}
                    onClick={() => toggleMember(contact)}
                  >
                    <div className="contact-avatar">
                      {contact.avatar}
                      <span className={`status-dot ${contact.status}`}></span>
                    </div>
                    <div className="contact-info">
                      <h4>{contact.name}</h4>
                      <p>{contact.email}</p>
                    </div>
                    <div className="select-indicator">
                      {selectedMembers.find(m => m.id === contact.id) ? '✓' : '+'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="step-content">
              <div className="review-section">
                <div className="review-header">
                  <div className="review-avatar">
                    {previewImage ? (
                      <img src={previewImage} alt="Group" />
                    ) : (
                      <span>👥</span>
                    )}
                  </div>
                  <div className="review-info">
                    <h2>{groupData.name}</h2>
                    <span className={`type-badge ${groupData.type}`}>
                      {groupData.type === 'private' ? '🔒 Private' : '🌐 Public'}
                    </span>
                  </div>
                </div>

                {groupData.description && (
                  <div className="review-description">
                    <h4>Description</h4>
                    <p>{groupData.description}</p>
                  </div>
                )}

                <div className="review-members">
                  <h4>Members ({selectedMembers.length + 1})</h4>
                  <div className="members-list">
                    <div className="member-item admin">
                      <div className="member-avatar">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="member-info">
                        <span>{user?.name || 'You'}</span>
                        <span className="admin-badge">Admin</span>
                      </div>
                    </div>
                    {selectedMembers.map(member => (
                      <div key={member.id} className="member-item">
                        <div className="member-avatar">{member.avatar}</div>
                        <div className="member-info">
                          <span>{member.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="card-actions">
            {step > 1 && (
              <button className="secondary-btn" onClick={() => setStep(step - 1)}>
                ← Previous
              </button>
            )}
            {step < 3 ? (
              <button
                className="primary-btn"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Next →
              </button>
            ) : (
              <button className="primary-btn create-btn" onClick={handleCreateGroup}>
                🎉 Create Group
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateGroupPage
