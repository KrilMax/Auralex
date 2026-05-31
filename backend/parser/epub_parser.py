from ebooklib import epub
from bs4 import BeautifulSoup


def parse_epub(file_path: str):
    book = epub.read_epub(file_path)

    chapters = []
    chapter_id = 1

    for item in book.get_items():
        if item.get_type() != 9:  # ITEM_DOCUMENT
            continue

        soup = BeautifulSoup(
            item.get_content(),
            "html.parser"
        )

        # Ищем заголовок главы
        heading = soup.find(
            ["h1", "h2", "h3"]
        )

        if heading:
            title = heading.get_text(
                separator=" ",
                strip=True
            )
        elif soup.title:
            title = soup.title.get_text(
                separator=" ",
                strip=True
            )
        else:
            title = f"Chapter {chapter_id}"

        # Собираем абзацы
        paragraphs = []

        for p in soup.find_all("p"):
            text = p.get_text(
                separator=" ",
                strip=True
            )

            if text:
                paragraphs.append(
                    text
                )

        # Если EPUB не использует <p>
        if not paragraphs:
            text = soup.get_text(
                separator="\n\n",
                strip=True
            )

            paragraphs = [
                part.strip()
                for part in text.split("\n\n")
                if part.strip()
            ]

        content = "\n\n".join(
            paragraphs
        )

        if len(content) < 20:
            continue

        chapters.append({
            "id": chapter_id,
            "title": title,
            "content": content
        })

        chapter_id += 1

    return {
        "title": (
            book.get_metadata(
                "DC",
                "title"
            )[0][0]
            if book.get_metadata(
                "DC",
                "title"
            )
            else "Unknown Book"
        ),
        "format": "epub",
        "chapters": chapters
    }