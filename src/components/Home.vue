<template>
  <div class="home-container">
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
          <h3>EEG Data Workflow</h3>
          <p>Complete workflow for retrieving and analyzing EEG data.</p>
          <router-link to="/workflow" class="action-btn">Start Workflow</router-link>
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

<script setup>
import FargateRunner from './FargateRunner.vue';
</script>