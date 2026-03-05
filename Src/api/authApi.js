import axiosInstance from './axiosInstance';

export const loginUser = async (email, password) => {
    try {
        const response = await axiosInstance.post('Login/GetLogin', {
            Email: email,
            Password: password,
            // Add other required parameters if any, corresponding to your API docs
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            // Server responded with an error status
            throw error.response.data;
        } else if (error.request) {
            // The request was made but no response was received
            throw { message: 'Network error. Please try again later.' };
        } else {
            // Something happened in setting up the request
            throw { message: 'An unexpected error occurred.' };
        }
    }
};
