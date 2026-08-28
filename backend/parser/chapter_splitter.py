import re


TARGET_CHAPTER_LENGTH = 10000
MIN_CHAPTER_LENGTH = 4000


def _split_large_block(text: str):
    """
    Разбивает слишком большой текстовый блок
    сначала по предложениям, а если предложение
    само по себе слишком большое — по словам.
    """

    sentences = re.split(
        r"(?<=[.!?…])\s+",
        text.strip()
    )

    result = []

    for sentence in sentences:
        sentence = sentence.strip()

        if not sentence:
            continue

        if len(sentence) <= TARGET_CHAPTER_LENGTH:
            result.append(sentence)
            continue

        words = sentence.split()
        current = []
        current_length = 0

        for word in words:
            added_length = len(word) + (
                1 if current else 0
            )

            if (
                current
                and
                current_length +
                added_length >
                TARGET_CHAPTER_LENGTH
            ):
                result.append(
                    " ".join(current)
                )

                current = []
                current_length = 0

            current.append(word)
            current_length += added_length

        if current:
            result.append(
                " ".join(current)
            )

    return result


def split_into_chapters(
    text: str,
    title_prefix: str = "Chapter"
):
    text = text.strip()

    if not text:
        return []

    # Сначала пробуем найти обычные абзацы.
    paragraphs = [
        paragraph.strip()
        for paragraph in re.split(
            r"\n\s*\n",
            text
        )
        if paragraph.strip()
    ]

    if not paragraphs:
        return []

    # Если файл практически не содержит
    # пустых строк, отдельные строки могут
    # фактически выполнять роль абзацев.
    if len(paragraphs) == 1:
        lines = [
            line.strip()
            for line in text.splitlines()
            if line.strip()
        ]

        if len(lines) > 1:
            paragraphs = lines

    # Разбираем слишком большие блоки.
    normalized_paragraphs = []

    for paragraph in paragraphs:
        if len(paragraph) <= TARGET_CHAPTER_LENGTH:
            normalized_paragraphs.append(
                paragraph
            )
        else:
            normalized_paragraphs.extend(
                _split_large_block(paragraph)
            )

    chapters = []

    current_paragraphs = []
    current_length = 0

    def add_chapter(paragraphs):
        if not paragraphs:
            return

        content = "\n\n".join(
            paragraphs
        ).strip()

        if not content:
            return

        chapters.append({
            "id": f"chapter-{len(chapters) + 1}",
            "title": (
                f"{title_prefix} "
                f"{len(chapters) + 1}"
            ),
            "content": content,
            "order": len(chapters) + 1,
        })

    for paragraph in normalized_paragraphs:
        paragraph_length = len(paragraph)

        should_split = (
            current_paragraphs
            and
            current_length >= MIN_CHAPTER_LENGTH
            and
            current_length +
            paragraph_length >
            TARGET_CHAPTER_LENGTH
        )

        if should_split:
            add_chapter(
                current_paragraphs
            )

            current_paragraphs = []
            current_length = 0

        current_paragraphs.append(
            paragraph
        )

        current_length += (
            paragraph_length + 2
        )

    add_chapter(
        current_paragraphs
    )

    # Не оставляем слишком маленькую
    # последнюю главу.
    if len(chapters) >= 2:
        last = chapters[-1]

        if len(last["content"]) < MIN_CHAPTER_LENGTH:
            previous = chapters[-2]

            previous["content"] += (
                "\n\n" +
                last["content"]
            )

            chapters.pop()

            for index, chapter in enumerate(
                chapters,
                start=1
            ):
                chapter["id"] = (
                    f"chapter-{index}"
                )

                chapter["title"] = (
                    f"{title_prefix} "
                    f"{index}"
                )

                chapter["order"] = index

    return chapters