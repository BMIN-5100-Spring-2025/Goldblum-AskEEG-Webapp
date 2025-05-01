<script setup>
import { ref, onMounted, watch } from 'vue';
import { signOut as authSignOut, getCurrentUser } from '@aws-amplify/auth';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const isAuthenticated = ref(false);
const isLoading = ref(true);

// Function to check authentication status
const checkAuthStatus = async () => {
  isLoading.value = true;
  try {
    const user = await getCurrentUser();
    isAuthenticated.value = true;
  } catch (error) {
    isAuthenticated.value = false;
  } finally {
    isLoading.value = false;
  }
};

// Watch for route changes to recheck auth status
watch(() => route.path, (newPath) => {
  // If coming from a path that might indicate auth state change
  if (newPath === '/dashboard' || newPath === '/') {
    checkAuthStatus();
  }
});

onMounted(async () => {
  await checkAuthStatus();
});

const signOut = async () => {
  try {
    await authSignOut();
    isAuthenticated.value = false;
    router.push('/signin');
  } catch (error) {
    // Silent error handling
  }
};

// Export the checkAuthStatus function for use in other components
defineExpose({ checkAuthStatus });
</script>

<template>
  <div id="app">
    <header v-if="isAuthenticated" class="app-header">
      <nav>
        <div class="logo-container" @click="router.push('/dashboard')" style="cursor: pointer;">
          <img src="@/assets/logo.png" alt="AskEEG Logo" class="nav-logo" />
          <span class="logo gradient-text">AskEEG</span>
        </div>
        <div class="nav-links">
          <router-link to="/dashboard">Dashboard</router-link>
          <router-link to="/upload">Upload</router-link>
          <router-link to="/workflow">EEG Workflow</router-link>
          <router-link to="/nlp-query">Natural Language Query</router-link>
          <router-link to="/gallery">Gallery</router-link>
          <button @click="signOut" class="btn btn-outline">Sign Out</button>
        </div>
      </nav>
    </header>
    
    <main class="app-main">
      <div v-if="isLoading" class="loading">
        <div class="loading-spinner"></div>
        <div>Loading...</div>
      </div>
      <router-view v-else @auth-state-changed="checkAuthStatus" />
    </main>
  </div>
</template>

<style scoped>
.app-header {
  background-color: var(--bg-secondary);
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-main {
  min-height: calc(100vh - var(--header-height));
  width: 100%;
  padding: var(--space-4);
}

.loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
  gap: var(--space-4);
  color: var(--text-tertiary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--primary-100);
  border-radius: 50%;
  border-top-color: var(--primary-500);
  animation: spinner 1s linear infinite;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.nav-logo {
  width: 32px;
  height: 32px;
}

.nav-links {
  display: flex;
  gap: var(--space-5);
  align-items: center;
}

.nav-links a {
  color: var(--text-secondary);
  text-decoration: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-fast);
  font-weight: 500;
}

.nav-links a:hover {
  color: var(--primary-500);
  background-color: var(--bg-tertiary);
}

.nav-links a.router-link-active {
  color: var(--primary-500);
  background-color: var(--primary-50);
  font-weight: 600;
}
</style>
