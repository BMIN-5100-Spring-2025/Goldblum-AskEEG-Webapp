<template>
  <div class="auth-container">
    <h2>Reset Password</h2>
    <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
    <div v-if="successMsg" class="success">{{ successMsg }}</div>
    
    <form @submit.prevent="requestCode" v-if="!codeSent">
      <div class="form-group">
        <label for="username">Email</label>
        <input 
          id="username"
          v-model="username" 
          type="email" 
          placeholder="Enter your email"
          required
        />
      </div>
      <div class="buttons">
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Sending...' : 'Send Reset Code' }}
        </button>
      </div>
    </form>
    
    <form @submit.prevent="confirmReset" v-else>
      <div class="form-group">
        <label for="code">Verification Code</label>
        <input 
          id="code"
          v-model="code" 
          type="text" 
          placeholder="Enter the code from your email"
          required
        />
      </div>
      <div class="form-group">
        <label for="new-password">New Password</label>
        <input 
          id="new-password"
          v-model="newPassword" 
          type="password" 
          placeholder="Enter new password"
          required
        />
      </div>
      <div class="form-group">
        <label for="confirm-password">Confirm Password</label>
        <input 
          id="confirm-password"
          v-model="confirmPassword" 
          type="password" 
          placeholder="Confirm new password"
          required
        />
      </div>
      <div class="buttons">
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </div>
    </form>
    <div class="links">
      <button type="button" class="link" @click="router.push('/signin')">Back to Sign In</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { resetPassword, confirmResetPassword } from '@aws-amplify/auth';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const username = ref('');
const code = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const errorMsg = ref('');
const successMsg = ref('');
const isLoading = ref(false);
const codeSent = ref(false);

onMounted(() => {
  username.value = route.params.username || '';
});

const requestCode = async () => {
  if (!username.value) {
    errorMsg.value = 'Please enter your email';
    return;
  }
  
  errorMsg.value = '';
  successMsg.value = '';
  isLoading.value = true;
  
  try {
    await resetPassword({ username: username.value });
    codeSent.value = true;
    successMsg.value = 'Verification code sent to your email';
  } catch (error) {
    errorMsg.value = error.message || 'Failed to send reset code';
  } finally {
    isLoading.value = false;
  }
};

const confirmReset = async () => {
  if (!code.value || !newPassword.value || !confirmPassword.value) {
    errorMsg.value = 'Please fill all fields';
    return;
  }
  
  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = 'Passwords do not match';
    return;
  }
  
  if (newPassword.value.length < 8) {
    errorMsg.value = 'Password must be at least 8 characters long';
    return;
  }
  
  errorMsg.value = '';
  successMsg.value = '';
  isLoading.value = true;
  
  try {
    await confirmResetPassword({
      username: username.value,
      confirmationCode: code.value,
      newPassword: newPassword.value
    });
    
    successMsg.value = 'Password reset successful';
    setTimeout(() => {
      router.push('/signin');
    }, 2000);
  } catch (error) {
    errorMsg.value = error.message || 'Failed to reset password';
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

.success {
  color: #28a745;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: #d4edda;
  border-radius: 4px;
}

.buttons {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.links {
  margin-top: 1rem;
  text-align: center;
}

.link {
  background: none;
  color: #007bff;
  border: none;
  padding: 0;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
}

.link:hover {
  color: #0056b3;
}
</style> 