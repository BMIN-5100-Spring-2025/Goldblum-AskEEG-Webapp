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
import { ref, onMounted } from 'vue';
import { fetchAuthSession, getCurrentUser } from '@aws-amplify/auth';
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { v4 as uuidv4 } from 'uuid';

const bucketName = import.meta.env.VITE_S3_BUCKET_NAME || "bmin5100-askeeg-user-uploads";
const region = import.meta.env.VITE_AWS_REGION || "us-east-1";
const identityPoolId = import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID || "us-east-1:6c006afe-1718-48c8-875f-51f7de84d8f7";

const fileInput = ref(null);
const selectedFile = ref(null);
const errorMsg = ref('');
const successMsg = ref('');
const isUploading = ref(false);
const uploadProgress = ref(0);
const isDragover = ref(false);

function makeSafeS3Key(string) {
  return string.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// Check auth status on component mount
onMounted(async () => {
  try {
    // Verify the user is authenticated
    await getCurrentUser();
  } catch (error) {
    console.error('Authentication error:', error);
    errorMsg.value = 'Please sign in to upload files';
  }
});

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
  
  try {
    // Get auth session for Cognito tokens
    const authSession = await fetchAuthSession();
    
    // Extract cognito identity provider from the token issuer
    const poolResource = authSession.tokens.idToken.payload.iss.replace("https://","");
    
    // Create logins map for Cognito Identity Pool
    let logins = {};
    logins[poolResource] = authSession.tokens.idToken.toString();
    
    // Generate unique ID for the upload
    const jobId = uuidv4();
    const filename = `${jobId}/${makeSafeS3Key(selectedFile.value.name)}`;
    
    // Create S3 client with Cognito Identity Pool credentials
    const s3Client = new S3Client({
      region: region,
      credentials: fromCognitoIdentityPool({
        identityPoolId: identityPoolId,
        clientConfig: { region: region },
        logins: logins
      })
    });
    
    // Set up the upload
    const parallelUpload = new Upload({
      client: s3Client,
      queueSize: 4,
      leavePartsOnError: false,
      params: {
        Bucket: bucketName,
        Key: filename,
        Body: selectedFile.value,
        ContentType: selectedFile.value.type
      }
    });
    
    // Track upload progress
    parallelUpload.on("httpUploadProgress", (progress) => {
      if (progress.total) {
        uploadProgress.value = Math.round((progress.loaded / progress.total) * 100);
      }
    });
    
    // Execute the upload
    await parallelUpload.done();
    
    successMsg.value = 'File uploaded successfully!';
    selectedFile.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    if (error.message === 'No credentials' || error.message.includes('Credentials should not be empty')) {
      errorMsg.value = 'Authentication error. Please sign out and sign in again.';
    } else {
      errorMsg.value = error.message || 'Failed to upload file';
    }
  } finally {
    isUploading.value = false;
  }
};
</script> 