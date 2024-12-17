const socket = io('http://localhost:3000');

document.addEventListener('DOMContentLoaded', () => {
   
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');

    if (!userId || !username) {
        window.location.href = '/'; 
        return;
    }

    
    document.getElementById('playerName').textContent = username;

    
    fetch('http://localhost:3000/categories')
        .then(response => response.json())
        .then(categories => {
            const select = document.getElementById('categorySelect');
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = `${category.name} (${category.starting_letter} ile başlayan)`;
                select.appendChild(option);
            });
        });

    
    document.getElementById('createRoom').addEventListener('click', () => {
        const categoryId = document.getElementById('categorySelect').value;
        socket.emit('createRoom', { 
            userId: userId, 
            categoryId: categoryId 
        });
    });

    
    document.getElementById('joinRoom').addEventListener('click', () => {
        const roomCode = document.getElementById('roomCode').value.trim();
        if (roomCode) {
            socket.emit('joinRoom', { roomCode, userId });
        } else {
            alert('Lütfen bir oda kodu girin');
        }
    });

    
    socket.on('roomCreated', ({ roomCode, category }) => {
        document.getElementById('roomOptions').style.display = 'none';
        document.getElementById('waitingRoom').style.display = 'block';
        document.getElementById('currentRoomCode').textContent = roomCode;
    });

    socket.on('gameStart', ({ players, roomCode }) => {
        
        localStorage.setItem('currentRoom', roomCode);
        window.location.href = `/game.html?room=${roomCode}`;
    });

    socket.on('roomError', ({ message }) => {
        alert(message);
    });
});