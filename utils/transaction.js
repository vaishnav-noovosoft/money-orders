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
    if(!await isSufficientBalance(client, userId, amount)) return null;

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
    if(!result) return null;
    return await depositAmount(client, toUserId, amount);
}

const executeTransaction = async (client, {transactionType, fromUserId, toUserId, amount}) => {
    if(transactionType === 'DEPOSIT') {
        await depositAmount(client, toUserId, amount);
    } else if(transactionType === 'WITHDRAW') {
        await withdrawAmount(client, fromUserId, amount);
    }
    else if(transactionType === 'TRANSFER') {
        await transferAmount(client, fromUserId, toUserId, amount);
    }
}

const retrieveUserTransactions = async (client, userObject, limit) => {
    if (userObject.role === 'user') {
        const query = `
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
        const values = ['TRANSACTION', userObject.id, limit];
        const result = await client.query(query, values);
        return result.rows;
    } else if (userObject.role === 'admin') {
        const query = `
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
        const values = ['TRANSACTION', limit];
        const result = await client.query(query, values);
        return result.rows;
    }
};

module.exports = {
    executeTransaction,
    retrieveUserTransactions
}