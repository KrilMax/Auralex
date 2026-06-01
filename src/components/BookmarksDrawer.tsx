import React from 'react';

import { Trash2 } from 'lucide-react';
 
import type {
  Bookmark as BookBookmark,
} from '@/lib/types';

import { Button } from '@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;

  onClose: () => void;

  bookmarks: BookBookmark[];

  onDelete: (
    bookmarkId: string
) => void;

onSelect: (
  bookmark: BookBookmark
) => void;

}

const BookmarksDrawer: React.FC<Props> = ({
  open,
  onClose,
  bookmarks,
  onDelete,
  onSelect
}) => {
  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Bookmarks
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 text-center text-muted-foreground">
          {
            bookmarks.length ===
            0 ? (
                <div className="py-6 text-center text-muted-foreground">
                No bookmarks yet
                </div>
            ) : (
                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
                    {[...bookmarks]
                        .sort(
                            (a, b) =>
                            a.pageIndex -
                            b.pageIndex
                        )
                        .map(
                            (bookmark) => (
                        <div
                            key={bookmark.id}
                            className="
                                flex
                                items-center
                                justify-between
                                rounded-lg
                                border
                                p-3
                                cursor-pointer
                                hover:bg-accent
                            "
                            onClick={() => onSelect(bookmark)}
                        >
                            <div className="flex-1">
                                <p
                                    className="
                                    text-sm
                                    line-clamp-2
                                    "
                                >
                                    {bookmark.selectedText}
                                </p>

                                <p
                                    className="
                                    text-xs
                                    text-muted-foreground
                                    mt-1
                                    "
                                >
                                    Page {bookmark.pageIndex + 1}
                                </p>
                                </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="
                                    text-destructive
                                    hover:text-destructive
                                    hover:bg-destructive/10
                                "
                                onClick={(e) => {
                                    e.stopPropagation();

                                    onDelete(
                                        bookmark.id
                                    );
                                }}
                                >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                        )
                    )}
                    </div>
            )
            }
        </div>

        <Button
          onClick={onClose}
          className="w-full"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default BookmarksDrawer;