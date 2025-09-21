# 📋 Simple Retroboard

Простое веб-приложение для проведения ретроспектив команды.

## 🚀 Возможности

- ✨ Создание и управление ретро-досками
- 📝 Добавление заметок в колонки "Хорошо", "Плохо", "Экшн поинты" 
- 🖱️ Drag & Drop перемещение заметок между колонками
- 🔗 Объединение заметок при перетаскивании одной на другую
- ✏️ Inline редактирование заметок
- 👥 Указание авторов заметок
- 👍 Голосование за заметки

## 🏗️ Архитектура

- **Backend**: FastAPI + Python 3.9
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Storage**: In-memory (для демо)

## 🐳 Запуск через Docker Compose

### Предварительные требования
- Docker
- Docker Compose

### Команды для запуска

```bash
# Клонировать репозиторий
git clone <your-repo-url>
cd simple_retroboard

# Запустить приложение
docker-compose up -d

# Просмотреть логи
docker-compose logs -f retroboard

# Остановить приложение
docker-compose down
```

Приложение будет доступно по адресу: **http://localhost:8080**

## 🛠️ Разработка

### Локальный запуск

```bash
# Создать виртуальное окружение
python3 -m venv venv
source venv/bin/activate

# Установить зависимости
pip install -r requirements.txt

# Запустить сервер
python main.py
```

### Структура проекта

```
simple_retroboard/
├── main.py           # Точка входа FastAPI приложения
├── handlers.py       # API endpoints
├── models.py         # Модели данных
├── static/           # Статические файлы (HTML/CSS/JS)
│   ├── index.html
│   └── app.js
├── requirements.txt  # Python зависимости
├── Dockerfile       # Docker образ
└── docker-compose.yml # Оркестрация
```

## 📚 API Endpoints

- `GET /` - Главная страница
- `GET /api/boards` - Список досок
- `POST /api/boards` - Создать доску
- `GET /api/boards/{id}` - Получить доску
- `POST /api/boards/{id}/notes` - Добавить заметку
- `PUT /api/boards/{id}/notes/{note_id}` - Редактировать заметку
- `PUT /api/boards/{id}/notes/{note_id}/vote` - Голосовать
- `PUT /api/boards/{id}/notes/{note_id}/category` - Изменить категорию
- `PUT /api/boards/{id}/notes/{note_id}/merge` - Объединить заметки

## 🎯 Использование

1. Откройте http://localhost:8080
2. Создайте новую ретро-доску или выберите существующую
3. Добавляйте заметки в соответствующие колонки
4. Перетаскивайте заметки между колонками
5. Редактируйте заметки кликом на ✏️
6. Голосуйте за заметки кликом на 👍

## 🐛 Устранение неполадок

### Порт уже занят
```bash
# Найти процесс на порту 8080
lsof -i :8080

# Остановить процесс
kill -9 <PID>
```

### Пересборка образа
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 📄 Лицензия

MIT License