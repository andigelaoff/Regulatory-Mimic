import axios from "axios";

const apiUrl = process.env.REACT_APP_API_BASE_URL;

const login = async (email, password) => {
    try {
        const response = await axios.post(`${apiUrl}/signin`, {
        email,
        password,
        });

        // Check for successful response
        if (response.status === 200) {
            return response.data; // Return the data if successful
        } else {
            // Handle other status codes
            return { error: `Error: ${response.statusText}` };
        }
    } catch (error) {
        // Check if error response exists
        if (error.response) {
            return { error: `Error:  ${error.response.detail || error.response.statusText}` };
        } else {
            return { error: 'Network error or server is down.' };
        }
    }
};

const signup = async (fullname, email, password) => {
    try {
        const response = await axios.post(`${apiUrl}/signup`, {
            full_name: fullname,
            email,
            password,
        });

        // Check for successful response
        if (response.status === 200) {
            return response.data; // Return the data if successful
        } else {
            // Handle other status codes
            return { error: `Error:  ${response.statusText}` };
        }
    } catch (error) {
        // Check if error response exists
        if (error.response) {
            return { error: `Error:  ${error.response.data.message || error.response.statusText}` };
        } else {
            return { error: 'Network error or server is down.' };
        }
    }
};

const verifyCode = async (email, code) => {
    try {
        const response = await axios.post(`${apiUrl}/confirm-signup`, {
            email,
            code,
        });

        // Check for successful response
        if (response.status === 200) {
            return response.data; // Return the data if successful
        } else {
            // Handle other status codes
            return { error: `Error:  ${response.statusText}` };
        }
    } catch (error) {
        // Check if error response exists
        if (error.response) {
            return { error: `Error:  ${error.response.data.message || error.response.statusText}` };
        } else {
            return { error: 'Network error or server is down.' };
        }
    }
};

export { login, signup, verifyCode };