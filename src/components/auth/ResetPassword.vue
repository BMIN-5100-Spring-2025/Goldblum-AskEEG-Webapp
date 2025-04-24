<template>
  <div class="auth-container">
    <h2>Reset Password</h2>
    <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
    <div v-if="successMsg" class="success">{{ successMsg }}</div>
    
    <form v-if="!codeSent" @submit.prevent="requestCode">
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
          {{ isLoading ? 'Sending...' : 'Send Verification Code' }}
        </button>
      </div>
    </form>
    
    <form v-if="codeSent" @submit.prevent="confirmReset">
      <div class="form-group">
        <label for="code">Verification Code</label>
        <input 
          id="code"
          v-model="code" 
          type="text" 
          placeholder="Enter verification code"
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