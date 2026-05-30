import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export const uploadBookFile = async (file: File, userId: string, bookId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${bookId}.${fileExt}`;
  const { data, error } = await supabase.storage
    .from('books')
    .upload(fileName, file);
  if (error) throw error;
  return data;
};

export const downloadBookFile = async (userId: string, bookId: string, fileExt: string) => {
  const fileName = `${userId}/${bookId}.${fileExt}`;
  const { data, error } = await supabase.storage
    .from('books')
    .download(fileName);
  if (error) throw error;
  return data;
};

export const deleteBookFile = async (userId: string, bookId: string, fileExt: string) => {
  const fileName = `${userId}/${bookId}.${fileExt}`;
  const { error } = await supabase.storage
    .from('books')
    .remove([fileName]);
  if (error) throw error;
};