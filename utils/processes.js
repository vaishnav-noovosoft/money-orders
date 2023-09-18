const db = require("../db/postgres");
const pool = require("../db/postgresPool");
const {executeTransaction} = require('./transaction');
const {sendEmail} = require("./mail");
const {getUserById} = require("./users");

const createProcess = async ({
    status = 'PENDING', processType = '', transaction = {},
    email = {}
}) => {
    // Transaction = {type: '', from_user: 0, to_user: 0, amount: 0};
    // Email = {receiver: 0, transactionCount: 10}

    if(processType === 'TRANSACTION') {
        if(Object.keys(transaction).length === 0) {
            console.error('Missing transaction parameter to createProcess()');
            return;
        }

        if(typeof transaction.amount !== 'number' || Number.isNaN(transaction.amount)) {
            console.error('Amount is not a number');
            return;
        }

        const query = `
          INSERT INTO 
          processes (status, type, transaction_type, transaction_from_user, transaction_to_user, transaction_amount)
          VALUES($1, $2, $3, $4, $5, $6)
          RETURNING *;
        `;
        const values = [status, processType, transaction.type, transaction.from_user, transaction.to_user, transaction.amount];
        const result = await db.query(query, values);

        return result.rows[0];
    } else if(processType === 'EMAIL') {
        if(Object.keys(email).length === 0) {
            console.error('Missing email parameter to createProcess()');
            return;
        }

        const query = `
          INSERT INTO 
          processes (status, type, email_receiver, email_transaction_count)
          VALUES($1, $2, $3, $4)
          RETURNING *;
        `;
        const values = [status, processType, email.receiver, email.transactionCount];
        const result = await db.query(query, values);

        return result.rows[0];
    }
}

const updateProcessStatus = async (client, processId = 0, status = '') => {
    let query;
    let values;
    if(status === 'COMPLETED') {
        query = `
          UPDATE processes
          SET status = $1, completed_at = $2
          WHERE id = $3
          RETURNING *;
        `;
        const completed_at = new Date();
        values = [status, completed_at, processId];
    } else {
        query = `
          UPDATE processes
          SET status = $1
          WHERE id = $2
          RETURNING *;
        `;
        values = [status, processId];
    }

    const result = await client.query(query, values);
    return result.rows[0];
}

const retrieveOldestPending = async (client, limit) => {
    const query = `
      SELECT 
        id, 
        status, 
        type, 
        transaction_type, 
        transaction_from_user AS from_user, 
        transaction_to_user AS to_user,
        transaction_amount AS amount,
        email_receiver AS receiver,
        email_transaction_count AS transaction_count
      FROM processes
      WHERE status = $1
      ORDER BY created_at
      LIMIT $2;
    `;
    const values = ['PENDING', limit];
    const result = await client.query(query, values);
    return result.rows;
}

const scheduleProcessExecution = async (client, jobLimit = 10) => {
    try {
        const processes = await retrieveOldestPending(client, jobLimit);

        for(const job of processes) {
            const processType = job.type;

            if(processType === 'TRANSACTION') {
                await updateProcessStatus(client, job.id, 'PROCESSING');
                executeTransaction(client, {
                    transactionType: job.transaction_type,
                    fromUserId: job.from_user,
                    toUserId: job.to_user,
                    amount: job.amount
                }).then(async (data) => {
                    if(data.error) {
                        console.error('Transaction processing failed with message: ', data.error);
                        await updateProcessStatus(client, job.id, 'FAILED');
                    } else {
                        await updateProcessStatus(client, job.id, 'COMPLETED');
                    }
                });

            } else if(processType === 'EMAIL') {
                const userObject = await getUserById(job.receiver, client);
                sendEmail(client, userObject, job.transaction_count)
                    .then(async (data) => {
                        if(data.error) {
                            console.error('Email sending failed with message: ', data.error);
                            await updateProcessStatus(client, job.id, 'FAILED');
;                        } else {
                            await updateProcessStatus(client, job.id, 'COMPLETED');
                        }
                    });
            }
        }
    }
    catch (err) {
        console.error('Error processing jobs: ', err);
    }
}

module.exports = {
    scheduleProcessExecution,
    createProcess
}