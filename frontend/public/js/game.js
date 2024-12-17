const socket = io('http://localhost:3000');
let timer;
let gameStarted = false;
let playerScore = 0;
let opponentScore = 0;

document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    const roomCode = new URLSearchParams(window.location.search).get('room');

    if (!userId || !username || !roomCode) {
        window.location.href = '/';
        return;
    }

    const answerInput = document.getElementById('answerInput');
    const submitButton = document.getElementById('submitAnswer');
    const playerAnswersList = document.getElementById('playerAnswers');
    const opponentAnswersList = document.getElementById('opponentAnswers');

    
    submitButton.addEventListener('click', () => {
        const answer = answerInput.value.trim();
        if (answer && gameStarted) {
            socket.emit('submitAnswer', {
                answer,
                roomCode,
                userId
            });
            answerInput.value = '';
        }
    });

    
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitButton.click();
        }
    });

    
    socket.on('gameStart', (data) => {
        console.log('Oyun başladı:', data);
        gameStarted = true;
        startTimer(60);
        answerInput.disabled = false;
        submitButton.disabled = false;

        
        document.getElementById('categoryName').textContent = data.category.name;
        document.getElementById('startingLetter').textContent = data.category.starting_letter;
    });

    
    socket.on('newAnswer', ({ playerId, answer, isCorrect, message }) => {
        const answerElement = document.createElement('li');
        answerElement.className = `list-group-item ${isCorrect ? 'list-group-item-success' : 'list-group-item-danger'}`;
        answerElement.textContent = message ? `${answer} (${message})` : answer;

        if (playerId === userId) {
            playerAnswersList.appendChild(answerElement);
            if (isCorrect) playerScore++;
        } else {
            opponentAnswersList.appendChild(answerElement);
            if (isCorrect) opponentScore++;
        }
    });

    
    socket.on('gameEnd', () => {
        gameStarted = false;
        answerInput.disabled = true;
        submitButton.disabled = true;

        const scoreTableBody = document.getElementById('scoreTableBody');
        scoreTableBody.innerHTML = `
            <tr>
                <td>Siz</td>
                <td>${playerScore}</td>
            </tr>
            <tr>
                <td>Rakip</td>
                <td>${opponentScore}</td>
            </tr>
        `;

        
        const scoreModal = new bootstrap.Modal(document.getElementById('scoreModal'));
        scoreModal.show();
    });

    
    socket.emit('joinGame', { roomCode, userId });
});


function startTimer(duration) {
    let timeLeft = duration;
    const timerDisplay = document.querySelector('.timer');
    
    timer = setInterval(() => {
        timerDisplay.textContent = timeLeft;
        
        if (--timeLeft < 0) {
            clearInterval(timer);
            socket.emit('timeUp', {
                roomCode: new URLSearchParams(window.location.search).get('room')
            });
        }
    }, 1000);
}