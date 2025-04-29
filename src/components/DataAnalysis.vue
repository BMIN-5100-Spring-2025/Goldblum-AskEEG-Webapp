<template>
  <div class="data-analysis-container">
    <h2>Data Analysis</h2>
    
    <div class="input-section">
      <div class="input-selection-card">
        <h3>Data Selection</h3>
        <p class="instruction-text">Select a data file to analyze</p>
        
        <div class="input-group">
          <label for="data-file">Data File Path:</label>
          <select 
            id="data-file" 
            v-model="selectedDataFile" 
            class="file-select"
            @change="onFileSelected"
          >
            <option value="">Select a data file</option>
            <option v-for="file in dataFiles" :key="file.path" :value="file.path">
              {{ file.displayName }}
            </option>
          </select>
        </div>
        
        <button @click="fetchDataFiles" class="refresh-btn" :disabled="isLoading">
          <span v-if="!isLoading">Refresh File List</span>
          <span v-else>Loading...</span>
        </button>
      </div>
      
      <div class="analysis-selection-card" v-if="selectedDataFile">
        <h3>Analysis Options</h3>
        
        <div class="analysis-type-selector">
          <div class="input-group">
            <label>Analysis Type:</label>
            <div class="radio-group">
              <label>
                <input type="radio" v-model="analysisType" value="eeg_synchrony">
                EEG Synchrony
              </label>
              <!-- More analysis types can be added here in the future -->
            </div>
          </div>
        </div>
        
        <!-- EEG Synchrony Options -->
        <div v-if="analysisType === 'eeg_synchrony'" class="analysis-options">
          <h4>EEG Synchrony Options</h4>
          
          <div class="input-group">
            <label for="frequency-bands">Frequency Bands:</label>
            <div class="checkbox-grid">
              <label v-for="(range, band) in frequencyBands" :key="band">
                <input type="checkbox" v-model="selectedBands" :value="band">
                {{ band.charAt(0).toUpperCase() + band.slice(1) }} ({{ range[0] }}-{{ range[1] }} Hz)
              </label>
            </div>
          </div>
          
          <div class="input-group">
            <label for="output-name">Output Name:</label>
            <input 
              type="text" 
              id="output-name" 
              v-model="outputName" 
              placeholder="Enter output name"
            >
          </div>
        </div>
        <div class="action-section" v-if="selectedDataFile && analysisType">
        <button 
          @click="runAnalysis" 
          class="run-btn" 
          :disabled="isAnalyzing || !canRunAnalysis"
        >
          <span v-if="!isAnalyzing">Run Analysis</span>
          <span v-else>Processing...</span>
        </button>
      </div>
      </div>
    </div>
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-if="analysisComplete" class="success-message">
      <p>Analysis completed successfully! Redirecting to Gallery to view results...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { fetchAuthSession } from '@aws-amplify/auth';
import { useRouter } from 'vue-router';

const router = useRouter();

// Component state
const dataFiles = ref([]);
const selectedDataFile = ref('');
const isLoading = ref(false);
const error = ref('');
const analysisType = ref('eeg_synchrony');
const isAnalyzing = ref(false);
const results = ref(null);
const outputName = ref('');
const analysisComplete = ref(false);

// Analysis options
const frequencyBands = ref({
  delta: [0.5, 4],
  theta: [4, 8],
  alpha: [8, 13],
  beta: [13, 30],
  gamma: [30, 80]
});

const selectedBands = ref(['delta', 'theta', 'alpha', 'beta', 'gamma']);

// API base URL
const apiBaseUrl = '/api';

// Computed properties
const canRunAnalysis = computed(() => {
  return (
    selectedDataFile.value && 
    analysisType.value && 
    (analysisType.value !== 'eeg_synchrony' || selectedBands.value.length > 0)
  );
});

// Methods
const fetchDataFiles = async () => {
  isLoading.value = true;
  error.value = '';
  
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
    }
    
    const response = await fetch(`${apiBaseUrl}/data-files`, {
      headers
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch data files');
    }
    
    const data = await response.json();
    dataFiles.value = data.files;
    
    // Restore the previously selected file after data files are loaded
    const savedFile = localStorage.getItem('selected_data_file');
    if (savedFile && dataFiles.value.some(file => file.path === savedFile)) {
      selectedDataFile.value = savedFile;
      // Set default output name based on selected file
      const fileName = selectedDataFile.value.split('/').pop().replace('.csv', '');
      outputName.value = `${fileName}_synchrony`;
    }
  } catch (err) {
    console.error('Error fetching data files:', err);
    error.value = err.message || 'Error occurred while fetching data files';
  } finally {
    isLoading.value = false;
  }
};

const onFileSelected = () => {
  results.value = null; // Clear previous results when a new file is selected
  error.value = '';
  analysisComplete.value = false;
  
  // Save the selected file to localStorage
  if (selectedDataFile.value) {
    localStorage.setItem('selected_data_file', selectedDataFile.value);
    
    // Set default output name based on selected file
    const fileName = selectedDataFile.value.split('/').pop().replace('.csv', '');
    outputName.value = `${fileName}_synchrony`;
  } else {
    localStorage.removeItem('selected_data_file');
  }
};

const runAnalysis = async () => {
  if (!canRunAnalysis.value) return;
  
  isAnalyzing.value = true;
  error.value = '';
  results.value = null;
  analysisComplete.value = false;
  
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
    }
    
    // Prepare request body based on analysis type
    let requestBody = {
      input_file: selectedDataFile.value,
      analysis_type: analysisType.value,
      output_name: outputName.value || 'analysis_result'
    };
    
    // Add analysis-specific parameters
    if (analysisType.value === 'eeg_synchrony') {
      requestBody.selected_bands = selectedBands.value;
    }
    
    const response = await fetch(`${apiBaseUrl}/run-analysis`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Analysis failed');
    }
    
    results.value = await response.json();
    console.log('Analysis results:', results.value);
    
    // Store the output directory in localStorage so the gallery can find it
    if (results.value && results.value.output_dir) {
      localStorage.setItem('last_analysis_dir', results.value.output_dir);
      localStorage.setItem('last_analysis_timestamp', results.value.timestamp || new Date().toISOString());
    }
    
    // Set analysis complete flag
    analysisComplete.value = true;
    
    // Navigate to gallery after a short delay
    setTimeout(() => {
      router.push('/gallery');
    }, 2000);
    
  } catch (err) {
    console.error('Error running analysis:', err);
    error.value = err.message || 'Error occurred during analysis';
  } finally {
    isAnalyzing.value = false;
  }
};

onMounted(() => {
  fetchDataFiles();
});
</script>

<style scoped>
.data-analysis-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

h3 {
  color: #333;
}

h4 {
  color: #333;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.input-selection-card,
.analysis-selection-card {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  width: 100%;
}

.input-group {
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.instruction-text {
  margin-bottom: 15px;
  font-style: italic;
  color: #666;
}

.file-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.refresh-btn,
.run-btn {
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 10px 15px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  margin: 10px 0;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.refresh-btn:hover,
.run-btn:hover {
  background-color: #4a90e2;
}

.refresh-btn:disabled,
.run-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.radio-group label {
  display: flex;
  align-items: center;
  font-weight: normal;
  white-space: nowrap;
}

.checkbox-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 10px;
}

.checkbox-grid label {
  display: flex;
  align-items: center;
  font-weight: normal;
  white-space: nowrap;
  min-width: 160px;
}

.radio-group input,
.checkbox-grid input {
  margin-right: 5px;
}

.action-section {
  text-align: left;
  margin: 20px 0;
}

.error-message {
  color: #d32f2f;
  background-color: #ffebee;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.success-message {
  color: #388e3c;
  background-color: #e8f5e9;
  padding: 15px;
  border-radius: 4px;
  margin: 20px 0;
  text-align: center;
  font-weight: bold;
}

.results-section {
  margin-top: 30px;
  background-color: #f0f7ff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.results-summary {
  margin-bottom: 20px;
}

.sync-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.sync-table th, 
.sync-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.sync-table th {
  background-color: #f2f2f2;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.image-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.image-card img {
  width: 100%;
  height: auto;
  display: block;
}

.image-caption {
  padding: 10px;
  text-align: center;
  font-size: 14px;
  color: #555;
}

@media (max-width: 768px) {
  /* Remove this media query since we're already stacking vertically */
}
</style> 