document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const showRegisterLink = document.getElementById('showRegister');
    let isLoginMode = true;

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        
        const submitButton = loginForm.querySelector('button');
        const title = document.querySelector('.card-title');
        const linkText = showRegisterLink;

        if (isLoginMode) {
            submitButton.textContent = 'Giriş Yap';
            title.textContent = 'Giriş Yap';
            linkText.textContent = 'Kayıt Ol';
        } else {
            submitButton.textContent = 'Kayıt Ol';
            title.textContent = 'Kayıt Ol';
            linkText.textContent = 'Giriş Yap';
        }
    });

    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const url = `http://localhost:3000/${isLoginMode ? 'login' : 'register'}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert(data.message);
                if (data.userId) {
                    localStorage.setItem('userId', data.userId);
                    localStorage.setItem('username', data.username);
                    window.location.href = '/game-room.html';
                    console.log('Giriş başarılı!');
                }
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Bir hata oluştu');
            console.error('Error:', error);
        }
    });
});