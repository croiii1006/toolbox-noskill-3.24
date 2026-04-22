import { useMemo, useState } from "react";
import {
  Database,
  Edit2,
  MoreHorizontal,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MemoryEntry, useMemory } from "@/contexts/MemoryContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MEMORY_CONTENT_LIMIT = 100000;

export function MemoryLibraryDrawer({ open, onOpenChange }: Props) {
  const { entries, addEntry, updateEntry, deleteEntry } = useMemory();
  const [search, setSearch] = useState("");
  const [editEntry, setEditEntry] = useState<MemoryEntry | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (search.trim()) {
      const query = search.toLowerCase();
      list = list.filter(
        (entry) =>
          entry.title.toLowerCase().includes(query) ||
          entry.content.toLowerCase().includes(query) ||
          entry.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }
    return list;
  }, [entries, search]);

  const openEdit = (entry: MemoryEntry) => {
    setEditEntry({ ...entry });
    setEditDialogOpen(true);
  };

  const saveEntry = () => {
    if (!editEntry) return;

    if (editEntry.id) {
      updateEntry(editEntry);
    } else {
      addEntry({
        title: editEntry.title,
        content: editEntry.content,
        category: editEntry.category,
        tags: editEntry.tags,
      });
    }

    setEditDialogOpen(false);
    setEditEntry(null);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full gap-0 p-0 sm:max-w-xl [&>button]:hidden"
          overlayClassName="bg-white/60 backdrop-blur-sm"
        >
          <SheetHeader className="space-y-0 border-b border-border px-5 pb-3 pt-5">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-base">
                <Database className="h-4.5 w-4.5" />
                记忆库
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索记忆条目..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9 border-border/50 bg-muted/50 pl-9 text-sm"
              />
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 px-5 py-3">
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  暂无记忆条目
                </div>
              ) : null}

              {filtered.map((entry) => (
                <div
                  key={entry.id}
                  className="group cursor-pointer rounded-xl border border-border/50 bg-card p-4 transition-shadow hover:shadow-sm"
                  onClick={() => openEdit(entry)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-medium text-foreground">
                        {entry.title}
                      </h4>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem
                          onClick={(event) => {
                            event.stopPropagation();
                            openEdit(entry);
                          }}
                        >
                          <Edit2 className="mr-2 h-3.5 w-3.5" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteConfirm(entry.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-foreground/70">
                    {entry.content}
                  </p>

                  <div className="mt-2.5 flex items-center">
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {entry.updatedAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          className="sm:max-w-2xl"
          overlayClassName="bg-white/60 backdrop-blur-sm"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{editEntry?.id ? "编辑记忆" : "新增记忆"}</DialogTitle>
          </DialogHeader>

          {editEntry ? (
            <div className="space-y-4 py-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  标题
                </label>
                <Input
                  value={editEntry.title}
                  onChange={(event) =>
                    setEditEntry({ ...editEntry, title: event.target.value })
                  }
                  placeholder="输入标题"
                  className="h-9"
                  maxLength={100}
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    内容
                  </label>
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {editEntry.content.length} / {MEMORY_CONTENT_LIMIT}
                  </span>
                </div>
                <Textarea
                  value={editEntry.content}
                  onChange={(event) =>
                    setEditEntry({ ...editEntry, content: event.target.value })
                  }
                  placeholder="输入记忆内容..."
                  className="min-h-[280px] text-sm font-mono"
                  maxLength={MEMORY_CONTENT_LIMIT}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={saveEntry} disabled={!editEntry?.title.trim()}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            删除后无法恢复，确定要删除这条记忆吗？
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteConfirm) return;
                deleteEntry(deleteConfirm);
                setDeleteConfirm(null);
              }}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
