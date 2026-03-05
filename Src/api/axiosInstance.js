import axios from 'axios';

const BASE_URL = 'https://api.touch4bill.com/V1.0/';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        // You can attach tokens here if needed
        // const token = await AsyncStorage.getItem('token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle global errors here
        return Promise.reject(error);
    }
);

export default axiosInstance;
