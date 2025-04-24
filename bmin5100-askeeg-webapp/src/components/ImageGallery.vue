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

<style scoped>
.image-gallery-container {
  padding: 2rem;
  background: linear-gradient(135deg, rgba(35, 35, 60, 0.3) 0%, rgba(25, 25, 45, 0.15) 100%);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(125, 125, 255, 0.12);
  position: relative;
  overflow: hidden;
}

.gallery-header {
  text-align: center;
  margin-bottom: 2.5rem;
  color: var(--color-text);
}

.gallery-header h2 {
  font-size: 2.5rem;
  background: linear-gradient(90deg, var(--color-accent-1), var(--color-accent-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.gallery-header p {
  opacity: 0.85;
  max-width: 600px;
  margin: 0 auto;
  color: #e4e4ff;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.image-card {
  background: rgba(25, 27, 40, 0.5);
  border-radius: 16px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(125, 125, 255, 0.12);
  overflow: hidden;
  position: relative;
}

.image-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(125, 125, 255, 0.2), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-card:hover::before {
  opacity: 1;
}

.image-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(114, 99, 255, 0.2);
  border-color: rgba(125, 125, 255, 0.3);
  background: rgba(35, 37, 55, 0.6);
}

.image-preview {
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  border-radius: 10px;
  margin-bottom: 0.8rem;
  border: 1px solid rgba(125, 125, 255, 0.08);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.image-card:hover .image-preview img {
  transform: scale(1.05);
}

.image-title {
  font-weight: 600;
  font-size: 1.1rem;
  color: #e4e4ff;
  text-align: center;
  padding: 0.5rem;
  background: linear-gradient(90deg, rgba(35, 37, 55, 0.6) 0%, rgba(35, 37, 55, 0.3) 100%);
  border-radius: 8px;
  margin-top: 0.5rem;
}

/* Modal styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(10, 11, 17, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.modal-backdrop.active {
  opacity: 1;
  visibility: visible;
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  background: rgba(25, 27, 40, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(125, 125, 255, 0.15);
  padding: 2rem;
  overflow: auto;
}

.modal-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(125, 125, 255, 0.3), transparent);
}

.modal-content h3 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  text-align: center;
  background: linear-gradient(90deg, var(--color-accent-1), var(--color-accent-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.modal-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-image-container img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(125, 125, 255, 0.12);
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(114, 99, 255, 0.2);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: rgba(114, 99, 255, 0.4);
  transform: rotate(90deg);
}

@media (max-width: 768px) {
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
  
  .modal-content {
    width: 95%;
    padding: 1.5rem;
  }
}
</style> 