"""
API обработчики для сервиса ретроборды с поддержкой SQLite
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from uuid import uuid4

from database import get_db, Board, Note
from models import (
    CreateBoardRequest, 
    CreateNoteRequest, 
    UpdateNoteCategoryRequest,
    MergeNotesRequest,
    UpdateNoteRequest,
    BoardSummaryResponse,
    BoardDetailResponse,
    NoteResponse
)

# Создание роутера для API
api_router = APIRouter()
static_router = APIRouter()


def board_to_summary_dict(board: Board) -> dict:
    """Преобразовать SQLAlchemy Board в словарь для API"""
    return {
        "id": board.id,
        "name": board.name,
        "description": board.description,
        "created_at": board.created_at.isoformat(),
        "notes_count": len(board.notes)
    }


def board_to_detail_dict(board: Board) -> dict:
    """Преобразовать SQLAlchemy Board с заметками в словарь для API"""
    return {
        "id": board.id,
        "name": board.name,
        "description": board.description,
        "created_at": board.created_at.isoformat(),
        "notes": [note_to_dict(note) for note in board.notes]
    }


def note_to_dict(note: Note) -> dict:
    """Преобразовать SQLAlchemy Note в словарь для API"""
    return {
        "id": note.id,
        "text": note.text,
        "category": note.category,
        "author": note.author,
        "votes": note.votes,
        "created_at": note.created_at.isoformat()
    }


@api_router.post("/api/boards", response_model=BoardDetailResponse)
async def create_board(request: CreateBoardRequest, db: Session = Depends(get_db)):
    """Создать новую ретроборду"""
    print(f"📋 Создание доски: '{request.name}'")
    
    if not request.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    
    # Создать новую доску
    board = Board(
        id=str(uuid4()),
        name=request.name.strip(),
        description=request.description.strip()
    )
    
    db.add(board)
    db.commit()
    db.refresh(board)
    
    print(f"✅ Доска создана: {board.id}")
    return board_to_detail_dict(board)


@api_router.get("/api/boards", response_model=List[BoardSummaryResponse])
async def get_boards(db: Session = Depends(get_db)):
    """Получить список всех досок"""
    print("📋 Запрос списка досок")
    
    boards = db.query(Board).all()
    result = [board_to_summary_dict(board) for board in boards]
    
    print(f"✅ Найдено досок: {len(result)}")
    return result


@api_router.get("/api/boards/{board_id}", response_model=BoardDetailResponse)
async def get_board(board_id: str, db: Session = Depends(get_db)):
    """Получить доску по ID"""
    print(f"📋 Запрос доски: {board_id}")
    
    board = db.query(Board).filter(Board.id == board_id).first()
    
    if not board:
        print(f"❌ Доска не найдена: {board_id}")
        raise HTTPException(status_code=404, detail="Board not found")
    
    print(f"✅ Доска найдена: {board.name} с {len(board.notes)} заметками")
    return board_to_detail_dict(board)


@api_router.post("/api/boards/{board_id}/notes", response_model=NoteResponse)
async def create_note(board_id: str, request: CreateNoteRequest, db: Session = Depends(get_db)):
    """Добавить заметку на доску"""
    print(f"📝 Добавление заметки на доску {board_id}: '{request.text[:50]}...'")
    
    # Проверить существование доски
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        print(f"❌ Доска не найдена: {board_id}")
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Проверить валидность категории
    if request.category not in ["good", "bad", "improve"]:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    
    # Создать заметку
    note = Note(
        id=str(uuid4()),
        text=request.text.strip(),
        category=request.category,
        author=request.author.strip() or "Anonymous",
        board_id=board_id
    )
    
    db.add(note)
    db.commit()
    db.refresh(note)
    
    print(f"✅ Заметка добавлена: {note.id}")
    return note_to_dict(note)


@api_router.put("/api/boards/{board_id}/notes/{note_id}/vote", response_model=NoteResponse)
async def vote_note(board_id: str, note_id: str, db: Session = Depends(get_db)):
    """Проголосовать за заметку"""
    print(f"👍 Голосование за заметку: board_id={board_id}, note_id={note_id}")
    
    # Найти заметку
    note = db.query(Note).filter(
        Note.id == note_id, 
        Note.board_id == board_id
    ).first()
    
    if not note:
        print(f"❌ Заметка не найдена: {note_id}")
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Увеличить голоса
    note.votes += 1
    db.commit()
    
    print(f"✅ Голос добавлен. Голосов: {note.votes}")
    return note_to_dict(note)


@api_router.put("/api/boards/{board_id}/notes/{note_id}/category", response_model=NoteResponse)
async def update_note_category(board_id: str, note_id: str, request: UpdateNoteCategoryRequest, db: Session = Depends(get_db)):
    """Обновить категорию заметки (для drag & drop)"""
    print(f"🔄 Перемещение заметки: {note_id} -> {request.category}")
    
    # Найти заметку
    note = db.query(Note).filter(
        Note.id == note_id, 
        Note.board_id == board_id
    ).first()
    
    if not note:
        print(f"❌ Заметка не найдена: {note_id}")
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Проверить валидность категории
    if request.category not in ["good", "bad", "improve"]:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    old_category = note.category
    note.category = request.category
    db.commit()
    
    print(f"✅ Категория изменена: {old_category} -> {request.category}")
    return note_to_dict(note)


@api_router.put("/api/boards/{board_id}/notes/{note_id}/merge", response_model=NoteResponse)
async def merge_notes(board_id: str, note_id: str, request: MergeNotesRequest, db: Session = Depends(get_db)):
    """Объединить две заметки"""
    print(f"🔗 Объединение заметок: {note_id} <- {request.sourceNoteId}")
    
    # В URL note_id это target_note (куда объединяем)
    # В теле sourceNoteId это source_note (что объединяем)
    target_note_id = note_id
    source_note_id = request.sourceNoteId
    
    # Найти обе заметки
    source_note = db.query(Note).filter(
        Note.id == source_note_id, 
        Note.board_id == board_id
    ).first()
    
    target_note = db.query(Note).filter(
        Note.id == target_note_id, 
        Note.board_id == board_id
    ).first()
    
    if not source_note:
        print(f"❌ Исходная заметка не найдена: {source_note_id}")
        raise HTTPException(status_code=404, detail="Source note not found")
    
    if not target_note:
        print(f"❌ Целевая заметка не найдена: {target_note_id}")
        raise HTTPException(status_code=404, detail="Target note not found")
    
    if source_note.id == target_note.id:
        print(f"❌ Попытка объединить заметку с собой")
        raise HTTPException(status_code=400, detail="Cannot merge note with itself")
    
    # Объединить тексты
    separator = "\n\n---\n\n" if source_note.text.strip() and target_note.text.strip() else ""
    target_note.text = target_note.text.strip() + separator + source_note.text.strip()
    
    # Объединить голоса
    target_note.votes += source_note.votes
    
    # Объединить авторов
    if target_note.author == "Anonymous" and source_note.author != "Anonymous":
        target_note.author = source_note.author
    elif (target_note.author != "Anonymous" and 
          source_note.author != "Anonymous" and 
          target_note.author != source_note.author):
        target_note.author = f"{target_note.author} & {source_note.author}"
    
    # Удалить исходную заметку
    db.delete(source_note)
    db.commit()
    
    print(f"✅ Заметки объединены. Голосов: {target_note.votes}")
    return note_to_dict(target_note)


@api_router.put("/api/boards/{board_id}/notes/{note_id}", response_model=NoteResponse)
async def update_note(board_id: str, note_id: str, request: UpdateNoteRequest, db: Session = Depends(get_db)):
    """Обновить заметку (текст и автор)"""
    print(f"📝 Запрос обновления заметки: board_id={board_id}, note_id={note_id}")
    
    # Найти заметку
    note = db.query(Note).filter(
        Note.id == note_id, 
        Note.board_id == board_id
    ).first()
    
    if not note:
        print(f"❌ Заметка не найдена: {note_id}")
        raise HTTPException(status_code=404, detail="Note not found")
    
    if not request.text.strip():
        print(f"❌ Пустой текст заметки")
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    old_text = note.text[:30] + "..." if len(note.text) > 30 else note.text
    old_author = note.author
    
    # Обновить заметку
    note.text = request.text.strip()
    note.author = request.author.strip() or "Anonymous"
    db.commit()
    
    print(f"✅ Заметка обновлена: '{old_text}' от {old_author} → '{request.text[:30]}...' от {note.author}")
    return note_to_dict(note)


@api_router.delete("/api/boards/{board_id}/notes/{note_id}")
async def delete_note(board_id: str, note_id: str, db: Session = Depends(get_db)):
    """Удалить заметку"""
    print(f"🗑️ Запрос удаления заметки: board_id={board_id}, note_id={note_id}")
    
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        print(f"❌ Доска не найдена: {board_id}")
        raise HTTPException(status_code=404, detail="Board not found")
    
    note = db.query(Note).filter(Note.id == note_id, Note.board_id == board_id).first()
    if not note:
        print(f"❌ Заметка не найдена: {note_id}")
        raise HTTPException(status_code=404, detail="Note not found")
    
    note_text = note.text[:50] + "..." if len(note.text) > 50 else note.text
    note_author = note.author
    
    db.delete(note)
    db.commit()
    
    print(f"✅ Заметка удалена: '{note_text}' от {note_author}")
    return {"message": "Note deleted successfully", "id": note_id}


# Статические файлы
@static_router.get("/")
async def serve_frontend():
    """Обслуживание главной страницы"""
    return FileResponse("static/index.html")


@static_router.get("/static/app.js")
async def serve_js():
    """Обслуживание JavaScript файла"""
    return FileResponse("static/app.js")