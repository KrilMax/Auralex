import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { Book } from './types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Firestore operations for books
export const getUserBooks = async (userId: string): Promise<Book[]> => {
  const q = query(collection(db, 'books'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
};

export const getBook = async (bookId: string): Promise<Book | null> => {
  const docRef = doc(db, 'books', bookId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Book;
  }
  return null;
};

export const addBook = async (userId: string, book: Omit<Book, 'id'>): Promise<string> => {
  const docRef = doc(collection(db, 'books'));
  await setDoc(docRef, { ...book, userId });
  return docRef.id;
};

export const updateBook = async (bookId: string, updates: Partial<Book>): Promise<void> => {
  const docRef = doc(db, 'books', bookId);
  await updateDoc(docRef, updates);
};

export const deleteBook = async (bookId: string): Promise<void> => {
  await deleteDoc(doc(db, 'books', bookId));
};