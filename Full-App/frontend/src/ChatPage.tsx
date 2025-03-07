import React from 'react';
import Sidebar from './components/sidebar';
import MainContent from './components/mainContent';
import { useState } from 'react';
import './App.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
}


const ChatPage = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [selectedConnversation, setSelectedConversation] = useState<Chat | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleChatSelect = (chat: Chat | null) => {
    setCurrentChat(chat);
  };

  return (
    <div className="app">
      <Sidebar
        isCollapsed={isCollapsed}
        currentChat={currentChat}
        onChatSelect={handleChatSelect}
        setSelectedConversation={setSelectedConversation}
        isStreaming={isStreaming}
      />
      <MainContent
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        currentChat={currentChat}
        setCurrentChat={setCurrentChat}
        selectedConnversation={selectedConnversation}
        isStreaming={isStreaming}
        setIsStreaming={setIsStreaming}
      />
    </div>
  );
};

export default ChatPage;