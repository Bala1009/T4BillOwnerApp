import axiosInstance from './axiosInstance';

export const loginUser = async (userName, passWord, deviceID = "unknown") => {
    try {
        const response = await axiosInstance.post('Login/GetLogin', {
            userName: userName,
            passWord: passWord,
            deviceID: deviceID
        });
        
        // We will return the response object so the caller can extract headers for 'authtoken' 
        // and data for user details
        return response;
    } catch (error) {
        if (error.response) {
            throw error.response.data;
        } else if (error.request) {
            throw { message: 'Network error. Please try again later.' };
        } else {
            throw { message: 'An unexpected error occurred.' };
        }
    }
};
