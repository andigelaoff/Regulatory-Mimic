import React from 'react';
import './mainContent.css';
import { Menu, User, ChevronDown, LogOut, ChevronLeft, X, BookOpen, FileText, UserPlus, ClipboardCheck, Square, Send, Bot, Sparkles, Paperclip, File } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import RealTimeFormatter from './RealTimeFormatter';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    attachment?: {
        name: string;
        type: string;
    };
    prompt?: string;
    isLoading?: boolean;
}

interface Chat {
    id: string;
    title: string;
    timestamp: Date;
    messages: Message[];
    lastMessage?: string;
    isGeneratingTitle?: boolean;
}

interface MainContentProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    currentChat: Chat | null;
    setCurrentChat: (chat: Chat | null) => void;
    selectedConnversation: Chat | null;
    isStreaming: boolean;
    setIsStreaming: (isStreaming: boolean) => void;
}

interface LoadingIndicatorProps {
    className?: string;
}

const MainContent = ({ isCollapsed, onToggleCollapse, currentChat, setCurrentChat, selectedConnversation, isStreaming, setIsStreaming }: MainContentProps) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const { tempEmail, signOut } = useAuth();
    const navigate = useNavigate();

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [selectedModel, setSelectedModel] = useState('GPT-4o');
    const [inputMessage, setInputMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<EventSource | null>(null);

    const streamBufferRef = useRef<string>('');

    const [isUploading, setIsUploading] = useState(false);
    const [currentFile, setCurrentFile] = useState<string | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [fileToshow, setFileToshow] = useState<string>("");

    const [hasStartedChat, setHasStartedChat] = useState(false);

    const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

    const [showSuggestions, setShowSuggestions] = useState(false);

    const [prompt, setPrompt] = useState("");
    const [showPromptInput, setShowPromptInput] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

    const [titleWs, setTitleWs] = useState<WebSocket | null>(null);
    const [isTitleGenerating, setIsTitleGenerating] = useState(false);
    const [generatedTitle, setGeneratedTitle] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);



    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.body.classList.contains("dark"));
        };

        checkDarkMode();

        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);


    const handleStopStreaming = () => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        // Reset all streaming states
        setIsGenerating(false);
        setIsStreaming(false);

        // Update messages state and chat storage in one go
        setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
                // Save the current content and mark as not loading
                lastMessage.isLoading = false;

                // Only add the stop message if it's not already there
                if (!lastMessage.content.endsWith("[Streaming stopped by user]")) {
                    lastMessage.content = lastMessage.content + " [Streaming stopped by user]";
                }

                // Update chat storage with the current content
                if (currentChat) {
                    const updatedMessages = [...currentChat.messages];
                    // Remove the last assistant message if it exists
                    if (updatedMessages.length > 0 && updatedMessages[updatedMessages.length - 1].role === 'assistant') {
                        updatedMessages.pop();
                    }
                    // Add the current message with the accumulated content
                    updatedMessages.push({
                        ...lastMessage,
                        timestamp: new Date()
                    });

                    const updatedChat = {
                        ...currentChat,
                        messages: updatedMessages,
                        lastMessage: lastMessage.content,
                        timestamp: new Date()
                    };
                    updateChatInStorage(updatedChat);
                }
            }
            return updated;
        });
    };

    const generateTitle = (prompt: string, chatId: string) => {
        setIsGenerating(true);
        let accumulatedTitle = '';
        let isComplete = false;
        let lastWord = '';

        const eventSource = new EventSource(`http://127.0.0.1:8000/api/title?model=${selectedModel}&prompt=${encodeURIComponent(prompt)}`);

        const updateTitle = (title: string, isTyping = true) => {
            const existingChats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
            const updatedChats = existingChats.map((chat: Chat) =>
                chat.id === chatId ? {
                    ...chat,
                    title: isTyping ? `${title}|` : title || 'Generating title...',
                    isGeneratingTitle: isTyping
                } : chat
            );
            localStorage.setItem('chatHistory', JSON.stringify(updatedChats));
            if (currentChat && currentChat.id === chatId) {
                setCurrentChat({
                    ...currentChat,
                    title: isTyping ? `${title}|` : title || 'Generating title...',
                    isGeneratingTitle: isTyping
                });
            }
            window.dispatchEvent(new CustomEvent('chatUpdated'));
        };

        const closeConnection = (finalTitle: string) => {
            if (!isComplete) {
                isComplete = true;
                eventSource.close();
                setIsGenerating(false);
                updateTitle(finalTitle, false);
            }
        };


        const timeoutId = setTimeout(() => {
            if (!isComplete) {
                const finalTitle = accumulatedTitle.trim() || 'New Chat';
                closeConnection(finalTitle);
            }
        }, 10000);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.error) {
                console.error('Error:', data.error);
                clearTimeout(timeoutId);
                closeConnection('New Chat');
                return;
            }

            if (data.content) {

                const cleanContent = data.content.replace(/^["']|["']$/g, '').trim();

                if (cleanContent) {

                    if (cleanContent.match(/^[A-Z]/) && accumulatedTitle.length > 0) {
                        accumulatedTitle += ' ';
                    }


                    accumulatedTitle += cleanContent;


                    updateTitle(accumulatedTitle, true);


                    if (data.content.includes('"') && accumulatedTitle.length > 0) {

                        clearTimeout(timeoutId);
                        closeConnection(accumulatedTitle);
                    } else if (
                        accumulatedTitle.trim().endsWith('.') ||
                        accumulatedTitle.trim().endsWith('!') ||
                        accumulatedTitle.trim().endsWith('?') ||
                        accumulatedTitle.length >= 50
                    ) {
                        clearTimeout(timeoutId);
                        closeConnection(accumulatedTitle);
                    }
                }
            }
        };

        eventSource.onerror = (error) => {
            console.error('EventSource failed:', error);
            if (!isComplete) {
                clearTimeout(timeoutId);
                const finalTitle = accumulatedTitle.trim() || 'New Chat';
                closeConnection(finalTitle);
            }
        };

        return () => {
            if (!isComplete) {
                clearTimeout(timeoutId);
                eventSource.close();
                setIsGenerating(false);
            }
        };
    };

    const updateChatInStorage = (updatedChat: Chat) => {
        const existingChats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        const updatedChats = existingChats.map((chat: Chat) =>
            chat.id === updatedChat.id ? {
                ...updatedChat,

                title: chat.title !== 'Generating title...' ? chat.title : updatedChat.title
            } : chat
        );
        localStorage.setItem('chatHistory', JSON.stringify(updatedChats));


        setCurrentChat({
            ...updatedChat,
            title: currentChat?.title !== 'Generating title...' ? currentChat?.title || updatedChat.title : updatedChat.title
        });

        window.dispatchEvent(new CustomEvent('chatUpdated'));
    };

    const models = [
        { name: 'GPT-4o', icon: <Bot size={16} /> },
        { name: 'GPT-4o-mini', icon: <Bot size={16} /> },
        { name: 'DeepSeek R1', icon: <Bot size={16} />, disabled: true },
        { name: 'Gemini 2.0', icon: <Bot size={16} />, disabled: true }
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);


    const handleError = (errorMessage: string) => {
        setIsStreaming(false);
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: errorMessage,
            timestamp: new Date()
        }]);
    };

  

    const handleSendMessage = async () => {
        if ((!inputMessage.trim() && !uploadedFiles[0]) || isStreaming) {
            return;
        }

        try {
            setIsStreaming(true);
            const messageToSend = inputMessage;
            setInputMessage('');

            const userMessage: Message = {
                role: 'user',
                content: messageToSend,
                timestamp: new Date(),
                ...(uploadedFiles[0] && {
                    attachment: {
                        name: uploadedFiles[0].name,
                        type: uploadedFiles[0].type
                    },
                    prompt: messageToSend
                })
            };

            let chatToUpdate: Chat;

            if (!currentChat) {
                const newChatId = Date.now().toString();
                const tempChat: Chat = {
                    id: newChatId,
                    title: '...',
                    timestamp: new Date(),
                    messages: [userMessage],
                    lastMessage: messageToSend
                };

                const existingChats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
                localStorage.setItem('chatHistory', JSON.stringify([tempChat, ...existingChats]));
                setCurrentChat(tempChat);
                chatToUpdate = tempChat;

                generateTitle(messageToSend, newChatId);
            } else {
                chatToUpdate = {
                    ...currentChat,
                    messages: [...currentChat.messages, userMessage],
                    timestamp: new Date(),
                    lastMessage: messageToSend
                };
                setCurrentChat(chatToUpdate);
            }

            setMessages(chatToUpdate.messages);

            const assistantMessage: Message = {
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                isLoading: true
            };

            setMessages(prev => [...prev, assistantMessage]);

            if (uploadedFiles[0]) {
                await handleFileUploadAndStream(uploadedFiles[0], messageToSend, chatToUpdate);
            } else {
                await handleMessageStream(messageToSend, chatToUpdate);
            }

            setHasStartedChat(true);
            window.dispatchEvent(new CustomEvent('chatUpdated'));

        } catch (error) {
            console.error('API request error:', error);
            setMessages(prev => prev.filter(msg => !msg.isLoading));
            handleError(error instanceof Error ? error.message : 'Failed to process request');
        }
    };

    const handleMessageStream = async (messageToSend: string, chatToUpdate: Chat) => {
        // Close any existing connections first
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        const eventSource = new EventSource(`http://127.0.0.1:8000/api/ask?model=${selectedModel}&q=${encodeURIComponent(messageToSend)}`);
        wsRef.current = eventSource;
        let accumulatedContent = '';
        let isComplete = false;

        const cleanup = () => {
            if (wsRef.current && wsRef.current.readyState !== eventSource.CLOSED) {
                wsRef.current.close();
                wsRef.current = null;
                setIsStreaming(false);
                window.removeEventListener('beforeunload', cleanup);
            }
        };

        window.addEventListener('beforeunload', cleanup);

        return new Promise((resolve, reject) => {
            eventSource.onmessage = (event) => {
                // If streaming has been stopped, don't process any more messages
                if (!wsRef.current) {
                    cleanup();
                    resolve(null);
                    return;
                }

                try {
                    const data = JSON.parse(event.data);

                    if (data.error) {
                        throw new Error(data.error);
                    }

                    if (data.content) {
                        accumulatedContent += data.content;

                        setMessages(prev => {
                            const updated = [...prev];
                            const lastMessage = updated[updated.length - 1];
                            if (lastMessage && lastMessage.role === 'assistant') {
                                lastMessage.content = accumulatedContent;
                                lastMessage.isLoading = false;
                            }
                            return updated;
                        });

                        if (data.content.includes("[END]")) {
                            isComplete = true;
                            const finalContent = accumulatedContent.replace("[END]", "").trim();
                            cleanup();
                            const finalAssistantMessage: Message = {
                                role: 'assistant',
                                content: finalContent,
                                timestamp: new Date(),
                                isLoading: false
                            };

                            chatToUpdate = {
                                ...chatToUpdate,
                                messages: [...chatToUpdate.messages, finalAssistantMessage],
                                timestamp: new Date(),
                                lastMessage: finalContent
                            };

                            updateChatInStorage(chatToUpdate);
                            setMessages(chatToUpdate.messages);
                            resolve(null);
                        }
                    }
                } catch (error) {
                    console.error('Error processing message:', error);
                    if (!isComplete) {
                        handleError(error instanceof Error ? error.message : 'Failed to process message');
                        cleanup();
                        reject(error);
                    }
                }
            };

            eventSource.onerror = (error) => {
                console.error('EventSource error:', error);
                cleanup();
                if (!isComplete) {
                    if (!accumulatedContent) {
                        handleError('Connection error occurred');
                        reject(error);
                    } else {
                        const finalAssistantMessage: Message = {
                            role: 'assistant',
                            content: accumulatedContent,
                            timestamp: new Date(),
                            isLoading: false
                        };

                        chatToUpdate = {
                            ...chatToUpdate,
                            messages: [...chatToUpdate.messages, finalAssistantMessage],
                            timestamp: new Date(),
                            lastMessage: accumulatedContent
                        };

                        updateChatInStorage(chatToUpdate);
                        setMessages(chatToUpdate.messages);
                        resolve(null);
                    }
                }
            };
        });
    };

    const handleFileUploadAndStream = async (file: File, messageToSend: string, chatToUpdate: Chat) => {
        const formData = new FormData();
        formData.append("file", file);
        if (messageToSend.trim()) {
            formData.append("prompt", messageToSend);
        }

        let accumulatedContent = '';
        let isComplete = false;

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/upload?model=${selectedModel}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('Failed to initialize stream reader');
            }

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.error) {
                                throw new Error(data.error);
                            }

                            if (data.content) {
                                accumulatedContent += data.content;

                                setMessages(prev => {
                                    const updated = [...prev];
                                    const lastMessage = updated[updated.length - 1];
                                    if (lastMessage && lastMessage.role === 'assistant') {
                                        lastMessage.content = accumulatedContent;
                                        lastMessage.isLoading = false;
                                    }
                                    return updated;
                                });

                                if (data.content.includes("[END]")) {
                                    isComplete = true;
                                    const finalContent = accumulatedContent.replace("[END]", "").trim();
                                    const finalAssistantMessage: Message = {
                                        role: 'assistant',
                                        content: finalContent,
                                        timestamp: new Date(),
                                        isLoading: false
                                    };

                                    chatToUpdate = {
                                        ...chatToUpdate,
                                        messages: [...chatToUpdate.messages, finalAssistantMessage],
                                        timestamp: new Date(),
                                        lastMessage: finalContent
                                    };

                                    updateChatInStorage(chatToUpdate);
                                    setMessages(chatToUpdate.messages);
                                    break;
                                }
                            }
                        } catch (error) {
                            console.error('Error parsing stream data:', error);
                        }
                    }
                }
            }

            if (!isComplete && accumulatedContent) {
                const finalAssistantMessage: Message = {
                    role: 'assistant',
                    content: accumulatedContent,
                    timestamp: new Date(),
                    isLoading: false
                };

                chatToUpdate = {
                    ...chatToUpdate,
                    messages: [...chatToUpdate.messages, finalAssistantMessage],
                    timestamp: new Date(),
                    lastMessage: accumulatedContent
                };

                updateChatInStorage(chatToUpdate);
                setMessages(chatToUpdate.messages);
            }

        } catch (error) {
            console.error('Upload/streaming error:', error);
            handleError(error instanceof Error ? error.message : 'Failed to process file');
            throw error;
        } finally {
            setUploadedFiles([]);
            setFileToshow("");
            setShowPromptInput(false);
            setIsStreaming(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        try {
            setIsUploading(true);
            setUploadStatus('uploading');
            setUploadProgress(0);

            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error("File size exceeds 10MB limit");
            }
            const allowedTypes = ['application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error("Only PDF files are allowed");
            }

            setFileToshow(file.name);
            setUploadedFiles(prev => [...prev, file]);
            setShowPromptInput(true);
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            setTimeout(() => {
                clearInterval(progressInterval);
                setUploadProgress(100);
                setUploadStatus('success');
            }, 2000);

        } catch (error) {
            console.error("File upload failed:", error);
            setUploadStatus('error');
            handleError(error instanceof Error ? error.message : "Failed to upload file");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileRemove = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
        setFileToshow("");
        setPrompt("");
        setShowPromptInput(false);
        setUploadStatus('idle');
        setUploadProgress(0);
    };


    useEffect(() => {
        const handleNewChat = () => {
            setHasStartedChat(false);
            setMessages([]);
            setInputMessage('');
            setIsStreaming(false);
            setCurrentFile(null);
            setIsUserMenuOpen(false);

        };

        window.addEventListener('newChat', handleNewChat);

        return () => {
            window.removeEventListener('newChat', handleNewChat);
        };
    }, []);

    useEffect(() => {
        function onChatUpdated() {
            const saved = localStorage.getItem('chatHistory') || '[]';
            const savedChats = JSON.parse(saved);
            if (currentChat) {
                const updatedChat = savedChats.find((chat: Chat) => chat.id === currentChat.id);
                if (updatedChat) {
                    setCurrentChat({
                        ...updatedChat,
                        timestamp: new Date(updatedChat.timestamp),
                        messages: updatedChat.messages.map((msg: Message) => ({
                            ...msg,
                            timestamp: new Date(msg.timestamp)
                        }))
                    });
                }
            }
        }

        window.addEventListener('chatUpdated', onChatUpdated);

        return () => {
            window.removeEventListener('chatUpdated', onChatUpdated);
        };
    }, [currentChat]);

    useEffect(() => {
        if (selectedConnversation) {
            setMessages(selectedConnversation.messages.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            })));
            setHasStartedChat(true);
            setCurrentChat(selectedConnversation);
        }
    }, [selectedConnversation]);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'chatHistory' && e.newValue) {
                const savedChats = JSON.parse(e.newValue);
                if (currentChat) {
                    const updatedCurrentChat = savedChats.find((chat: Chat) => chat.id === currentChat.id);
                    if (updatedCurrentChat) {
                        setCurrentChat(updatedCurrentChat);
                        setMessages(updatedCurrentChat.messages);
                    }
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [currentChat]);

    const handleSuggestionClick = (suggestion: string) => {
        setSelectedSuggestion(prevSuggestion => prevSuggestion === suggestion ? null : suggestion);
        setInputMessage(prevSuggestion => prevSuggestion === suggestion ? '' : suggestion);
        setShowSuggestions(false);
    };

    const suggestions = [
        { text: "Privacy and Policy", icon: <BookOpen size={18} /> },
        { text: "Holiday Information", icon: <FileText size={18} /> },
        { text: "Medical Insurance", icon: <UserPlus size={18} /> },
        { text: "CV Analyzer", icon: <ClipboardCheck size={18} /> }
    ];

    const fileInputRef = useRef<HTMLInputElement>(null);

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const LoadingIndicator = ({ className = '' }: LoadingIndicatorProps) => (
        <div className={`typing-indicator ${className}`}>
            <div className="typing-circle"></div>
            <div className="typing-circle"></div>
            <div className="typing-circle"></div>
            <div className="typing-shadow"></div>
        </div>
    );

    const handleLogout = () => {
        signOut();
        navigate('/login');
    };

    return (
        <div className={`main-content ${isDarkMode ? "dark-mode" : "light-mode"} ${isCollapsed ? 'sidebar-collapsed' : ''}`}>

            <div className="content-header">
                <div className="header-left">
                    <button
                        className="toggle-sidebar-button"
                        onClick={onToggleCollapse}
                    >
                        {isCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
                    </button>

                    <div className="model-selector-container">
                        <button
                            className="model-selector-button"
                            onClick={() => setShowModelDropdown(!showModelDropdown)}
                        >
                            <span className="model-icon">
                                <Bot size={16} />
                            </span>
                            <span>{selectedModel}</span>
                            <ChevronDown size={14} />
                        </button>

                        {showModelDropdown && (
                            <div className="model-dropdown">
                                {models.map((model) => (
                                    <button
                                        key={model.name}
                                        className={`model-option ${selectedModel === model.name ? 'active' : ''} ${model.disabled ? 'disabled' : ''}`}
                                        onClick={() => {
                                            if (!model.disabled) {
                                                setSelectedModel(model.name);
                                                setShowModelDropdown(false);
                                            }
                                        }}
                                    >
                                        <span className="model-icon">{model.icon}</span>
                                        <span>{model.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="header-right">
                    <ThemeToggle /> { }
                    <div className="user-menu-container">
                        <button
                            className="user-profile-button"
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        >
                            <div className="user-avatar">
                                <User size={20} />
                            </div>
                        </button>

                        {isUserMenuOpen && (
                            <div className="user-dropdown">
                                <div className="user-info">
                                    <div className="user-details">
                                        <span className="user-email">{tempEmail || localStorage.getItem('userEmail')}</span>
                                    </div>
                                </div>
                                <div className="dropdown-divider"></div>
                                <button className="sign-out-button" onClick={handleLogout}>
                                    <LogOut size={16} />
                                    <span>Sign out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="chat-container">
                {(selectedConnversation || currentChat) ? (
                    <div className="messages-container">
                        {messages.map((message, index) => (
                            <div key={index} className={`message ${message.role}`}>
                                <div className="message-content-wrapper">
                                    {message.attachment && message.role === "user" && (
                                        <div className="uploaded-file">
                                            <div className="icon-container">
                                                <File size={18} className="file-icon" />
                                            </div>
                                            <span className="file-name">{message.attachment.name}</span>
                                        </div>
                                    )}
                                    <div className="message-text">
                                        {message.isLoading ? (
                                            <div className="loading-dots">
                                                <span>.</span>
                                                <span>.</span>
                                                <span>.</span>
                                            </div>
                                        ) : (
                                            <RealTimeFormatter content={message.content} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                ) : (
                    <div className="empty-state">
                        <h2>How can I help you today?</h2>
                        <div className="suggestion-grid">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    className={`suggestion-button ${selectedSuggestion === suggestion.text ? 'selected' : ''}`}
                                    onClick={() => handleSuggestionClick(suggestion.text)}

                                >
                                    <div className="suggestion-content">
                                        <span className="suggestion-icon">{suggestion.icon}</span>
                                        <span className="suggestion-text">{suggestion.text}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showSuggestions && (
                <div className="suggestions-popover">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            className="suggestion-item"
                            onClick={() => handleSuggestionClick(suggestion.text)}
                        >
                            <span className="suggestion-icon">{suggestion.icon}</span>
                            <span className="suggestion-text">{suggestion.text}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="input-footer">
                {showSuggestions && (
                    <div className="suggestions-popover">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                className="suggestion-item"
                                onClick={() => handleSuggestionClick(suggestion.text)}
                            >
                                <span className="suggestion-icon">{suggestion.icon}</span>
                                <span className="suggestion-text">{suggestion.text}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div
                    className="input-container"
                    style={{ display: 'flex', flexDirection: 'column', width: '100%' }}
                >
                    {uploadedFiles.map((file, index) => (
                        <div key={index} className="file-preview">
                            <div className="file-icon">
                                <File size={18} className="file-icon-svg" />
                            </div>

                            <span className="file-name">{file.name}</span>

                            <button onClick={() => handleFileRemove(index)} className="remove-file">
                                <X size={14} />
                            </button>
                        </div>

                    ))}

                    <div
                        className="input-row"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                        }}
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                setIsStreaming(true);
                                handleSendMessage();
                            }
                        }}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                const prompt = e.target.value;
                                if (file && prompt) handleFileUpload(file);
                            }}
                            accept=".pdf"
                            style={{ display: 'none' }}

                        />
                        <button
                            className="attach-button"
                            onClick={triggerFileUpload}
                            disabled={isUploading || uploadedFiles.length >= 3}
                        >
                            <Paperclip size={20} />
                        </button>

                        {hasStartedChat && (
                            <button
                                className="sparkle-button"
                                onClick={() => setShowSuggestions(!showSuggestions)}
                            >
                                <Sparkles size={20} className="sparkle-icon" />
                            </button>
                        )}



                        <input
                            type="text"
                            placeholder="Message Regulatory Agent..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSendMessage();
                                    setSelectedSuggestion('');
                                    setFileToshow("")
                                    setUploadedFiles([])
                                }
                            }}
                            style={{
                                flex: 1,
                                marginLeft: '6px',
                                border: 'none',
                                outline: 'none',
                            }}
                        />

                        <button
                            className="send-button"
                            disabled={!isStreaming && !inputMessage.trim()}
                            style={{ marginLeft: '6px' }}
                            onClick={() => {
                                if (isStreaming) {
                                    handleStopStreaming();
                                } else {
                                    handleSendMessage();
                                }
                            }}
                        >
                            {isStreaming ? <Square size={20} /> : <Send size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainContent;
