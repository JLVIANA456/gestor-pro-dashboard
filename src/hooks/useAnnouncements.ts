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

export interface AnnouncementTemplate {
    id: string;
    created_at: string;
    name: string;
    subject: string;
    content: string;
    department: string;
}

export function useAnnouncements() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [folders, setFolders] = useState<AnnouncementFolder[]>([]);
    const [templates, setTemplates] = useState<AnnouncementTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            
            const sb = supabase as any;

            // Fetch folders
            const { data: folderData, error: folderError } = await sb
                .from('announcement_folders')
                .select('*')
                .order('name');
            
            // Fetch announcements with client info
            const { data: announcementData, error: announcementError } = await sb
                .from('announcements')
                .select('*, client:clients(nome_fantasia, razao_social, telefone)')
                .order('created_at', { ascending: false });

            // Fetch templates
            const { data: templateData, error: templateError } = await sb
                .from('announcement_templates')
                .select('*')
                .order('name');

            if (folderError) {
                console.warn('Announcement folders table might be missing:', folderError);
                setFolders([]);
            } else {
                setFolders(folderData || []);
            }

            if (templateError) {
                console.warn('Announcement templates table might be missing:', templateError);
                setTemplates([]);
            } else {
                setTemplates(templateData || []);
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

    const createTemplate = async (template: Omit<AnnouncementTemplate, 'id' | 'created_at'>) => {
        try {
            const sb = supabase as any;
            const { data, error } = await sb
                .from('announcement_templates')
                .insert(template)
                .select()
                .single();

            if (error) throw error;
            setTemplates(prev => [data, ...prev]);
            toast.success(`Modelo "${template.name}" salvo com sucesso!`);
            return data;
        } catch (error) {
            console.error('Error creating template:', error);
            toast.error("Erro ao salvar modelo.");
            return null;
        }
    };

    const deleteTemplate = async (id: string) => {
        try {
            const sb = supabase as any;
            const { error } = await sb
                .from('announcement_templates')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setTemplates(prev => prev.filter(t => t.id !== id));
            toast.success("Modelo removido.");
            return true;
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error("Erro ao remover modelo.");
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
        templates,
        loading,
        createFolder,
        deleteFolder,
        createTemplate,
        deleteTemplate,
        sendAnnouncement,
        deleteAnnouncement,
        refresh: fetchAll
    };
}

