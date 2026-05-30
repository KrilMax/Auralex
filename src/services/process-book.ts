export const processBook = async (
  file: File
) => {
  const formData = new FormData();

  formData.append('file', file);

  const extension =
    file.name
      .split('.')
      .pop()
      ?.toLowerCase();

  let endpoint = '';

  switch (extension) {
    case 'epub':
      endpoint =
        'http://127.0.0.1:8000/parse-epub';
      break;

    case 'txt':
      endpoint =
        'http://127.0.0.1:8000/parse-txt';
      break;

    case 'fb2':
      endpoint =
        'http://127.0.0.1:8000/parse-fb2';
      break;

    default:
      throw new Error(
        `Unsupported format: ${extension}`
      );
  }

  const response =
    await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

  if (!response.ok) {
    throw new Error(
      'Failed to process book'
    );
  }

  return response.json();
};