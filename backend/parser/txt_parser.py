from pathlib import Path
from .chapter_splitter import split_into_chapters


def parse_txt(file_path: str):
    path = Path(file_path)

    text = path.read_text(
        encoding="utf-8",
        errors="ignore"
    )

    return {
        "title": path.stem,
        "format": "txt",
        "chapters": split_into_chapters(
            text
        ),
    }