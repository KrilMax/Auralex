from lxml import etree


def parse_fb2(file_path: str):
    tree = etree.parse(file_path)

    root = tree.getroot()

    namespaces = {
        "fb": "http://www.gribuser.ru/xml/fictionbook/2.0"
    }

    title = "Unknown Book"

    title_info = root.find(
        ".//fb:title-info/fb:book-title",
        namespaces,
    )

    if title_info is not None:
        title = title_info.text

    chapters = []

    sections = root.findall(
        ".//fb:body/fb:section",
        namespaces,
    )

    for index, section in enumerate(
        sections
    ):
        section_title = (
            f"Chapter {index + 1}"
        )

        title_node = section.find(
            "./fb:title",
            namespaces,
        )

        if (
            title_node is not None
            and len(title_node)
        ):
            section_title = (
                title_node[0].text
            )

        paragraphs = []

        for p in section.findall(
            ".//fb:p",
            namespaces,
        ):
            if p.text:
                paragraphs.append(
                    p.text
                )

        chapters.append(
            {
                "id": f"chapter-{index+1}",
                "title": section_title,
                "content": "\n\n".join(
                    paragraphs
                ),
                "order": index + 1,
            }
        )

    return {
        "title": title,
        "format": "fb2",
        "chapters": chapters,
    }