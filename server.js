const express = require('express');
const path = require('path');
const app = express();

// Статические файлы
app.use(express.static('public'));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Все остальные запросы направляем на index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PWA_PORT || 3001;
app.listen(port, () => {
    console.log(`PWA client running on http://localhost:${port}`);
}); 