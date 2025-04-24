<template>
  <div class="upload-container">
    <h2>Upload EEG File</h2>
    <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
    <div v-if="successMsg" class="success">{{ successMsg }}</div>
    
    <div class="upload-area" 
         @dragover.prevent="dragover" 
         @dragleave.prevent="dragleave" 
         @drop.prevent="drop"
         :class="{ 'is-dragover': isDragover }">
      <div v-if="!selectedFile">
        <p>Drag and drop your EEG file here</p>
        <p>or</p>
        <label for="file-upload" class="custom-file-upload">
          Select File
          <input
            id="file-upload"
            type="file"
            ref="fileInput"
            @change="handleFileSelect"
            accept=".edf,.TXT,.txt"
            style="display: none"
          />
        </label>
      </div>
      <div v-else class="selected-file">
        <p>Selected file: {{ selectedFile.name }}</p>
        <div class="file-actions">
          <button @click="removeFile" class="remove-btn">Remove</button>
          <button @click="uploadFile" :disabled="isUploading" class="upload-btn">
            {{ isUploading ? 'Uploading...' : 'Upload' }}
          </button>
        </div>
        <div v-if="uploadProgress > 0" class="progress-container">
          <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
          <span class="progress-text">{{ uploadProgress }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { uploadData } from '@aws-amplify/storage';

const bucketName = import.meta.env.VITE_S3_BUCKET_NAME;

const fileInput = ref(null);
const selectedFile = ref(null);
const errorMsg = ref('');
const successMsg = ref('');
const isUploading = ref(false);
const uploadProgress = ref(0);
const isDragover = ref(false);

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    errorMsg.value = '';
    successMsg.value = '';
  }
};

const dragover = () => {
  isDragover.value = true;
};

const dragleave = () => {
  isDragover.value = false;
};

const drop = (event) => {
  isDragover.value = false;
  
  if (event.dataTransfer.files.length) {
    const file = event.dataTransfer.files[0];
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (['edf', 'txt'].includes(extension)) {
      selectedFile.value = file;
      errorMsg.value = '';
      successMsg.value = '';
    } else {
      errorMsg.value = 'Invalid file type. Please upload .edf or .txt files.';
    }
  }
};

const removeFile = () => {
  selectedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  uploadProgress.value = 0;
};

const uploadFile = async () => {
  if (!selectedFile.value) {
    errorMsg.value = 'Please select a file first';
    return;
  }
  
  errorMsg.value = '';
  successMsg.value = '';
  isUploading.value = true;
  uploadProgress.value = 0;
  
  const fileName = `eeg-files/${Date.now()}-${selectedFile.value.name}`;
  
  try {
    const result = await uploadData({
      key: fileName,
      data: selectedFile.value,
      options: {
        onProgress: (progress) => {
          uploadProgress.value = Math.round((progress.loaded / progress.total) * 100);
        },
      }
    });
    
    if (result.key) {
      successMsg.value = 'File uploaded successfully!';
      selectedFile.value = null;
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    } else {
      errorMsg.value = 'Failed to upload file';
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    errorMsg.value = error.message || 'Failed to upload file';
  } finally {
    isUploading.value = false;
  }
};
</script>

<style scoped>
.upload-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
}

.upload-area {
  padding: 2rem;
  border: 2px dashed #ccc;
  border-radius: 8px;
  text-align: center;
  transition: border-color 0.3s ease;
  cursor: pointer;
}

.upload-area.is-dragover {
  border-color: #007bff;
  background-color: rgba(0, 123, 255, 0.05);
}

.custom-file-upload {
  display: inline-block;
  background-color: #007bff;
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.2s;
}

.custom-file-upload:hover {
  background-color: #0069d9;
}

.selected-file {
  margin-top: 1rem;
}

.file-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.remove-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.6rem 1.2rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-btn:hover {
  background-color: #c82333;
}

.upload-btn {
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.6rem 1.2rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.upload-btn:hover {
  background-color: #218838;
}

.upload-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error {
  color: #dc3545;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: #f8d7da;
  border-radius: 4px;
}

.success {
  color: #28a745;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: #d4edda;
  border-radius: 4px;
}

.progress-container {
  margin-top: 1rem;
  height: 20px;
  position: relative;
  background-color: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #007bff;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #000;
  font-size: 0.8rem;
}
</style> 