const isSufficientBalance = async (client, userId, amount) => {
    const query = `
      SELECT balance
      FROM users
      WHERE id = $1;
    `;
    const values = [userId];
    const result = await client.query(query, values);
    const user = result.rows[0];

    return user.balance >= amount;
}

const depositAmount = async (client, userId, amount) => {
    const query = `
      UPDATE users
      SET balance = balance - $1
      WHERE id = $2
      RETURNING *;
    `;
    const values = [amount, userId];
    const result = await client.query(query, values);
    return result.rows[0];
}

const withdrawAmount = async (client, userId, amount) => {
    if(!await isSufficientBalance(client, userId, amount)) throw 'In-Sufficient balance';

    const query = `
      UPDATE users
      SET balnce = balance - $1
      WHERE id = $2
      RETURNING *;
    `;
    const values = [amount, userId];
    const result = await client.query(query, values);
    return result.rows[0];
}

const transferAmount = async (client, fromUserId, toUserId, amount) => {
    const result = await withdrawAmount(client, fromUserId, amount);
    if(!result) throw 'Error while transaction';
    return await depositAmount(client, toUserId, amount);
}

const executeTransaction = async (client, {transactionType, fromUserId, toUserId, amount}) => {
    try {
        if(transactionType === 'DEPOSIT') {
            await depositAmount(client, toUserId, amount);
        } else if(transactionType === 'WITHDRAW') {
            await withdrawAmount(client, fromUserId, amount);
        }
        else if(transactionType === 'TRANSFER') {
            await transferAmount(client, fromUserId, toUserId, amount);
        }
        return {"message": "OK"};
    } catch (err) {
        return {"error": err.message};
    }
}

const retrieveUserTransactions = async (client, userObject, limit, lastTimestamp) => {
    if (userObject.role === 'user') {
        let query;
        let values;
        if(!lastTimestamp) {
            query = `
            SELECT
                p.id,
                p.status,
                p.transaction_type AS type,
                uf.username AS from_user,
                ut.username AS to_user,
                p.transaction_amount AS amount,
                p.created_at
            FROM processes p
            LEFT JOIN users uf ON p.transaction_from_user = uf.id
            LEFT JOIN users ut ON p.transaction_to_user = ut.id
            WHERE p.type = $1 AND (p.transaction_from_user = $2 OR p.transaction_to_user = $2)
            ORDER BY p.created_at DESC
            LIMIT $3;
            `;
            values = ['TRANSACTION', userObject.id, limit];
        } else {
            query = `
            SELECT
                p.id,
                p.status,
                p.transaction_type AS type,
                uf.username AS from_user,
                ut.username AS to_user,
                p.transaction_amount AS amount,
                p.created_at
            FROM processes p
            LEFT JOIN users uf ON p.transaction_from_user = uf.id
            LEFT JOIN users ut ON p.transaction_to_user = ut.id
            WHERE p.type = $1 AND (p.transaction_from_user = $2 OR p.transaction_to_user = $2) AND created_at > $3
            ORDER BY p.created_at DESC
            LIMIT $4;
            `;
            console.log(lastTimestamp);
            values = ['TRANSACTION', userObject.id, new Date(lastTimestamp), limit];
        }

        const result = await client.query(query, values);
        return result.rows;
    } else if (userObject.role === 'admin') {
        let query, values;
        if(!lastTimestamp) {
            query = `
            SELECT
                p.id,
                p.status,
                p.transaction_type AS type,
                uf.username AS from_user,
                ut.username AS to_user,
                p.transaction_amount AS amount,
                p.created_at
            FROM processes p
            LEFT JOIN users uf ON p.transaction_from_user = uf.id
            LEFT JOIN users ut ON p.transaction_to_user = ut.id
            WHERE p.type = $1
            ORDER BY p.created_at DESC
            LIMIT $2;
            `;
            values = ['TRANSACTION', limit];
        } else {
            query = `
            SELECT
                p.id,
                p.status,
                p.transaction_type AS type,
                uf.username AS from_user,
                ut.username AS to_user,
                p.transaction_amount AS amount,
                p.created_at
            FROM processes p
            LEFT JOIN users uf ON p.transaction_from_user = uf.id
            LEFT JOIN users ut ON p.transaction_to_user = ut.id
            WHERE p.type = $1 AND created_at > $2
            ORDER BY p.created_at DESC
            LIMIT $3;
            `;
            console.log(lastTimestamp);
            values = ['TRANSACTION', new Date(lastTimestamp), limit];
        }
        const result = await client.query(query, values);
        return result.rows;
    }
};

module.exports = {
    executeTransaction,
    retrieveUserTransactions
}