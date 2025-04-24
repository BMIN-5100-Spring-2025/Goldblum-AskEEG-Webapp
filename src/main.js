import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { Amplify } from 'aws-amplify'

// Ensure VITE variables are loaded
const region = import.meta.env.VITE_AWS_REGION;
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_COGNITO_USER_POOL_WEB_CLIENT_ID;
const oauthDomain = import.meta.env.VITE_COGNITO_OAUTH_DOMAIN;
const s3BucketName = import.meta.env.VITE_S3_BUCKET_NAME;

// Basic validation
if (!region || !userPoolId || !userPoolClientId || !oauthDomain || !s3BucketName) {
    console.error("Error: Missing required environment variables for AWS configuration.");
    // TODO: Handle this error appropriately, maybe show a message to the user
}

const awsConfig = {
    Auth: {
        Cognito: {
            userPoolId: userPoolId,
            userPoolClientId: userPoolClientId,
            loginWith: {
                authFlowType: "USER_PASSWORD_AUTH",
                oauth: {
                    domain: oauthDomain,
                    scopes: ['openid', 'email', 'profile', 'aws.cognito.signin.user.admin'],
                    redirectSignIn: ['http://localhost:5173/', 'http://localhost:5174/'],
                    redirectSignOut: ['http://localhost:5173/', 'http://localhost:5174/'],
                    responseType: 'code'
                },
                email: true,
            }
        }
    },
    Storage: {
        S3: {
            bucket: s3BucketName,
            region: region,
        }
    }
};

Amplify.configure(awsConfig);

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app') 