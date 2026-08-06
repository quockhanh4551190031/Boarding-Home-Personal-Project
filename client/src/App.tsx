import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  // State quản lý số lượng người đăng ký Beta & thông tin Form
  const [testerCount, setTesterCount] = useState(128)
  const [hasJoined, setHasJoined] = useState(false)
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleJoinBeta = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && !hasJoined) {
      setTesterCount((prev) => prev + 1)
      setHasJoined(true)
    }
  }

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault()
    if (feedback.trim()) {
      setIsSubmitted(true)
      setFeedback('')
      setTimeout(() => setIsSubmitted(false), 3000)
    }
  }

  return (
    <div className="app-container">
      {/* Banner thông báo Beta */}
      <div className="beta-badge">
        <span className="pulse-dot"></span> Phiên bản thử nghiệm (Beta v0.1.0)
      </div>

      {/* Hero Section */}
      <section id="center">
        <div className="hero-header">
          <h1>BoardingHub 🏠</h1>
          <p className="subtitle">
            Mạng xã hội kết nối cộng đồng nhà trọ, tìm bạn ở ghép & đánh giá khu trọ minh bạch.
          </p>
        </div>

        {/* Thống kê & Form đăng ký Tester */}
        <div className="card tester-card">
          <h3>Đăng ký trải nghiệm sớm</h3>
          <p>Hiện đã có <strong>{testerCount}</strong> Testers đang tham gia đánh giá ứng dụng.</p>

          {!hasJoined ? (
            <form onSubmit={handleJoinBeta} className="form-inline">
              <input
                type="email"
                placeholder="Nhập email của bạn..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary">
                Tham gia Beta
              </button>
            </form>
          ) : (
            <div className="success-msg">
              🎉 Cảm ơn bạn! Chúng tôi đã ghi nhận email <strong>{email}</strong> vào danh sách trải nghiệm sớm.
            </div>
          )}
        </div>
      </section>

      <div className="ticks"></div>

      {/* Tính năng chính đang testing */}
      <section id="features">
        <h2>Tính năng đang thử nghiệm 🧪</h2>
        <div className="feature-grid">
          <div className="feature-item">
            <span className="icon">🔍</span>
            <h3>Tìm bạn ở ghép</h3>
            <p>Kết nối người ở ghép dựa trên thói quen sinh hoạt và độ tương thích.</p>
          </div>
          <div className="feature-item">
            <span className="icon">⭐</span>
            <h3>Review Khu Trọ</h3>
            <p>Đánh giá an ninh, điện nước, chủ trọ từ cộng đồng người thuê thực tế.</p>
          </div>
          <div className="feature-item">
            <span className="icon">💬</span>
            <h3>Bảng tin Xóm Trọ</h3>
            <p>Đăng tin nhượng phòng, thanh lý đồ đạc và giao lưu nội bộ khu phố.</p>
          </div>
        </div>
      </section>

      <div className="ticks"></div>

      {/* Form đóng góp ý kiến & Kênh hỗ trợ */}
      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Gửi phản hồi Beta</h2>
          <p>Phát hiện lỗi (bug) hoặc có góp ý tính năng? Hãy báo cho đội ngũ phát triển:</p>

          <form onSubmit={handleSendFeedback} className="feedback-form">
            <textarea
              rows={3}
              placeholder="Mô tả lỗi hoặc góp ý của bạn tại đây..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
            ></textarea>
            <button type="submit" className="btn-secondary">
              Gửi phản hồi
            </button>
            {isSubmitted && <span className="feedback-success">✅ Cảm ơn ý kiến đóng góp của bạn!</span>}
          </form>
        </div>

        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>

          <h2>Cộng đồng Tester</h2>
          <p>Giao lưu và cập nhật tiến độ phát triển dự án</p>

          <ul>
            <li>
              <a href="https://github.com" target="_blank" rel="noreferrer">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                Source Code (GitHub)
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank" rel="noreferrer">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Kênh Discord Tester
              </a>
            </li>
            <li>
              <a href="https://facebook.com" target="_blank" rel="noreferrer">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#social-icon"></use>
                </svg>
                Group Facebook Báo Lỗi
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>

      {/* Footer kỹ thuật */}
      <footer className="footer-tech">
        <p>
          Xây dựng trên nền tảng <img src={viteLogo} className="mini-logo" alt="Vite" /> Vite +{' '}
          <img src={reactLogo} className="mini-logo" alt="React" /> React
        </p>
      </footer>
    </div>
  )
}

export default App