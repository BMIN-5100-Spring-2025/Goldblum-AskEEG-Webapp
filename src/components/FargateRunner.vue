<template>
  <div class="analysis-runner">
    <button @click="runFargateTask" :disabled="loading">
      {{ loading ? 'Running...' : 'Run Analysis' }}
    </button>
    
    <div v-if="loading" class="status-message">
      Starting EEG synchrony analysis...
    </div>
    
    <div v-if="success" class="success">
      <p><strong>Analysis completed successfully!</strong></p>
      <p>Your EEG synchrony analysis has finished and the results have been saved.</p>
      <p>You can view the generated visualizations in the Gallery section.</p>
    </div>
    
    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { fetchAuthSession } from 'aws-amplify/auth';

const loading = ref(false);
const success = ref(false);
const error = ref(null);

async function runFargateTask() {
  loading.value = true;
  error.value = null;
  success.value = false;
  
  try {
    // Get the JWT token from Cognito using the new API
    const { tokens } = await fetchAuthSession();
    const token = tokens.idToken.toString();
    
    // Call the API with the token
    const response = await fetch('https://api.bmin-5100.com/goldblum-askeeg/run', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Additional parameters for the Fargate task
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    await response.json();
    success.value = true;
  } catch (err) {
    console.error('Error running Fargate task:', err);
    error.value = err.message || 'Failed to run Fargate task';
  } finally {
    loading.value = false;
  }
}
</script> 