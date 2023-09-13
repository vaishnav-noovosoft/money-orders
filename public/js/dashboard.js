import { getHeader, HOST } from './clientConfig.js';

// Define the request headers, including the Authorization header
const headers = getHeader();

const checkTokenValidity = () => {
    fetch(HOST + '/api/auth/verify-token', {
        method: "GET",
        headers: headers
    })
        .then((res) => res.json())
        .then(data => {
            if(data.error) {
                window.location.href = '/api/auth/login';
            }
        })
        .catch((err) => {
            window.location.href = '/api/auth/login';
        });
}

checkTokenValidity();

const retrieveUsersFromDB = async () => {
    try {
        const data = await fetch(HOST + '/api/users', {
            method: 'GET',
            headers: headers,
        });

        return await data.json();
    } catch (error) {
        console.error('Error retrieving users');
    }
}

const listUsers = async (element) => {
    const fromUserDeposit = document.getElementById(element);
    const { users } = await retrieveUsersFromDB();

    users.forEach((user => {
        const option = document.createElement('option');

        const innerText = document.createTextNode(user.username.toString());
        option.appendChild(innerText);

        option.setAttribute('value', user.username.toString());
        fromUserDeposit.appendChild(option);
    }));
}

await listUsers('fromUserDeposit');
await listUsers('fromUserWithdraw');

