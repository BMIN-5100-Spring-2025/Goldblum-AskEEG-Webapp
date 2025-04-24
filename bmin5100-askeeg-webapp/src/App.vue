<script setup>
import ImageGallery from './components/ImageGallery.vue';
</script>

<template>
  <main>
    <div class="app-container">
      <header class="app-header">
        <h1>AskEEG</h1>
        <p class="subtitle">EEG Analysis & Visualization Using Natural Language</p>
      </header>
      
      <ImageGallery />
      
    </div>
  </main>
</template>

<style>
:root {
  --color-accent-1: #7263ff;
  --color-accent-2: #c175ff;
  --color-background-gradient: linear-gradient(135deg, rgba(15, 15, 25, 0.4) 0%, rgba(10, 10, 15, 0.2) 100%);
}

main {
  min-height: 100vh;
  padding: 0;
  margin: 0;
}

.app-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.app-header {
  text-align: center;
  margin-bottom: 1rem;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, rgba(35, 35, 60, 0.4) 0%, rgba(25, 25, 45, 0.2) 100%);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(125, 125, 255, 0.12);
  position: relative;
  overflow: hidden;
}

.app-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(125, 125, 255, 0.3), transparent);
}

.app-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(125, 125, 255, 0.1), transparent);
}

.app-header h1 {
  font-size: 3.5rem;
  font-weight: 700;
  background: linear-gradient(90deg, var(--color-accent-1), var(--color-accent-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: 1px;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.85;
  margin-top: 0;
  color: #e4e4ff;
}

@media (max-width: 768px) {
  .app-container {
    padding: 1rem;
  }
  
  .app-header {
    padding: 1.5rem 1rem;
    margin-bottom: 1.5rem;
  }
  
  .app-header h1 {
    font-size: 2.5rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
}

.app-footer {
  text-align: center;
  margin-top: 3rem;
  padding: 1.5rem;
  font-size: 0.9rem;
  opacity: 0.7;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-accent-1: #5e9eff;
    --color-accent-2: #d16bff;
  }
  
  .app-header {
    background: linear-gradient(135deg, rgba(30,30,30,0.5) 0%, rgba(20,20,20,0.5) 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
}
</style>
