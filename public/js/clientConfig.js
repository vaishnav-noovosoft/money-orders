export const HOST = 'http://localhost:3000';

const getAuthToken = () => {
    return localStorage.getItem('authToken');
}

export const getHeader = () => {
    return new Headers({
        'Content-Type': 'application/json', // Specify the content type as JSON
        'Authorization': `Bearer ${getAuthToken()}` // Include the authorization token
    });
}