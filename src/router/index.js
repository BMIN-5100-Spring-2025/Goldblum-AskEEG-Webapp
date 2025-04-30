import { createRouter, createWebHistory } from 'vue-router';
import { getCurrentUser } from '@aws-amplify/auth';

import SignIn from '../components/auth/SignIn.vue';
import CompleteNewPassword from '../components/auth/CompleteNewPassword.vue';
import ResetPassword from '../components/auth/ResetPassword.vue';
import UploadComponent from '../components/upload/UploadComponent.vue';
import Home from '../components/Home.vue';
import ImageGallery from '../components/ImageGallery.vue';
import DataWorkflow from '../components/DataWorkflow.vue';

const routes = [
    {
        path: '/',
        redirect: '/signin'
    },
    {
        path: '/signin',
        name: 'signin',
        component: SignIn
    },
    {
        path: '/complete-new-password/:username',
        name: 'completeNewPassword',
        component: CompleteNewPassword
    },
    {
        path: '/reset-password/:username',
        name: 'resetPassword',
        component: ResetPassword
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: Home,
        meta: { requiresAuth: true }
    },
    {
        path: '/upload',
        name: 'upload',
        component: UploadComponent,
        meta: { requiresAuth: true }
    },
    {
        path: '/gallery',
        name: 'gallery',
        component: ImageGallery,
        meta: { requiresAuth: true }
    },
    {
        path: '/workflow',
        name: 'workflow',
        component: DataWorkflow,
        meta: { requiresAuth: true }
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

    if (requiresAuth) {
        try {
            const user = await getCurrentUser();
            if (user) {
                next();
            } else {
                next('/signin');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            next('/signin');
        }
    } else {
        next();
    }
});

export default router; 