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
          <router-link to="/dataset-viewer">Dataset Viewer</router-link>
          <router-link to="/data-segment">Data Segment</router-link>
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
