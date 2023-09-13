import {getHeader, HOST} from './clientConfig.js';
const messageDiv = document.getElementById('form-message');



const authenticate = (formData) => {
    try {
        fetch(HOST + '/api/auth/login', {
            method: 'POST',
            body: formData, // Serialized data
            headers: {
                // Specify the content type as 'application/x-www-form-urlencoded'
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    const message = document.createTextNode(data.error);
                    messageDiv.setAttribute('class', 'error');
                    messageDiv.appendChild(message);
                } else {
                    const authToken = data.token;
                    if (authToken) {
                        localStorage.setItem('authToken', authToken);
                        const userRole = data.userRole;
                        window.location.href = `/dashboard?role=${userRole}`;
                    } else console.error('Unexpected error!');
                }
            })
    } catch (err) {
        console.error('Error while authentication: ', err);
    }
}

const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    console.log(formData);
    authenticate(formData);
});