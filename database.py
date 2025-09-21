"""
Настройка базы данных SQLite с SQLAlchemy
"""

from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# URL базы данных
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./retroboard.db")

# Создание engine
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Необходимо для SQLite
)

# Создание session maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base для моделей
Base = declarative_base()


class Board(Base):
    """Модель ретроборды"""
    __tablename__ = "boards"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связь с заметками
    notes = relationship("Note", back_populates="board", cascade="all, delete-orphan")


class Note(Base):
    """Модель заметки"""
    __tablename__ = "notes"
    
    id = Column(String, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    category = Column(String, nullable=False)  # good, bad, improve
    author = Column(String, default="Anonymous")
    votes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связь с доской
    board_id = Column(String, ForeignKey("boards.id"), nullable=False)
    board = relationship("Board", back_populates="notes")


def get_db():
    """Получить сессию базы данных"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_database():
    """Инициализация базы данных"""
    print("🗄️ Инициализация базы данных SQLite...")
    Base.metadata.create_all(bind=engine)
    print("✅ База данных готова!")


def create_demo_data():
    """Создать демо-данные"""
    from uuid import uuid4
    
    db = SessionLocal()
    try:
        # Проверить есть ли уже данные
        existing_boards = db.query(Board).count()
        if existing_boards > 0:
            print("📋 Демо-данные уже существуют")
            return
        
        print("📋 Создание демо-данных...")
        
        # Создать демо-доску
        demo_board = Board(
            id=str(uuid4()),
            name="Демо ретроборд",
            description="Пример доски для тестирования"
        )
        db.add(demo_board)
        db.flush()  # Чтобы получить ID
        
        # Создать демо-заметки
        demo_notes = [
            Note(
                id=str(uuid4()),
                text="Отличная коммуникация в команде",
                category="good",
                author="Алексей",
                board_id=demo_board.id
            ),
            Note(
                id=str(uuid4()),
                text="Долгое время решения багов",
                category="bad",
                author="Мария",
                votes=1,
                board_id=demo_board.id
            ),
            Note(
                id=str(uuid4()),
                text="Внедрить code review процесс",
                category="improve",
                author="Сергей",
                board_id=demo_board.id
            ),
            Note(
                id=str(uuid4()),
                text="Хорошо организованные митинги",
                category="good",
                author="Анна",
                votes=2,
                board_id=demo_board.id
            ),
            Note(
                id=str(uuid4()),
                text="Настроить CI/CD pipeline",
                category="improve",
                author="Игорь",
                votes=1,
                board_id=demo_board.id
            )
        ]
        
        for note in demo_notes:
            db.add(note)
        
        db.commit()
        print("✅ Демо-данные созданы!")
        
    except Exception as e:
        print(f"❌ Ошибка создания демо-данных: {e}")
        db.rollback()
        raise
    finally:
        db.close()

