import './assets/styles/index.css'

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
const identityPoolId = import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID;

// Basic validation
if (!region || !userPoolId || !userPoolClientId || !oauthDomain) {
    console.error("Error: Missing required environment variables for AWS configuration.");
    console.log("Required environment variables:");
    console.log("- VITE_AWS_REGION");
    console.log("- VITE_COGNITO_USER_POOL_ID");
    console.log("- VITE_COGNITO_USER_POOL_WEB_CLIENT_ID");
    console.log("- VITE_COGNITO_OAUTH_DOMAIN");
    console.log("- VITE_COGNITO_IDENTITY_POOL_ID (for S3 uploads)");
}

const awsConfig = {
    Auth: {
        Cognito: {
            userPoolId: userPoolId,
            userPoolClientId: userPoolClientId,
            identityPoolId: identityPoolId,
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
    }
};

console.log("Configuring AWS Amplify with region:", region);
Amplify.configure(awsConfig);

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app') 