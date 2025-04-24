<template>
  <div class="home-container">
    <header class="app-header">
      <h1>AskEEG</h1>
      <p class="subtitle">EEG Analysis & Visualization Using Natural Language</p>
    </header>
    
    <div class="dashboard-content">
      <div class="welcome-section">
        <h2>Welcome to AskEEG</h2>
        <p>
          This application allows you to upload EEG files and analyze them using natural language queries.
        </p>
      </div>
      
      <div class="actions-section">
        <div class="action-card">
          <h3>Upload EEG File</h3>
          <p>Upload your EEG data for analysis.</p>
          <router-link to="/upload" class="action-btn">Upload</router-link>
        </div>
        
        <div class="action-card">
          <h3>View Gallery</h3>
          <p>View your analyzed EEG data visualizations.</p>
          <router-link to="/gallery" class="action-btn">View Gallery</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1000px;
  margin: 0 auto;
}

.app-header {
  text-align: center;
  margin-bottom: 3rem;
}

.app-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(to right, var(--color-accent-1), var(--color-accent-2));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.8;
}

.dashboard-content {
  padding: 2rem;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.welcome-section {
  margin-bottom: 2rem;
  text-align: center;
}

.welcome-section h2 {
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

.actions-section {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.action-card {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
  width: 300px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.action-card h3 {
  margin-bottom: 1rem;
  font-size: 1.4rem;
}

.action-card p {
  margin-bottom: 1.5rem;
  opacity: 0.8;
}

.action-btn {
  display: inline-block;
  background: linear-gradient(to right, var(--color-accent-1), var(--color-accent-2));
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .actions-section {
    flex-direction: column;
    align-items: center;
  }
  
  .action-card {
    width: 100%;
    max-width: 400px;
  }
}
</style> 