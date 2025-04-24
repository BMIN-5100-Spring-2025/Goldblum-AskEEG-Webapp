<script setup>
import { ref, onMounted } from 'vue';

const images = ref([]);
const selectedImage = ref(null);
const modalVisible = ref(false);

onMounted(async () => {
  try {
    // List of image names from the output directory (based on what we saw in list_dir)
    const imageNames = [
      'synchrony_spectrogram.png',
      'gamma_high_synchrony.png',
      'gamma_low_synchrony.png',
      'beta_synchrony.png',
      'alpha_synchrony.png',
      'theta_synchrony.png',
      'delta_synchrony.png',
      'all_bands_synchrony.png',
      'mean_synchrony_by_band.png'
    ];
    
    // Create image objects with paths and formatted titles
    images.value = imageNames.map(name => {
      // Convert file name to a formatted title (remove extension, replace underscores with spaces, capitalize words)
      const title = name
        .replace('.png', '')
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
        
      return {
        path: `/data/output/${name}`,
        name,
        title
      };
    });
  } catch (error) {
    console.error('Error loading images:', error);
  }
});

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
    
    <div class="image-grid">
      <div v-for="image in images" :key="image.name" class="image-card" @click="openModal(image)">
        <div class="image-preview">
          <img :src="image.path" :alt="image.title">
        </div>
        <div class="image-title">{{ image.title }}</div>
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