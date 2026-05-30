from ebooklib import epub
from bs4 import BeautifulSoup


def parse_epub(file_path: str):
    book = epub.read_epub(file_path)

    chapters = []
    chapter_id = 1

    for item in book.get_items():
        if item.get_type() == 9:  # ITEM_DOCUMENT

            soup = BeautifulSoup(
                item.get_content(),
                "html.parser"
            )

            text = soup.get_text(
                separator="\n",
                strip=True
            )

            if len(text.strip()) < 20:
                continue

            title = (
                soup.title.string
                if soup.title
                else f"Chapter {chapter_id}"
            )

            chapters.append({
                "id": chapter_id,
                "title": title,
                "content": text
            })

            chapter_id += 1

    return {
        "title": book.get_metadata(
            "DC",
            "title"
        )[0][0]
        if book.get_metadata(
            "DC",
            "title"
        )
        else "Unknown Book",

        "format": "epub",

        "chapters": chapters
    }