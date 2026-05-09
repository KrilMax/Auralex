import { Book, Chapter } from './types';

const sampleContent = `The morning sun cast long shadows across the ancient library, its golden light filtering through stained glass windows that depicted scenes of forgotten myths. Dust motes danced in the beams like tiny galaxies, each one carrying a fragment of history on its microscopic surface.

Eleanor traced her fingers along the spines of books that hadn't been touched in decades. The leather was cracked and dry, but beneath her fingertips she could feel the pulse of stories waiting to be rediscovered. Each volume was a doorway, and she held the key.

"You shouldn't be here," a voice said from the shadows. It wasn't threatening — more resigned, as if the speaker had grown tired of repeating the warning. She turned to find an old man seated in a wingback chair, nearly invisible among the towering shelves.

"The restricted section is closed to students," he continued, adjusting his spectacles. "Has been for thirty years."

"I'm not a student," Eleanor replied, pulling a weathered letter from her coat pocket. "I'm the new curator."

The old man's eyes widened. He leaned forward, the leather of his chair creaking like a ship in rough seas. "Then you've come about the collection. The one they tried to destroy."

She nodded. The letter had been specific: a collection of manuscripts predating the library itself, hidden in a vault beneath the reading room. Manuscripts that some believed held knowledge too dangerous for the modern world.

"Follow me," he said, rising with surprising agility for his apparent age. "But understand this — once you see what's down there, you can never unsee it. The words have a way of staying with you."

Eleanor followed him through a narrow passage between the shelves, descending stone steps worn smooth by centuries of footsteps. The air grew cooler, carrying the scent of old parchment and something else — something electric, like the moment before a storm.

At the bottom, a heavy oak door stood closed. The old man produced a key that seemed to glow faintly in the dim light. As the lock turned, Eleanor felt a vibration in the air, as if the building itself was awakening.

The door swung open to reveal a circular chamber lined with manuscripts sealed in glass cases. In the center stood a reading desk with a single lamp, its light warm and steady. But it was the manuscripts that held her attention — their pages seemed to shimmer, the text shifting and rearranging as she watched.

"The Living Library," the old man whispered. "The texts rewrite themselves based on who reads them. Each reader receives the knowledge they need most, in the language they understand best."

Eleanor stepped forward, drawn by an irresistible curiosity. As she approached the nearest case, the manuscript inside it began to glow, its pages turning of their own accord, settling on a passage that seemed written specifically for her.

She began to read, and the world outside ceased to exist.`;

const createChapters = (count: number): Chapter[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `ch-${i + 1}`,
    title: `Chapter ${i + 1}: ${['The Awakening', 'Shadows and Light', 'The Hidden Path', 'Echoes of Time', 'The Final Door', 'Into the Unknown', 'The Reckoning', 'New Beginnings', 'The Last Page', 'Epilogue'][i % 10]}`,
    content: sampleContent,
    order: i + 1,
  }));

export const mockBooks: Book[] = [
  {
    id: '1',
    title: 'The Living Library',
    author: 'Amara Thornfield',
    coverUrl: '',
    progress: 67,
    lastRead: new Date(Date.now() - 1000 * 60 * 30),
    chapters: createChapters(8),
    totalPages: 342,
    currentChapter: 5,
    genre: 'Fantasy',
  },
  {
    id: '2',
    title: 'Quantum Reflections',
    author: 'Dr. Elise Huang',
    coverUrl: '',
    progress: 23,
    lastRead: new Date(Date.now() - 1000 * 60 * 60 * 3),
    chapters: createChapters(6),
    totalPages: 276,
    currentChapter: 2,
    genre: 'Science Fiction',
  },
  {
    id: '3',
    title: 'Midnight Architecture',
    author: 'James Calloway',
    coverUrl: '',
    progress: 89,
    lastRead: new Date(Date.now() - 1000 * 60 * 60 * 24),
    chapters: createChapters(10),
    totalPages: 418,
    currentChapter: 9,
    genre: 'Mystery',
  },
  {
    id: '4',
    title: 'The Silk Road Diaries',
    author: 'Yuki Tanaka',
    coverUrl: '',
    progress: 12,
    lastRead: new Date(Date.now() - 1000 * 60 * 60 * 48),
    chapters: createChapters(7),
    totalPages: 298,
    currentChapter: 1,
    genre: 'Historical Fiction',
  },
  {
    id: '5',
    title: 'Neon Psalms',
    author: 'Viktor Orel',
    coverUrl: '',
    progress: 45,
    lastRead: new Date(Date.now() - 1000 * 60 * 60 * 72),
    chapters: createChapters(9),
    totalPages: 356,
    currentChapter: 4,
    genre: 'Cyberpunk',
  },
  {
    id: '6',
    title: 'Beneath Still Waters',
    author: 'Clara Whitmore',
    coverUrl: '',
    progress: 0,
    chapters: createChapters(5),
    totalPages: 212,
    currentChapter: 0,
    genre: 'Thriller',
  },
];

export const mockSearchResults = [
  {
    chapterId: 'ch-1',
    chapterTitle: 'Chapter 1: The Awakening',
    fragment: '...the pulse of stories waiting to be rediscovered. Each volume was a doorway, and she held the key...',
    relevance: 0.95,
  },
  {
    chapterId: 'ch-3',
    chapterTitle: 'Chapter 3: The Hidden Path',
    fragment: '...manuscripts predating the library itself, hidden in a vault beneath the reading room...',
    relevance: 0.82,
  },
  {
    chapterId: 'ch-5',
    chapterTitle: 'Chapter 5: The Final Door',
    fragment: '...the texts rewrite themselves based on who reads them. Each reader receives the knowledge they need most...',
    relevance: 0.78,
  },
];
