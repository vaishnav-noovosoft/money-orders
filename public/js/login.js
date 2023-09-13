import { HOST } from "./clientConfig.js";

const authenticate = (username, password) => {
    try {
        fetch(HOST + '/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ "username": username, "password": password }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    const messageDiv = document.getElementById('form-message');
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
            });
    } catch (err) {
        console.error('Error while authentication: ', err);
    }
}

const loginForm = document.getElementById('form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

   const username = usernameInput.value;
   const password = passwordInput.value;

   authenticate(username, password);
});

