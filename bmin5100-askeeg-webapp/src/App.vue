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
    <header v-if="isAuthenticated">
      <nav>
        <div class="logo">AskEEG App</div>
        <div class="nav-links">
          <router-link to="/dashboard">Dashboard</router-link>
          <router-link to="/upload">Upload</router-link>
          <router-link to="/gallery">Gallery</router-link>
          <button @click="signOut" class="sign-out-btn">Sign Out</button>
        </div>
      </nav>
    </header>
    
    <main>
      <div v-if="isLoading" class="loading">Loading...</div>
      <router-view v-else @auth-state-changed="checkAuthStatus" />
    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f8f9fa;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

header {
  background-color: #343a40;
  color: white;
  padding: 1rem;
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-links a {
  color: white;
  text-decoration: none;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: #ccc;
}

.nav-links a.router-link-exact-active {
  color: #17a2b8;
  font-weight: bold;
}

.sign-out-btn {
  background-color: transparent;
  color: white;
  border: 1px solid white;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.sign-out-btn:hover {
  background-color: white;
  color: #343a40;
}

main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #666;
}

:root {
  --color-accent-1: #7263ff;
  --color-accent-2: #c175ff;
  --color-background-gradient: linear-gradient(135deg, rgba(15, 15, 25, 0.4) 0%, rgba(10, 10, 15, 0.2) 100%);
}

@media (prefers-color-scheme: dark) {
  body {
    background-color: #121212;
    color: #f0f0f0;
  }
  
  .app-container {
    background-color: #1e1e1e;
  }
}
</style>
