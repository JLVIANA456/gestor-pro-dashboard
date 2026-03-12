import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AnnouncementStatus = 'sent' | 'delivered' | 'read' | 'scheduled' | 'pending';

export interface Announcement {
    id: string;
    created_at: string;
    department: string;
    recipient: string;
    subject: string;
    content: string;
    status: AnnouncementStatus;
    sent_at: string | null;
    scheduled_for?: string | null;
    is_scheduled?: boolean;
    folder_id?: string | null;
    client_id?: string | null;
    client?: {
        nome_fantasia: string;
        razao_social: string;
    } | null;
}

export interface AnnouncementFolder {
    id: string;
    created_at: string;
    name: string;
    department: string;
    icon?: string;
    color?: string;
}

export function useAnnouncements() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [folders, setFolders] = useState<AnnouncementFolder[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            
            // Cast to any to access tables not in the generated Database type
            const sb = supabase as any;

            // Try to fetch folders
            const { data: folderData, error: folderError } = await sb
                .from('announcement_folders')
                .select('*')
                .order('name');
            
            // Try to fetch announcements with client info
            const { data: announcementData, error: announcementError } = await sb
                .from('announcements')
                .select('*, client:clients(nome_fantasia, razao_social)')
                .order('created_at', { ascending: false });

            if (folderError) {
                console.warn('Announcement folders table might missing:', folderError);
                setFolders([]);
            } else {
                setFolders(folderData || []);
            }

            if (announcementError) {
                console.error('Error fetching announcements:', announcementError);
                if (announcementError.code !== '42P01') {
                    toast.error("Erro ao carregar comunicações.");
                }
            } else {
                setAnnouncements(announcementData || []);
            }
        } catch (err) {
            console.error('Announcements error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const createFolder = async (folder: Omit<AnnouncementFolder, 'id' | 'created_at'>) => {
        try {
            const sb = supabase as any;
            const { data, error } = await sb
                .from('announcement_folders')
                .insert(folder)
                .select()
                .single();

            if (error) throw error;
            setFolders(prev => [data, ...prev]);
            toast.success(`Pasta "${folder.name}" criada com sucesso!`);
            return data;
        } catch (error) {
            console.error('Error creating folder:', error);
            toast.error("Erro ao criar pasta.");
            return null;
        }
    };

    const deleteFolder = async (id: string) => {
        try {
            const sb = supabase as any;
            const { error } = await sb
                .from('announcement_folders')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setFolders(prev => prev.filter(f => f.id !== id));
            toast.success("Pasta removida.");
            return true;
        } catch (error) {
            console.error('Error deleting folder:', error);
            toast.error("Erro ao remover pasta.");
            return false;
        }
    };

    const sendAnnouncement = async (announcement: Partial<Announcement>) => {
        try {
            const sb = supabase as any;
            const { data, error } = await sb
                .from('announcements')
                .insert(announcement)
                .select()
                .single();

            if (error) throw error;
            setAnnouncements((prev: Announcement[]) => [data, ...prev]);
            return data;
        } catch (error) {
            console.error('Error sending announcement:', error);
            toast.error("Erro ao registrar comunicado.");
            return null;
        }
    };

    const deleteAnnouncement = async (id: string) => {
        try {
            const sb = supabase as any;
            const { error } = await sb
                .from('announcements')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setAnnouncements(prev => prev.filter(a => a.id !== id));
            toast.success("Registro removido.");
            return true;
        } catch (error) {
            console.error('Error deleting announcement:', error);
            toast.error("Erro ao remover registro.");
            return false;
        }
    };

    return {
        announcements,
        folders,
        loading,
        createFolder,
        deleteFolder,
        sendAnnouncement,
        deleteAnnouncement,
        refresh: fetchAll
    };
}
