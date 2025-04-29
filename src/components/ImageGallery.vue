<script setup>
import { ref, onMounted } from 'vue';

const images = ref([]);
const selectedImage = ref(null);
const modalVisible = ref(false);
const analysisResults = ref([]);

onMounted(async () => {
  try {
    // Get the latest analysis directory from localStorage
    const lastAnalysisDir = localStorage.getItem('last_analysis_dir');
    const lastAnalysisTimestamp = localStorage.getItem('last_analysis_timestamp');
    
    // Create a default analysis result entry
    if (lastAnalysisDir) {
      analysisResults.value = [{
        id: 'latest',
        name: 'Latest EEG Synchrony Analysis',
        timestamp: lastAnalysisTimestamp || new Date().toISOString(),
        path: lastAnalysisDir
      }];
      
      // Load the images from this directory
      await loadImagesFromDirectory(lastAnalysisDir);
    } else {
      console.log('No recent analysis found in localStorage');
    }
  } catch (error) {
    console.error('Error loading images:', error);
  }
});

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
    
    <div v-if="images.length > 0" class="current-analysis">
      <h3>Current Analysis: {{ images[0]?.analysisName || 'Latest Results' }}</h3>
    </div>
    
    <div class="image-grid">
      <div v-for="image in images" :key="image.name" class="image-card" @click="openModal(image)">
        <div class="image-preview">
          <img :src="image.path" :alt="image.title">
        </div>
        <div class="image-title">{{ image.title }}</div>
      </div>
    </div>
    
    <div v-if="images.length === 0" class="no-results">
      <p>No analysis results found. Run an EEG synchrony analysis from the Data Analysis tab.</p>
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
  color: #333
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

.current-analysis {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f0f7ff;
  border-radius: 4px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.image-card {
  background-color: white;
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
  color: #333;
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
  background-color: white;
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
  color: #333;
}

.modal-image-container {
  text-align: center;
}

.modal-image-container img {
  max-width: 100%;
  max-height: 80vh;
}

.no-results {
  text-align: center;
  padding: 40px 0;
  color: #666;
}
</style> 