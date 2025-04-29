<template>
  <div class="data-segment-retriever">
    <h2>Data Segment Retriever</h2>
    
    <div class="input-section">
      <!-- Dataset/Package Selection -->
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
      
      <button @click="fetchMetadata" class="fetch-btn" :disabled="loading">
        {{ loading ? 'Loading...' : 'Fetch Metadata' }}
      </button>
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <!-- Show metadata summary if available -->
    <div v-if="metadata" class="metadata-summary">
      <h3>Dataset Summary</h3>
      <div class="summary-info">
        <div class="info-item">
          <strong>Total Duration:</strong> {{ (metadata.time_range.duration_seconds).toFixed(2) }} seconds
        </div>
        <div class="info-item">
          <strong>Sampling Rate:</strong> {{ metadata.time_range.sampling_rate || 'Unknown' }} Hz
        </div>
        <div class="info-item">
          <strong>Channels:</strong> {{ metadata.total_channels }}
        </div>
      </div>
    </div>
    
    <!-- Data segment selection form -->
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
          <div v-for="channel in metadata.channels" :key="channel.id" class="channel-item">
            <label>
              <input type="checkbox" v-model="selectedChannels" :value="channel.id" />
              <span>{{ channel.name }}</span>
            </label>
            <span class="channel-info">({{ channel.unit || 'no unit' }}, {{ channel.rate || 'unknown' }} Hz)</span>
          </div>
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
          :disabled="isRetrieving || !isFormValid"
        >
          {{ isRetrieving ? 'Processing...' : 'Retrieve Data Segment' }}
        </button>
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
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { fetchAuthSession } from '@aws-amplify/auth';
import '@/assets/styles/components/DataSegmentRetriever.css';

// Component state
const datasetId = ref('');
const packageId = ref('');
const metadata = ref(null);
const loading = ref(false);
const error = ref('');
const isRetrieving = ref(false);
const retrievalResult = ref(null);

// Data segment parameters
const startTime = ref(0);
const endTime = ref(10);
const selectedChannels = ref([]);
const outputFilename = ref('eeg_segment');

// API base URL - modify as needed based on your environment
const apiBaseUrl = '/api';

// Load saved values from localStorage
const loadFromLocalStorage = () => {
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
      if (metadata.value && metadata.value.time_range) {
        // Initialize time values based on metadata
        startTime.value = 0;
        endTime.value = Math.min(10, metadata.value.time_range.duration_seconds);
      }
      
      // Select all channels by default
      if (metadata.value && metadata.value.channels) {
        selectedChannels.value = metadata.value.channels.map(c => c.id);
      }
    } catch (e) {
      console.error('Error parsing saved metadata:', e);
    }
  }
};

// Computed properties
const isFormValid = computed(() => {
  return (
    datasetId.value && 
    packageId.value && 
    selectedChannels.value.length > 0 && 
    startTime.value < endTime.value &&
    outputFilename.value.trim() !== ''
  );
});

// Methods
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
      }
      
      const response = await fetch(`${apiBaseUrl}/metadata?${params.toString()}`, {
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch metadata');
      }
      
      metadata.value = await response.json();
      
      // Initialize time values based on the fetched metadata
      if (metadata.value && metadata.value.time_range) {
        startTime.value = 0;
        endTime.value = Math.min(10, metadata.value.time_range.duration_seconds);
      }
      
      // Select all channels by default
      if (metadata.value && metadata.value.channels) {
        selectedChannels.value = metadata.value.channels.map(c => c.id);
      }
      
      // Save metadata to localStorage
      localStorage.setItem('askeeg_dataset_id', datasetId.value);
      localStorage.setItem('askeeg_package_id', packageId.value);
      localStorage.setItem('askeeg_metadata', JSON.stringify(metadata.value));
      
    } catch (authError) {
      console.error('Authentication error:', authError);
      error.value = authError.message;
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
  if (!isFormValid.value) return;
  
  isRetrieving.value = true;
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
    
    // Prepare the request payload with relative time
    const requestData = {
      dataset_id: datasetId.value,
      package_id: packageId.value,
      channel_ids: selectedChannels.value,
      start_time_seconds: startTime.value,
      end_time_seconds: endTime.value,
      output_filename: outputFilename.value,
      is_relative_time: true  // Explicitly set to use relative time
    };
    
    // We don't need to send absolute timestamps when using relative time
    // This will prevent confusion in the backend
    
    const response = await fetch(`${apiBaseUrl}/retrieve-data-segment`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
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
    
  } catch (err) {
    console.error('Error retrieving data segment:', err);
    retrievalResult.value = {
      error: true,
      message: err.message || 'Error occurred while retrieving data'
    };
  } finally {
    isRetrieving.value = false;
  }
};

// Watch for changes to ensure valid values
watch(startTime, (newValue) => {
  validateStartTime();
});

watch(endTime, (newValue) => {
  validateEndTime();
});

// Component lifecycle hooks
onMounted(() => {
  loadFromLocalStorage();
  
  // Auto-fetch metadata if we have a dataset ID but no metadata
  if (datasetId.value && packageId.value && !metadata.value) {
    fetchMetadata();
  }
});
</script> 