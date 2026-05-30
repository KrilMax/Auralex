import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

export const getBooks = async (
  userId: string
) => {
  const booksQuery = query(
    collection(db, 'books'),

    where(
      'ownerId',
      '==',
      userId
    )
  );

  const snapshot =
    await getDocs(
      booksQuery
    );

  return snapshot.docs.map(
    (doc) => ({
      id: doc.id,

      ...doc.data(),
    })
  );
};