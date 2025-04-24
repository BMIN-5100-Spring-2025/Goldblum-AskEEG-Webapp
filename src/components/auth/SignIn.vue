<template>
  <div class="auth-container">
    <h2>Sign In</h2>
    <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
    <form @submit.prevent="signIn">
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
      <div class="form-group">
        <label for="password">Password</label>
        <input 
          id="password"
          v-model="password" 
          type="password" 
          placeholder="Enter your password"
          required
        />
      </div>
      <div class="buttons">
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
        </button>
      </div>
      <div class="links">
        <button type="button" class="link" @click="forgotPassword">Forgot Password?</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { signIn as authSignIn, resetPassword } from '@aws-amplify/auth';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
const errorMsg = ref('');
const isLoading = ref(false);

// Define emits for parent components
const emit = defineEmits(['auth-state-changed']);

const signIn = async () => {
  if (!username.value || !password.value) {
    errorMsg.value = 'Please enter both email and password';
    return;
  }

  errorMsg.value = '';
  isLoading.value = true;

  try {
    const result = await authSignIn({
      username: username.value,
      password: password.value,
      options: {
        authFlowType: "USER_PASSWORD_AUTH"
      }
    });

    if (result.isSignedIn) {
      emit('auth-state-changed');
      router.push('/dashboard');
    } else if (result.nextStep) {
      const nextStep = result.nextStep.signInStep;
      
      if (nextStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD' || 
          nextStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        sessionStorage.setItem('authNextStep', nextStep);
        sessionStorage.setItem('challengeParams', JSON.stringify(result.nextStep.challengeParameters || {}));
        router.push({
          name: 'completeNewPassword',
          params: { username: username.value }
        });
      } else if (nextStep === 'NEW_PASSWORD_REQUIRED') {
        sessionStorage.setItem('authNextStep', nextStep);
        sessionStorage.setItem('challengeParams', JSON.stringify(result.nextStep.challengeParameters || {}));
        router.push({
          name: 'completeNewPassword',
          params: { username: username.value }
        });
      } else {
        errorMsg.value = `Authentication requires additional step: ${nextStep}`;
      }
    }
  } catch (error) {
    if (error.code === 'UserNotConfirmedException') {
      errorMsg.value = 'Please verify your email first';
    } else if (error.code === 'NotAuthorizedException') {
      errorMsg.value = 'Incorrect username or password';
    } else {
      errorMsg.value = error.message || 'Failed to sign in';
    }
  } finally {
    isLoading.value = false;
  }
};

const forgotPassword = async () => {
  if (!username.value) {
    errorMsg.value = 'Please enter your email';
    return;
  }

  try {
    await resetPassword({ username: username.value });
    router.push({
      name: 'resetPassword',
      params: { username: username.value }
    });
  } catch (error) {
    errorMsg.value = error.message || 'Failed to initiate password reset';
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