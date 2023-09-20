import {getHeader, HOST, setUser, getUser} from './client-config.js';

const emailButton = document.getElementById('btn-send-email');

let lastTimestamp = null;

const setStatusTextColor = (element, status) => {
    if(status === 'PENDING') element.className = 'text-yellow';
    else if(status === 'PROCESSING') element.className = 'text-blue';
    else if(status === 'COMPLETED') element.className = 'text-green';
    else element.className = 'text-red';
}

const setAmountTextColor = (element, transactionType, toUser = '') => {
    if(transactionType === 'DEPOSIT') {
        element.textContent = '+' + element.textContent;
        element.className = 'text-green';
    }
    else if(transactionType === 'WITHDRAW') {
        element.textContent = '-' + element.textContent;
        element.className = 'text-red';
    }
    else if(transactionType === 'TRANSFER') {
        const {username, role} = getUser();
        if(role === 'user') {
            if(username === toUser) {
                element.textContent = '+' + element.textContent;
                element.className = 'text-green';
            }
            else {
                element.textContent = '-' + element.textContent;
                element.className = 'text-red';
            }
        } else if(role === 'admin') {
            element.className = 'text-yellow';
        }
    }
}

const sendEmailButton = () => {
    const limit = 15;
    try {
        fetch(HOST + `/api/mail/transaction-history?limit=${limit}`, {
            method: "POST",
            headers: getHeader()
        })
            .then((res) => {
                return res.json();
            })
            .then(async data => {
                if (data.error) {
                    console.error(data);
                } else {
                    const sendEmailBtn = document.getElementById("btn-send-email");
                    sendEmailBtn.disabled = true;
                    sendEmailBtn.innerHTML = "Sent";

                    setTimeout(() => {
                        sendEmailBtn.disabled = false;
                        sendEmailBtn.innerHTML = "Send Email";
                    }, 4000);

                    removeEmails();
                    await fetchEmails();
                }
            })
    } catch (err) {
        console.error('Error while sending Email', err);
    }
}

emailButton.addEventListener("click", sendEmailButton);

const getEmailStatus = (status) => {
    if(status === 'PROCESSING') return 'QUEUED';
    else if(status === 'COMPLETED') return  'SENT';
    else if(status === 'PENDING') return 'PENDING';
    else return 'FAILED';
}

// Fetch Emails
const populateTableWithEmails = (emails = []) => {
    const tbody = document.getElementById('email-table-body');

    emails.forEach((email) => {
        const tr = document.createElement('tr');
        const emailCreatedAt = new Date(email.created_at);

        const tdFromUser = document.createElement('td');
        const fromUserText = document.createTextNode(emailCreatedAt.toLocaleDateString('en-IN').toUpperCase());
        tdFromUser.appendChild(fromUserText);
        tr.appendChild(tdFromUser);

        const tdToUser = document.createElement('td');
        const toUserText = document.createTextNode(emailCreatedAt.toLocaleTimeString('en-IN').toUpperCase());
        tdToUser.appendChild(toUserText);
        tr.appendChild(tdToUser);

        const tdAmount = document.createElement('td');
        const amountText = document.createTextNode(getEmailStatus(email.status) || '-');
        tdAmount.appendChild(amountText);
        setStatusTextColor(tdAmount, email.status);
        tr.appendChild(tdAmount);

        tbody.appendChild(tr);
    });
}

const fetchEmails = async () => {
    const limit = 10;
    try {
        fetch(HOST + `/api/mail?limit=${limit}`, {
            method: 'GET',
            headers: getHeader()
        })
            .then((res) => res.json())
            .then(data => {
                if (data.error)
                    console.error(data);
                else {
                    populateTableWithEmails(data.emails);
                }
            });
    } catch (err) {
        console.error('Error while retrieving emails Transaction', err);
    }
}

const removeEmails = () => {
    const tbody = document.getElementById('email-table-body');

    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
}

// Fetch and Update Emails every 10 seconds
const updateEmailTable = () => {
    setInterval(async () => {
        removeEmails();
        await fetchEmails();
        console.log('Updated emails');
    }, 10000);
}

const fetchTransactions = async () => {
    const limit = 15;

    let URI = HOST + `/api/transactions?limit=${limit}`;
    if(lastTimestamp)
        URI += `&lastTimestamp=${lastTimestamp}`;
    console.log(URI);

    try {
        fetch(URI, {
            method: 'GET',
            headers: getHeader()
        })
            .then((res) => res.json())
            .then(data => {
                if (data.error)
                    console.error(data);
                else {
                    lastTimestamp = data.transactions[0].created_at;
                    populateTableWithTransactions(data.transactions);
                }
            });
    } catch (err) {
        console.error('Error while retrieving transactions', err);
    }
}

const populateTableWithTransactions = (transactions = []) => {
    const tbody = document.getElementById('transaction-table-body');

    transactions.forEach((transaction) => {
        const tr = document.createElement('tr');

        const tdType = document.createElement('td');
        const typeText = document.createTextNode(transaction.type);
        tdType.appendChild(typeText);
        tr.appendChild(tdType);

        const tdFromUser = document.createElement('td');
        const fromUserText = document.createTextNode(transaction.from_user || '-');
        tdFromUser.appendChild(fromUserText);
        tr.appendChild(tdFromUser);

        const tdToUser = document.createElement('td');
        const toUserText = document.createTextNode(transaction.to_user || '-');
        tdToUser.appendChild(toUserText);
        tr.appendChild(tdToUser);

        const tdAmount = document.createElement('td');
        const amountText = document.createTextNode(transaction.amount);
        tdAmount.appendChild(amountText);
        setAmountTextColor(tdAmount, transaction.type, transaction.to_user);
        tr.appendChild(tdAmount);

        const tdStatus = document.createElement('td');
        const statusText = document.createTextNode(transaction.status || '-');
        tdStatus.appendChild(statusText);
        setStatusTextColor(tdStatus, transaction.status);
        tr.appendChild(tdStatus);

        tbody.appendChild(tr);
    });
}

const removeTransactions = () => {
    const tbody = document.getElementById('transaction-table-body');

    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
}

// Fetch and Update Transactions every 10 seconds
setInterval(async () => {
    removeTransactions();
    await fetchTransactions();
    console.log('Updated transactions');
}, 10000);

const checkTokenValidity = () => {
    fetch(HOST + '/api/auth/verify-token', {
        method: "GET",
        headers: getHeader()
    })
        .then((res) => res.json())
        .then(async data => {
            if (data.error) {
                window.location.href = '/api/auth/login';
            } else {
                const role = data.user.role;

                // Set current user in localStorage
                setUser({username: data.user.username, role: data.user.role});

                if (role === "user") {
                    removeElementByClassName("admin-container");
                    const body = document.body;
                    styleManipulator(body);
                    await fetchTransactions();
                    await fetchEmails();
                    updateEmailTable();
                } else {
                    const emailButton = document.getElementById("email-btn-wrapper");
                    emailButton.remove();
                    removeElementByClassName("email-history");

                    const {users} = await retrieveUsersFromDB();
                    await listUsers('toUserDeposit', users);
                    await listUsers('fromUserWithdraw', users);
                    await listUsers('toUserTransfer', users);
                    await listUsers('fromUserTransfer', users);
                    await fetchTransactions();
                }
            }
        })
        .catch((err) => {
            console.error(err);
            window.location.href = '/api/auth/login';
        });
}

checkTokenValidity();

function removeElementByClassName(className) {
    const removeAdmin = document.querySelectorAll('.' + className);
    removeAdmin.forEach(element => {
        element.remove();
    });
}

function styleManipulator(body){
    body.style.display = "block";
    body.style.width = "80%";
    body.style.margin = "auto";
}

const retrieveUsersFromDB = async () => {
    try {
        const data = await fetch(HOST + '/api/users', {
            method: 'GET',
            headers: getHeader(),
        });

        return await data.json();
    } catch (error) {
        console.error('Error retrieving users');
    }
}

const listUsers = async (element, users) => {
    const usersSelect = document.getElementById(element);

    users.forEach((user => {
        const option = document.createElement('option');

        const innerText = document.createTextNode(user.username.toString());
        option.appendChild(innerText);

        option.setAttribute('value', user.username.toString());
        usersSelect.appendChild(option);
    }));
}

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
            headers: getHeader(),
            body: JSON.stringify({
                "toUser": toUser,
                "amount": parseFloat(amount)
            })
        })
            .then((res) => res.json())
            .then(async (data) => {
                if (data.error) {
                    console.error(data);
                } else {
                    removeTransactions();
                    await fetchTransactions();
                }
            });
    } catch (err) {
    }
});

withdrawForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const fromUser = document.getElementById('fromUserWithdraw').value;
    const amount = document.getElementById('amountWithdraw').value;

    try {
        fetch(HOST + '/api/transactions?type=withdraw', {
            method: 'POST',
            headers: getHeader(),
            body: JSON.stringify({
                "fromUser": fromUser,
                "amount": parseFloat(amount)
            })
        })
            .then(res => res.json())
            .then(async data => {
                if (data.error) {
                    console.error(data);
                } else {
                    removeTransactions();
                    await fetchTransactions();
                }
            })
            .catch(err => {
                console.error(err);
            });
    } catch (err) {
        console.error(err);
    }
});

transferForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const fromUser = document.getElementById('fromUserTransfer').value;
    const toUser = document.getElementById('toUserTransfer').value;

    if (fromUser === toUser) return;

    const amount = document.getElementById('amountTransfer').value;

    try {
        fetch(HOST + '/api/transactions?type=transfer', {
            method: 'POST',
            headers: getHeader(),
            body: JSON.stringify({
                "fromUser": fromUser,
                "toUser": toUser,
                "amount": parseFloat(amount)
            })
        })
            .then(res => res.json())
            .then(async data => {
                if (data.error) {
                    console.error(data);
                } else {
                    removeTransactions();
                    await fetchTransactions();
                }
            })
            .catch(err => {
                console.error(err);
            });
    } catch (err) {
        console.error(err);
    }
});
