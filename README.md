# Word Bank Game

A real-time multiplayer word game where two players try to find words starting with a specific letter in different categories.

## Features

- User registration and login system
- Real-time multiplayer gameplay
- Multiple categories (cities, animals, fruits, etc.)
- Word validation system
- Scoreboard and end-game statistics

## Technologies

- Frontend: HTML, CSS, JavaScript, Bootstrap
- Backend: Node.js, Express.js
- Database: MySQL
- Real-time communication: Socket.IO

## Installation

1. Clone the repository:
git clone https://github.com/gkberksari/word-bank.git
cd word-bank

Install dependencies:

bashCopycd backend
npm install

Set up MySQL database:


Create a new MySQL database: word_bank
Run the SQL commands in database.sql


Start the backend server:

bashCopynode app.js

Open http://localhost:3000 in your browser

Database Structure
The project includes the following database features:

Views: Player and category statistics
Triggers: Auto-update category word counts
Stored Procedures: Add new categories with words
Functions: Calculate category word length averages

Game Rules

Two players join a game room
Players choose a category (e.g., cities, animals)
Players have 60 seconds to write as many words as possible
Words must start with the specified letter
Each correct word earns one point
The player with the most points wins

Contributing

Fork this repository
Create a new branch
Make your changes
Commit your changes
Push to your branch
Open a pull request

License
This project is open-source and available under the MIT License.
Contact
If you have any questions or suggestions, please open an issue or contact me.






# Word Bank Game

Word Bank, iki oyuncunun belirli bir harf ile başlayan kelimeleri bulmaya çalıştığı bir kelime oyunudur.

## Özellikler

- Kullanıcı kayıt ve giriş sistemi
- Gerçek zamanlı çok oyunculu oyun
- Farklı kategoriler (şehirler, hayvanlar, meyveler vb.)
- Kelime doğrulama sistemi
- Puan tablosu ve oyun sonu istatistikleri

## Teknolojiler

- Frontend: HTML, CSS, JavaScript, Bootstrap
- Backend: Node.js, Express.js
- Database: MySQL
- Gerçek zamanlı iletişim: Socket.IO

## Kurulum

1. Repository'yi klonlayın:
git clone https://github.com/gkberksari/word-bank.git
cd word-bank

Gerekli paketleri yükleyin:

bashCopycd backend
npm install

MySQL veritabanını oluşturun:


MySQL'de yeni bir veritabanı oluşturun: word_bank
database.sql dosyasındaki SQL komutlarını çalıştırın


Backend'i başlatın:

bashCopynode app.js

Tarayıcıda http://localhost:3000 adresine gidin

Veritabanı Yapısı
Proje aşağıdaki veritabanı özelliklerini içerir:

Views
Triggers
Stored Procedures
Functions

Katkıda Bulunma

Bu repository'yi fork edin
Yeni bir branch oluşturun
Değişikliklerinizi commit edin
Branch'inize push yapın
Pull request açın
