import React from 'react';
import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import './sideBar.css';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachment?: {
    name: string;
    type: string;
  };
  prompt?: string;
}

export interface Chat {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
  lastMessage?: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  currentChat: Chat | null;
  onChatSelect: (chat: Chat | null) => void;
  setSelectedConversation: (chat: Chat | null) => void;
  isStreaming: boolean;
}

const Sidebar = ({
  isCollapsed,
  currentChat,
  onChatSelect,
  setSelectedConversation,
  isStreaming
}: SidebarProps) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [generatingTitles, setGeneratingTitles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadChats = () => {
      const savedChats = localStorage.getItem('chatHistory');
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
          ...chat,
          timestamp: new Date(chat.timestamp)
        }));
        const generating = new Set<string>();
        parsedChats.forEach((chat: Chat) => {
          if (chat.title === 'Generating title...') {
            generating.add(chat.id);
          }
        });
        setGeneratingTitles(generating);
        setChats(parsedChats);
      }
    };

    loadChats();

    window.addEventListener('chatUpdated', loadChats);
    return () => window.removeEventListener('chatUpdated', loadChats);
  }, []);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.body.classList.contains('dark'));
    };
    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleNewChat = () => {
    setSelectedConversation(null);
    onChatSelect(null);
    window.dispatchEvent(new Event('newChat'));
  };

  const handleDeleteChat = (chatId: string) => {
    const savedChats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    const updatedSavedChats = savedChats.filter((chat: Chat) => chat.id !== chatId);
    localStorage.setItem('chatHistory', JSON.stringify(updatedSavedChats));
    const updatedChats = chats.filter((c) => c.id !== chatId);
    setChats(updatedChats);

    if (currentChat?.id === chatId) {
      onChatSelect(null);
      setSelectedConversation(null);
    }
  };

  const groupChatsByDate = () => {
    const groups: { [date: string]: Chat[] } = {};
    const sortedChats = [...chats].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    sortedChats.forEach((chat) => {
      const dateKey = new Date(chat.timestamp).toLocaleDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(chat);
    });
    return groups;
  };

  const chatGroups = groupChatsByDate();

  const handleChatSelect = (chat: Chat) => {
    const chatWithDates = {
      ...chat,
      timestamp: new Date(chat.timestamp),
      messages: chat.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    };

    setSelectedConversation(chatWithDates);
    onChatSelect(chatWithDates);
  };

  return (
    <div className={`sidebar ${isDarkMode ? 'dark-mode' : 'light-mode'} ${isCollapsed ? 'collapsed' : ''}`}>
      {!isCollapsed && (
        <>
          <div className="sidebar-header">
            <div className="sidebar-title">
              <h1>Regulatory Agent</h1>
            </div>
            <div className="top-buttons">
              <button
                className={`new-chat ${isStreaming ? 'disabled' : ''}`}
                onClick={handleNewChat}
                disabled={isStreaming}
              >
                <Plus size={16} />
                <span>New Chat</span>
              </button>
            </div>
          </div>

          <nav className="sidebar-content">
            {Object.entries(chatGroups).map(([date, dateChats]) => (
              <div key={date} className="history-section">
                <div className="section-title">{date}</div>
                {dateChats.map((chat) => (
                  <div key={chat.id} className={`history-item-wrapper ${isStreaming && currentChat?.id !== chat.id ? 'disabled' : ''}`}>
                    <button
                      className={`history-item ${currentChat?.id === chat.id ? 'active' : ''} ${isStreaming && currentChat?.id !== chat.id ? 'disabled' : ''}`}
                      onClick={() => !isStreaming && handleChatSelect(chat)}
                    >
                      <div className="chat-info">
                        <span className={`chat-title ${generatingTitles.has(chat.id) ? 'generating-title' : ''}`}>
                          {chat.title}
                          {generatingTitles.has(chat.id) && (
                            <span className="typing-dots">
                              <span>.</span>
                              <span>.</span>
                              <span>.</span>
                            </span>
                          )}
                        </span>
                      </div>
                    </button>
                    <button
                      className={`delete-chat-button ${isStreaming ? 'disabled' : ''}`}
                      onClick={(e) => {
                        if (!isStreaming) {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }
                      }}
                      disabled={isStreaming}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </>
      )}
    </div>
  );
};

export default Sidebar;
