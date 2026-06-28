import AddIcon from '@mui/icons-material/Add';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import appConfig from '../config/appConfig';

export interface ThreadItem {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ThreadSidebarProps {
  currentThreadId: string;
  onSelectThread: (threadId: string) => void;
  onNewChat: () => void;
  apiUrl?: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
  drawerWidth?: number;
  isStreaming?: boolean;
}

export const ThreadSidebar: React.FC<ThreadSidebarProps> = ({
  currentThreadId,
  onSelectThread,
  onNewChat,
  apiUrl = 'http://localhost:8000/chat/stream',
  mobileOpen,
  onMobileClose,
  drawerWidth = 280,
  isStreaming = false,
}) => {
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [threadToDelete, setThreadToDelete] = useState<ThreadItem | null>(null);

  const fetchThreads = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await fetch(appConfig.endpoints.userThreads());
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setThreads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar lista');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const handleDeleteThread = async (threadIdToDelete: string) => {
    try {
      const res = await fetch(appConfig.endpoints.deleteThread(threadIdToDelete), {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      if (threadIdToDelete === currentThreadId) {
        onNewChat();
      }
      fetchThreads(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar conversa');
    }
  };

  const handleConfirmDelete = async () => {
    if (!threadToDelete) return;
    await handleDeleteThread(threadToDelete.id);
    setThreadToDelete(null);
  };

  // Carregar lista ao montar e quando a transmissão do chat for concluída
  const prevStreamingRef = useRef(isStreaming);
  useEffect(() => {
    const isInitialMount = prevStreamingRef.current === undefined;
    const justFinishedStreaming = prevStreamingRef.current && !isStreaming;
    prevStreamingRef.current = isStreaming;

    if (isInitialMount || justFinishedStreaming || !isStreaming) {
      fetchThreads(false);
    }
  }, [isStreaming, fetchThreads]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Header com botão de Nova Conversa */}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', color: 'primary.main' }}>
            Conversas
          </Typography>
          <Tooltip title="Atualizar lista">
            <IconButton size="small" onClick={() => fetchThreads(true)} disabled={loading}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            onNewChat();
            onMobileClose();
          }}
          disabled={isStreaming}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 4px 14px 0 rgba(33, 150, 243, 0.3)',
          }}
        >
          Nova Conversa
        </Button>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* Lista de Threads */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1, py: 1 }}>
        {loading && threads.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Typography variant="body2" color="error" align="center" sx={{ p: 2 }}>
            {error}
          </Typography>
        ) : threads.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ p: 3 }}>
            Nenhuma conversa encontrada.
          </Typography>
        ) : (
          <List disablePadding>
            {threads.map((thread) => {
              const isSelected = thread.id === currentThreadId;
              return (
                <ListItem
                  key={thread.id}
                  disablePadding
                  sx={{ mb: 0.5 }}
                  secondaryAction={
                    <Tooltip title="Deletar conversa">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setThreadToDelete(thread);
                        }}
                        disabled={isStreaming}
                        sx={{
                          color: 'text.secondary',
                          opacity: 0.7,
                          '&:hover': {
                            color: 'error.main',
                            opacity: 1,
                          },
                        }}
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => {
                      onSelectThread(thread.id);
                      onMobileClose();
                    }}
                    disabled={isStreaming}
                    sx={{
                      borderRadius: 2,
                      py: 1,
                      px: 1.5,
                      pr: 5, // Espaço para não sobrepor o botão de delete
                      '&.Mui-selected': {
                        bgcolor: 'rgba(33, 150, 243, 0.15)',
                        borderLeft: '3px solid #2196f3',
                        '&:hover': {
                          bgcolor: 'rgba(33, 150, 243, 0.25)',
                        },
                      },
                    }}
                  >
                    <ChatBubbleOutlineOutlinedIcon
                      fontSize="small"
                      sx={{
                        mr: 1.5,
                        color: isSelected ? 'primary.main' : 'text.secondary',
                      }}
                    />
                    <ListItemText
                      primary={thread.title || 'Conversa sem título'}
                      secondary={formatDate(thread.updated_at)}
                      slotProps={{
                        primary: {
                          sx: {
                            fontSize: '0.9rem',
                            fontWeight: isSelected ? 600 : 400,
                            color: isSelected ? 'text.primary' : 'text.secondary',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          },
                        },
                        secondary: {
                          sx: {
                            typography: 'body2',
                            fontSize: '0.75rem',
                            color: 'text.disabled',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          },
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Dialog de Confirmação de Deleção */}
      <Dialog
        open={Boolean(threadToDelete)}
        onClose={() => setThreadToDelete(null)}
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'background.paper',
              backgroundImage: 'none',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: 'text.primary' }}>
          Excluir conversa?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
            Tem certeza que deseja excluir a conversa &quot;{threadToDelete?.title || 'Conversa sem título'}&quot;? Esta ação não poderá ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setThreadToDelete(null)}
            sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
