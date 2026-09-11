import { pipeline } from '@huggingface/transformers';

let extractor: Awaited<
  ReturnType<typeof pipeline<'feature-extraction'>>
> | null = null;

export interface SemanticSearchChunk {
  id: string;
  text: string;
  chapterIndex: number;
  startOffset: number;
  endOffset: number;
}

export const getEmbeddingModel = async () => {
  if (!extractor) {
    extractor = await pipeline(
      'feature-extraction',
      'Xenova/multilingual-e5-small',
      {
        dtype: 'q8',
      }
    );
  }

  return extractor;
};

export const createSearchChunks = (
  chapters: {
    content: string;
  }[]
): SemanticSearchChunk[] => {
  const chunks: SemanticSearchChunk[] = [];

  const chunkSize = 1000;
  const overlap = 200;

  chapters.forEach((chapter, chapterIndex) => {
    const content = chapter.content ?? '';

    if (!content.trim()) {
      return;
    }

    let startOffset = 0;
    let chunkIndex = 0;

    while (startOffset < content.length) {
      let endOffset = Math.min(
        startOffset + chunkSize,
        content.length
      );

      if (endOffset < content.length) {
        const paragraphBreak = content.lastIndexOf(
          '\n',
          endOffset
        );

        if (
          paragraphBreak > startOffset + 400
        ) {
          endOffset = paragraphBreak;
        }
      }

      const text = content
        .slice(startOffset, endOffset)
        .trim();

      if (text) {
        const leadingWhitespace =
          content
            .slice(startOffset, endOffset)
            .length -
          content
            .slice(startOffset, endOffset)
            .trimStart()
            .length;

        const trailingWhitespace =
          content
            .slice(startOffset, endOffset)
            .length -
          content
            .slice(startOffset, endOffset)
            .trimEnd()
            .length;

        chunks.push({
          id: `${chapterIndex}-${chunkIndex}`,
          text,
          chapterIndex,
          startOffset:
            startOffset + leadingWhitespace,
          endOffset:
            endOffset - trailingWhitespace,
        });

        chunkIndex++;
      }

      if (endOffset >= content.length) {
        break;
      }

      startOffset = Math.max(
        endOffset - overlap,
        startOffset + 1
      );
    }
  });

  return chunks;
};

export interface SemanticSearchIndexItem
  extends SemanticSearchChunk {
  embedding: number[];
}

export const createSemanticSearchIndex = async (
  chapters: {
    content: string;
  }[],
  onProgress?: (current: number, total: number) => void
): Promise<SemanticSearchIndexItem[]> => {
  const chunks =
    createSearchChunks(chapters);

  if (chunks.length === 0) {
    return [];
  }

  const model =
    await getEmbeddingModel();

  const batchSize = 1;
  const embeddingSize = 384;

  const index: SemanticSearchIndexItem[] = [];

  onProgress?.(0, chunks.length);

  for (
    let i = 0;
    i < chunks.length;
    i += batchSize
  ) {
    const batch =
      chunks.slice(i, i + batchSize);

    const output = await model(
      batch.map(
        chunk => `passage: ${chunk.text}`
      ),
      {
        pooling: 'mean',
        normalize: true,
      }
    );

    const values = Array.from(
      output.data
    ) as number[];

    batch.forEach(
      (chunk, batchIndex) => {
        const start =
          batchIndex * embeddingSize;

        index.push({
          ...chunk,
          embedding: values.slice(
            start,
            start + embeddingSize
          ),
        });
      }
    );

    const current = Math.min(
      i + batchSize,
      chunks.length
    );

    onProgress?.(
      current,
      chunks.length
    );

    await new Promise(resolve =>
      setTimeout(resolve, 0)
    );

  }

  return index;
};

export const testEmbedding = async (
  text: string
) => {
  const model = await getEmbeddingModel();

  const output = await model(
    `passage: ${text}`,
    {
      pooling: 'mean',
      normalize: true,
    }
  );

  return Array.from(output.data);
};

export const searchSemanticIndex = async (
  query: string,
  index: SemanticSearchIndexItem[],
  limit = 10,
  minScore = 0.80
) => {
  if (!query.trim() || index.length === 0) {
    return [];
  }

  const model = await getEmbeddingModel();

  const output = await model(
    `query: ${query.trim()}`,
    {
      pooling: 'mean',
      normalize: true,
    }
  );

  const queryEmbedding = Array.from(
    output.data
  ) as number[];

  const results = index.map(chunk => {
    let score = 0;

    for (let i = 0; i < queryEmbedding.length; i++) {
      score +=
        queryEmbedding[i] * chunk.embedding[i];
    }

    return {
      ...chunk,
      score,
    };
  });

  const filteredResults = results
    .filter(result => result.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  console.log(
    `Semantic search query: "${query.trim()}"`
  );

  console.table(
    filteredResults.map((result, index) => ({
      rank: index + 1,
      score: result.score.toFixed(4),
      chapter: result.chapterIndex,
      text: result.text.slice(0, 100),
    }))
  );

  return filteredResults;
};

const getSemanticCacheKey = (
  chapters: {
    content: string;
  }[]
) => {
  const totalLength = chapters.reduce(
    (sum, chapter) =>
      sum + (chapter.content?.length ?? 0),
    0
  );

  return `auralex-semantic-index-${chapters.length}-${totalLength}`;
};

const SEMANTIC_DB_NAME = 'auralex-semantic-search';
const SEMANTIC_STORE_NAME = 'indexes';

const openSemanticDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      SEMANTIC_DB_NAME,
      1
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (
        !db.objectStoreNames.contains(
          SEMANTIC_STORE_NAME
        )
      ) {
        db.createObjectStore(
          SEMANTIC_STORE_NAME
        );
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const saveSemanticSearchIndex = async (
  chapters: {
    content: string;
  }[],
  index: SemanticSearchIndexItem[]
) => {
  try {
    const db = await openSemanticDatabase();

    await new Promise<void>(
      (resolve, reject) => {
        const transaction = db.transaction(
          SEMANTIC_STORE_NAME,
          'readwrite'
        );

        const store =
          transaction.objectStore(
            SEMANTIC_STORE_NAME
          );

        const request = store.put(
          index,
          getSemanticCacheKey(chapters)
        );

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      }
    );

    db.close();
  } catch (error) {
    console.error(
      'Failed to cache semantic index:',
      error
    );
  }
};

export const loadSemanticSearchIndex = async (
  chapters: {
    content: string;
  }[]
): Promise<SemanticSearchIndexItem[] | null> => {
  try {
    const db = await openSemanticDatabase();

    const index =
      await new Promise<
        SemanticSearchIndexItem[] | null
      >((resolve, reject) => {
        const transaction = db.transaction(
          SEMANTIC_STORE_NAME,
          'readonly'
        );

        const store =
          transaction.objectStore(
            SEMANTIC_STORE_NAME
          );

        const request = store.get(
          getSemanticCacheKey(chapters)
        );

        request.onsuccess = () => {
          resolve(
            request.result ??
              null
          );
        };

        request.onerror = () => {
          reject(request.error);
        };
      });

    db.close();

    return index;
  } catch (error) {
    console.error(
      'Failed to load semantic index cache:',
      error
    );

    return null;
  }
};