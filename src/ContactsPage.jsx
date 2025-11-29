import { useState } from 'react'
import './ContactsPage.css'

function ContactsPage({ user, onLogout, onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '' })

  const [contacts, setContacts] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1 555-0101', status: 'online', favorite: true, avatar: 'J' },
    { id: 2, name: 'Sarah Wilson', email: 'sarah@example.com', phone: '+1 555-0102', status: 'online', favorite: true, avatar: 'S' },
    { id: 3, name: 'Emily Chen', email: 'emily@example.com', phone: '+1 555-0103', status: 'offline', favorite: false, avatar: 'E' },
    { id: 4, name: 'Michael Brown', email: 'michael@example.com', phone: '+1 555-0104', status: 'away', favorite: false, avatar: 'M' },
    { id: 5, name: 'Alex Johnson', email: 'alex@example.com', phone: '+1 555-0105', status: 'online', favorite: false, avatar: 'A' },
    { id: 6, name: 'Lisa Anderson', email: 'lisa@example.com', phone: '+1 555-0106', status: 'offline', favorite: true, avatar: 'L' },
    { id: 7, name: 'David Lee', email: 'david@example.com', phone: '+1 555-0107', status: 'online', favorite: false, avatar: 'D' },
    { id: 8, name: 'Emma Taylor', email: 'emma@example.com', phone: '+1 555-0108', status: 'away', favorite: false, avatar: 'E' },
  ])

  const [selectedContact, setSelectedContact] = useState(null)

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeTab === 'favorites') return matchesSearch && contact.favorite
    if (activeTab === 'online') return matchesSearch && contact.status === 'online'
    return matchesSearch
  })

  const toggleFavorite = (contactId) => {
    setContacts(contacts.map(c => 
      c.id === contactId ? { ...c, favorite: !c.favorite } : c
    ))
  }

  const handleAddContact = (e) => {
    e.preventDefault()
    if (!newContact.name || !newContact.email) return

    const contact = {
      id: Date.now(),
      name: newContact.name,
      email: newContact.email,
      phone: newContact.phone || 'Not provided',
      status: 'offline',
      favorite: false,
      avatar: newContact.name.charAt(0).toUpperCase()
    }

    setContacts([...contacts, contact])
    setNewContact({ name: '', email: '', phone: '' })
    setShowAddModal(false)
  }

  const handleDeleteContact = (contactId) => {
    setContacts(contacts.filter(c => c.id !== contactId))
    setSelectedContact(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#22c55e'
      case 'away': return '#fbbf24'
      case 'offline': return '#6b7280'
      default: return '#6b7280'
    }
  }

  return (
    <div className="contacts-container">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="brand-icon">💬</span>
          <span className="brand-text">TALKSPACE</span>
        </div>
        <div className="nav-links">
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>Home</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('messages'); }}>Messages</a>
          <a href="#" className="nav-link active">Contacts</a>
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

      <div className="contacts-layout">
        {/* Contacts List */}
        <div className="contacts-sidebar">
          <div className="sidebar-header">
            <h2>Contacts</h2>
            <button className="add-contact-btn" onClick={() => setShowAddModal(true)}>
              ➕ Add
            </button>
          </div>

          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="contacts-tabs">
            <button 
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All ({contacts.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              ⭐ Favorites
            </button>
            <button 
              className={`tab-btn ${activeTab === 'online' ? 'active' : ''}`}
              onClick={() => setActiveTab('online')}
            >
              🟢 Online
            </button>
          </div>

          <div className="contacts-list">
            {filteredContacts.length === 0 ? (
              <div className="no-contacts">
                <p>No contacts found</p>
              </div>
            ) : (
              filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="contact-avatar">
                    {contact.avatar}
                    <span 
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(contact.status) }}
                    ></span>
                  </div>
                  <div className="contact-info">
                    <div className="contact-name">
                      {contact.name}
                      {contact.favorite && <span className="favorite-star">⭐</span>}
                    </div>
                    <div className="contact-status">{contact.status}</div>
                  </div>
                  <button 
                    className="favorite-btn"
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(contact.id); }}
                  >
                    {contact.favorite ? '★' : '☆'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contact Details */}
        <div className="contact-details">
          {selectedContact ? (
            <>
              <div className="details-header">
                <div className="details-avatar">
                  {selectedContact.avatar}
                  <span 
                    className="status-indicator large"
                    style={{ backgroundColor: getStatusColor(selectedContact.status) }}
                  ></span>
                </div>
                <h2>{selectedContact.name}</h2>
                <span className={`status-badge ${selectedContact.status}`}>
                  {selectedContact.status}
                </span>
              </div>

              <div className="details-content">
                <div className="info-section">
                  <h3>Contact Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-icon">📧</span>
                      <div>
                        <label>Email</label>
                        <p>{selectedContact.email}</p>
                      </div>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">📱</span>
                      <div>
                        <label>Phone</label>
                        <p>{selectedContact.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="action-buttons">
                  <button className="action-btn primary" onClick={() => onNavigate('messages')}>
                    <span>💬</span> Send Message
                  </button>
                  <button className="action-btn">
                    <span>📞</span> Voice Call
                  </button>
                  <button className="action-btn">
                    <span>📹</span> Video Call
                  </button>
                </div>

                <div className="shared-section">
                  <h3>Shared Media</h3>
                  <div className="shared-placeholder">
                    <span>🖼️</span>
                    <p>No shared media yet</p>
                  </div>
                </div>

                <div className="danger-actions">
                  <button className="block-btn">🚫 Block Contact</button>
                  <button className="delete-btn" onClick={() => handleDeleteContact(selectedContact.id)}>
                    🗑️ Delete Contact
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <div className="no-selection-icon">👥</div>
              <h2>Select a Contact</h2>
              <p>Choose a contact from the list to view their details</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Contact</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddContact}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Enter name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="Enter email"
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContactsPage
