import { supabase } from '@/lib/supabase';
import { processBook } from './process-book';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';

export const uploadBook = async (
  file: File,
  userId: string
) => {
  const fileExt =
    file.name.split('.').pop();

  const fileName =
    `${Date.now()}-${file.name}`;

  const filePath =
    `books/${userId}/original/${fileName}`;

  const { error } =
    await supabase.storage
      .from('books')
      .upload(filePath, file);

  if (error) {
    console.error(error);
    throw error;
  }

  const bookDoc =
    await addDoc(
      collection(db, 'books'),
      {
        ownerId: userId,

        title:
          file.name.replace(
            /\.[^/.]+$/,
            ''
          ),

        format: fileExt,

        originalFilePath:
          filePath,

        processedFilePath: '',

        processingStatus:
          'processing',

        uploadedAt:
          serverTimestamp(),

        readingProgress: 0,
      }
    );
  const parsedBook =
    await processBook(file);

  await updateDoc(
    doc(db, 'books', bookDoc.id),
    {
      chapters:
        parsedBook.chapters,

      processingStatus:
        'completed',
    }
  );
  return bookDoc.id;
};