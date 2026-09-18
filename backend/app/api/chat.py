from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat import ask_portfolio_question

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="question cannot be empty")
    try:
        answer = ask_portfolio_question(db, payload.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {e}")
    return ChatResponse(answer=answer)