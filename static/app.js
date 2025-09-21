// Глобальные переменные
let currentBoard = null;
let boards = [];
let currentUser = null;

// Утилиты
function isSubmitShortcut(event) {
    // Проверяем нажатие Ctrl+Enter (Windows/Linux) или Cmd+Enter (Mac)
    return event.key === 'Enter' && (event.ctrlKey || event.metaKey);
}

function autoResizeTextarea(textarea) {
    // Функция для автоматического изменения высоты textarea
    if (!textarea) return;
    
    // Сбросить высоту для правильного вычисления
    textarea.style.height = 'auto';
    
    // Установить высоту равную scrollHeight
    textarea.style.height = Math.max(40, textarea.scrollHeight) + 'px';
}

function setupAutoResize(textarea) {
    // Настройка автоматического изменения размера для textarea
    if (!textarea) return;
    
    console.log('🔧 Настройка автоматического изменения размера для textarea');
    
    // Устанавливаем базовые стили
    textarea.style.minHeight = '40px';
    textarea.style.maxHeight = '200px';
    textarea.style.resize = 'none';
    textarea.style.overflowY = 'hidden';
    
    // Увеличиваем padding если он еще не установлен
    if (!textarea.style.padding || textarea.style.padding === '8px') {
        textarea.style.padding = '12px 25px 20px 15px';
    }
    
    // Изменяем размер при инициализации
    autoResizeTextarea(textarea);
    
    // Добавляем обработчики событий
    textarea.addEventListener('input', function() {
        autoResizeTextarea(this);
    });
    
    textarea.addEventListener('paste', function() {
        // Небольшая задержка для обработки вставленного текста
        setTimeout(() => autoResizeTextarea(this), 10);
    });
    
    // Изменяем размер при фокусе (на случай программного изменения value)
    textarea.addEventListener('focus', function() {
        autoResizeTextarea(this);
    });
}

function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.style.display = 'block';
    errorContainer.innerHTML = `<div class="error">${message}</div>`;
    setTimeout(() => {
        errorContainer.innerHTML = '';
        errorContainer.style.display = 'none';
    }, 10000);
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Функции авторизации
function getCurrentUser() {
    if (!currentUser) {
        const stored = localStorage.getItem('retroboard_user');
        if (stored) {
            try {
                currentUser = JSON.parse(stored);
            } catch (e) {
                console.warn('Ошибка чтения данных пользователя:', e);
                currentUser = null;
            }
        }
    }
    return currentUser;
}

function updateUserDisplay() {
    const user = getCurrentUser();
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (user && user.name) {
        userName.textContent = user.name;
        userAvatar.textContent = user.name.charAt(0).toUpperCase();
    } else {
        userName.textContent = 'Гость';
        userAvatar.textContent = 'Г';
    }
}

function showLoginModal() {
    console.log('👋 Показ модального окна входа');
    const modal = document.getElementById('loginModal');
    const input = document.getElementById('loginName');
    
    modal.classList.add('show');
    setTimeout(() => input.focus(), 300); // Фокус после анимации
    
    // Обработчики клавиш
    input.onkeydown = (e) => {
        if (e.key === 'Enter' || isSubmitShortcut(e)) {
            e.preventDefault();
            saveUserName();
        }
    };
}

function showProfileModal() {
    console.log('👤 Показ модального окна профиля');
    const modal = document.getElementById('profileModal');
    const input = document.getElementById('profileName');
    const user = getCurrentUser();
    
    input.value = user ? user.name || '' : '';
    modal.classList.add('show');
    setTimeout(() => input.focus(), 300);
    
    // Обработчики клавиш  
    input.onkeydown = (e) => {
        if (e.key === 'Enter' || isSubmitShortcut(e)) {
            e.preventDefault();
            updateProfile();
        }
    };
}

function hideProfileModal() {
    console.log('❌ Скрытие модального окна профиля');
    const modal = document.getElementById('profileModal');
    modal.classList.remove('show');
}

function saveUserName() {
    const nameInput = document.getElementById('loginName');
    const name = nameInput.value.trim();
    
    if (!name) {
        nameInput.focus();
        return;
    }
    
    console.log('💾 Сохранение имени пользователя:', name);
    
    currentUser = {
        name: name,
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('retroboard_user', JSON.stringify(currentUser));
    updateUserDisplay();
    
    const modal = document.getElementById('loginModal');
    modal.classList.remove('show');
    
    console.log('✅ Пользователь авторизован:', currentUser.name);
}

function updateProfile() {
    const nameInput = document.getElementById('profileName');
    const name = nameInput.value.trim();
    
    if (!name) {
        nameInput.focus();
        return;
    }
    
    console.log('📝 Обновление профиля:', name);
    
    currentUser = {
        name: name,
        createdAt: currentUser ? currentUser.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('retroboard_user', JSON.stringify(currentUser));
    updateUserDisplay();
    hideProfileModal();
    
    console.log('✅ Профиль обновлен:', currentUser.name);
}

// Функция удаления заметки
async function deleteNote(noteId) {
    if (!currentBoard) {
        showError('Доска не выбрана');
        return;
    }
    
    // Найти заметку для отображения в подтверждении
    const note = currentBoard.notes.find(n => n.id === noteId);
    if (!note) {
        showError('Заметка не найдена');
        return;
    }
    
    const notePreview = note.text.length > 50 ? note.text.substring(0, 50) + '...' : note.text;
    
    
    try {
        console.log('🗑️ Удаление заметки:', noteId);
        
        const response = await fetch(`/api/boards/${currentBoard.id}/notes/${noteId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        console.log('Delete API response status:', response.status);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка удаления заметки');
        }
        
        const result = await response.json();
        console.log('✅ Заметка удалена:', result);
        
        // Перезагрузить доску для отображения изменений
        await loadBoard(currentBoard.id);
        
    } catch (error) {
        console.error('❌ Ошибка удаления заметки:', error);
        showError('Ошибка удаления заметки: ' + error.message);
    }
}

// API функции
async function fetchBoards() {
    try {
        const response = await fetch('/api/boards');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        boards = await response.json();
        renderBoardTabs();
    } catch (error) {
        console.error('Ошибка при загрузке досок:', error);
        showError('Ошибка при загрузке досок: ' + error.message);
    }
}

async function createBoard() {
    const name = document.getElementById('newBoardName').value.trim();
    const description = document.getElementById('newBoardDesc').value.trim();
    
    if (!name) {
        showError('Название доски обязательно');
        return;
    }
    
    try {
        const response = await fetch('/api/boards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, description })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка создания доски');
        }
        
        const newBoard = await response.json();
        boards.push({
            id: newBoard.id,
            name: newBoard.name,
            description: newBoard.description,
            created_at: newBoard.created_at
        });
        
        // Скрыть форму создания доски
        cancelCreateBoardForm();
        
        renderBoardTabs();
        await loadBoard(newBoard.id);
        
    } catch (error) {
        console.error('Ошибка создания доски:', error);
        showError('Ошибка создания доски: ' + error.message);
    }
}

async function loadBoard(boardId) {
    try {
        console.log('🔄 Загрузка доски:', boardId);
        
        if (!boardId) {
            throw new Error('Board ID is required');
        }
        
        const response = await fetch(`/api/boards/${boardId}`);
        console.log('📡 Ответ от API:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Ошибка загрузки доски:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const boardData = await response.json();
        console.log('📊 Полученные данные доски:', {
            id: boardData.id,
            name: boardData.name,
            notesCount: boardData.notes ? boardData.notes.length : 'undefined'
        });
        
        // Валидация данных
        if (!boardData.id || !boardData.name) {
            throw new Error('Invalid board data: missing id or name');
        }
        
        if (!boardData.notes || !Array.isArray(boardData.notes)) {
            console.warn('⚠️ Notes array is missing or invalid, setting empty array');
            boardData.notes = [];
        }
        
        currentBoard = boardData;
        console.log('✅ Доска загружена:', currentBoard.name, 'ID:', currentBoard.id, 'Заметок:', currentBoard.notes.length);
        
        // Сохранить выбранную доску в localStorage
        localStorage.setItem('selectedBoardId', currentBoard.id);

        // Выделить активный таб
        selectBoardTab(currentBoard.id);

        console.log('🎨 Начинаем рендеринг доски...');
        renderBoard();
        console.log('✅ Рендеринг доски завершен');
    } catch (error) {
        console.error('❌ Ошибка при загрузке доски:', error);
        showError('Ошибка при загрузке доски: ' + error.message);
        
        // Очистить неверный ID из localStorage
        localStorage.removeItem('selectedBoardId');
        
        // Показать placeholder если не удалось загрузить выбранную доску
        showBoardPlaceholder();
    }
}

function showBoardPlaceholder() {
    console.log('📋 Показ placeholder (доска не выбрана)');
    const placeholder = document.getElementById('boardPlaceholder');
    const boardInfo = document.getElementById('boardInfo');
    const boardColumns = document.getElementById('boardColumns');
    
    if (placeholder) placeholder.style.display = 'block';
    if (boardInfo) boardInfo.style.display = 'none';
    if (boardColumns) boardColumns.style.display = 'none';
}

function showBoardContent() {
    console.log('📋 Показ содержимого доски');
    const placeholder = document.getElementById('boardPlaceholder');
    const boardInfo = document.getElementById('boardInfo');
    const boardColumns = document.getElementById('boardColumns');
    
    if (placeholder) placeholder.style.display = 'none';
    if (boardInfo) boardInfo.style.display = 'block';
    if (boardColumns) boardColumns.style.display = 'grid';
}

async function addInlineNote(category) {
    if (!currentBoard) {
        showError('Выберите доску');
        return;
    }
    
    const text = document.getElementById(`${category}NoteText`).value.trim();
    
    // Используем имя авторизованного пользователя или введенное имя
    const user = getCurrentUser();
    let author = document.getElementById(`${category}NoteAuthor`).value.trim();
    if (!author && user && user.name) {
        author = user.name;
    } else if (!author) {
        author = 'Anonymous';
    }
    
    if (!text) {
        showError('Текст заметки обязателен');
        return;
    }
    
    try {
        const response = await fetch(`/api/boards/${currentBoard.id}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, category, author })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка добавления заметки');
        }
        
        // Скрыть и очистить форму после успешного добавления
        cancelNoteForm(category);
        
        // Перезагрузить доску
        await loadBoard(currentBoard.id);
        
    } catch (error) {
        console.error('Ошибка добавления заметки:', error);
        showError('Ошибка добавления заметки: ' + error.message);
    }
}

// Старая функция для совместимости (можно удалить)
async function addNote() {
    // Эта функция больше не используется
}

async function voteNote(noteId) {
    if (!currentBoard) return;
    
    try {
        const response = await fetch(`/api/boards/${currentBoard.id}/notes/${noteId}/vote`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка голосования');
        }
        
        // Перезагрузить доску
        await loadBoard(currentBoard.id);
        
    } catch (error) {
        console.error('Ошибка голосования:', error);
        showError('Ошибка голосования: ' + error.message);
    }
}

// Рендеринг
function renderBoardTabs() {
    const boardTabs = document.getElementById('boardTabs');
    if (!boardTabs) {
        console.error('❌ Элемент boardTabs не найден');
        return;
    }
    
    if (boards.length === 0) {
        boardTabs.innerHTML = '<div style="color: #6c757d; font-size: 14px;">Нет досок. Создайте новую.</div>';
        return;
    }
    
    boardTabs.innerHTML = boards.map(board => `
        <div class="board-tab" onclick="loadBoard('${board.id}')" data-board-id="${board.id}" title="${board.description || board.name}">
            ${board.name}
        </div>
    `).join('');
    
    console.log('📋 Табы досок отрендерены:', boards.length);
}

function selectBoardTab(boardId) {
    // Убрать активность со всех табов
    document.querySelectorAll('.board-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Активировать выбранный таб
    const selectedTab = document.querySelector(`[data-board-id="${boardId}"]`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
}

function renderBoardList() {
    // Функция устарела - используем новый дизайн с табами
    renderBoardTabs();
}

function selectBoard(boardId) {
    console.log('🎯 Выбор доски (перенаправление на loadBoard):', boardId);
    loadBoard(boardId);
}

function renderBoard() {
    console.log('🎨 renderBoard() вызвана, currentBoard:', currentBoard);
    
    if (!currentBoard) {
        console.error('❌ currentBoard is null/undefined');
        showBoardPlaceholder();
        return;
    }
    
    if (!currentBoard.notes) {
        console.error('❌ currentBoard.notes is missing');
        currentBoard.notes = [];
    }
    
    // Показать колонки и информацию о доске, скрыть placeholder
    showBoardContent();
    
    console.log('🎨 Рендеринг доски:', currentBoard.name, 'заметок:', currentBoard.notes.length);
    
    // Проверить наличие DOM элементов
    const boardTitle = document.getElementById('boardTitle');
    const boardDescription = document.getElementById('boardDescription');
    
    if (!boardTitle) {
        console.error('❌ Элемент boardTitle не найден');
        throw new Error('DOM element boardTitle not found');
    }
    if (!boardDescription) {
        console.error('❌ Элемент boardDescription не найден');
        throw new Error('DOM element boardDescription not found');
    }
    
    // Обновить заголовок
    console.log('📝 Обновление заголовка доски...');
    boardTitle.textContent = currentBoard.name;
    boardDescription.textContent = currentBoard.description || '';
    
    // В новом дизайне доска всегда видима, не нужно добавлять класс 'active'
    
    // Рендерить заметки по категориям
    const categories = {
        good: document.getElementById('goodNotes'),
        bad: document.getElementById('badNotes'),
        improve: document.getElementById('improveNotes')
    };
    
    // Очистить все колонки
    Object.values(categories).forEach(container => {
        // Сохранить drop-zone
        const dropZone = container.querySelector('.drop-zone');
        container.innerHTML = '';
        if (dropZone) {
            container.appendChild(dropZone);
        }
    });
    
    // Сгруппировать заметки по категориям
    const notesByCategory = {
        good: [],
        bad: [],
        improve: []
    };
    
    currentBoard.notes.forEach(note => {
        if (notesByCategory[note.category]) {
            notesByCategory[note.category].push(note);
        }
    });
    
    // Отсортировать заметки по количеству голосов (убывание)
    Object.values(notesByCategory).forEach(notes => {
        notes.sort((a, b) => b.votes - a.votes);
    });
    
    // Рендерить заметки в соответствующие колонки
    Object.keys(notesByCategory).forEach(category => {
        const container = categories[category];
        const notes = notesByCategory[category];
        
        if (notes.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.style.textAlign = 'center';
            emptyDiv.style.color = '#999';
            emptyDiv.style.padding = '20px';
            emptyDiv.textContent = 'Заметок пока нет';
            container.appendChild(emptyDiv);
            return;
        }
        
        notes.forEach(note => {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'note';
            noteDiv.draggable = true;
            noteDiv.dataset.noteId = note.id;
            noteDiv.dataset.category = note.category;
            noteDiv.dataset.createdAt = note.created_at;
            
            noteDiv.innerHTML = `
                <div class="note-text">${note.text}</div>
                <div class="note-meta">
                    <span>${note.author} • ${formatDate(note.created_at)}</span>
                    <div class="note-actions">
                        <button class="edit-btn" onclick="editNote('${note.id}')" title="Редактировать">
                            ✏️
                        </button>
                        <button class="vote-btn" onclick="voteNote('${note.id}')">
                            👍 ${note.votes}
                        </button>
                    </div>
                </div>
            `;
            
            container.appendChild(noteDiv);
        });
    });
    
    // Обновить список досок для выделения активной
    renderBoardList();
    
    // Инициализировать drag-and-drop после рендеринга
    setTimeout(() => {
        initializeDragAndDrop();
    }, 100);
}

// Обработчики событий
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию
    const user = getCurrentUser();
    if (!user || !user.name) {
        console.log('🔐 Пользователь не авторизован, показ окна входа');
        showLoginModal();
    } else {
        console.log('👋 Добро пожаловать,', user.name);
        updateUserDisplay();
    }
    
    // Загрузить список досок при загрузке страницы
    fetchBoards();
    
    // Показать placeholder по умолчанию (доска не выбрана)
    showBoardPlaceholder();
    
    // Обработчики сочетаний клавиш для создания доски
    const boardNameInput = document.getElementById('newBoardName');
    const boardDescInput = document.getElementById('newBoardDesc');
    
    [boardNameInput, boardDescInput].forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || isSubmitShortcut(e)) {
                e.preventDefault();
                createBoard();
            }
        });
    });
    
    // Добавить обработчики для inline форм
    addInlineFormHandlers();
    
    // Глобальный обработчик клавиш для закрытия форм
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Закрыть формы редактирования заметок если они активны
            const editingNotes = document.querySelectorAll('.note[data-editing="true"]');
            if (editingNotes.length > 0) {
                e.preventDefault();
                console.log('⌨️ Закрытие форм редактирования заметок через Escape');
                cancelAllEditing();
                return;
            }
            
            // Закрыть форму создания доски если она открыта
            const createBoardForm = document.getElementById('createBoardForm');
            if (createBoardForm && createBoardForm.classList.contains('show')) {
                e.preventDefault();
                console.log('⌨️ Закрытие формы создания доски через Escape');
                cancelCreateBoardForm();
                return;
            }
            
            // Закрыть модальное окно профиля если оно открыто
            const profileModal = document.getElementById('profileModal');
            if (profileModal && profileModal.style.display === 'flex') {
                e.preventDefault();
                console.log('⌨️ Закрытие модального окна профиля через Escape');
                hideProfileModal();
                return;
            }
        }
    });
    
    // Глобальный обработчик кликов для закрытия форм при клике вне их области
    document.addEventListener('click', function(e) {
        // Закрытие форм редактирования заметок при клике вне редактируемой заметки
        const editingNotes = document.querySelectorAll('.note[data-editing="true"]');
        editingNotes.forEach(noteElement => {
            // Проверяем, был ли клик вне редактируемой заметки
            if (!noteElement.contains(e.target)) {
                const noteId = noteElement.dataset.noteId;
                const note = currentBoard?.notes?.find(n => n.id === noteId);
                if (note) {
                    console.log(`🖱️ Закрытие формы редактирования заметки ${noteId} по клику вне заметки`);
                    cancelInlineEdit(noteId, note.text, note.author);
                }
            }
        });
        
        // Закрытие формы создания доски при клике вне её
        const createBoardForm = document.getElementById('createBoardForm');
        const createBoardSection = document.querySelector('.create-board-section');
        
        if (createBoardForm && createBoardForm.classList.contains('show')) {
            // Проверяем, был ли клик вне секции создания доски
            if (!createBoardSection.contains(e.target)) {
                console.log('🖱️ Закрытие формы создания доски по клику вне формы');
                cancelCreateBoardForm();
            }
        }
        
        // Закрытие форм добавления заметок при клике вне их
        const categories = ['good', 'bad', 'improve'];
        categories.forEach(category => {
            const noteForm = document.getElementById(`${category}NoteForm`);
            const column = noteForm?.closest('.column');
            
            if (noteForm && noteForm.classList.contains('show')) {
                // Проверяем, был ли клик вне колонки с открытой формой
                if (!column || !column.contains(e.target)) {
                    console.log(`🖱️ Закрытие формы добавления заметки ${category} по клику вне формы`);
                    cancelNoteForm(category);
                }
            }
        });
    });
    
    console.log('Ретроборда загружена');
});

function addInlineFormHandlers() {
    const categories = ['good', 'bad', 'improve'];
    
    categories.forEach(category => {
        // Обработчики сочетаний клавиш для заметок
        const textarea = document.getElementById(`${category}NoteText`);
        const authorInput = document.getElementById(`${category}NoteAuthor`);
        
        [textarea, authorInput].forEach(element => {
            if (element) {
                // Настройка автоматического изменения размера для textarea
                if (element.tagName === 'TEXTAREA') {
                    setupAutoResize(element);
                }
                
                element.addEventListener('keydown', function(e) {
                    if (isSubmitShortcut(e)) {
                        e.preventDefault();
                        console.log(`⌨️ Создание заметки через ${e.ctrlKey ? 'Ctrl' : 'Cmd'}+Enter в категории: ${category}`);
                        addInlineNote(category);
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        console.log(`⌨️ Отмена формы через Escape в категории: ${category}`);
                        cancelNoteForm(category);
                    }
                });
            }
        });
    });
}

// Drag and Drop функциональность
let draggedElement = null;

function initializeDragAndDrop() {
    console.log('Инициализация drag-and-drop...');
    
    // Удалить старые обработчики сначала
    const oldNotes = document.querySelectorAll('.note[draggable="true"]');
    oldNotes.forEach(note => {
        note.removeEventListener('dragstart', handleDragStart);
        note.removeEventListener('dragend', handleDragEnd);
        // Удалить обработчики для merge
        note.removeEventListener('dragover', handleNoteDragOver);
        note.removeEventListener('dragenter', handleNoteDragEnter);
        note.removeEventListener('dragleave', handleNoteDragLeave);
        note.removeEventListener('drop', handleNoteDrop);
    });
    
    // Добавить обработчики drag-and-drop для заметок
    const notes = document.querySelectorAll('.note[draggable="true"]');
    console.log('Найдено заметок для drag-and-drop:', notes.length);
    
    notes.forEach((note, index) => {
        console.log(`Настройка заметки ${index}:`, note.dataset.noteId, note.dataset.category);
        
        // Обработчики для перетаскивания
        note.addEventListener('dragstart', handleDragStart);
        note.addEventListener('dragend', handleDragEnd);
        
        // Обработчики для merge (заметка как цель)
        note.addEventListener('dragover', handleNoteDragOver);
        note.addEventListener('dragenter', handleNoteDragEnter);
        note.addEventListener('dragleave', handleNoteDragLeave);
        note.addEventListener('drop', handleNoteDrop);
    });
    
    // Добавить обработчики для колонок (только один раз)
    const columns = document.querySelectorAll('.column');
    console.log('Найдено колонок:', columns.length);
    
    columns.forEach(column => {
        // Убрать старые обработчики чтобы избежать дублирования
        column.removeEventListener('dragover', handleDragOver);
        column.removeEventListener('dragenter', handleDragEnter);
        column.removeEventListener('dragleave', handleDragLeave);
        column.removeEventListener('drop', handleDrop);
        
        // Добавить новые
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('dragenter', handleDragEnter);
        column.addEventListener('dragleave', handleDragLeave);
        column.addEventListener('drop', handleDrop);
        
        console.log('Настроена колонка:', column.dataset.category);
    });
}

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    
    // Сохранить данные для переноса
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
    e.dataTransfer.setData('note-id', this.dataset.noteId);
    e.dataTransfer.setData('source-category', this.dataset.category);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedElement = null;
    
    // Убрать все visual feedback
    document.querySelectorAll('.column').forEach(col => {
        col.classList.remove('drag-over');
    });
    
    // Убрать подсветку merge со всех заметок
    document.querySelectorAll('.note.merge-target').forEach(note => {
        note.classList.remove('merge-target');
    });
    
    console.log('✅ Завершение перетаскивания - все подсветки очищены');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (draggedElement && !this.classList.contains('drag-over')) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    // Убрать highlight только если мышка действительно покинула колонку
    if (!this.contains(e.relatedTarget)) {
        this.classList.remove('drag-over');
    }
}

async function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (!draggedElement) {
        console.log('No dragged element');
        return;
    }
    
    const noteId = e.dataTransfer.getData('note-id');
    const sourceCategory = e.dataTransfer.getData('source-category');
    const targetCategory = this.dataset.category;
    
    console.log('Drop в колонку:', { noteId, sourceCategory, targetCategory });
    
    // Если категория не изменилась, ничего не делаем
    if (sourceCategory === targetCategory) {
        console.log('Категория не изменилась');
        return;
    }
    
    try {
        console.log('Обновление категории заметки...');
        await updateNoteCategory(noteId, targetCategory);
        console.log('Категория обновлена успешно');
        // Перезагрузить доску для отображения изменений
        await loadBoard(currentBoard.id);
    } catch (error) {
        console.error('Ошибка перемещения заметки:', error);
        showError('Ошибка при перемещении заметки: ' + error.message);
    }
}

// Обработчики для merge заметок
function handleNoteDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
}

function handleNoteDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedElement && draggedElement !== this) {
        // Убираем подсветку со всех других заметок перед добавлением новой
        document.querySelectorAll('.note.merge-target').forEach(note => {
            if (note !== this) {
                note.classList.remove('merge-target');
            }
        });
        
        console.log('🔗 Заметка готова к merge:', this.dataset.noteId);
        this.classList.add('merge-target');
    }
}

function handleNoteDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Используем более надежную проверку с таймаутом
    const targetElement = this;
    
    // Небольшая задержка для корректной обработки быстрых движений мыши
    setTimeout(() => {
        // Проверяем, находится ли курсор все еще над заметкой
        const rect = targetElement.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // Если курсор действительно покинул границы заметки, убираем подсветку
        if (mouseX < rect.left || mouseX > rect.right || 
            mouseY < rect.top || mouseY > rect.bottom) {
            targetElement.classList.remove('merge-target');
            console.log('🔗 Убрана подсветка merge для заметки:', targetElement.dataset.noteId);
        }
    }, 10);
}

async function handleNoteDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('merge-target');
    
    if (!draggedElement || draggedElement === this) {
        console.log('Нельзя склеить заметку саму с собой');
        return;
    }
    
    const sourceNoteId = e.dataTransfer.getData('note-id');
    const targetNoteId = this.dataset.noteId;
    
    console.log('🔗 Merge заметок:', { source: sourceNoteId, target: targetNoteId });
    
    try {
        await mergeNotes(sourceNoteId, targetNoteId);
        console.log('✅ Заметки успешно объединены');
        // Перезагрузить доску для отображения изменений
        await loadBoard(currentBoard.id);
    } catch (error) {
        console.error('❌ Ошибка объединения заметок:', error);
        showError('Ошибка при объединении заметок: ' + error.message);
    }
}

async function updateNoteCategory(noteId, newCategory) {
    if (!currentBoard) {
        throw new Error('Доска не выбрана');
    }
    
    console.log('🔍 Current Board Info:', {
        boardId: currentBoard.id,
        boardName: currentBoard.name,
        notesCount: currentBoard.notes.length
    });
    
    console.log('API запрос:', {
        url: `/api/boards/${currentBoard.id}/notes/${noteId}/category`,
        method: 'PUT',
        body: { category: newCategory }
    });
    
    const response = await fetch(`/api/boards/${currentBoard.id}/notes/${noteId}/category`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: newCategory })
    });
    
    console.log('API response status:', response.status);
    
    if (!response.ok) {
        let errorMessage = 'Ошибка обновления категории';
        try {
            const error = await response.json();
            errorMessage = error.error || error.detail || errorMessage;
        } catch (e) {
            const text = await response.text();
            errorMessage = text || errorMessage;
        }
        console.error('❌ API error:', errorMessage);
        console.error('❌ Board ID в запросе:', currentBoard.id);
        
        // Попытаемся получить свежий список досок для диагностики
        try {
            const boardsResponse = await fetch('/api/boards');
            const boards = await boardsResponse.json();
            console.error('📋 Доступные доски:', boards.map(b => ({name: b.name, id: b.id})));
        } catch (e) {
            console.error('Не удалось получить список досок');
        }
        
        throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log('✅ API response:', result);
    return result;
}

async function mergeNotes(sourceNoteId, targetNoteId) {
    if (!currentBoard) {
        throw new Error('Доска не выбрана');
    }
    
    console.log('🔗 API запрос merge:', {
        url: `/api/boards/${currentBoard.id}/notes/${targetNoteId}/merge`,
        method: 'PUT',
        body: { sourceNoteId: sourceNoteId }
    });
    
    const response = await fetch(`/api/boards/${currentBoard.id}/notes/${targetNoteId}/merge`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceNoteId: sourceNoteId })
    });
    
    console.log('Merge API response status:', response.status);
    
    if (!response.ok) {
        let errorMessage = 'Ошибка объединения заметок';
        try {
            const error = await response.json();
            errorMessage = error.error || error.detail || errorMessage;
        } catch (e) {
            const text = await response.text();
            errorMessage = text || errorMessage;
        }
        console.error('❌ Merge API error:', errorMessage);
        throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log('✅ Merge API response:', result);
    return result;
}

// Функции для управления формой создания доски
function toggleCreateBoardForm() {
    const form = document.getElementById('createBoardForm');
    const button = form.previousElementSibling;
    
    if (form.classList.contains('show')) {
        form.classList.remove('show');
        button.classList.remove('active');
    } else {
        form.classList.add('show');
        button.classList.add('active');
        
        // Поставить фокус на поле названия
        const nameInput = document.getElementById('newBoardName');
        if (nameInput) {
            nameInput.focus();
        }
    }
}

function cancelCreateBoardForm() {
    const form = document.getElementById('createBoardForm');
    const button = form.previousElementSibling;
    const nameInput = document.getElementById('newBoardName');
    const descInput = document.getElementById('newBoardDesc');
    
    // Скрыть форму
    form.classList.remove('show');
    button.classList.remove('active');
    
    // Очистить поля
    if (nameInput) nameInput.value = '';
    if (descInput) descInput.value = '';
}

// Функции для управления формами добавления заметок
function toggleNoteForm(category) {
    const form = document.getElementById(`${category}NoteForm`);
    const button = form.previousElementSibling; // кнопка "+Добавить заметку"
    
    if (form.classList.contains('show')) {
        // Скрыть форму
        form.classList.remove('show');
        button.classList.remove('active');
    } else {
        // Скрыть все другие формы сначала
        hideAllNoteForms();
        
        // Показать эту форму
        form.classList.add('show');
        button.classList.add('active');
        
        // Поставить фокус на textarea
        const textarea = document.getElementById(`${category}NoteText`);
        if (textarea) {
            // Настройка автоматического изменения размера при первом показе
            setupAutoResize(textarea);
            textarea.focus();
        }
    }
}

function cancelNoteForm(category) {
    const form = document.getElementById(`${category}NoteForm`);
    const button = form.previousElementSibling;
    const textarea = document.getElementById(`${category}NoteText`);
    const authorInput = document.getElementById(`${category}NoteAuthor`);
    
    // Скрыть форму
    form.classList.remove('show');
    button.classList.remove('active');
    
    // Очистить поля
    if (textarea) textarea.value = '';
    if (authorInput) authorInput.value = '';
}

function hideAllNoteForms() {
    const categories = ['good', 'bad', 'improve'];
    categories.forEach(category => {
        const form = document.getElementById(`${category}NoteForm`);
        const button = form ? form.previousElementSibling : null;
        
        if (form && form.classList.contains('show')) {
            form.classList.remove('show');
            if (button) button.classList.remove('active');
        }
    });
}

// Функции для редактирования заметок
function editNote(noteId) {
    console.log('📝 Inline редактирование заметки:', noteId);
    
    // Отменить другие редактирования
    cancelAllEditing();
    
    const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
    if (!noteElement) {
        console.error('Заметка не найдена:', noteId);
        return;
    }
    
    // Найти заметку в данных
    const note = currentBoard.notes.find(n => n.id === noteId);
    if (!note) {
        console.error('Данные заметки не найдены:', noteId);
        return;
    }
    
    // Получить элементы
    const noteTextEl = noteElement.querySelector('.note-text');
    const noteMetaEl = noteElement.querySelector('.note-meta');
    const authorSpan = noteMetaEl.querySelector('span');
    const actionsDiv = noteElement.querySelector('.note-actions');
    
    if (!noteTextEl || !authorSpan || !actionsDiv) {
        console.error('Элементы заметки не найдены');
        return;
    }
    
    // Сохранить оригинальные значения
    const originalText = note.text;
    const originalAuthor = note.author;
    
    // Заменить текст на textarea
    const textarea = document.createElement('textarea');
    textarea.id = `editText-${noteId}`;
    textarea.value = originalText;
    textarea.className = 'inline-edit-textarea';
    textarea.style.cssText = `
        width: 100%;
        min-height: 60px;
        padding: 12px 25px 20px 15px;
        border: 2px solid #007bff;
        border-radius: 4px;
        font-family: inherit;
        font-size: inherit;
        margin-bottom: 8px;
        line-height: 1.4;
    `;
    
    // Настройка автоматического изменения размера
    setupAutoResize(textarea);
    
    // Заменить автора на input
    const authorInput = document.createElement('input');
    authorInput.id = `editAuthor-${noteId}`;
    authorInput.value = originalAuthor;
    authorInput.type = 'text';
    authorInput.placeholder = 'Автор';
    authorInput.style.cssText = `
        border: 1px solid #007bff; 
        border-radius: 3px; 
        padding: 2px 6px; 
        font-size: 12px; 
        width: 120px;
        margin-right: 10px;
    `;
    
    // Заменить содержимое
    noteTextEl.replaceWith(textarea);
    authorSpan.replaceWith(authorInput);
    
    // Добавить кнопки сохранения и отмены
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '✓';
    saveBtn.title = 'Сохранить';
    saveBtn.className = 'edit-save-btn';
    saveBtn.style.cssText = 'background:rgb(141, 210, 157); color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 4px; font-size: 12px;';
    saveBtn.onclick = () => saveInlineEdit(noteId, originalText, originalAuthor);
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '✗';
    cancelBtn.title = 'Отмена';
    cancelBtn.className = 'edit-cancel-btn';
    cancelBtn.style.cssText = 'background: #f5a3bd; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 4px; font-size: 12px;';
    cancelBtn.onclick = () => cancelInlineEdit(noteId, originalText, originalAuthor);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️';
    deleteBtn.title = 'Удалить заметку';
    deleteBtn.className = 'delete-btn';
    deleteBtn.style.cssText = 'background: #f5a3bd; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; display: inline-block;';
    deleteBtn.onclick = () => deleteNote(noteId);

    // Создать контейнер для кнопок редактирования
    const editButtonsContainer = document.createElement('div');
    editButtonsContainer.className = 'edit-buttons-container';
    editButtonsContainer.style.cssText = 'display: flex; gap: 4px; align-items: center; margin-top: 8px;';
    
    // Добавить кнопки в контейнер
    editButtonsContainer.appendChild(saveBtn);
    editButtonsContainer.appendChild(cancelBtn);
    editButtonsContainer.appendChild(deleteBtn);

    // Скрыть кнопку редактирования и кнопку лайков, добавить контейнер с кнопками
    const editBtn = actionsDiv.querySelector('.edit-btn');
    const voteBtn = actionsDiv.querySelector('.vote-btn');
    
    if (editBtn) {
        editBtn.style.display = 'none';
    }
    
    if (voteBtn) {
        voteBtn.style.display = 'none';
    }
    
    actionsDiv.appendChild(editButtonsContainer);
    
    // Пометить заметку как редактируемую
    noteElement.classList.add('editing');
    noteElement.dataset.editing = 'true';
    
    // Поставить фокус
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

function cancelInlineEdit(noteId, originalText, originalAuthor) {
    console.log('❌ Отмена inline редактирования заметки:', noteId);
    
    const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
    if (!noteElement) return;
    
    // Найти элементы редактирования
    const textarea = noteElement.querySelector(`#editText-${noteId}`);
    const authorInput = noteElement.querySelector(`#editAuthor-${noteId}`);
    const saveBtn = noteElement.querySelector('.edit-save-btn');
    const cancelBtn = noteElement.querySelector('.edit-cancel-btn');
    const editBtn = noteElement.querySelector('.edit-btn');
    
    // Восстановить оригинальные элементы
    if (textarea) {
        const noteTextDiv = document.createElement('div');
        noteTextDiv.className = 'note-text';
        noteTextDiv.textContent = originalText;
        textarea.replaceWith(noteTextDiv);
    }
    
    if (authorInput) {
        const authorSpan = document.createElement('span');
        const createdAt = noteElement.dataset.createdAt || new Date().toISOString();
        authorSpan.innerHTML = `${originalAuthor} • ${formatDate(createdAt)}`;
        authorInput.replaceWith(authorSpan);
    }
    
    // Удалить контейнер с кнопками редактирования и показать кнопки редактирования и лайков
    const editButtonsContainer = noteElement.querySelector('.edit-buttons-container');
    const voteBtn = noteElement.querySelector('.vote-btn');
    
    if (editButtonsContainer) editButtonsContainer.remove();
    if (editBtn) editBtn.style.display = '';
    if (voteBtn) voteBtn.style.display = '';
    
    // Убрать пометку редактирования
    noteElement.classList.remove('editing');
    delete noteElement.dataset.editing;
}

function cancelAllEditing() {
    const editingNotes = document.querySelectorAll('.note[data-editing="true"]');
    editingNotes.forEach(noteElement => {
        const noteId = noteElement.dataset.noteId;
        const note = currentBoard?.notes?.find(n => n.id === noteId);
        if (note) {
            cancelInlineEdit(noteId, note.text, note.author);
        }
    });
}

async function saveInlineEdit(noteId, originalText, originalAuthor) {
    console.log('💾 Сохранение изменений заметки:', noteId);
    
    if (!currentBoard) {
        showError('Доска не выбрана');
        return;
    }
    
    const textarea = document.getElementById(`editText-${noteId}`);
    const authorInput = document.getElementById(`editAuthor-${noteId}`);
    
    if (!textarea || !authorInput) {
        showError('Элементы редактирования не найдены');
        return;
    }
    
    const newText = textarea.value.trim();
    const newAuthor = authorInput.value.trim() || 'Anonymous';
    
    if (!newText) {
        showError('Текст заметки не может быть пустым');
        return;
    }
    
    try {
        const response = await fetch(`/api/boards/${currentBoard.id}/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: newText,
                author: newAuthor
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка обновления заметки');
        }
        
        console.log('✅ Заметка обновлена успешно');
        
        // Отменить режим редактирования
        cancelInlineEdit(noteId, newText, newAuthor);
        
        // Перезагрузить доску
        await loadBoard(currentBoard.id);
        
    } catch (error) {
        console.error('❌ Ошибка обновления заметки:', error);
        showError('Ошибка обновления заметки: ' + error.message);
    }
}

// Автоматическое обновление доски каждые 30 секунд
setInterval(() => {
    if (currentBoard) {
        loadBoard(currentBoard.id);
    }
}, 30000);
