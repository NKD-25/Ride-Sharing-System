const express = require('express');
const cors = require('cors');
const { port } = require('./src/config');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/rides', require('./src/routes/rides'));
app.use('/api/bookings', require('./src/routes/bookings'));

app.use(errorHandler);  // must be last

app.listen(port, () => console.log(`Server running on port ${port}`));