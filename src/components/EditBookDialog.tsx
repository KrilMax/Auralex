import React, {
  useState,
  useEffect,
} from 'react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Book } from '@/lib/types';

interface Props {
  open: boolean;

  onClose: () => void;

  book: Book | null;

  onSave: (
    bookId: string,
    title: string
  ) => void;

  onDelete: (
    bookId: string
  ) => void;
}

const EditBookDialog: React.FC<Props> =
  ({
    open,
    onClose,
    book,
    onSave,
    onDelete,
  }) => {
    const [title, setTitle] =
      useState('');

    useEffect(() => {
      if (book) {
        setTitle(book.title);
      }
    }, [book]);

    if (!book) return null;

    return (
      <Dialog
        open={open}
        onOpenChange={onClose}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Book
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm mb-2">
                Book title
              </p>

              <Input
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
              />
            </div>

            <Button
              className="w-full"
              onClick={() =>
                onSave(
                  book.id,
                  title
                )
              }
            >
              Save Changes
            </Button>

            <Button
              variant="destructive"
              className="w-full"
              onClick={() =>
                onDelete(
                  book.id
                )
              }
            >
              Delete Book
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

export default EditBookDialog;