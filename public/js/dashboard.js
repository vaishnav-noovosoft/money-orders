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
            } else {
                const role = data.user.role;
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

const populateTableWithTransactions = (transactions = []) => {
    const tbody = document.getElementById('table-body');

    transactions.forEach((transaction) => {
        const tr = document.createElement('tr');

        const tdType = document.createElement('td');
        const typeText = document.createTextNode(transaction.type);
        tdType.appendChild(typeText);
        tr.appendChild(tdType);

        const tdFromUser = document.createElement('td');
        const fromUserText = document.createTextNode(transaction.from_username);
        tdFromUser.appendChild(fromUserText);
        tr.appendChild(tdFromUser);

        const tdToUser = document.createElement('td');
        const toUserText = document.createTextNode(transaction.to_username);
        tdToUser.appendChild(toUserText);
        tr.appendChild(tdToUser);

        const tdAmount = document.createElement('td');
        const amountText = document.createTextNode(transaction.amount);
        tdAmount.appendChild(amountText);
        tr.appendChild(tdAmount);

        tbody.appendChild(tr);
    });
}

const fetchTransactions = async () => {
    const limit = 15;
    try {
        fetch(HOST + `/api/transactions?limit=${limit}`, {
            method: 'GET',
            headers: headers
        })
            .then((res) => res.json())
            .then(data => {
                if(data.error)
                    console.error(data);
                else {
                    populateTableWithTransactions(data.transactions);
                }
            });
    }
    catch (err) {
        console.error('Error while retrieving transactions', err);
    }
}

const removeTransactions = () => {
    const tbody = document.getElementById('table-body');

    while(tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
}

await listUsers('toUserDeposit');
await listUsers('fromUserWithdraw');
await listUsers('toUserTransfer');
await listUsers('fromUserTransfer');
await fetchTransactions();

// Transaction actions
const depositForm = document.getElementById('form-deposit');
const withdrawForm = document.getElementById('form-withdraw');
const transferForm = document.getElementById('form-transfer');

depositForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const toUser = document.getElementById('toUserDeposit').value;
    const amount = document.getElementById('amountDeposit').value;

    try {
        fetch(HOST + `/api/transactions?type=deposit`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                "toUser": toUser,
                "amount": amount
            })
        })
            .then((res) => res.json())
            .then(async (data) => {
               if(data.error) {
                   console.error(data);
               } else {
                   removeTransactions();
                   await fetchTransactions();
               }
            });
    }
    catch (err) {}
});

withdrawForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const fromUser = document.getElementById('fromUserWithdraw').value;
    const amount = document.getElementById('amountWithdraw').value;

    try {
        fetch(HOST + '/api/transactions?type=withdraw', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                "fromUser": fromUser,
                "amount": amount
            })
        })
            .then(res => res.json())
            .then(async data => {
                if(data.error) {
                    console.error(data);
                } else {
                    removeTransactions();
                    await fetchTransactions();
                }
            })
            .catch(err => {
                console.error(err);
            });
    }
    catch (err) {
        console.error(err);
    }
});

transferForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const fromUser = document.getElementById('fromUserTransfer').value;
    const toUser = document.getElementById('toUserTransfer').value;

    if(fromUser === toUser) return;

    const amount = document.getElementById('amountTransfer').value;

    try {
       fetch(HOST + '/api/transactions?type=transfer', {
           method: 'POST',
           headers: headers,
           body: JSON.stringify({
               "fromUser": fromUser,
               "toUser": toUser,
               "amount": amount
           })
       })
           .then(res => res.json())
           .then(async data => {
               if(data.error) {
                   console.error(data);
               } else {
                   removeTransactions();
                   await fetchTransactions();
               }
           })
           .catch(err => {
               console.error(err);
           });
    }
    catch (err) {
        console.error(err);
    }
});
