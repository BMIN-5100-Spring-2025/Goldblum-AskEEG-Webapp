<template>
  <div class="auth-container">
    <h2>Complete New Password</h2>
    <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
    <form @submit.prevent="completeNewPassword">
      <div class="form-group">
        <label for="password">New Password</label>
        <input 
          id="password"
          v-model="password" 
          type="password" 
          placeholder="Enter your new password"
          required
        />
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirm New Password</label>
        <input 
          id="confirmPassword"
          v-model="confirmPassword" 
          type="password" 
          placeholder="Confirm your new password"
          required
        />
      </div>
      <div class="buttons">
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Updating...' : 'Update Password' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { confirmSignIn } from '@aws-amplify/auth';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const errorMsg = ref('');
const isLoading = ref(false);

// Define emits for parent components
const emit = defineEmits(['auth-state-changed']);

onMounted(() => {
  username.value = route.params.username || '';
  
  if (!username.value) {
    errorMsg.value = 'Missing username parameter';
  }
});

const completeNewPassword = async () => {
  if (!password.value || !confirmPassword.value) {
    errorMsg.value = 'Please enter both password fields';
    return;
  }
  
  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'Passwords do not match';
    return;
  }
  
  if (password.value.length < 8) {
    errorMsg.value = 'Password must be at least 8 characters long';
    return;
  }
  
  errorMsg.value = '';
  isLoading.value = true;
  
  try {
    const result = await confirmSignIn({
      challengeResponse: password.value
    });
    
    if (result.isSignedIn) {
      // Clear the session storage items as they're no longer needed
      sessionStorage.removeItem('authNextStep');
      sessionStorage.removeItem('challengeParams');
      
      // Emit an event to inform parent components that auth state has changed
      emit('auth-state-changed');
      
      // Navigate to dashboard
      router.push('/dashboard');
    } else if (result.nextStep) {
      errorMsg.value = `Additional step required: ${result.nextStep.signInStep}`;
    } else {
      errorMsg.value = 'Failed to update password';
    }
  } catch (error) {
    errorMsg.value = error.message || 'Failed to update password';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.2rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #0069d9;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error {
  color: #dc3545;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: #f8d7da;
  border-radius: 4px;
}

.buttons {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}
</style> 