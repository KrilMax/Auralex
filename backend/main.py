from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from parser.txt_parser import parse_txt
from parser.epub_parser import parse_epub

import tempfile


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "Auralex Backend работает"
    }

@app.post("/parse-txt")
async def parse_uploaded_txt(
    file: UploadFile = File(...)
):
    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".txt"
    ) as temp_file:

        content = await file.read()

        temp_file.write(content)

        temp_path = temp_file.name

    result = parse_txt(temp_path)

    result["title"] = (
        file.filename.rsplit(".", 1)[0]
    )

    return result

@app.post("/parse-epub")
async def parse_uploaded_epub(
    file: UploadFile = File(...)
):
    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".epub"
    ) as temp_file:

        content = await file.read()

        temp_file.write(content)

        temp_path = temp_file.name

    return parse_epub(temp_path)