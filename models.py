#!/usr/bin/env python3
"""
Pydantic модели для API запросов и ответов
"""

from pydantic import BaseModel
from typing import List


# Модели запросов и ответов API
class CreateBoardRequest(BaseModel):
    name: str
    description: str = ""


class CreateNoteRequest(BaseModel):
    text: str
    category: str  # good, bad, improve
    author: str = "Anonymous"


class UpdateNoteCategoryRequest(BaseModel):
    category: str


class MergeNotesRequest(BaseModel):
    sourceNoteId: str


class UpdateNoteRequest(BaseModel):
    text: str
    author: str = "Anonymous"


class NoteResponse(BaseModel):
    id: str
    text: str
    category: str
    author: str
    votes: int
    created_at: str


class BoardSummaryResponse(BaseModel):
    id: str
    name: str
    description: str
    created_at: str
    notes_count: int


class BoardDetailResponse(BaseModel):
    id: str
    name: str
    description: str
    created_at: str
    notes: List[NoteResponse]