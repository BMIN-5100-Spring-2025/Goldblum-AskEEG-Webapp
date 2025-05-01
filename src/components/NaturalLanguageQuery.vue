<template>
  <div class="natural-language-query">
    <h2>Natural Language EEG Analysis</h2>
    
    <div class="input-section">
      <div class="nlp-query-box">
        <label for="query-input">Ask your EEG question:</label>
        <textarea 
          id="query-input" 
          v-model="query" 
          placeholder="Example: Run a synchrony analysis on the first 30 seconds of data" 
          rows="3"
          @keyup.ctrl.enter="submitQuery"
        ></textarea>
        <div class="examples">
          <p>Examples:</p>
          <ul>
            <li><a href="#" @click.prevent="setExample('Run a synchrony analysis on the first 30 seconds of data')">Run a synchrony analysis on the first 30 seconds of data</a></li>
            <li><a href="#" @click.prevent="setExample('Analyze alpha band synchrony between 10 and 20 seconds')">Analyze alpha band synchrony between 10 and 20 seconds</a></li>
            <li><a href="#" @click.prevent="setExample('Calculate synchrony in theta band from channels 1, 2, and 3')">Calculate synchrony in theta band from channels 1, 2, and 3</a></li>
          </ul>
        </div>
      </div>
      
      <div class="dataset-selection">
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
      </div>
      
      <div class="button-group">
        <button 
          @click="analyzeQuery" 
          class="analyze-btn" 
          :disabled="loading || !query"
        >
          {{ loading ? 'Analyzing...' : 'Analyze Query' }}
        </button>
        
        <button @click="resetQuery" class="clear-btn" :disabled="loading">
          Clear
        </button>
      </div>
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <!-- Query Analysis Section -->
    <div v-if="queryAnalysis && !results" class="query-analysis">
      <h3>Query Analysis</h3>
      <div class="analysis-card">
        <div class="analysis-parameter" v-if="queryAnalysis.tool_name">
          <div class="parameter-label">Analysis Type:</div>
          <div class="parameter-value">{{ formatToolName(queryAnalysis.tool_name) }}</div>
        </div>
        <div v-else class="missing-tool-warning">
          <p>No analysis tool identified. You may need to be more specific in your query.</p>
        </div>
        <div class="analysis-parameter" v-if="queryAnalysis.time_window">
          <div class="parameter-label">Time Window:</div>
          <div class="parameter-value">{{ queryAnalysis.time_window[0] }} to {{ queryAnalysis.time_window[1] }} seconds</div>
        </div>
        <div class="analysis-parameter" v-if="queryAnalysis.frequency_band">
          <div class="parameter-label">Frequency Band:</div>
          <div class="parameter-value">{{ queryAnalysis.frequency_band }}</div>
        </div>
        <div class="analysis-parameter" v-if="queryAnalysis.channel_ids && queryAnalysis.channel_ids.length > 0">
          <div class="parameter-label">Channels:</div>
          <div class="parameter-value">{{ queryAnalysis.channel_ids.join(', ') }}</div>
        </div>
        
        <div class="confirm-section">
          <p>Is this analysis correct?</p>
          <button @click="submitQuery" class="confirm-btn" :disabled="loading">
            Yes, Run Analysis
          </button>
          <button @click="editQuery" class="edit-btn">
            No, Edit Query
          </button>
        </div>
      </div>
    </div>
    
    <!-- Results Section -->
    <div v-if="results" class="results-section">
      <h3>Analysis Results</h3>
      
      <div v-if="redirectingToGallery" class="retrieval-result success">
        <h3>Success</h3>
        <p>Analysis completed successfully!</p>
        <div class="folder-info">
          <p>You are being redirected to the Gallery to view results...</p>
        </div>
      </div>
      
      <div class="results-card" v-else>
        <div class="results-header">
          <div class="query-details">
            <div class="analysis-parameter">
              <div class="parameter-label">Query:</div>
              <div class="parameter-value">{{ results.query }}</div>
            </div>
            <div class="analysis-parameter" v-if="results.parameters">
              <div class="parameter-label">Time Window:</div>
              <div class="parameter-value">{{ results.parameters.time_window[0] }} to {{ results.parameters.time_window[1] }} seconds</div>
            </div>
            <div v-if="results.synchrony" class="analysis-parameter">
              <div class="parameter-label">Synchrony Results:</div>
              <div class="parameter-value">
                <div v-for="(value, key) in results.synchrony" :key="key" class="synchrony-value">
                  {{ formatBandName(key) }}: {{ formatNumber(value) }}
                </div>
              </div>
            </div>
          </div>
          <button @click="newQuery" class="new-query-btn">New Query</button>
        </div>
        
        <!-- Image Gallery -->
        <div v-if="results.images && results.images.length > 0" class="result-images">
          <h4>Analysis Visualizations</h4>
          <div class="image-gallery">
            <div v-for="(image, index) in results.images" :key="index" class="gallery-item">
              <h5>{{ formatImageName(image.name) }}</h5>
              <img :src="image.url" :alt="image.name" class="result-image" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NaturalLanguageQuery',
  data() {
    return {
      query: '',
      datasetId: '',
      packageId: '',
      loading: false,
      error: null,
      results: null,
      queryAnalysis: null,
      datasetSet: false,
      redirectingToGallery: false
    };
  },
  methods: {
    async submitQuery() {
      if (!this.query) return;
      
      this.loading = true;
      this.error = null;
      this.results = null;
      this.redirectingToGallery = false;
      
      try {
        // Save current query to localStorage before sending
        localStorage.setItem('nlp_current_query', this.query);
        
        // Use fetch instead of axios
        const response = await fetch('/api/nlp-query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: this.query,
            dataset_id: this.datasetId || undefined,
            package_id: this.packageId || undefined
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Error processing your query');
        }
        
        this.results = data;
        this.queryAnalysis = null;
        
        // Save results to localStorage
        localStorage.setItem('nlp_current_results', JSON.stringify(data));
        
        // If we have results, set the dataset as configured for future queries
        if (data && !this.datasetSet) {
          this.datasetSet = true;
        }
        
        // Check if we should redirect to gallery
        if (data.redirect_to_gallery && data.gallery_entry) {
          this.redirectingToGallery = true;
          
          // Save to localStorage for gallery to find
          localStorage.setItem('last_analysis_dir', data.output_dir);
          localStorage.setItem('last_analysis_timestamp', data.timestamp);
          
          // Add to analysis history
          const savedHistory = localStorage.getItem('analysis_history');
          let history = savedHistory ? JSON.parse(savedHistory) : [];
          
          // Check if this analysis already exists
          const existingIndex = history.findIndex(item => item.path === data.output_dir);
          if (existingIndex === -1) {
            // Add to the beginning of the array (most recent first)
            history.unshift(data.gallery_entry);
          } else {
            // Update the existing entry
            history[existingIndex] = data.gallery_entry;
          }
          
          // Limit history to 10 items
          if (history.length > 10) {
            history = history.slice(0, 10);
          }
          
          // Save updated history
          localStorage.setItem('analysis_history', JSON.stringify(history));
          
          // Redirect to gallery after a short delay
          setTimeout(() => {
            this.$router.push('/gallery');
          }, 3000);
        }
      } catch (err) {
        console.error('Error processing query:', err);
        this.error = err.message || 'Error processing your query';
      } finally {
        this.loading = false;
      }
    },
    
    async analyzeQuery() {
      if (!this.query) return;
      
      this.loading = true;
      this.error = null;
      
      try {
        // Save current query to localStorage before sending
        localStorage.setItem('nlp_current_query', this.query);
        
        // Use fetch instead of axios
        const response = await fetch('/api/nlp-analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: this.query
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Error analyzing your query');
        }
        
        this.queryAnalysis = data.analysis;
        
        // Save analysis to localStorage
        localStorage.setItem('nlp_current_analysis', JSON.stringify(data.analysis));
      } catch (err) {
        console.error('Error analyzing query:', err);
        this.error = err.message || 'Error analyzing your query';
      } finally {
        this.loading = false;
      }
    },
    
    resetQuery() {
      this.query = '';
      this.queryAnalysis = null;
      this.results = null;
      this.error = null;
      
      // Clear saved query and results from localStorage
      localStorage.removeItem('nlp_current_query');
      localStorage.removeItem('nlp_current_analysis');
      localStorage.removeItem('nlp_current_results');
    },
    
    newQuery() {
      this.results = null;
      this.queryAnalysis = null;
      this.error = null;
      
      // Remove only results from localStorage, keep the query
      localStorage.removeItem('nlp_current_results');
      localStorage.removeItem('nlp_current_analysis');
    },
    
    editQuery() {
      this.queryAnalysis = null;
      
      // Remove only analysis from localStorage, keep the query
      localStorage.removeItem('nlp_current_analysis');
    },
    
    setExample(example) {
      this.query = example;
      localStorage.setItem('nlp_current_query', example);
    },
    
    formatToolName(toolName) {
      if (!toolName) return 'Unknown';
      
      // Convert camelCase or snake_case to Title Case with spaces
      return toolName
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^\s+/, '')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },
    
    formatBandName(key) {
      // Convert keys like "alpha_mean" to "Alpha Band"
      const band = key.split('_')[0];
      return band.charAt(0).toUpperCase() + band.slice(1) + ' Band';
    },
    
    formatImageName(name) {
      // Clean up image names for display
      return name
        .replace('.png', '')
        .replace(/_/g, ' ')
        .replace(/by/g, 'by ')
        .replace(/band/g, 'Band')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },
    
    formatNumber(num) {
      if (num === undefined || num === null) return 'N/A';
      return typeof num === 'number' ? num.toFixed(4) : num;
    }
  },
  created() {
    // Check if we have dataset/package IDs saved in localStorage
    const savedDatasetId = localStorage.getItem('datasetId');
    const savedPackageId = localStorage.getItem('packageId');
    
    if (savedDatasetId) this.datasetId = savedDatasetId;
    if (savedPackageId) this.packageId = savedPackageId;
    
    if (savedDatasetId && savedPackageId) {
      this.datasetSet = true;
    }
    
    // Restore query state from localStorage
    const savedQuery = localStorage.getItem('nlp_current_query');
    const savedAnalysis = localStorage.getItem('nlp_current_analysis');
    const savedResults = localStorage.getItem('nlp_current_results');
    
    if (savedQuery) {
      this.query = savedQuery;
    }
    
    if (savedAnalysis) {
      try {
        this.queryAnalysis = JSON.parse(savedAnalysis);
      } catch (e) {
        console.error('Error parsing saved analysis:', e);
        localStorage.removeItem('nlp_current_analysis');
      }
    }
    
    if (savedResults) {
      try {
        this.results = JSON.parse(savedResults);
      } catch (e) {
        console.error('Error parsing saved results:', e);
        localStorage.removeItem('nlp_current_results');
      }
    }
  },
  watch: {
    datasetId(newValue) {
      if (newValue) localStorage.setItem('datasetId', newValue);
    },
    packageId(newValue) {
      if (newValue) localStorage.setItem('packageId', newValue);
    }
  }
};
</script>

<style scoped>
.natural-language-query {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-5);
}

h2 {
  margin-bottom: var(--space-5);
  color: var(--text-primary);
}

h3, h4 {
  margin-bottom: var(--space-3);
  color: var(--text-primary);
}

p {
  color: var(--text-secondary);
}

.input-section {
  background-color: var(--bg-card);
  border-radius: var(--border-radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-5);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.nlp-query-box {
  margin-bottom: var(--space-4);
  color: var(--text-secondary);
}

label {
  display: block;
  margin-bottom: var(--space-2);
  font-weight: 500;
  color: var(--text-secondary);
}

textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border-medium);
  border-radius: var(--border-radius-sm);
  font-size: 1rem;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  resize: vertical;
}

.examples {
  margin-top: var(--space-3);
  font-size: 0.9rem;
}

.examples p {
  margin-bottom: var(--space-2);
  font-weight: 600;
}

.examples ul {
  padding-left: var(--space-5);
}

.examples a {
  color: var(--primary-500);
  text-decoration: none;
}

.examples a:hover {
  text-decoration: underline;
}

.dataset-selection {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.input-group {
  flex: 1;
  margin-bottom: var(--space-4);
}

input[type="text"] {
  width: 100%;
  padding: var(--space-2);
  border: 1px solid var(--border-medium);
  border-radius: var(--border-radius-sm);
  font-size: 1rem;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.button-group {
  display: flex;
  gap: var(--space-3);
}

button {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-weight: 500;
  transition: background-color var(--transition-fast);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.analyze-btn, .confirm-btn, .submit-btn {
  background-color: var(--primary-500);
  color: white;
}

.analyze-btn:hover:not(:disabled), 
.confirm-btn:hover:not(:disabled), 
.submit-btn:hover:not(:disabled) {
  background-color: var(--primary-600);
}

.clear-btn, .edit-btn {
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
}

.clear-btn:hover:not(:disabled), 
.edit-btn:hover:not(:disabled) {
  background-color: var(--neutral-600);
}

.new-query-btn {
  background-color: var(--primary-500);
  color: white;
}

.new-query-btn:hover:not(:disabled) {
  background-color: var(--primary-600);
}

.error-message {
  color: var(--danger);
  background-color: rgba(220, 53, 69, 0.1);
  padding: var(--space-3);
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--space-4);
}

.query-analysis, .results-section {
  background-color: var(--bg-card);
  border-radius: var(--border-radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-5);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.analysis-card, .results-card {
  padding: var(--space-4);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-sm);
  background-color: var(--bg-secondary);
}

.analysis-parameter {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--border-radius-sm);
  background-color: var(--bg-tertiary);
  border-left: 4px solid var(--primary-500);
}

.parameter-label {
  font-weight: 600;
  color: var(--text-primary);
  min-width: 150px;
  margin-right: 20px;
}

.parameter-value {
  flex: 1;
  color: var(--text-secondary);
}

.analysis-item {
  margin-bottom: var(--space-3);
  color: var(--text-secondary);
}

.analysis-item strong {
  margin-right: var(--space-2);
  font-weight: 600;
  color: var(--text-primary);
}

.synchrony-value {
  margin-bottom: var(--space-2);
  color: var(--text-secondary);
}

.confirm-section {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-light);
}

.confirm-section p {
  margin-bottom: var(--space-3);
  font-weight: 600;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
}

.result-images {
  margin-top: var(--space-5);
}

.result-images h4 {
  margin-bottom: var(--space-4);
}

.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.gallery-item {
  display: flex;
  flex-direction: column;
}

.gallery-item h5 {
  margin-bottom: var(--space-2);
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.result-image {
  width: 100%;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-light);
}

.retrieval-result {
  background-color: var(--bg-card);
  border-radius: var(--border-radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-5);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.retrieval-result.success {
  background-color: rgba(46, 204, 113, 0.1);
  border-color: var(--secondary-300);
}

.retrieval-result h3 {
  margin-bottom: var(--space-2);
  color: var(--text-primary);
}

.retrieval-result p {
  margin-bottom: var(--space-3);
  color: var(--text-secondary);
}

.folder-info {
  margin-top: var(--space-3);
  padding: var(--space-3);
  background-color: var(--bg-tertiary);
  border-radius: var(--border-radius-sm);
}

.folder-info p {
  margin: 0;
  color: var(--text-secondary);
}

.missing-tool-warning {
  background-color: rgba(255, 193, 7, 0.1);
  color: var(--warning);
  padding: var(--space-3);
  border-radius: var(--border-radius-sm);
  border-left: 4px solid var(--warning);
  margin-bottom: var(--space-4);
}

.missing-tool-warning p {
  margin: 0;
  font-weight: 500;
  color: var(--warning);
}

.confirm-btn {
  margin-right: var(--space-3);
}

@media (max-width: 768px) {
  .dataset-selection {
    flex-direction: column;
    gap: var(--space-3);
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .button-group button {
    width: 100%;
  }
  
  .image-gallery {
    grid-template-columns: 1fr;
  }
}
</style> 