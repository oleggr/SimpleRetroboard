#!/usr/bin/env python3
"""
Простой сервис ретроборды на FastAPI
"""

from fastapi import FastAPI
import os
from database import init_database, create_demo_data
from handlers import api_router, static_router


# Создание FastAPI приложения
app = FastAPI(
    title="Simple Retroboard API",
    description="Простой API для ретроспектив команды",
    version="1.0.0"
)

# Подключение роутеров
app.include_router(api_router)
app.include_router(static_router)


# Инициализация с тестовыми данными
@app.on_event("startup")
async def startup_event():
    """Инициализация базы данных при запуске"""
    init_database()
    create_demo_data()
    
    print("🚀 Ретроборда запущена!")
    print("🗄️ База данных SQLite готова!")


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.environ.get('PORT', 8080))
    import os
    
    # Определяем режим запуска
    env = os.getenv("ENV", "development")
    reload_mode = env == "development"
    
    print(f"🔄 Запуск ретроборды в режиме {env} на http://0.0.0.0:{port}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=reload_mode
    )