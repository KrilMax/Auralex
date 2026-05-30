import {
  doc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

export const updateBookTitle =
  async (
    bookId: string,
    title: string
  ) => {
    await updateDoc(
      doc(db, 'books', bookId),
      {
        title,
      }
    );
  };