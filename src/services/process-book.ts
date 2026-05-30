export const processBook = async (
  file: File
) => {
  const formData = new FormData();

  formData.append('file', file);

  const response = await fetch(
    'http://127.0.0.1:8000/parse-epub',
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to process book');
  }

  return response.json();
};