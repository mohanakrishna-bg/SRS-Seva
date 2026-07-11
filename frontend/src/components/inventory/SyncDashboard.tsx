import React, { useState, useEffect } from 'react';
import { FolderSync, Upload, Play, CheckCircle2, AlertCircle, Loader2, RefreshCw, FileArchive, Image as ImageIcon } from 'lucide-react';
import { inventoryApi } from '../../api';

interface InboxFile {
    name: string;
    size: number;
    size_human: string;
    modified: string;
    type: 'zip' | 'image';
}

interface SyncConfig {
    watch_folder: string;
    watch_folder_abs: string;
    default_category: string;
    auto_archive_zips: string;
}

export default function SyncDashboard() {
    const [config, setConfig] = useState<SyncConfig | null>(null);
    const [inboxFiles, setInboxFiles] = useState<InboxFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [syncResult, setSyncResult] = useState<any>(null);

    const loadInbox = async () => {
        setLoading(true);
        try {
            const [cfgRes, inboxRes] = await Promise.all([
                inventoryApi.syncConfig(),
                inventoryApi.syncInbox()
            ]);
            setConfig(cfgRes.data);
            setInboxFiles(inboxRes.data.files || []);
        } catch (e) {
            console.error('Failed to load sync inbox', e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadInbox();
    }, []);

    const handleRunSync = async () => {
        setSyncing(true);
        setSyncResult(null);
        try {
            const res = await inventoryApi.runSync({});
            setSyncResult(res.data);
            await loadInbox();
        } catch (e: any) {
            setSyncResult({
                status: 'failed',
                errors: [{ error: e.message || 'Sync failed unexpectedly' }],
                log: ['❌ Sync failed to initiate']
            });
        }
        setSyncing(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        try {
            const filesList = Array.from(e.target.files);
            await inventoryApi.syncUpload(filesList);
            await loadInbox();
        } catch (err) {
            console.error('Failed to upload files', err);
        }
        setUploading(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                            <FolderSync className="text-blue-500" size={20} /> Image Sync Watch Folder
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">
                            {config?.watch_folder_abs || 'sync_inbox'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={loadInbox}
                            disabled={loading || syncing}
                            className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-[var(--text-primary)] hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                            title="Refresh Inbox"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>

                        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-sm hover:bg-blue-500/20 cursor-pointer transition-colors">
                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            {uploading ? 'Uploading...' : 'Upload Photos/ZIP'}
                            <input
                                type="file"
                                multiple
                                accept="image/*,.zip,.heic"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                        </label>

                        <button
                            onClick={handleRunSync}
                            disabled={syncing || inboxFiles.length === 0}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {syncing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                            {syncing ? 'Syncing...' : 'Run Sync Now'}
                        </button>
                    </div>
                </div>

                {/* Inbox File List */}
                <div className="border-t border-[var(--glass-border)] pt-4">
                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                        Pending Files in Inbox ({inboxFiles.length})
                    </h3>
                    {inboxFiles.length === 0 ? (
                        <div className="text-center py-8 text-[var(--text-secondary)] bg-black/5 dark:bg-white/5 rounded-xl border border-dashed border-[var(--glass-border)]">
                            <FolderSync size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Inbox is empty. Drop photos or ZIP packages here to sync.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {inboxFiles.map((file, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--glass-border)] text-sm"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                                            {file.type === 'zip' ? <FileArchive size={18} /> : <ImageIcon size={18} />}
                                        </div>
                                        <div className="truncate">
                                            <p className="font-medium text-[var(--text-primary)] truncate" title={file.name}>
                                                {file.name}
                                            </p>
                                            <p className="text-[10px] text-[var(--text-secondary)]">{file.size_human}</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/10 dark:bg-white/10 text-[var(--text-secondary)] shrink-0">
                                        {file.type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Sync Execution Results */}
            {syncResult && (
                <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-md space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                            {syncResult.status === 'completed' ? (
                                <CheckCircle2 className="text-emerald-500" size={20} />
                            ) : (
                                <AlertCircle className="text-amber-500" size={20} />
                            )}
                            Sync Summary ({syncResult.status})
                        </h3>
                        <div className="flex gap-4 text-xs font-mono">
                            <span className="text-emerald-500 font-bold">Matched: {syncResult.synced || 0}</span>
                            <span className="text-blue-500 font-bold">Created Stubs: {syncResult.created || 0}</span>
                            {syncResult.errors?.length > 0 && (
                                <span className="text-red-500 font-bold">Errors: {syncResult.errors.length}</span>
                            )}
                        </div>
                    </div>

                    <div className="bg-black/40 text-emerald-400 p-4 rounded-xl font-mono text-xs max-h-60 overflow-y-auto space-y-1">
                        {syncResult.log?.map((entry: string, i: number) => (
                            <div key={i}>{entry}</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
