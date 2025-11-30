import { useState, useEffect, useRef } from 'react'
import { conversationsAPI, messagesAPI } from './services/api'
import socketService from './services/socket'
import './MessagesPage.css'

function MessagesPage({ user, onLogout, onNavigate }) {
  const [selectedChat, setSelectedChat] = useState(null)
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [showMessageSearch, setShowMessageSearch] = useState(false)
  const [messageSearchQuery, setMessageSearchQuery] = useState('')
  const [selectedMessages, setSelectedMessages] = useState([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showChatInfo, setShowChatInfo] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [voiceRecording, setVoiceRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showContextMenu, setShowContextMenu] = useState(null)
  const [pinnedMessages, setPinnedMessages] = useState([])
  const [showPinnedMessages, setShowPinnedMessages] = useState(false)
  const [forwardingMessage, setForwardingMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const recordingIntervalRef = useRef(null)

  const emojiCategories = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '😏', '😒', '🙄', '😬', '🤥'],
    'Gestures': ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '👋', '🤚', '🖐️', '✋', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💝'],
    'Objects': ['📱', '💻', '🖥️', '💾', '📷', '📹', '🎥', '📞', '📺', '🎙️', '⏰', '🔋', '💡', '🔦'],
    'Symbols': ['✅', '❌', '❓', '❗', '💯', '🔥', '⭐', '🌟', '✨', '💫', '🎉', '🎊', '🏆', '🎁', '🔔', '💬', '💭']
  }

  const [conversations, setConversations] = useState([
    {
      id: 1,
      name: 'John Doe',
      avatar: 'J',
      avatarColor: '#7e22ce',
      lastMessage: 'Hey! How are you doing?',
      time: '2:30 PM',
      unread: 2,
      online: true,
      typing: false,
      pinned: true,
      muted: false,
      archived: false,
      isGroup: false,
      lastSeen: 'Online',
      messages: [
        { id: 1, text: 'Hi there!', sender: 'them', time: '2:25 PM', status: 'read', reactions: ['👍'], timestamp: Date.now() - 500000 },
        { id: 2, text: 'Hey! How are you doing?', sender: 'them', time: '2:30 PM', status: 'read', reactions: [], timestamp: Date.now() - 400000 },
      ]
    },
    {
      id: 2,
      name: 'Sarah Wilson',
      avatar: 'S',
      avatarColor: '#ec4899',
      lastMessage: 'See you tomorrow!',
      time: '1:15 PM',
      unread: 0,
      online: true,
      typing: true,
      pinned: false,
      muted: false,
      archived: false,
      isGroup: false,
      lastSeen: 'Online',
      messages: [
        { id: 1, text: 'Are we still meeting tomorrow?', sender: 'me', time: '1:10 PM', status: 'read', reactions: [], timestamp: Date.now() - 600000 },
        { id: 2, text: 'See you tomorrow!', sender: 'them', time: '1:15 PM', status: 'read', reactions: ['❤️'], timestamp: Date.now() - 550000 },
      ]
    },
    {
      id: 3,
      name: 'Tech Group',
      avatar: 'T',
      avatarColor: '#3b82f6',
      lastMessage: 'Alex: Check out this new feature',
      time: 'Yesterday',
      unread: 5,
      online: false,
      typing: false,
      pinned: true,
      muted: true,
      archived: false,
      isGroup: true,
      members: ['Alex', 'Mike', 'Sarah', 'You'],
      lastSeen: '3 members online',
      messages: [
        { id: 1, text: 'Has anyone tried the new update?', sender: 'them', senderName: 'Alex', time: 'Yesterday', status: 'read', reactions: ['🔥', '👍'], timestamp: Date.now() - 86400000 },
        { id: 2, text: 'Check out this new feature', sender: 'them', senderName: 'Alex', time: 'Yesterday', status: 'read', reactions: [], timestamp: Date.now() - 85000000 },
      ]
    },
    {
      id: 4,
      name: 'Emily Chen',
      avatar: 'E',
      avatarColor: '#22c55e',
      lastMessage: 'Thanks for your help!',
      time: 'Yesterday',
      unread: 0,
      online: false,
      typing: false,
      pinned: false,
      muted: false,
      archived: false,
      isGroup: false,
      lastSeen: 'Last seen yesterday at 5:30 PM',
      messages: [
        { id: 1, text: 'Can you help me with something?', sender: 'them', time: 'Yesterday', status: 'read', reactions: [], timestamp: Date.now() - 90000000 },
        { id: 2, text: 'Sure, what do you need?', sender: 'me', time: 'Yesterday', status: 'read', reactions: [], timestamp: Date.now() - 89000000 },
        { id: 3, text: 'Thanks for your help!', sender: 'them', time: 'Yesterday', status: 'read', reactions: ['😊'], timestamp: Date.now() - 88000000 },
      ]
    },
    {
      id: 5,
      name: 'Design Team',
      avatar: 'D',
      avatarColor: '#f59e0b',
      lastMessage: 'New mockups ready for review',
      time: 'Monday',
      unread: 0,
      online: false,
      typing: false,
      pinned: false,
      muted: false,
      archived: true,
      isGroup: true,
      members: ['Lisa', 'Tom', 'Anna', 'You'],
      lastSeen: '2 members online',
      messages: [
        { id: 1, text: 'New mockups ready for review', sender: 'them', senderName: 'Lisa', time: 'Monday', status: 'read', reactions: [], timestamp: Date.now() - 172800000 },
      ]
    },
  ])

  // Load conversations from backend
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoading(true)
        const response = await conversationsAPI.getAll()
        if (response.data && response.data.length > 0) {
          const formattedConversations = response.data.map(conv => ({
            id: conv._id,
            name: conv.type === 'group' ? conv.name : conv.participants?.find(p => p._id !== user?._id)?.name || 'Unknown',
            avatar: conv.type === 'group' ? conv.name?.[0] : conv.participants?.find(p => p._id !== user?._id)?.name?.[0] || '?',
            avatarColor: conv.type === 'group' ? conv.groupAvatarColor : conv.participants?.find(p => p._id !== user?._id)?.avatarColor || '#7e22ce',
            lastMessage: conv.lastMessage?.content || 'No messages yet',
            time: conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            unread: conv.unreadCount || 0,
            online: false,
            typing: false,
            pinned: false,
            muted: false,
            archived: conv.archived || false,
            isGroup: conv.type === 'group',
            members: conv.type === 'group' ? conv.participants?.map(p => p.name) : [],
            lastSeen: 'Offline',
            messages: []
          }))
          setConversations(prev => [...formattedConversations, ...prev])
        }
      } catch (error) {
        console.error('Error loading conversations:', error)
        // Keep mock data if API fails
      } finally {
        setIsLoading(false)
      }
    }

    loadConversations()

    // Set up socket listeners for real-time messages
    const token = localStorage.getItem('token')
    if (token) {
      socketService.connect(token)
      
      socketService.on('new-message', (data) => {
        console.log('New message received:', data)
        setConversations(prev => prev.map(conv => {
          if (conv.id === data.conversationId) {
            const newMsg = {
              id: data.message._id,
              text: data.message.content,
              sender: data.message.sender === user?._id ? 'me' : 'them',
              senderName: data.message.senderName,
              time: new Date(data.message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'delivered',
              reactions: [],
              timestamp: new Date(data.message.createdAt).getTime()
            }
            return {
              ...conv,
              messages: [...conv.messages, newMsg],
              lastMessage: data.message.content,
              time: 'Just now'
            }
          }
          return conv
        }))
        
        // Update selected chat if it's the one receiving the message
        setSelectedChat(prev => {
          if (prev && prev.id === data.conversationId) {
            const newMsg = {
              id: data.message._id,
              text: data.message.content,
              sender: data.message.sender === user?._id ? 'me' : 'them',
              senderName: data.message.senderName,
              time: new Date(data.message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'delivered',
              reactions: [],
              timestamp: new Date(data.message.createdAt).getTime()
            }
            return {
              ...prev,
              messages: [...prev.messages, newMsg]
            }
          }
          return prev
        })
      })

      socketService.on('user-typing', (data) => {
        setConversations(prev => prev.map(conv => 
          conv.id === data.conversationId ? { ...conv, typing: true } : conv
        ))
        setTimeout(() => {
          setConversations(prev => prev.map(conv => 
            conv.id === data.conversationId ? { ...conv, typing: false } : conv
          ))
        }, 3000)
      })
    }

    return () => {
      socketService.off('new-message')
      socketService.off('user-typing')
    }
  }, [user?._id])

  useEffect(() => {
    if (selectedChat?.messages?.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [selectedChat?.id, selectedChat?.messages?.length])

  useEffect(() => {
    if (selectedChat?.typing) {
      const timeout = setTimeout(() => {
        setConversations(prev => prev.map(conv => 
          conv.id === selectedChat.id ? { ...conv, typing: false } : conv
        ))
      }, 3000)
      return () => clearTimeout(timeout)
    }
  }, [selectedChat])

  useEffect(() => {
    if (voiceRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(recordingIntervalRef.current)
      setRecordingTime(0)
    }
    return () => clearInterval(recordingIntervalRef.current)
  }, [voiceRecording])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!message.trim() || !selectedChat) return

    const messageText = message
    const newMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      reactions: [],
      timestamp: Date.now(),
      replyTo: replyingTo ? { id: replyingTo.id, text: replyingTo.text, sender: replyingTo.sender } : null
    }

    // Optimistically update UI
    updateConversationWithMessage(newMessage)
    setMessage('')
    setReplyingTo(null)
    setShowEmojiPicker(false)

    // Send to backend if conversation has a real ID (from database)
    if (selectedChat.id && typeof selectedChat.id === 'string' && selectedChat.id.length === 24) {
      try {
        const response = await messagesAPI.send(selectedChat.id, messageText)
        if (response.data) {
          // Update message with server ID
          setConversations(prev => prev.map(conv => {
            if (conv.id === selectedChat.id) {
              return {
                ...conv,
                messages: conv.messages.map(msg => 
                  msg.id === newMessage.id ? { ...msg, id: response.data._id, status: 'delivered' } : msg
                )
              }
            }
            return conv
          }))
        }
      } catch (error) {
        console.error('Error sending message:', error)
        // Mark message as failed
        updateMessageStatus(newMessage.id, 'failed')
      }
    } else {
      // For mock conversations, simulate delivery
      setTimeout(() => updateMessageStatus(newMessage.id, 'delivered'), 1000)
      setTimeout(() => updateMessageStatus(newMessage.id, 'read'), 2000)
    }
  }

  const updateConversationWithMessage = (newMessage) => {
    setConversations(conversations.map(conv => {
      if (conv.id === selectedChat.id) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessage: newMessage.text || '📎 Attachment',
          time: 'Just now'
        }
      }
      return conv
    }))
    setSelectedChat({
      ...selectedChat,
      messages: [...selectedChat.messages, newMessage]
    })
  }

  const updateMessageStatus = (messageId, status) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === selectedChat?.id) {
        return {
          ...conv,
          messages: conv.messages.map(msg => 
            msg.id === messageId ? { ...msg, status } : msg
          )
        }
      }
      return conv
    }))
    if (selectedChat) {
      setSelectedChat(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId ? { ...msg, status } : msg
        )
      }))
    }
  }

  const handleEmojiSelect = (emoji) => setMessage(prev => prev + emoji)

  const handleReaction = (messageId, emoji) => {
    const updateMessages = (messages) => messages.map(msg => {
      if (msg.id === messageId) {
        const hasReaction = msg.reactions.includes(emoji)
        return { ...msg, reactions: hasReaction ? msg.reactions.filter(r => r !== emoji) : [...msg.reactions, emoji] }
      }
      return msg
    })
    setConversations(prev => prev.map(conv => 
      conv.id === selectedChat.id ? { ...conv, messages: updateMessages(conv.messages) } : conv
    ))
    setSelectedChat(prev => ({ ...prev, messages: updateMessages(prev.messages) }))
    setShowContextMenu(null)
  }

  const handleDeleteMessage = (messageId) => {
    setConversations(prev => prev.map(conv => 
      conv.id === selectedChat.id ? { ...conv, messages: conv.messages.filter(msg => msg.id !== messageId) } : conv
    ))
    setSelectedChat(prev => ({ ...prev, messages: prev.messages.filter(msg => msg.id !== messageId) }))
    setShowContextMenu(null)
  }

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text)
    setShowContextMenu(null)
  }

  const handlePinMessage = (message) => {
    setPinnedMessages(prev => prev.some(m => m.id === message.id) ? prev.filter(m => m.id !== message.id) : [...prev, message])
    setShowContextMenu(null)
  }

  const handlePinConversation = (convId) => {
    setConversations(prev => prev.map(conv => conv.id === convId ? { ...conv, pinned: !conv.pinned } : conv))
  }

  const handleMuteConversation = (convId) => {
    setConversations(prev => prev.map(conv => conv.id === convId ? { ...conv, muted: !conv.muted } : conv))
  }

  const handleArchiveConversation = (convId) => {
    setConversations(prev => prev.map(conv => conv.id === convId ? { ...conv, archived: !conv.archived } : conv))
  }

  const handleDeleteConversation = (convId) => {
    setConversations(prev => prev.filter(conv => conv.id !== convId))
    if (selectedChat?.id === convId) setSelectedChat(null)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file && selectedChat) {
      const newMessage = {
        id: Date.now(),
        text: '',
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
        reactions: [],
        timestamp: Date.now(),
        attachment: {
          type: file.type.startsWith('image/') ? 'image' : 'file',
          name: file.name,
          size: (file.size / 1024).toFixed(2) + ' KB',
          url: URL.createObjectURL(file)
        }
      }
      updateConversationWithMessage(newMessage)
    }
    setShowAttachMenu(false)
  }

  const handleVoiceRecord = () => {
    if (voiceRecording) {
      setVoiceRecording(false)
      if (selectedChat && recordingTime > 0) {
        const newMessage = {
          id: Date.now(),
          text: '',
          sender: 'me',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
          reactions: [],
          timestamp: Date.now(),
          voiceMessage: { duration: formatRecordingTime(recordingTime) }
        }
        updateConversationWithMessage(newMessage)
      }
    } else {
      setVoiceRecording(true)
    }
  }

  const handleSelectMessage = (messageId) => {
    setSelectedMessages(prev => prev.includes(messageId) ? prev.filter(id => id !== messageId) : [...prev, messageId])
  }

  const handleDeleteSelected = () => {
    setConversations(prev => prev.map(conv => 
      conv.id === selectedChat.id ? { ...conv, messages: conv.messages.filter(msg => !selectedMessages.includes(msg.id)) } : conv
    ))
    setSelectedChat(prev => ({ ...prev, messages: prev.messages.filter(msg => !selectedMessages.includes(msg.id)) }))
    setSelectedMessages([])
    setIsSelectionMode(false)
  }

  const handleForwardMessages = () => {
    setForwardingMessage(selectedMessages)
    setIsSelectionMode(false)
    setSelectedMessages([])
  }

  const filteredConversations = conversations
    .filter(conv => {
      if (filterType === 'unread') return conv.unread > 0
      if (filterType === 'groups') return conv.isGroup
      if (filterType === 'archived') return conv.archived
      return !conv.archived
    })
    .filter(conv => conv.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (a.pinned && !b.pinned) ? -1 : (!a.pinned && b.pinned) ? 1 : 0)

  const searchedMessages = messageSearchQuery && selectedChat
    ? selectedChat.messages.filter(msg => msg.text.toLowerCase().includes(messageSearchQuery.toLowerCase()))
    : []

  const getMessageStatus = (status) => {
    switch (status) {
      case 'sent': return '✓'
      case 'delivered': return '✓✓'
      case 'read': return <span className="read-status">✓✓</span>
      default: return '⏳'
    }
  }

  return (
    <div className="messages-container">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="brand-icon">💬</span>
          <span className="brand-text">TALKSPACE</span>
        </div>
        <div className="nav-links">
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>Home</a>
          <a href="#" className="nav-link active">Messages</a>
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

      <div className="messages-layout">
        {/* Conversations Sidebar */}
        <div className="conversations-sidebar">
          <div className="sidebar-header">
            <h2>Messages</h2>
            <div className="sidebar-actions">
              <button className="sidebar-action-btn" onClick={() => setShowMessageSearch(!showMessageSearch)} title="Search">🔍</button>
              <button className="new-chat-btn" onClick={() => setShowNewChatModal(true)} title="New Chat">✏️</button>
            </div>
          </div>
          
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-tabs">
            <button className={`filter-tab ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>All</button>
            <button className={`filter-tab ${filterType === 'unread' ? 'active' : ''}`} onClick={() => setFilterType('unread')}>Unread</button>
            <button className={`filter-tab ${filterType === 'groups' ? 'active' : ''}`} onClick={() => setFilterType('groups')}>Groups</button>
            <button className={`filter-tab ${filterType === 'archived' ? 'active' : ''}`} onClick={() => setFilterType('archived')}>Archived</button>
          </div>

          <div className="conversations-list">
            {filteredConversations.length === 0 ? (
              <div className="no-conversations">
                <span className="no-conv-icon">📭</span>
                <p>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  className={`conversation-item ${selectedChat?.id === conv.id ? 'active' : ''} ${conv.pinned ? 'pinned' : ''}`}
                  onClick={() => setSelectedChat(conv)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setShowContextMenu({ type: 'conversation', id: conv.id, x: e.clientX, y: e.clientY })
                  }}
                >
                  {conv.pinned && <span className="pin-indicator">📌</span>}
                  <div className="conv-avatar" style={{ background: `linear-gradient(135deg, ${conv.avatarColor}, ${conv.avatarColor}99)` }}>
                    {conv.avatar}
                    {conv.online && <span className="online-dot"></span>}
                  </div>
                  <div className="conv-info">
                    <div className="conv-header">
                      <span className="conv-name">
                        {conv.name}
                        {conv.isGroup && <span className="group-icon">👥</span>}
                        {conv.muted && <span className="muted-icon">🔇</span>}
                      </span>
                      <span className="conv-time">{conv.time}</span>
                    </div>
                    <div className="conv-preview">
                      {conv.typing ? (
                        <span className="typing-preview">
                          <span className="typing-dots"><span></span><span></span><span></span></span>
                          typing...
                        </span>
                      ) : (
                        <span className="conv-message">{conv.lastMessage}</span>
                      )}
                      {conv.unread > 0 && <span className="unread-badge">{conv.unread}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <div className="chat-user-info" onClick={() => setShowChatInfo(true)}>
                  <button className="back-btn mobile-only" onClick={(e) => { e.stopPropagation(); setSelectedChat(null); }}>←</button>
                  <div className="chat-avatar" style={{ background: `linear-gradient(135deg, ${selectedChat.avatarColor}, ${selectedChat.avatarColor}99)` }}>
                    {selectedChat.avatar}
                    {selectedChat.online && <span className="online-dot"></span>}
                  </div>
                  <div className="chat-user-details">
                    <h3>{selectedChat.name}</h3>
                    <span className="user-status">
                      {selectedChat.typing ? (
                        <span className="typing-indicator">typing<span className="typing-dots"><span></span><span></span><span></span></span></span>
                      ) : selectedChat.lastSeen}
                    </span>
                  </div>
                </div>
                <div className="chat-actions">
                  {isSelectionMode ? (
                    <>
                      <span className="selected-count">{selectedMessages.length} selected</span>
                      <button className="chat-action-btn" onClick={handleForwardMessages} title="Forward">↗️</button>
                      <button className="chat-action-btn danger" onClick={handleDeleteSelected} title="Delete">🗑️</button>
                      <button className="chat-action-btn" onClick={() => { setIsSelectionMode(false); setSelectedMessages([]) }}>✕</button>
                    </>
                  ) : (
                    <>
                      <button className="chat-action-btn" onClick={() => setShowMessageSearch(!showMessageSearch)} title="Search">🔍</button>
                      <button className="chat-action-btn" title="Voice Call">📞</button>
                      <button className="chat-action-btn" title="Video Call">📹</button>
                      <button className="chat-action-btn" onClick={() => setShowPinnedMessages(!showPinnedMessages)} title="Pinned">📌</button>
                      <button className="chat-action-btn" onClick={() => setShowChatInfo(!showChatInfo)} title="Info">ℹ️</button>
                    </>
                  )}
                </div>
              </div>

              {showMessageSearch && (
                <div className="message-search-bar">
                  <input type="text" placeholder="Search in conversation..." value={messageSearchQuery} onChange={(e) => setMessageSearchQuery(e.target.value)} autoFocus />
                  {messageSearchQuery && <span className="search-results-count">{searchedMessages.length} results</span>}
                  <button onClick={() => { setShowMessageSearch(false); setMessageSearchQuery('') }}>✕</button>
                </div>
              )}

              {showPinnedMessages && pinnedMessages.length > 0 && (
                <div className="pinned-messages-bar">
                  <div className="pinned-header"><span>📌 Pinned Messages ({pinnedMessages.length})</span><button onClick={() => setShowPinnedMessages(false)}>✕</button></div>
                  <div className="pinned-list">
                    {pinnedMessages.map(msg => (
                      <div key={msg.id} className="pinned-message-item"><p>{msg.text}</p><button onClick={() => handlePinMessage(msg)}>Unpin</button></div>
                    ))}
                  </div>
                </div>
              )}

              {replyingTo && (
                <div className="reply-preview">
                  <div className="reply-content"><span className="reply-label">Replying to</span><p>{replyingTo.text}</p></div>
                  <button onClick={() => setReplyingTo(null)}>✕</button>
                </div>
              )}

              <div className="chat-messages">
                {selectedChat.messages.map((msg, index) => {
                  const showDate = index === 0 || new Date(msg.timestamp).toDateString() !== new Date(selectedChat.messages[index - 1]?.timestamp).toDateString()
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="message-date-divider">
                          <span>{new Date(msg.timestamp).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                      <div 
                        className={`message ${msg.sender} ${selectedMessages.includes(msg.id) ? 'selected' : ''} ${messageSearchQuery && msg.text.toLowerCase().includes(messageSearchQuery.toLowerCase()) ? 'highlighted' : ''}`}
                        onClick={() => isSelectionMode && handleSelectMessage(msg.id)}
                        onContextMenu={(e) => { e.preventDefault(); setShowContextMenu({ type: 'message', message: msg, x: e.clientX, y: e.clientY }) }}
                      >
                        {isSelectionMode && <div className={`message-checkbox ${selectedMessages.includes(msg.id) ? 'checked' : ''}`}>{selectedMessages.includes(msg.id) && '✓'}</div>}
                        {selectedChat.isGroup && msg.sender === 'them' && <span className="message-sender-name">{msg.senderName}</span>}
                        <div className="message-content">
                          {msg.replyTo && (
                            <div className="replied-message">
                              <span className="replied-label">↩ {msg.replyTo.sender === 'me' ? 'You' : selectedChat.name}</span>
                              <p>{msg.replyTo.text}</p>
                            </div>
                          )}
                          {msg.attachment && (
                            <div className={`message-attachment ${msg.attachment.type}`}>
                              {msg.attachment.type === 'image' ? (
                                <div className="attachment-image"><img src={msg.attachment.url} alt={msg.attachment.name} /></div>
                              ) : (
                                <div className="attachment-file">
                                  <span className="file-icon">📄</span>
                                  <div className="file-info"><span className="file-name">{msg.attachment.name}</span><span className="file-size">{msg.attachment.size}</span></div>
                                  <button className="download-btn">⬇️</button>
                                </div>
                              )}
                            </div>
                          )}
                          {msg.voiceMessage && (
                            <div className="voice-message">
                              <button className="play-btn">▶️</button>
                              <div className="voice-wave">{[...Array(20)].map((_, i) => <span key={i} style={{ height: `${Math.random() * 20 + 5}px` }}></span>)}</div>
                              <span className="voice-duration">{msg.voiceMessage.duration}</span>
                            </div>
                          )}
                          {msg.text && <p>{msg.text}</p>}
                          <div className="message-meta">
                            <span className="message-time">{msg.time}</span>
                            {msg.sender === 'me' && <span className="message-status">{getMessageStatus(msg.status)}</span>}
                          </div>
                          {msg.reactions.length > 0 && (
                            <div className="message-reactions">
                              {msg.reactions.map((reaction, i) => <span key={i} className="reaction" onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, reaction) }}>{reaction}</span>)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-area" onSubmit={handleSendMessage}>
                <div className="input-actions-left">
                  <button type="button" className="attach-btn" onClick={() => setShowAttachMenu(!showAttachMenu)}>📎</button>
                  {showAttachMenu && (
                    <div className="attach-menu">
                      <button type="button" onClick={() => fileInputRef.current?.click()}><span>🖼️</span> Photo/Video</button>
                      <button type="button" onClick={() => fileInputRef.current?.click()}><span>📄</span> Document</button>
                      <button type="button"><span>👤</span> Contact</button>
                      <button type="button"><span>📍</span> Location</button>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept="image/*,video/*,.pdf,.doc,.docx,.txt" />
                </div>
                
                <div className="input-wrapper">
                  {voiceRecording ? (
                    <div className="voice-recording-indicator">
                      <span className="recording-dot"></span>
                      <span className="recording-time">{formatRecordingTime(recordingTime)}</span>
                      <div className="recording-wave">{[...Array(15)].map((_, i) => <span key={i}></span>)}</div>
                    </div>
                  ) : (
                    <input type="text" placeholder="Type a message..." value={message} onChange={(e) => setMessage(e.target.value)} />
                  )}
                </div>

                <div className="input-actions-right">
                  <button type="button" className="emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
                  {message.trim() ? (
                    <button type="submit" className="send-btn"><span>➤</span></button>
                  ) : (
                    <button type="button" className={`voice-btn ${voiceRecording ? 'recording' : ''}`} onClick={handleVoiceRecord}>🎤</button>
                  )}
                </div>

                {showEmojiPicker && (
                  <div className="emoji-picker">
                    <div className="emoji-picker-header"><span>Emojis</span><button type="button" onClick={() => setShowEmojiPicker(false)}>✕</button></div>
                    <div className="emoji-picker-content">
                      {Object.entries(emojiCategories).map(([category, emojis]) => (
                        <div key={category} className="emoji-category">
                          <h4>{category}</h4>
                          <div className="emoji-grid">{emojis.map((emoji, i) => <button key={i} type="button" className="emoji-item" onClick={() => handleEmojiSelect(emoji)}>{emoji}</button>)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-illustration">
                <div className="illustration-circle"><span className="illustration-icon">💬</span></div>
                <div className="floating-elements">
                  <span className="float-emoji" style={{ '--delay': '0s' }}>💜</span>
                  <span className="float-emoji" style={{ '--delay': '0.5s' }}>✨</span>
                  <span className="float-emoji" style={{ '--delay': '1s' }}>💬</span>
                  <span className="float-emoji" style={{ '--delay': '1.5s' }}>🚀</span>
                </div>
              </div>
              <h2>Welcome to TALKSPACE</h2>
              <p>Select a conversation to start chatting or create a new one</p>
              <button className="start-chat-btn" onClick={() => setShowNewChatModal(true)}><span>✨</span> Start New Chat</button>
            </div>
          )}
        </div>

        {showChatInfo && selectedChat && (
          <div className="chat-info-sidebar">
            <div className="info-header"><h3>Chat Info</h3><button onClick={() => setShowChatInfo(false)}>✕</button></div>
            <div className="info-content">
              <div className="info-avatar" style={{ background: `linear-gradient(135deg, ${selectedChat.avatarColor}, ${selectedChat.avatarColor}99)` }}>{selectedChat.avatar}</div>
              <h2>{selectedChat.name}</h2>
              <p className="info-status">{selectedChat.lastSeen}</p>
              {selectedChat.isGroup && (
                <div className="info-section">
                  <h4>Members ({selectedChat.members?.length})</h4>
                  <div className="members-list">{selectedChat.members?.map((member, i) => <div key={i} className="member-item"><div className="member-avatar">{member.charAt(0)}</div><span>{member}</span></div>)}</div>
                </div>
              )}
              <div className="info-section"><h4>Media & Files</h4><div className="media-grid"><div className="media-placeholder">No media yet</div></div></div>
              <div className="info-actions">
                <button className="info-action-btn" onClick={() => handleMuteConversation(selectedChat.id)}>{selectedChat.muted ? '🔔 Unmute' : '🔇 Mute'}</button>
                <button className="info-action-btn" onClick={() => handlePinConversation(selectedChat.id)}>{selectedChat.pinned ? '📌 Unpin' : '📌 Pin'}</button>
                <button className="info-action-btn danger" onClick={() => handleDeleteConversation(selectedChat.id)}>🗑️ Delete Chat</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showContextMenu && (
        <>
          <div className="context-menu-overlay" onClick={() => setShowContextMenu(null)} />
          <div className="context-menu" style={{ top: showContextMenu.y, left: showContextMenu.x }}>
            {showContextMenu.type === 'message' ? (
              <>
                <button onClick={() => { setReplyingTo(showContextMenu.message); setShowContextMenu(null) }}>↩️ Reply</button>
                <button onClick={() => handleCopyMessage(showContextMenu.message.text)}>📋 Copy</button>
                <button onClick={() => handlePinMessage(showContextMenu.message)}>📌 {pinnedMessages.some(m => m.id === showContextMenu.message.id) ? 'Unpin' : 'Pin'}</button>
                <button onClick={() => { setIsSelectionMode(true); setSelectedMessages([showContextMenu.message.id]); setShowContextMenu(null) }}>☑️ Select</button>
                <div className="context-reactions">{['❤️', '👍', '😂', '😮', '😢', '🔥'].map(emoji => <button key={emoji} onClick={() => handleReaction(showContextMenu.message.id, emoji)}>{emoji}</button>)}</div>
                {showContextMenu.message.sender === 'me' && <button className="danger" onClick={() => handleDeleteMessage(showContextMenu.message.id)}>🗑️ Delete</button>}
              </>
            ) : (
              <>
                <button onClick={() => { handlePinConversation(showContextMenu.id); setShowContextMenu(null) }}>📌 {conversations.find(c => c.id === showContextMenu.id)?.pinned ? 'Unpin' : 'Pin'}</button>
                <button onClick={() => { handleMuteConversation(showContextMenu.id); setShowContextMenu(null) }}>🔇 {conversations.find(c => c.id === showContextMenu.id)?.muted ? 'Unmute' : 'Mute'}</button>
                <button onClick={() => { handleArchiveConversation(showContextMenu.id); setShowContextMenu(null) }}>📥 {conversations.find(c => c.id === showContextMenu.id)?.archived ? 'Unarchive' : 'Archive'}</button>
                <button className="danger" onClick={() => { handleDeleteConversation(showContextMenu.id); setShowContextMenu(null) }}>🗑️ Delete</button>
              </>
            )}
          </div>
        </>
      )}

      {showNewChatModal && (
        <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
          <div className="new-chat-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>New Conversation</h2><button onClick={() => setShowNewChatModal(false)}>✕</button></div>
            <div className="modal-content">
              <div className="search-contact"><span className="search-icon">🔍</span><input type="text" placeholder="Search contacts..." /></div>
              <div className="quick-actions">
                <button className="quick-action" onClick={() => onNavigate('createGroup')}><span className="action-icon">👥</span><span>New Group</span></button>
                <button className="quick-action"><span className="action-icon">📢</span><span>New Channel</span></button>
              </div>
              <div className="contacts-list">
                <h4>Suggested</h4>
                {['Alice Brown', 'Bob Smith', 'Charlie Davis'].map((name, i) => (
                  <div key={i} className="contact-item" onClick={() => setShowNewChatModal(false)}><div className="contact-avatar">{name.charAt(0)}</div><span>{name}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {forwardingMessage && (
        <div className="modal-overlay" onClick={() => setForwardingMessage(null)}>
          <div className="forward-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Forward to...</h2><button onClick={() => setForwardingMessage(null)}>✕</button></div>
            <div className="modal-content">
              <div className="search-contact"><span className="search-icon">🔍</span><input type="text" placeholder="Search conversations..." /></div>
              <div className="conversations-forward-list">
                {conversations.filter(c => c.id !== selectedChat?.id).map(conv => (
                  <div key={conv.id} className="forward-item" onClick={() => setForwardingMessage(null)}>
                    <div className="forward-avatar" style={{ background: `linear-gradient(135deg, ${conv.avatarColor}, ${conv.avatarColor}99)` }}>{conv.avatar}</div>
                    <span>{conv.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessagesPage
