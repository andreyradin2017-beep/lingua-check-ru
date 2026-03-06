from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import pymorphy3

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/trademarks", tags=["trademarks"])
morph = pymorphy3.MorphAnalyzer()

@router.get("", response_model=List[schemas.Trademark])
def get_trademarks(db: Session = Depends(get_db)):
    """Получить список всех зарегистрированных брендов."""
    return db.query(models.Trademark).all()

@router.post("", response_model=schemas.Trademark, status_code=status.HTTP_201_CREATED)
def create_trademark(trademark: schemas.TrademarkCreate, db: Session = Depends(get_db)):
    """Добавить новый бренд с автоматической нормализацией."""
    # Нормализация для поиска
    normal_form = morph.parse(trademark.word.lower())[0].normal_form
    
    # Проверка на дубликат (по нормальной форме)
    existing = db.query(models.Trademark).filter(models.Trademark.normal_form == normal_form).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Бренд '{trademark.word}' уже зарегистрирован (нормальная форма: {normal_form})"
        )

    db_trademark = models.Trademark(
        word=trademark.word,
        normal_form=normal_form
    )
    db.add(db_trademark)
    db.commit()
    db.refresh(db_trademark)
    return db_trademark

@router.delete("/{trademark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trademark(trademark_id: str, db: Session = Depends(get_db)):
    """Удалить бренд из списка исключений."""
    db_trademark = db.query(models.Trademark).filter(models.Trademark.id == trademark_id).first()
    if not db_trademark:
        raise HTTPException(status_code=404, detail="Бренд не найден")
    
    db.delete(db_trademark)
    db.commit()
    return None
