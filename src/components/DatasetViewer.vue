<template>
  <div class="dataset-viewer-container">
    <h2>Dataset / Package Metadata Viewer</h2>
    
    <div class="input-section">
      <div class="input-group">
        <label for="dataset-id">Dataset ID:</label>
        <input 
          type="text" 
          id="dataset-id" 
          v-model="datasetId" 
          placeholder="Enter Dataset ID"
        />
      </div>
      
      <div class="input-group">
        <label for="package-id">Package ID:</label>
        <input 
          type="text" 
          id="package-id" 
          v-model="packageId" 
          placeholder="Enter Package ID"
        />
      </div>
      
      <div class="button-group">
        <button @click="fetchMetadata" class="fetch-btn" :disabled="loading">
          {{ loading ? 'Loading...' : 'Fetch Metadata' }}
        </button>
        <button @click="clearData" class="clear-btn" :disabled="loading">
          Clear
        </button>
      </div>
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-if="metadata" class="metadata-section">
      <div class="metadata-card">
        <h3>Dataset/Package Information</h3>
        <div class="metadata-item">
          <strong>Dataset ID:</strong>
          {{ metadata.dataset.id }}
        </div>
        <!-- <div class="metadata-item"> -->
          <!-- <strong>Dataset Name:</strong> -->
          <!-- {{ metadata.dataset.name }} -->
        <!-- </div> -->
        <div v-if="metadata.dataset.description" class="metadata-item">
          <strong>Description:</strong>
          {{ metadata.dataset.description }}
        </div>
        <div v-if="metadata.package" class="metadata-item">
          <strong>Package ID:</strong>
          {{ metadata.package.id }}
        </div>
      </div>
      
      <div v-if="metadata.time_range" class="metadata-card">
        <h3>Time Range Information</h3>
        <div class="metadata-item">
          <strong>Start Time:</strong>
          {{ metadata.time_range.start }}
        </div>
        <div class="metadata-item">
          <strong>End Time:</strong>
          {{ metadata.time_range.end }}
        </div>
        <div class="metadata-item">
          <strong>Duration:</strong>
          {{ metadata.time_range.duration_seconds.toFixed(2) }} seconds
        </div>
        <!-- <div v-if="metadata.time_range.sampling_rate" class="metadata-item">
          <strong>Sampling Rate:</strong>
          {{ metadata.time_range.sampling_rate }} Hz
        </div>
        <div v-if="metadata.time_range.unit" class="metadata-item">
          <strong>Unit:</strong>
          {{ metadata.time_range.unit }}
        </div> -->
      </div>
      
      <div v-if="metadata.channels && metadata.channels.length > 0" class="metadata-card">
        <h3>Channels ({{ metadata.total_channels }})</h3>
        <div class="channels-list">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Unit</th>
                <th>Rate</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="channel in metadata.channels" :key="channel.id">
                <td>{{ channel.id }}</td>
                <td>{{ channel.name }}</td>
                <td>{{ channel.unit || '-' }}</td>
                <td>{{ channel.rate || '-' }}</td>
                <td>{{ channel.type || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { fetchAuthSession } from '@aws-amplify/auth';

const datasetId = ref('');
const packageId = ref('');
const metadata = ref(null);
const loading = ref(false);
const error = ref('');

// API base URL - modify as needed based on your environment
const apiBaseUrl = '/api';

// Save values to localStorage
const saveToLocalStorage = () => {
  if (datasetId.value) {
    localStorage.setItem('askeeg_dataset_id', datasetId.value);
  }
  if (packageId.value) {
    localStorage.setItem('askeeg_package_id', packageId.value);
  }
  if (metadata.value) {
    localStorage.setItem('askeeg_metadata', JSON.stringify(metadata.value));
  }
};

// Clear all saved data
const clearData = () => {
  // Clear localStorage items
  localStorage.removeItem('askeeg_dataset_id');
  localStorage.removeItem('askeeg_package_id');
  localStorage.removeItem('askeeg_metadata');
  
  // Reset component state
  datasetId.value = '';
  packageId.value = '';
  metadata.value = null;
  error.value = '';
};

// Watch for changes to save to localStorage
watch(datasetId, saveToLocalStorage);
watch(packageId, saveToLocalStorage);
watch(metadata, saveToLocalStorage);

const fetchMetadata = async () => {
  if (!datasetId.value) {
    error.value = 'Dataset ID is required';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const params = new URLSearchParams();
    params.append('dataset_id', datasetId.value);
    
    if (packageId.value) {
      params.append('package_id', packageId.value);
    }
    
    try {
      // Get auth session and extract the token
      const authSession = await fetchAuthSession();
      const token = authSession.tokens?.idToken?.toString();
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add auth token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn('No auth token available. Please sign in.');
      }
      
      const response = await fetch(`${apiBaseUrl}/metadata?${params.toString()}`, {
        headers
      });
      
      if (response.status === 403) {
        throw new Error('Authentication failed. Please sign in again.');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch metadata');
      }
      
      metadata.value = await response.json();
      saveToLocalStorage(); // Save after successful fetch
    } catch (authError) {
      console.error('Authentication error:', authError);
      if (authError.message.includes('No current user')) {
        error.value = 'Authentication required. Please sign in.';
      } else {
        error.value = authError.message;
      }
      metadata.value = null;
    }
  } catch (err) {
    console.error('Error fetching metadata:', err);
    error.value = err.message || 'Error occurred while fetching metadata';
    metadata.value = null;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  // Load saved values from localStorage
  const savedDatasetId = localStorage.getItem('askeeg_dataset_id');
  const savedPackageId = localStorage.getItem('askeeg_package_id');
  const savedMetadata = localStorage.getItem('askeeg_metadata');
  
  if (savedDatasetId) {
    datasetId.value = savedDatasetId;
  }
  
  if (savedPackageId) {
    packageId.value = savedPackageId;
  }
  
  if (savedMetadata) {
    try {
      metadata.value = JSON.parse(savedMetadata);
    } catch (e) {
      console.error('Error parsing saved metadata:', e);
      // If there's an error parsing, we'll keep metadata as null
    }
  }
  
  // Auto-fetch metadata if we have a dataset ID but no metadata
  if (datasetId.value && !metadata.value) {
    fetchMetadata();
  }
});
</script> 