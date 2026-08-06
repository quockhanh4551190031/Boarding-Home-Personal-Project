import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span className="badge">🚧 Phase Testing</span>

          <h1>Boarding Home Social</h1>

          <p className="subtitle">
            Discover boarding houses, connect with roommates, and share your
            living experience in one community platform.
          </p>

          <div className="buttons">
            <button className="primary">Join Beta</button>
            <button className="secondary">Learn More</button>
          </div>
        </div>

        <div className="hero-image">
          <img
            src="https://placehold.co/500x350"
            alt="Boarding Home"
          />
        </div>
      </section>

      <section className="features">
        <h2>What you can do</h2>

        <div className="cards">
          <div className="card">
            <h3>🏠 Find Boarding Houses</h3>
            <p>
              Search boarding homes by location, price, and available
              facilities.
            </p>
          </div>

          <div className="card">
            <h3>👥 Find Roommates</h3>
            <p>
              Connect with people who have similar lifestyles and budgets.
            </p>
          </div>

          <div className="card">
            <h3>⭐ Reviews</h3>
            <p>
              Read honest reviews from students and workers before renting.
            </p>
          </div>

          <div className="card">
            <h3>💬 Community</h3>
            <p>
              Ask questions, share experiences, and receive helpful advice from
              other tenants.
            </p>
          </div>
        </div>
      </section>

      <section className="testing">
        <h2>Testing Progress</h2>

        <div className="status-grid">
          <div className="status-card">
            <h3>Authentication</h3>
            <p>✅ Completed</p>
          </div>

          <div className="status-card">
            <h3>Post Feed</h3>
            <p>🟡 In Testing</p>
          </div>

          <div className="status-card">
            <h3>Messaging</h3>
            <p>🟡 In Testing</p>
          </div>

          <div className="status-card">
            <h3>Boarding Search</h3>
            <p>✅ Completed</p>
          </div>

          <div className="status-card">
            <h3>Reviews</h3>
            <p>🟡 In Testing</p>
          </div>

          <div className="status-card">
            <h3>Notifications</h3>
            <p>🚧 Coming Soon</p>
          </div>
        </div>
      </section>

      <section className="feedback">
        <h2>Help us improve</h2>

        <p>
          This website is currently in the testing phase. Your feedback helps us
          build a better platform for everyone looking for boarding homes.
        </p>

        <button className="primary">
          Send Feedback
        </button>
      </section>

      <footer>
        <p>© 2026 Boarding Home Social - Beta Testing</p>
      </footer>
    </>
  );
}

export default App;