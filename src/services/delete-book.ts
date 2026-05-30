import { doc, deleteDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';

import { supabase } from '@/lib/supabase';

export const deleteBook = async (
  bookId: string,
  originalFilePath: string
) => {
  const { error } =
    await supabase.storage
      .from('books')
      .remove([
        originalFilePath,
      ]);

  if (error) {
    console.error(error);
    throw error;
  }

  await deleteDoc(
    doc(db, 'books', bookId)
  );
};