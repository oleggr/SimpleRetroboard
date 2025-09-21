#!/bin/bash
# Быстрый локальный запуск Simple Retroboard

echo "🚀 Быстрый запуск Simple Retroboard локально..."

# Проверка Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не найден"
    exit 1
fi

# Активация виртуального окружения
if [ -d "venv" ]; then
    echo "📦 Активация существующего venv..."
    source venv/bin/activate
else
    echo "📦 Создание нового виртуального окружения..."
    python3 -m venv venv
    source venv/bin/activate
fi

# Установка зависимостей
echo "⚙️ Проверка зависимостей..."
pip install --quiet -r requirements.txt

# Проверка что порт свободен
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️ Порт 8080 занят. Останавливаем процессы..."
    pkill -f "python.*main.py" 2>/dev/null || true
    sleep 2
fi

# Запуск приложения
echo "✅ Запуск приложения на http://localhost:8080"
echo "   Нажмите Ctrl+C для остановки"
echo ""

python main.py
