<script setup>
import { ref, onMounted } from 'vue';

const images = ref([]);
const selectedImage = ref(null);
const modalVisible = ref(false);
const analysisResults = ref([]);
const activeAnalysisId = ref('latest');
const expandedAnalysis = ref(null);

onMounted(async () => {
  try {
    await loadAnalysisHistory();
    
    // Load the images from the latest analysis if available
    if (analysisResults.value.length > 0) {
      const latestAnalysis = analysisResults.value[0];
      expandedAnalysis.value = latestAnalysis.id;
      await loadImagesFromDirectory(latestAnalysis.path);
    } else {
      console.log('No analysis history found');
    }
  } catch (error) {
    console.error('Error loading analysis history:', error);
  }
});

const formatDate = (dateString) => {
  try {
    // Check if date string has the format 'YYYYMMDD_HHMMSS'
    if (dateString && dateString.includes('_')) {
      // Extract parts from the timestamp format
      const parts = dateString.split('_');
      if (parts.length === 2) {
        const datePart = parts[0];
        const timePart = parts[1];
        
        // Format: YYYYMMDD_HHMMSS to YYYY-MM-DD HH:MM:SS
        if (datePart.length === 8 && timePart.length === 6) {
          const year = datePart.substring(0, 4);
          const month = datePart.substring(4, 6);
          const day = datePart.substring(6, 8);
          
          const hour = timePart.substring(0, 2);
          const minute = timePart.substring(2, 4);
          const second = timePart.substring(4, 6);
          
          return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        }
      }
    }
    
    // If not in special format, try standard Date parsing
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString();
    }
    
    // If all else fails, return a placeholder or the original string
    return dateString || 'No date available';
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date format error';
  }
};

const loadAnalysisHistory = async () => {
  try {
    // Get the latest analysis directory from localStorage
    const lastAnalysisDir = localStorage.getItem('last_analysis_dir');
    const lastAnalysisTimestamp = localStorage.getItem('last_analysis_timestamp');
    
    // Get existing analysis history from localStorage
    const savedHistory = localStorage.getItem('analysis_history');
    let history = savedHistory ? JSON.parse(savedHistory) : [];
    
    // Create an entry for the latest analysis if it exists
    if (lastAnalysisDir) {
      // Extract the folder name to use as the analysis name
      const analysisName = lastAnalysisDir.split('/').pop();
      
      const newAnalysis = {
        id: `analysis_${Date.now()}`,
        name: analysisName,
        timestamp: lastAnalysisTimestamp || new Date().toISOString(),
        path: lastAnalysisDir
      };
      
      // Check if this analysis already exists in history to avoid duplicates
      const existingIndex = history.findIndex(item => item.path === lastAnalysisDir);
      if (existingIndex === -1) {
        // Add to the history
        history.push(newAnalysis);
        // Save updated history to localStorage
        localStorage.setItem('analysis_history', JSON.stringify(history));
      } else {
        // Update the timestamp if it already exists
        history[existingIndex].timestamp = lastAnalysisTimestamp || new Date().toISOString();
        // Make sure the name is consistent
        history[existingIndex].name = analysisName;
        localStorage.setItem('analysis_history', JSON.stringify(history));
      }
    }
    
    // Custom sort function to handle various timestamp formats
    history.sort((a, b) => {
      // Try to compare as dates first
      try {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        
        // If both are valid dates, compare them
        if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          return dateB.getTime() - dateA.getTime();
        }
      } catch (error) {
        console.error('Error comparing dates:', error);
      }
      
      // If dates can't be compared, try string comparison
      // For formatted strings like YYYYMMDD_HHMMSS
      if (typeof a.timestamp === 'string' && typeof b.timestamp === 'string') {
        // For YYYYMMDD_HHMMSS format, simply compare strings (larger is more recent)
        if (a.timestamp.includes('_') && b.timestamp.includes('_')) {
          return b.timestamp.localeCompare(a.timestamp);
        }
      }
      
      // Default: Keep original order
      return 0;
    });
    
    // Update the analysisResults
    analysisResults.value = history;
  } catch (error) {
    console.error('Error loading analysis history:', error);
  }
};

const loadImagesFromDirectory = async (directoryPath) => {
  try {
    // Clear previous images
    images.value = [];
    
    if (!directoryPath) {
      console.warn('No directory path provided');
      return;
    }
    
    console.log('Loading images from directory:', directoryPath);
    
    // Extract just the folder name from the full path
    const folderName = directoryPath.split('/').pop();
    console.log('Extracted folder name:', folderName);
    
    // TODO: Pull names from data output dir
    const imageNames = [
      'delta_synchrony.png',
      'theta_synchrony.png',
      'alpha_synchrony.png',
      'beta_synchrony.png',
      'gamma_synchrony.png',
      'mean_synchrony_by_band.png',
      'synchrony_spectrogram.png',
      'all_bands_synchrony.png'
    ];
    
    // Some older analyses might have gamma bands
    if (folderName.includes('gamma')) {
      imageNames.push('gamma_high_synchrony.png');
      imageNames.push('gamma_low_synchrony.png');
    }
    
    // Create image objects with proper paths and formatted titles
    images.value = imageNames.map(name => {
      // Convert file name to a formatted title
      const title = name
        .replace('.png', '')
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Use absolute URL pointing directly to Flask server instead of relying on proxy
      const path = `http://localhost:5012/static/output/${folderName}/${name}`;
      
      console.log(`Generated path for ${name}: ${path}`);
      
      return {
        path,
        name,
        title,
        analysisName: folderName
      };
    });
  } catch (error) {
    console.error('Error loading images from directory:', error, directoryPath);
  }
};

const selectAnalysis = async (analysis) => {
  try {
    if (expandedAnalysis.value === analysis.id) {
      // If clicking the same analysis that's already expanded, collapse it
      expandedAnalysis.value = null;
    } else {
      // Otherwise, expand the clicked analysis and load its images
      expandedAnalysis.value = analysis.id;
      activeAnalysisId.value = analysis.id;
      await loadImagesFromDirectory(analysis.path);
    }
  } catch (error) {
    console.error('Error selecting analysis:', error);
  }
};

const deleteAnalysis = (analysis, event) => {
  // Stop event propagation to prevent dropdown toggle
  event.stopPropagation();
  
  if (confirm(`Are you sure you want to delete "${analysis.name}"?`)) {
    // Get the current history
    const savedHistory = localStorage.getItem('analysis_history');
    if (savedHistory) {
      let history = JSON.parse(savedHistory);
      
      // Remove the analysis from history
      history = history.filter(item => item.id !== analysis.id);
      
      // Save updated history to localStorage
      localStorage.setItem('analysis_history', JSON.stringify(history));
      
      // Update the current analysisResults
      analysisResults.value = history;
      
      // If the deleted item was expanded, collapse it
      if (expandedAnalysis.value === analysis.id) {
        expandedAnalysis.value = null;
      }
      
      // If history is empty, clear the images
      if (history.length === 0) {
        images.value = [];
      }
      // If the currently active analysis was deleted, load the most recent one
      else if (activeAnalysisId.value === analysis.id && history.length > 0) {
        const latestAnalysis = history[0];
        activeAnalysisId.value = latestAnalysis.id;
        expandedAnalysis.value = latestAnalysis.id;
        loadImagesFromDirectory(latestAnalysis.path);
      }
    }
  }
};

const openModal = (image) => {
  selectedImage.value = image;
  modalVisible.value = true;
};

const closeModal = () => {
  modalVisible.value = false;
  setTimeout(() => {
    selectedImage.value = null;
  }, 300); // Wait for fade out animation
};
</script>

<template>
  <div class="image-gallery-container">
    <div class="gallery-header">
      <h2>EEG Analysis Results</h2>
      <p>Visualization of synchrony patterns across different frequency bands</p>
    </div>
    
    <div class="analysis-history">
      <h3>Analysis History</h3>
      <div v-if="analysisResults.length === 0" class="no-history">
        <p>No analysis history found. Run an EEG synchrony analysis from the Data Analysis tab.</p>
      </div>
      
      <div v-else class="analysis-list">
        <div 
          v-for="analysis in analysisResults" 
          :key="analysis.id" 
          class="analysis-item"
          :class="{ 'expanded': expandedAnalysis === analysis.id }"
        >
          <div class="analysis-header" @click="selectAnalysis(analysis)">
            <div class="analysis-info">
              <h4>{{ analysis.name }}</h4>
              <span class="analysis-timestamp">{{ formatDate(analysis.timestamp) }}</span>
            </div>
            <div class="analysis-actions">
              <button class="delete-btn" @click="deleteAnalysis(analysis, $event)" title="Delete analysis">
                ✕
              </button>
              <div class="expand-icon">
                {{ expandedAnalysis === analysis.id ? '▼' : '▶' }}
              </div>
            </div>
          </div>
          
          <div v-if="expandedAnalysis === analysis.id" class="analysis-content">
            <div class="image-grid">
              <div v-for="image in images" :key="image.name" class="image-card" @click="openModal(image)">
                <div class="image-preview">
                  <img :src="image.path" :alt="image.title">
                </div>
                <div class="image-title">{{ image.title }}</div>
              </div>
            </div>
            
            <div v-if="images.length === 0" class="no-results">
              <p>No images found for this analysis.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal for full-size image view -->
    <div class="modal-backdrop" v-if="selectedImage" :class="{ active: modalVisible }" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="close-button" @click="closeModal">×</button>
        <h3>{{ selectedImage?.title }}</h3>
        <div class="modal-image-container">
          <img :src="selectedImage?.path" :alt="selectedImage?.title">
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
h3 {
  font-size: 1.5rem;
}

.image-gallery-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.gallery-header {
  text-align: center;
  margin-bottom: 30px;
}

.gallery-header h2 {
  margin-bottom: 10px;
}

.analysis-history {
  margin-bottom: 30px;
}

.analysis-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.analysis-item {
  background: rgba(75, 86, 131, 0.3);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.analysis-item.expanded {
  background: rgba(75, 86, 131, 0.5);
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.analysis-header:hover {
  background-color: rgba(85, 96, 141, 0.5);
}

.analysis-info {
  display: flex;
  flex-direction: column;
}

.analysis-info h4 {
  margin: 0;
  font-size: 1.1rem;
}

.analysis-timestamp {
  font-size: 0.9rem;
  opacity: 0.7;
  margin-top: 5px;
}

.analysis-actions {
  display: flex;
  align-items: center;
}

.delete-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  cursor: pointer;
  padding: 5px 8px;
  margin-right: 10px;
  border-radius: 4px;
  transition: all 0.2s;
}

.delete-btn:hover {
  background-color: rgba(255, 100, 100, 0.3);
  color: #fff;
}

.expand-icon {
  font-size: 1.2rem;
}

.analysis-content {
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.no-history, .no-results {
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.7);
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 10px;
}

.image-card {
  background: rgba(75, 86, 131, 0.5);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.image-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.image-preview {
  height: 200px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-title {
  padding: 10px;
  text-align: center;
  font-weight: bold;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
}

.modal-backdrop.active {
  opacity: 1;
  visibility: visible;
}

.modal-content {
  background: rgba(45, 55, 90, 0.9);
  border-radius: 8px;
  padding: 20px;
  max-width: 90%;
  max-height: 90%;
  overflow: auto;
  position: relative;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #fff;
}

.modal-image-container {
  text-align: center;
}

.modal-image-container img {
  max-width: 100%;
  max-height: 80vh;
}
</style> 