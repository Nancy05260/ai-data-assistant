"""数据库连接与会话 - 应用库 app.db"""
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.models import Base

engine = create_engine(
    f"sqlite:///{settings.app_db_path}",
    connect_args={"check_same_thread": False},
    echo=False,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """创建所有表"""
    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    """依赖注入用：获取 DB 会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
