from pathlib import Path


def parse_txt(file_path: str):
    path = Path(file_path)

    text = path.read_text(
        encoding="utf-8",
        errors="ignore"
    )

    return {
        "title": path.stem,
        "format": "txt",
        "chapters": [
            {
                "id": "chapter-1",
                "title": "",
                "content": text,
                "order": 1
            }
        ]
    }