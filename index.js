// Ali Md mini bot - entry point
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// bot.js exports the router (pair page, /code, /status, /active, /ping ...)
app.use('/', require('./bot'));

app.listen(PORT, () => {
    console.log(`Ali Md mini bot running on port ${PORT}`);
});

module.exports = app;
