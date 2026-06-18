import { useState, useEffect, useCallback } from 'react';
import type { VaultFolder } from '../types';
import * as db from '../services/db';
import { pickDirectory, verifyPermission } from '../services/filesystem';

export function useFolders() {
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [openFolderIds, setOpenFolderIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    db.getAllFolders().then((fs) => {
      setFolders(fs.sort((a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()));
    });
  }, []);

  const openNewFolder = useCallback(async () => {
    const handle = await pickDirectory();
    if (!handle) return null;
    const folder: VaultFolder = {
      id: crypto.randomUUID(),
      name: handle.name,
      handle,
      lastOpenedAt: new Date(),
    };
    await db.saveFolder(folder);
    setFolders((prev) => [folder, ...prev]);
    setOpenFolderIds((prev) => new Set(prev).add(folder.id));
    return folder;
  }, []);

  const reopenFolder = useCallback(async (folder: VaultFolder) => {
    const granted = await verifyPermission(folder.handle);
    if (!granted) return false;
    const updated: VaultFolder = { ...folder, lastOpenedAt: new Date() };
    await db.saveFolder(updated);
    setFolders((prev) =>
      prev
        .map((f) => (f.id === folder.id ? updated : f))
        .sort((a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime())
    );
    setOpenFolderIds((prev) => new Set(prev).add(folder.id));
    return true;
  }, []);

  const closeFolder = useCallback((id: string) => {
    setOpenFolderIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const forgetFolder = useCallback(async (id: string) => {
    await db.deleteFolder(id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setOpenFolderIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return { folders, openFolderIds, openNewFolder, reopenFolder, closeFolder, forgetFolder };
}
