<template>
  <div class="data-workflow-container">
    <h2>EEG Data Workflow</h2>
    
    <!-- Step Navigation -->
    <div class="workflow-navigation">
      <div 
        v-for="(step, index) in workflowSteps" 
        :key="step.id"
        :class="['workflow-step', { 'active': currentStep === index, 'completed': index < currentStep }]"
        @click="goToStep(index)"
      >
        <div class="step-number">{{ index + 1 }}</div>
        <div class="step-title">{{ step.title }}</div>
      </div>
    </div>

    <!-- Current Step Content -->
    <div class="workflow-content">
      <!-- Step 1: Dataset Viewer -->
      <div v-if="currentStep === 0" class="workflow-step-content">
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
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="channel in metadata.channels" :key="channel.id">
                    <td>{{ channel.id }}</td>
                    <td>{{ channel.name }}</td>
                    <td>{{ channel.unit || '-' }}</td>
                    <td>{{ channel.rate ? `${channel.rate} Hz` : '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="workflow-actions">
            <button @click="nextStep" class="next-btn" :disabled="!metadata">Next: Select Segments</button>
          </div>
        </div>
      </div>

      <!-- Step 2: Data Segment Retriever -->
      <div v-if="currentStep === 1" class="workflow-step-content">
        <div v-if="metadata" class="segment-selection">
          <h3>Select Data Segment</h3>
          
          <!-- Time Range Selection -->
          <div class="time-selection">
            <h4>Time Range</h4>
            
            <div class="time-range-inputs">
              <div class="input-group">
                <label for="start-time">Start Time:</label>
                <input 
                  type="range" 
                  id="start-time-slider" 
                  v-model.number="startTime" 
                  :min="0" 
                  :max="metadata.time_range.duration_seconds" 
                  step="1"
                />
                <input 
                  type="number" 
                  id="start-time" 
                  v-model.number="startTime" 
                  @input="validateStartTime"
                  step="1"
                />
                <span class="unit">seconds</span>
              </div>
              
              <div class="input-group">
                <label for="end-time">End Time:</label>
                <input 
                  type="range" 
                  id="end-time-slider" 
                  v-model.number="endTime" 
                  :min="0" 
                  :max="metadata.time_range.duration_seconds"
                  step="1"
                />
                <input 
                  type="number" 
                  id="end-time" 
                  v-model.number="endTime" 
                  @input="validateEndTime"
                  step="1"
                />
                <span class="unit">seconds</span>
              </div>
              
              <div class="segment-info">
                <div>Selected Duration: {{ (endTime - startTime).toFixed(0) }} seconds</div>
                <div v-if="startTime >= endTime" class="error-text">
                  Start time must be less than end time
                </div>
              </div>
            </div>
          </div>
          
          <!-- Channel Selection -->
          <div class="channel-selection">
            <h4>Channels</h4>
            <div class="channel-options">
              <button @click="selectAllChannels" class="button-sm">Select All</button>
              <button @click="deselectAllChannels" class="button-sm">Deselect All</button>
            </div>
            
            <div class="channels-list" v-if="metadata.channels.length > 0">
              <table>
                <thead>
                  <tr>
                    <th style="width: 50px;">Select</th>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Unit</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="channel in metadata.channels" :key="channel.id">
                    <td class="checkbox-cell">
                      <input type="checkbox" v-model="selectedChannels" :value="channel.id" />
                    </td>
                    <td>{{ channel.id }}</td>
                    <td>{{ channel.name }}</td>
                    <td>{{ channel.unit || '-' }}</td>
                    <td>{{ channel.rate ? `${channel.rate} Hz` : '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Output options -->
          <div class="output-options">
            <h4>Output Options</h4>
            <div class="input-group">
              <label for="output-filename">Output Filename:</label>
              <input 
                type="text" 
                id="output-filename" 
                v-model="outputFilename" 
                placeholder="Enter filename"
              />
              <span class="extension">.csv</span>
            </div>
          </div>
          
          <!-- Submit button -->
          <div class="actions">
            <button 
              @click="retrieveData" 
              class="retrieve-btn" 
              :disabled="isRetrieving || !isSegmentFormValid"
            >
              {{ isRetrieving ? 'Processing...' : 'Retrieve Data Segment' }}
            </button>
            <button @click="currentStep = 2" class="next-btn" style="margin-left: auto;">Next: Analyze Data</button>
          </div>
        </div>
        
        <!-- Results section -->
        <div v-if="retrievalResult" class="retrieval-result" :class="{ success: !retrievalResult.error }">
          <h3>{{ retrievalResult.error ? 'Error' : 'Success' }}</h3>
          <p>{{ retrievalResult.message }}</p>
          <div v-if="!retrievalResult.error && retrievalResult.timestamp" class="folder-info">
            <p>Your data has been saved to the following location:</p>
            <code>/data/input/{{ retrievalResult.timestamp }}/{{ outputFilename }}.csv</code>
          </div>
        </div>
      </div>

      <!-- Step 3: Data Analysis -->
      <div v-if="currentStep === 2" class="workflow-step-content">
        <div class="analysis-section">
          <h3>Data Analysis</h3>
          
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
              
              <button @click="fetchDataFiles" class="button-sm" :disabled="isLoading">
                <span v-if="!isLoading">Refresh File List</span>
                <span v-else>Loading...</span>
              </button>
            </div>
            
            <div class="analysis-selection-card" v-if="selectedDataFile">
              <h3>Analysis Options</h3>
              
              <div class="analysis-type-selector">
                <div class="input-group">
                  <label>Analysis Type:</label>
                  <select v-model="analysisType" class="analysis-type-select">
                    <option value="eeg_synchrony">EEG Synchrony</option>
                    <!-- More analysis types can be added here in the future -->
                  </select>
                </div>
              </div>
              
              <!-- EEG Synchrony Options -->
              <div v-if="analysisType === 'eeg_synchrony'" class="analysis-options">
                <h4>EEG Synchrony Options</h4>
                
                <div class="input-group">
                  <label for="frequency-bands">Frequency Bands:</label>
                  <div class="frequency-bands-grid">
                    <label v-for="(range, band) in frequencyBands" :key="band" class="frequency-band-item">
                      <input type="checkbox" v-model="selectedBands" :value="band">
                      <span class="band-label">{{ band.charAt(0).toUpperCase() + band.slice(1) }} ({{ range[0] }}-{{ range[1] }} Hz)</span>
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
          
          <div v-if="analysisError" class="error-message">
            {{ analysisError }}
          </div>
          
          <div v-if="analysisComplete" class="retrieval-result success">
            <h3>Success</h3>
            <p>Analysis completed successfully!</p>
            <div v-if="results && results.output_dir" class="folder-info">
              <p>Your results have been saved to the following location:</p>
              <code>{{ results.output_dir }}</code>
              <p style="margin-top: var(--space-2);">Redirecting to Gallery to view results...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { fetchAuthSession } from '@aws-amplify/auth';
import { useRouter } from 'vue-router';

const router = useRouter();

// Workflow steps
const workflowSteps = [
  { id: 'dataset-viewer', title: 'Select Dataset' },
  { id: 'data-segment', title: 'Extract Segments' },
  { id: 'data-analysis', title: 'Analyze Data' }
];
const currentStep = ref(0);

// Dataset Viewer state
const datasetId = ref('');
const packageId = ref('');
const metadata = ref(null);
const loading = ref(false);
const error = ref('');

// Data Segment Retriever state
const startTime = ref(0);
const endTime = ref(10);
const selectedChannels = ref([]);
const outputFilename = ref('eeg_segment');
const isRetrieving = ref(false);
const retrievalResult = ref(null);

// Data Analysis state
const dataFiles = ref([]);
const selectedDataFile = ref('');
const isLoading = ref(false);
const analysisType = ref('eeg_synchrony');
const isAnalyzing = ref(false);
const results = ref(null);
const outputName = ref('');
const analysisComplete = ref(false);
const analysisError = ref('');

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
const isSegmentFormValid = computed(() => {
  return (
    datasetId.value && 
    packageId.value && 
    selectedChannels.value.length > 0 && 
    startTime.value < endTime.value &&
    outputFilename.value.trim() !== ''
  );
});

const canRunAnalysis = computed(() => {
  return (
    selectedDataFile.value && 
    analysisType.value && 
    (analysisType.value !== 'eeg_synchrony' || selectedBands.value.length > 0)
  );
});

// Navigation methods
const goToStep = (stepIndex) => {
  // Allow navigation to analyze data without requiring segment retrieval
  if (stepIndex === 0 || (stepIndex === 1 && metadata.value) || stepIndex === 2) {
    currentStep.value = stepIndex;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const nextStep = () => {
  if (currentStep.value < workflowSteps.length - 1) {
    currentStep.value++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// Dataset Viewer methods
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

const clearData = () => {
  localStorage.removeItem('askeeg_dataset_id');
  localStorage.removeItem('askeeg_package_id');
  localStorage.removeItem('askeeg_metadata');
  
  datasetId.value = '';
  packageId.value = '';
  metadata.value = null;
  error.value = '';
};

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
      
      // Initialize segment values after metadata is loaded
      if (metadata.value && metadata.value.time_range) {
        // Set initial time range
        startTime.value = 0;
        endTime.value = Math.min(10, metadata.value.time_range.duration_seconds);
        
        // Run validations to ensure values are within acceptable ranges
        validateStartTime();
        validateEndTime();
      }
      
      // Select all channels by default
      if (metadata.value && metadata.value.channels) {
        selectedChannels.value = metadata.value.channels.map(c => c.id);
      }
      
      saveToLocalStorage();
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

// Data Segment Retriever methods
const validateStartTime = () => {
  if (metadata.value && metadata.value.time_range) {
    const duration = metadata.value.time_range.duration_seconds;
    
    // Clamp to valid range and round to nearest integer
    startTime.value = Math.round(startTime.value);
    if (startTime.value < 0) startTime.value = 0;
    if (startTime.value >= duration) startTime.value = duration - 1;
    
    // Ensure start time is less than end time
    if (startTime.value >= endTime.value) {
      startTime.value = endTime.value - 1;
    }
  }
};

const validateEndTime = () => {
  if (metadata.value && metadata.value.time_range) {
    const duration = metadata.value.time_range.duration_seconds;
    
    // Clamp to valid range and round to nearest integer
    endTime.value = Math.round(endTime.value);
    if (endTime.value <= 0) endTime.value = 1;
    if (endTime.value > duration) endTime.value = duration;
    
    // Ensure end time is greater than start time
    if (endTime.value <= startTime.value) {
      endTime.value = startTime.value + 1;
    }
  }
};

const selectAllChannels = () => {
  if (metadata.value && metadata.value.channels) {
    selectedChannels.value = metadata.value.channels.map(c => c.id);
  }
};

const deselectAllChannels = () => {
  selectedChannels.value = [];
};

const retrieveData = async () => {
  if (!isSegmentFormValid.value) return;
  
  // Run validation one more time before submission
  validateStartTime();
  validateEndTime();
  
  // Double-check that start time is less than end time
  if (startTime.value >= endTime.value) {
    error.value = 'Start time must be less than end time';
    return;
  }
  
  isRetrieving.value = true;
  error.value = '';
  retrievalResult.value = null;
  
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
    
    const requestBody = {
      dataset_id: datasetId.value,
      package_id: packageId.value,
      channel_ids: selectedChannels.value,
      start_time_seconds: startTime.value,
      end_time_seconds: endTime.value,
      output_filename: outputFilename.value,
      is_relative_time: true
    };
    
    const response = await fetch(`${apiBaseUrl}/retrieve-data-segment`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to retrieve data segment');
    }
    
    retrievalResult.value = {
      error: false,
      message: `Data successfully retrieved and saved!`,
      timestamp: result.timestamp_folder,
      path: result.output_path
    };
    
    // Save the generated data file path for the analysis step
    if (result.timestamp_folder) {
      const filePath = `/data/input/${result.timestamp_folder}/${outputFilename.value}.csv`;
      localStorage.setItem('last_segment_file', filePath);
    }
    
  } catch (err) {
    console.error('Error retrieving data segment:', err);
    retrievalResult.value = {
      error: true,
      message: err.message || 'Error occurred while retrieving data segment'
    };
  } finally {
    isRetrieving.value = false;
  }
};

// Data Analysis methods
const fetchDataFiles = async () => {
  isLoading.value = true;
  analysisError.value = '';
  
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
    
    // If we just created a data segment, select it by default
    const lastSegmentFile = localStorage.getItem('last_segment_file');
    if (lastSegmentFile && dataFiles.value.some(file => file.path === lastSegmentFile)) {
      selectedDataFile.value = lastSegmentFile;
      // Set default output name based on selected file
      const fileName = selectedDataFile.value.split('/').pop().replace('.csv', '');
      outputName.value = `${fileName}_synchrony`;
    }
  } catch (err) {
    console.error('Error fetching data files:', err);
    analysisError.value = err.message || 'Error occurred while fetching data files';
  } finally {
    isLoading.value = false;
  }
};

const onFileSelected = () => {
  results.value = null;
  analysisError.value = '';
  analysisComplete.value = false;
  
  if (selectedDataFile.value) {
    // Set default output name based on selected file
    const fileName = selectedDataFile.value.split('/').pop().replace('.csv', '');
    outputName.value = `${fileName}_synchrony`;
  } 
};

const runAnalysis = async () => {
  if (!canRunAnalysis.value) return;
  
  isAnalyzing.value = true;
  analysisError.value = '';
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
      const currentTimestamp = results.value.timestamp || new Date().toISOString();
      localStorage.setItem('last_analysis_dir', results.value.output_dir);
      localStorage.setItem('last_analysis_timestamp', currentTimestamp);
      
      // Add this analysis to the history
      const analysisName = outputName.value || 'EEG Synchrony Analysis';
      const newAnalysis = {
        id: `analysis_${Date.now()}`,
        name: analysisName,
        timestamp: currentTimestamp,
        path: results.value.output_dir
      };
      
      // Get existing history
      const savedHistory = localStorage.getItem('analysis_history');
      let history = savedHistory ? JSON.parse(savedHistory) : [];
      
      // Check if this analysis already exists in history to avoid duplicates
      const existingIndex = history.findIndex(item => item.path === results.value.output_dir);
      if (existingIndex === -1) {
        // Add to the beginning of the array (most recent first)
        history.unshift(newAnalysis);
      } else {
        // Update the existing entry
        history[existingIndex] = newAnalysis;
      }
      
      // Limit history to 10 items
      if (history.length > 10) {
        history = history.slice(0, 10);
      }
      
      // Save updated history to localStorage
      localStorage.setItem('analysis_history', JSON.stringify(history));
    }
    
    analysisComplete.value = true;
    
    // Redirect to gallery after a short delay
    setTimeout(() => {
      router.push('/gallery');
    }, 3000);
  } catch (err) {
    console.error('Error running analysis:', err);
    analysisError.value = err.message || 'Error occurred during analysis';
  } finally {
    isAnalyzing.value = false;
  }
};

// Load data on mount
onMounted(() => {
  // Load saved dataset values from localStorage
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
    }
  }
  
  // Auto-fetch metadata if we have a dataset ID
  if (datasetId.value) {
    fetchMetadata();
  }
  
  // Fetch data files for analysis tab
  fetchDataFiles();
  
  // Validate time ranges if metadata is available
  if (metadata.value) {
    validateStartTime();
    validateEndTime();
  }
});

// Add watchers for time values to ensure they stay valid
watch(startTime, (newValue) => {
  validateStartTime();
});

watch(endTime, (newValue) => {
  validateEndTime();
});

// Add watcher for currentStep to refresh data files when user navigates to Analyze Data tab
watch(currentStep, (newValue) => {
  if (newValue === 2) {
    // User has navigated to the Analyze Data tab, refresh the file list
    fetchDataFiles();
  }
});
</script>

<style scoped>
.data-workflow-container {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-5);
}

.workflow-navigation {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-3);
}

.workflow-step {
  display: flex;
  align-items: center;
  flex-direction: column;
  flex: 1;
  text-align: center;
  cursor: pointer;
  padding: var(--space-3);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
  color: var(--text-tertiary);
  border: 1px solid var(--border-medium);
  margin: 0 var(--space-2);
}

.workflow-step.active {
  font-weight: bold;
  background-color: var(--primary-50);
  color: var(--primary-500);
}

.step-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-2);
  color: white;
}

.workflow-step.active .step-number {
  background-color: var(--primary-600);
  color: white;
}

.step-title {
  font-weight: 500;
}

.workflow-actions {
  margin-top: var(--space-5);
  display: flex;
  justify-content: flex-end;
}

.next-btn, .prev-btn {
  padding: var(--space-2) var(--space-4);
  margin-left: var(--space-3);
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-weight: 500;
}

.next-btn {
  background-color: var(--primary-500);
  color: white;
}

.next-btn:hover {
  background-color: var(--primary-600);
}

.next-btn:disabled {
  background-color: var(--neutral-300);
  cursor: not-allowed;
}

.prev-btn {
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
}

.input-section, .metadata-section, .segment-selection, .analysis-section {
  margin-bottom: var(--space-5);
}

.input-group {
  margin-bottom: var(--space-4);
}

.metadata-card {
  background-color: var(--bg-card);
  border-radius: var(--border-radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.channels-list {
  max-height: 300px;
  overflow-y: auto;
}

.error-message {
  color: var(--danger);
  background-color: rgba(220, 53, 69, 0.1);
  padding: var(--space-3);
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--space-4);
}

.error-text {
  color: var(--danger);
  font-size: 0.9em;
  margin-top: var(--space-2);
  font-weight: 500;
}

.success-message {
  color: var(--success);
  background-color: rgba(40, 167, 69, 0.1);
  padding: var(--space-3);
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--space-4);
}

.retrieval-result {
  background-color: var(--bg-card);
  border-radius: var(--border-radius-md);
  padding: var(--space-4);
  margin-top: var(--space-5);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.retrieval-result.success {
  background-color: rgba(46, 204, 113, 0.1);
  border-color: var(--secondary-300);
}

.time-selection, .channel-selection, .output-options {
  margin-bottom: var(--space-5);
}

.time-range-inputs {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.segment-info {
  margin-top: var(--space-3);
  font-style: italic;
  color: var(--text-tertiary);
}

.channel-options {
  margin-bottom: var(--space-3);
}

.button-sm {
  padding: var(--space-1) var(--space-3);
  margin-right: var(--space-2);
  border: none;
  border-radius: var(--border-radius-sm);
  background-color: var(--bg-tertiary);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.button-sm:hover {
  background-color: var(--neutral-600);
}

.channel-item {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border-light);
}

.channel-info {
  color: var(--text-tertiary);
  font-size: 0.9em;
}

.input-selection-card, .analysis-selection-card {
  background-color: var(--bg-card);
  border-radius: var(--border-radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.file-select {
  width: 100%;
  padding: var(--space-2);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-medium);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.frequency-bands-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-medium);
}

.frequency-band-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--bg-card);
  border-radius: var(--border-radius-sm);
}

.band-label {
  font-size: 0.9em;
  color: var(--text-primary);
  white-space: nowrap;
}

.action-section {
  margin-top: var(--space-5);
}

.run-btn, .retrieve-btn, .fetch-btn, .clear-btn, .refresh-btn {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  margin-right: var(--space-3);
  font-weight: 500;
  transition: background-color var(--transition-fast);
}

.run-btn, .retrieve-btn {
  background-color: var(--primary-500);
  color: white;
}

.run-btn:hover, .retrieve-btn:hover {
  background-color: var(--primary-600);
}

.fetch-btn {
  background-color: var(--primary-500);
  color: white;
}

.fetch-btn:hover {
  background-color: var(--primary-600);
}

.clear-btn {
  background-color: var(--danger);
  color: white;
}

.clear-btn:hover {
  background-color: #bd2130;
}

.refresh-btn {
  background-color: var(--primary-500);
  color: var(--text-secondary);
}

.refresh-btn:hover {
  background-color: var(--primary-600);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

input[type="text"],
input[type="number"],
select {
  padding: var(--space-2);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-medium);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  width: 100%;
}

input[type="range"] {
  width: 100%;
  accent-color: var(--primary-500);
}

input[type="range"]::-webkit-slider-thumb {
  background: var(--primary-500);
}

input[type="range"]::-moz-range-thumb {
  background: var(--primary-500);
}

input[type="range"]::-ms-thumb {
  background: var(--primary-500);
}

label {
  font-weight: 500;
  display: block;
  margin-bottom: var(--space-2);
  color: var(--text-secondary);
}

h3, h4 {
  margin-bottom: var(--space-3);
  color: var(--text-primary);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: var(--space-2);
  text-align: left;
  border-bottom: 1px solid var(--border-light);
}

th {
  font-weight: 600;
  color: var(--text-secondary);
  background-color: var(--bg-tertiary);
}

code {
  background-color: var(--bg-tertiary);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--border-radius-sm);
  font-family: monospace;
  font-size: 0.9em;
  color: var(--primary-500);
}

.folder-info {
  margin-top: var(--space-3);
  padding: var(--space-3);
  background-color: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
}

.instruction-text {
  color: var(--text-tertiary);
  margin-bottom: var(--space-3);
}

.checkbox-cell {
  text-align: center;
  vertical-align: middle;
}

.checkbox-cell input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
}

input[type="checkbox"] {
  accent-color: var(--primary-500);
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-5);
}

.retrieve-btn {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-weight: 500;
  transition: background-color var(--transition-fast);
  background-color: var(--primary-500);
  color: white;
}

.retrieve-btn:hover {
  background-color: var(--primary-600);
}

.retrieve-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--neutral-300);
}
</style> 