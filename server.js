const express = require('express');
const pool = require('./DataBase');

const app = express();
const PORT = process.env.PORT || 9000;
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  );

  next();
});
async function getInitialBal(user_id) {
  const result = await pool.query(
    'select balance from personalwallet where user_id=$1',
    [user_id]
  );
  console.log(result.rows[0].balance, 'balance');
  return result.rows[0].balance;
}
app.get('/allWallets', async (req, res) => {
  let result = {};
  result = await pool.query('select * from personalwallet');

  // console.log(await JSON.stringify(result.rows));
  getInitialBal(2);
  res.send(result.rows).status(200);
});
app.get('/balance', async (req, res) => {
  const user_id = req.query.user_id;
  // console.log(req.query.user_id, 'userid');
  await pool
    .query('select * from personalwallet where user_id=$1', [user_id])
    .then((data) => res.status(200).send(data.rows))
    .catch((e) => res.status(500).send(e.message));
});
app.get('/transactions', async (req, res) => {
  const { user_id } = req.query;
  await pool
    .query('select * from transactions where user_id=$1', [user_id])
    .then((data) => res.status(200).send(data.rows))
    .catch((e) => res.status(401).send(e.message));
});
app.put('/addFunds', async (req, res) => {
  const { user_id, amount } = req.body;
  // console.log(user_id, amount, 'user id');
  const initial_balance = await getInitialBal(user_id);
  console.log(user_id, typeof amount, initial_balance, 'user id');
  await pool
    .query('update personalwallet set balance=$1 where user_id=$2', [
      (initial_balance + parseFloat(amount)).toFixed(2),
      user_id,
    ])
    .then(async () => {
      await pool
        .query(
          'INSERT INTO public.transactions(user_id, transaction_type, trans_date, initial_balance, final_balance, remarks)	VALUES ($1, $2, $3, $4, $5, $6)',
          [
            user_id,
            'add_funds',
            new Date(),
            initial_balance,
            (initial_balance + parseFloat(amount)).toFixed(2),
            'added funds',
          ]
        )
        .then((dt) => res.status(200).send(dt));
    });
});
app.put('/spendFunds', async (req, res) => {
  const { user_id, amount } = req.body;
  const initial_balance = await getInitialBal(user_id);
  await pool
    .query('update personalwallet set balance=$1 where user_id=$2', [
      (initial_balance - parseFloat(amount)).toFixed(2),
      user_id,
    ])
    .then(async () => {
      await pool.query(
        'INSERT INTO public.transactions(user_id, transaction_type, trans_date, initial_balance, final_balance, remarks)	VALUES ($1, $2, $3, $4, $5, $6)',
        [
          user_id,
          'spend_funds',
          Date.now(),
          initial_balance,
          (initial_balance - parseFloat(amount)).toFixed(2),
          'deducted funds',
        ]
      );
    });
});
app.post('/user', async (req, res) => {
  const { username, phone, balance } = req.body;

  const result = await pool
    .query(
      'INSERT INTO public.personalwallet( username, phone, balance)	VALUES ( $1, $2, $3)',
      [username, phone, balance]
    )
    .then((dt) => res.status(200).send(dt))
    .catch((e) => res.status(500).send(e.message));
});
app.listen(PORT, () => console.log(PORT, 'connected'));
