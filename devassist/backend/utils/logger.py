import logging
import sys
from pathlib import Path

LOG_DIR = Path("logs")


def setup_logging(level: str = "INFO"):
    LOG_DIR.mkdir(exist_ok=True)
    fmt = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    handlers = [
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_DIR / "devassist.log"),
    ]
    logging.basicConfig(level=getattr(logging, level), format=fmt, handlers=handlers)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
