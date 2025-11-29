import { useState, useEffect } from 'react'
import './App.css'
import MainPage from './MainPage'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [isLogin, setIsLogin] = useState(true)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    rememberMe: false
  })
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const calculateEyePosition = (eyeId) => {
    // Eye positions in the SVG (approximate centers of the eyes)
    const eyes = {
      left: { cx: 86, cy: 73 },
      right: { cx: 114, cy: 73 }
    }
    
    const eye = eyes[eyeId]
    const angle = Math.atan2(mousePos.y - (window.innerHeight / 2), mousePos.x - (window.innerWidth / 2))
    const distance = 4

    const pupilX = eye.cx + Math.cos(angle) * distance
    const pupilY = eye.cy + Math.sin(angle) * distance

    return { x: pupilX, y: pupilY }
  }

  const leftEyePupil = calculateEyePosition('left')
  const rightEyePupil = calculateEyePosition('right')

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!isForgotPassword) {
      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters'
      }

      if (!isLogin) {
        if (!formData.name) {
          newErrors.name = 'Name is required'
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match'
        }
      }
    }

    return newErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSuccessMessage('')
    
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (isForgotPassword) {
      setSuccessMessage(`Password reset link sent to ${formData.email}`)
      setTimeout(() => {
        setIsForgotPassword(false)
        setFormData({ email: '', password: '', confirmPassword: '', name: '', rememberMe: false })
        setSuccessMessage('')
      }, 2000)
    } else if (isLogin) {
      setSuccessMessage(`Welcome back! Logging in...`)
      setTimeout(() => {
        setCurrentUser({ name: formData.name || formData.email.split('@')[0], email: formData.email })
        setIsLoggedIn(true)
      }, 1000)
    } else {
      setSuccessMessage(`Account created successfully! Redirecting...`)
      setTimeout(() => {
        setCurrentUser({ name: formData.name, email: formData.email })
        setIsLoggedIn(true)
      }, 1000)
    }
  }

  const toggleAuthMode = () => {
    setIsLogin(!isLogin)
    setIsForgotPassword(false)
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      rememberMe: false
    })
    setErrors({})
    setSuccessMessage('')
  }

  const handleSocialLogin = (provider) => {
    setSuccessMessage(`Signing in with ${provider}...`)
    setTimeout(() => setSuccessMessage(''), 2000)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentUser(null)
    setFormData({ email: '', password: '', confirmPassword: '', name: '', rememberMe: false })
  }

  if (isLoggedIn && currentUser) {
    return <MainPage user={currentUser} onLogout={handleLogout} />
  }

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-visual">
          <h2 className="textbox-title">
            <span className="letter">TALKSPACE</span>
          </h2>
          <div className="robot-float">
            <svg viewBox='0 0 200 260' xmlns='http://www.w3.org/2000/svg' className="robot-image">
              <defs>
                <linearGradient id='robotGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                  <stop offset='0%' style={{stopColor:'#5bb5c9',stopOpacity:1}} />
                  <stop offset='100%' style={{stopColor:'#3d8a9a',stopOpacity:1}} />
                </linearGradient>
                <linearGradient id='bodyGrad' x1='0%' y1='0%' x2='0%' y2='100%'>
                  <stop offset='0%' style={{stopColor:'#5bb5c9',stopOpacity:1}} />
                  <stop offset='100%' style={{stopColor:'#2d7a8a',stopOpacity:1}} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              {/* Head */}
              <circle cx='100' cy='75' r='55' fill='url(#robotGrad)' stroke='#e8a87c' strokeWidth='4'/>
              {/* Head highlight */}
              <ellipse cx='85' cy='55' rx='20' ry='10' fill='rgba(255,255,255,0.15)'/>
              {/* Left Eye White */}
              <circle cx='82' cy='70' r='12' fill='white' filter='url(#glow)'/>
              {/* Right Eye White */}
              <circle cx='118' cy='70' r='12' fill='white' filter='url(#glow)'/>
              {/* Left Pupil */}
              <circle cx={leftEyePupil.x - 4} cy={leftEyePupil.y - 3} r='5' fill='#2c3e50'/>
              {/* Left Pupil Highlight */}
              <circle cx={leftEyePupil.x - 6} cy={leftEyePupil.y - 5} r='2' fill='white'/>
              {/* Right Pupil */}
              <circle cx={rightEyePupil.x + 4} cy={rightEyePupil.y - 3} r='5' fill='#2c3e50'/>
              {/* Right Pupil Highlight */}
              <circle cx={rightEyePupil.x + 2} cy={rightEyePupil.y - 5} r='2' fill='white'/>
              {/* Mouth */}
              <path d='M 88 95 Q 100 108 112 95' stroke='#e8a87c' strokeWidth='3' fill='none' strokeLinecap='round'/>
              {/* Left Ear */}
              <rect x='50' y='68' width='12' height='14' rx='4' fill='#e8a87c'/>
              {/* Right Ear */}
              <rect x='138' y='68' width='12' height='14' rx='4' fill='#e8a87c'/>
              {/* Neck */}
              <rect x='90' y='125' width='20' height='15' rx='4' fill='#3d8a9a'/>
              {/* Body */}
              <rect x='60' y='138' width='80' height='85' rx='12' fill='url(#bodyGrad)' stroke='#e8a87c' strokeWidth='4'/>
              {/* Body highlight */}
              <ellipse cx='80' cy='155' rx='15' ry='8' fill='rgba(255,255,255,0.1)'/>
              {/* Chest Circle */}
              <circle cx='100' cy='175' r='18' fill='#2d7a8a' stroke='#e8a87c' strokeWidth='3'/>
              <circle cx='100' cy='175' r='10' fill='#e8a87c'/>
              {/* Left Arm */}
              <rect x='35' y='150' width='22' height='50' rx='8' fill='url(#robotGrad)' stroke='#e8a87c' strokeWidth='2'/>
              {/* Right Arm */}
              <rect x='143' y='150' width='22' height='50' rx='8' fill='url(#robotGrad)' stroke='#e8a87c' strokeWidth='2'/>
              {/* Left Hand */}
              <circle cx='46' cy='208' r='10' fill='#e8a87c'/>
              {/* Right Hand */}
              <circle cx='154' cy='208' r='10' fill='#e8a87c'/>
            </svg>
          </div>
          <div className="floating-particles">
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
          </div>
        </div>

        <div className="auth-box">
          <div className="form-header">
            <h1>{isForgotPassword ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Create Account')}</h1>
            <p className="form-subtitle">
              {isForgotPassword 
                ? 'Enter your email to reset your password' 
                : (isLogin ? 'Sign in to your TALKSPACE account' : 'Join the conversation today')}
            </p>
          </div>
          
          {successMessage && <div className="success-message"><span>✓</span> {successMessage}</div>}
          
          <form onSubmit={handleSubmit}>
            {!isLogin && !isForgotPassword && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className={errors.name ? 'input-error' : ''}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            {!isForgotPassword && (
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={errors.password ? 'input-error' : ''}
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>
            )}

            {!isLogin && !isForgotPassword && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={errors.confirmPassword ? 'input-error' : ''}
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
            )}

            {isLogin && !isForgotPassword && (
              <div className="form-options">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="rememberMe" className="checkbox-label">Remember me</label>
                </div>
                <button
                  type="button"
                  className="forgot-btn"
                  onClick={() => setIsForgotPassword(true)}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" className="submit-btn">
              {isForgotPassword ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {!isForgotPassword && (
            <>
              <div className="divider">
                <span>or continue with</span>
              </div>

              <div className="social-login">
                <button
                  type="button"
                  className="social-btn google"
                  onClick={() => handleSocialLogin('Google')}
                >
                  <span className="social-icon">G</span>
                  <span className="social-text">Google</span>
                </button>
                <button
                  type="button"
                  className="social-btn github"
                  onClick={() => handleSocialLogin('GitHub')}
                >
                  <span className="social-icon">◇</span>
                  <span className="social-text">GitHub</span>
                </button>
              </div>
            </>
          )}

          <div className="toggle-auth">
            {isForgotPassword ? (
              <p>
                Remember your password?{' '}
                <button
                  type="button"
                  className="toggle-link"
                  onClick={() => setIsForgotPassword(false)}
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  type="button"
                  className="toggle-link"
                  onClick={toggleAuthMode}
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            )}
          </div>

          <div className="terms">
            <p>
              By continuing, you agree to our{' '}
              <a href="#">Terms of Service</a> and{' '}
              <a href="#">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
