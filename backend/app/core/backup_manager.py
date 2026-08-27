import os
import csv
import logging
import datetime
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.database import SessionLocal
from app.models.models import Devotee, Seva, EventComposition, User, Role, Settings, SevaRegistration, UserAuditLog

logger = logging.getLogger(__name__)

MASTER_TABLES = [Devotee, Seva, EventComposition, User, Role, Settings]
TRANSACTION_TABLES = [SevaRegistration, UserAuditLog]

def get_backup_dir():
    # Make configurable later or default to backend/backups
    base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "backups")
    os.makedirs(base_dir, exist_ok=True)
    return base_dir

def backup_tables(tables, category: str):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup_dir = os.path.join(get_backup_dir(), f"{category}_{timestamp}")
    os.makedirs(backup_dir, exist_ok=True)
    
    db: Session = SessionLocal()
    try:
        for model in tables:
            table_name = model.__tablename__
            file_path = os.path.join(backup_dir, f"{table_name}.csv")
            try:
                records = db.query(model).all()
                if not records:
                    continue
                
                headers = [column.name for column in model.__table__.columns]
                
                with open(file_path, mode="w", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    writer.writerow(headers)
                    for row in records:
                        writer.writerow([getattr(row, c) for c in headers])
                logger.info(f"Successfully backed up {table_name} to {file_path}")
            except Exception as e:
                logger.error(f"Failed to backup {table_name}: {e}")
                raise
    except Exception as e:
        logger.error(f"Backup failed for {category}: {e}")
        raise
    finally:
        db.close()

def backup_master():
    logger.info("Starting master tables backup...")
    backup_tables(MASTER_TABLES, "master")

def backup_transaction():
    logger.info("Starting transaction tables backup...")
    backup_tables(TRANSACTION_TABLES, "transaction")

def init_scheduler():
    scheduler = BackgroundScheduler()
    
    # Retry mechanism via apscheduler misfire grace times
    # transaction daily at 8:45 PM
    scheduler.add_job(
        backup_transaction,
        trigger=CronTrigger(hour=20, minute=45),
        id="backup_transaction",
        replace_existing=True,
        misfire_grace_time=15*60  # 15 minutes grace time
    )
    
    # master weekly on Sundays at 8:45 PM
    scheduler.add_job(
        backup_master,
        trigger=CronTrigger(day_of_week="sun", hour=20, minute=45),
        id="backup_master",
        replace_existing=True,
        misfire_grace_time=15*60
    )
    
    scheduler.start()
    return scheduler
