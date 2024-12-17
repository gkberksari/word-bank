const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt'); 
const path = require('path'); 
const http = require('http'); 
const socketIo = require('socket.io'); 

const app = express();
const server = http.createServer(app); 
const io = socketIo(server, {  
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});


// Middleware
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend/public')));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'gokberk99',
    database: 'word_bank'
});

// Database connection and control
db.connect((err) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err);
        return;
    }
    console.log('MySQL veritabanına bağlanıldı');
});

// Just a simple query to check connection
db.query('SELECT 1', (err, results) => {
    if (err) {
        console.error('Veritabanı sorgu hatası:', err);
        return;
    }
    console.log('Veritabanı bağlantısı test edildi ve çalışıyor');
});

// To hold active rooms
const activeRooms = new Map();

io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı');

    socket.on('createRoom', ({ userId, categoryId }) => {
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        db.query(
            'INSERT INTO rooms (room_code, category_id) VALUES (?, ?)',
            [roomCode, categoryId],
            (err, result) => {
                if (err) {
                    socket.emit('roomError', { message: 'Oda oluşturulurken bir hata oluştu' });
                    return;
                }
    
                db.query(
                    'SELECT * FROM categories WHERE id = ?',
                    [categoryId],
                    (err, categoryResults) => {
                        if (err || categoryResults.length === 0) {
                            socket.emit('roomError', { message: 'Kategori bilgisi alınamadı' });
                            return;
                        }
    
                        const category = categoryResults[0];
                        
                        activeRooms.set(roomCode, {
                            creator: userId,
                            players: [userId],
                            status: 'waiting',
                            category: category,
                            usedWords: new Set() 
                        });
    
                        socket.join(roomCode);
                        socket.emit('roomCreated', { roomCode, category });
                    }
                );
            }
        );
    });

    // Joining room
    socket.on('joinRoom', ({ roomCode, userId }) => {
        const room = activeRooms.get(roomCode);
        
        if (!room) {
            socket.emit('roomError', { message: 'Oda bulunamadı' });
            return;
        }
    
        if (room.status !== 'waiting') {
            socket.emit('roomError', { message: 'Oda dolu' });
            return;
        }
    
        // Add second player
        room.players.push(userId);
        room.status = 'playing';
        
        // Activate socket
        socket.join(roomCode);
    
        // Get category information from the database
        db.query(
            'SELECT c.* FROM categories c JOIN rooms r ON c.id = r.category_id WHERE r.room_code = ?',
            [roomCode],
            (err, results) => {
                if (err || results.length === 0) {
                    socket.emit('roomError', { message: 'Kategori bilgisi alınamadı' });
                    return;
                }
    
                room.category = results[0];
    
                
                io.to(roomCode).emit('gameStart', {
                    players: room.players,
                    roomCode: roomCode,
                    category: room.category
                });
            }
        );
    });

    socket.on('joinGame', ({ roomCode, userId }) => {
        socket.join(roomCode);
        
        const room = activeRooms.get(roomCode);
        if (!room) {
            socket.emit('error', { message: 'Oda bulunamadı' });
            return;
        }
        
        // Checking the number of players
        const socketRoom = io.sockets.adapter.rooms.get(roomCode);
        if (socketRoom && socketRoom.size === 2) {
            // start the game
            io.to(roomCode).emit('gameStart', {
                category: room.category,
                roomCode: roomCode
            });
        }
    });
    
    socket.on('submitAnswer', async ({ answer, roomCode, userId }) => {
        const room = activeRooms.get(roomCode);
        if (!room || !room.category) {
            socket.emit('error', { message: 'Oda bilgisi bulunamadı' });
            return;
        }
    
        // check if word has been used
        const normalizedAnswer = answer.toLowerCase().trim();
        if (room.usedWords.has(normalizedAnswer)) {
            io.to(roomCode).emit('newAnswer', {
                playerId: userId,
                answer,
                isCorrect: false,
                message: 'Bu kelime daha önce kullanıldı!'
            });
            return;
        }
    
        // check the answer in the database
        db.query(
            'SELECT * FROM words WHERE word = ? AND category_id = ?',
            [normalizedAnswer, room.category.id],
            (err, results) => {
                if (err) {
                    console.error('Kelime kontrolü hatası:', err);
                    return;
                }
                const isCorrect = results.length > 0;
                
                if (isCorrect) {
                    room.usedWords.add(normalizedAnswer);
                }
    
                io.to(roomCode).emit('newAnswer', {
                    playerId: userId,
                    answer,
                    isCorrect,
                    message: isCorrect ? '' : (results.length === 0 ? 'Geçersiz kelime!' : 'Bu kelime daha önce kullanıldı!')
                });
            }
        );
    });
    
    socket.on('timeUp', ({roomCode}) => {
        const room = activeRooms.get(roomCode);
        if (room) {
            io.to(roomCode).emit('gameEnd');
            activeRooms.delete(roomCode); // clear the room
        }
    });

    socket.on('disconnect', () => {
        console.log('Bir kullanıcı ayrıldı');
    });
});

// Signing route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // add user to the database
        db.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
                    }
                    return res.status(500).json({ error: 'Kayıt olma hatası' });
                }
                res.json({ message: 'Kayıt başarılı' });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server hatası' });
    }
});

// Logging in route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    db.query(
        'SELECT * FROM users WHERE username = ?',
        [username],
        async (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Giriş hatası' });
            }
            
            if (results.length === 0) {
                return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
            }
            
            const user = results[0];
            
            try {
                if (await bcrypt.compare(password, user.password)) {
                    res.json({ 
                        message: 'Giriş başarılı',
                        userId: user.id,
                        username: user.username
                    });
                } else {
                    res.status(401).json({ error: 'Hatalı şifre' });
                }
            } catch (error) {
                res.status(500).json({ error: 'Server hatası' });
            }
        }
    );
});

// get categories endpoint
app.get('/categories', (req, res) => {
    db.query('SELECT * FROM categories', (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Kategoriler alınırken bir hata oluştu' });
            return;
        }
        res.json(results);
    });
});

// player stats endpoint
app.get('/player-stats', (req, res) => {
    db.query('SELECT * FROM player_statistics', (err, results) => {
        if (err) {
            res.status(500).json({ error: 'İstatistikler alınırken bir hata oluştu' });
            return;
        }
        res.json(results);
    });
});

// category stats endpoint
app.get('/category-stats', (req, res) => {
    db.query('SELECT * FROM category_statistics', (err, results) => {
        if (err) {
            res.status(500).json({ error: 'İstatistikler alınırken bir hata oluştu' });
            return;
        }
        res.json(results);
    });
});

// specific player stats endpoint
app.get('/player-stats/:userId', (req, res) => {
    db.query(
        'SELECT * FROM player_statistics WHERE player_id = ?',
        [req.params.userId],
        (err, results) => {
            if (err) {
                res.status(500).json({ error: 'İstatistikler alınırken bir hata oluştu' });
                return;
            }
            res.json(results[0] || {});
        }
    );
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
});