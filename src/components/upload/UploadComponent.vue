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