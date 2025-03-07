// Chat.js
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useContext,
} from "react";
import { FaPaperclip, FaPaperPlane, FaTimes } from "react-icons/fa";
import axios from "axios";
import "./Chat.css";
import { options } from "./Dashboard";
import { useTheme } from "@mui/material/styles";
import { CustomThemeContext } from "./ThemeContext";

// ---- MUI Loading Spinner imports ----
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";

// ---- Rating Imports ----
import { styled } from "@mui/material/styles";
import Rating from "@mui/material/Rating";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import SentimentSatisfiedIcon from "@mui/icons-material/SentimentSatisfied";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAltOutlined";
import SentimentVerySatisfiedIcon from "@mui/icons-material/SentimentVerySatisfied";

import ReactMarkdown from "react-markdown";

import SmartToyIcon from '@mui/icons-material/SmartToy';
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";


const StyledRating = styled(Rating)(({ theme }) => ({
  // Make the rating small so it doesn't disturb the chat
  fontSize: "1rem",
  "& .MuiRating-iconEmpty .MuiSvgIcon-root": {
    color: theme.palette.action.disabled,
  },
}));

const customIcons = {
  1: {
    icon: <SentimentVeryDissatisfiedIcon color="error" />,
    label: "Very Dissatisfied",
  },
  2: {
    icon: <SentimentDissatisfiedIcon color="error" />,
    label: "Dissatisfied",
  },
  3: {
    icon: <SentimentSatisfiedIcon color="warning" />,
    label: "Neutral",
  },
  4: {
    icon: <SentimentSatisfiedAltIcon color="success" />,
    label: "Satisfied",
  },
  5: {
    icon: <SentimentVerySatisfiedIcon color="success" />,
    label: "Very Satisfied",
  },
};

function IconContainer(props) {
  const { value, ...other } = props;
  return <span {...other}>{customIcons[value].icon}</span>;
}

export default function Chat({
  setActiveScreen,
  newChat,
  setNewChat,
  input,
  setInput,
}) {
  const theme = useTheme();
  const { darkMode } = useContext(CustomThemeContext);

  const [messages, setMessages] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [ratings, setRatings] = useState({});
  const [models, setModels] = useState(['GPTo1', 'Gemini Flash 2.0', 'Deepseek R1', 'Deepseek', 'Claude 3.7']);
  const [selectedModel, setSelectedModel] = useState('GPTo1');
  const messagesEndRef = useRef(null);

  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  const resetState = useCallback(() => {
    setMessages([]);
    setInput("");
    setUploadedFiles([]);
    setRatings({});
  }, [setMessages, setInput, setUploadedFiles]);

  const fetchChatHistory = async (userId, sessionId) => {
    try {
      const response = await axios.get(`${apiUrl}/chat/history/`, {
        params: { userId, sessionId },
      });
      console.log("✅ Chat history fetched:", response.data.history);

      setMessages(
        response.data.history.flatMap((item) =>
          [
            { text: item.message, sender: "user" },
            item.bot_response && { text: item.bot_response, sender: "bot" },
          ].filter(Boolean)
        )
      );
    } catch (error) {
      console.error(
        "❌ Error while fetching chat history:",
        error.response?.data || error
      );
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return;

    const userId = "user123"; // Replace with dynamic user ID logic if needed
    const sessionId = "session123"; // Replace with dynamic session ID logic if needed

    // Extract actual File objects from our array
    const actualFiles = uploadedFiles.map((obj) => obj.file);

    const newMessages = [
        ...messages,
        { text: input, files: actualFiles, sender: "user" },
    ];
    setMessages(newMessages);
    setInput("");
    setUploadedFiles([]);

    const formData = new FormData();
    formData.append("message", input);

    // Append files to the form data if there are any
    actualFiles.forEach((file) => {
        formData.append("files", file); // Ensure we are appending the File object
    });

    // Add userId and sessionId for chat history storage
    formData.append("userId", userId);
    formData.append("sessionId", sessionId);

    // Immediately set the "Thinking..." message
    setMessages((prevMessages) => [
        ...prevMessages,
        { text: "Thinking...", sender: "bot" },
    ]);

    try {
        const response = await fetch(`${apiUrl}/chat/`, {
            method: "POST",
            body: formData,
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;

        let botResponse = "";
        const botMessageIndex = newMessages.length; // Index of the last message

        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
                const chunk = decoder.decode(value, { stream: true });
                botResponse += chunk;

                // Update the last message with the accumulated response
                setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages];
                    updatedMessages[botMessageIndex].text = botResponse; // Store raw response
                    return updatedMessages;
                });

                await new Promise((resolve) => setTimeout(resolve, 25));
            }
        }

        // After receiving the full response, format it
        setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            updatedMessages[botMessageIndex].text = botResponse; // Store raw response
            console.log("✅ Bot response:", botResponse);
            return updatedMessages;
        });

    } catch (error) {
        console.error("❌ Error while sending message:", error);
        setMessages([
            ...newMessages,
            {
                text: "Sorry, something went wrong. Please try again.",
                sender: "bot",
            },
        ]);
    }
};

  /**
   * When user selects files, create objects with { file, isLoading: true },
   * then use a setTimeout to simulate a quick "uploading" spinner before
   * flipping isLoading to false.
   */
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const newFileObjects = files.map((f) => ({ file: f, isLoading: true }));
    setUploadedFiles((prev) => [...prev, ...newFileObjects]);

    // Simulate a short "uploading" spinner for each file
    newFileObjects.forEach((fileObj) => {
      setTimeout(() => {
        setUploadedFiles((prev) =>
          prev.map((item) =>
            item.file === fileObj.file ? { ...item, isLoading: false } : item
          )
        );
      }, 2000);
    });

    // Reset file input
    event.target.value = null;
  };

  const removeFile = (index) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (newChat) {
      resetState();
      setNewChat(false);
    }
  }, [newChat, resetState, setNewChat]);

  useEffect(() => {
    const userId = "user123"; // Replace with dynamic user ID logic if needed
    const sessionId = "session123"; // Replace with dynamic session ID logic if needed
    fetchChatHistory(userId, sessionId);
  }, []);

  const handleRatingChange = (index, newValue) => {
    setRatings((prev) => ({ ...prev, [index]: newValue }));
    // If you need to send the rating to the server, do it here
  };

  return (
    <div
      className="chat-container"
      style={{
        backgroundColor: "var(--background-dark)",
        color: theme.palette.text.primary,
      }}>
        <div className="chat-header">
          <FormControl sx={{ m: 1, minWidth: 40, maxheight: '1px' }}>
            {/* <InputLabel id="demo-simple-select-label">Model</InputLabel> */}
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              autoWidth
              sx={{ fontSize: '.9rem', color: 'black', fontWeight: 'bold'}}
            >
              {models.map((model) => (
                <MenuItem key={model} value={model}>{model}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <div className="profile">
            <img src="https://t4.ftcdn.net/jpg/00/65/77/27/360_F_65772719_A1UV5kLi5nCEWI0BNLLiFaBPEkUbv5Fv.jpg"  />
          </div>
        </div>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className="chat-message-block">
            {/* Message Bubble */}
            <div className={`chat-message ${msg.sender}-message`}>
              {/* Use dangerouslySetInnerHTML to render HTML */}
              {/* <span dangerouslySetInnerHTML={{ __html: msg.text }} /> */}
              {msg.sender == 'bot' && <SmartToyIcon 
                sx={{
                  color: theme.palette.text.primary, 
                  fontSize: 30,
                  position: "relative",
                  left: "-50px",
                  top: "50px",
                
                }}
                />}
              <ReactMarkdown
                  // If your text is in a variable called msgText
                  children={msg.text}

                  // Treat single line breaks as actual line breaks
                  breaks={true}

                  // By default, react-markdown will skip raw HTML tags in your text
                  // If you need to allow <br>, <b>, etc. in your text, you can do:
                  skipHtml={false}
                  // or allow specific elements:
                  // allowedElements={['b', 'i', 'br', 'strong', ...]}

                  // Optionally override default components
                  components={{
                    // Example: add left padding to <ul> to indent bullet points
                    ul: ({ node, ...props }) => <ul style={{ paddingLeft: "1.5rem" }} {...props} />,
                    ol: ({ node, ...props }) => <ol style={{ paddingLeft: "1.5rem" }} {...props} />,
                    br: ({ node, ...props }) => <br style={{ marginTop: "0.5rem" }} {...props} />,
                    // new line
                    p: ({ node, ...props }) => <p style={{ marginTop: "0.5rem" }} {...props} />,
                    // Example: override headings if you want special styling
                    bold: ({ node, ...props }) => <strong style={{ color: "black" }} {...props} />,
                    h2: ({ node, ...props }) => <h2 style={{ color: "black"}} {...props} />,
                    a: ({ node, ...props }) => <a style={{ color: "#5E84B3", textDecoration: "none" }} {...props} />,
                  }}
                />

              {/* If there are files attached to the message, display them */}
              {msg.files && (
                <div className="sent-files">
                  {msg.files.map((file, fileIndex) => (
                    <div key={fileIndex} className="file-preview">
                      <span className="file-icon">📄</span>
                      <span className="file-name">{file.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rating Outside the Bubble, only for bot messages */}
            {msg.sender === "bot" && (
              <div className="rating-container">
                <StyledRating
                  name={`rating-${index}`}
                  value={ratings[index] || 0}
                  onChange={(_, newValue) =>
                    handleRatingChange(index, newValue)
                  }
                  IconContainerComponent={IconContainer}
                  getLabelText={(value) => customIcons[value].label}
                  highlightSelectedOnly
                />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Display uploaded files (before sending) */}
      {uploadedFiles.length > 0 && (
        <div className="file-preview-container">
          {uploadedFiles.map((item, index) => (
            <div key={index} className="file-preview">
              {item.isLoading ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CircularProgress color="secondary" size={20} />
                  <span className="file-name">{item.file.name}</span>
                </Stack>
              ) : (
                <>
                  <span className="file-icon">📄</span>
                  <span className="file-name">{item.file.name}</span>
                  <FaTimes
                    className="remove-file"
                    onClick={() => removeFile(index)}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {messages.length === 0 && (
        <div className="chat-card-container">
          {options
            .filter((e) => e.prompt)
            .map(({ label, icon, prompt }) => (
              <div
                key={label}
                className="chat-card"
                onClick={() => setInput(prompt)}
                
                >
                <i>{icon}</i>
                <p>{label}</p>
              </div>
            ))}
        </div>
      )}
      <div className="chat-input-container">
        <button className="attach-button" title="Upload attachment">
          <FaPaperclip />
          <input type="file" multiple onChange={handleFileUpload} />
        </button>
        <input
          type="text"
          placeholder="Ask anything..."
          value={input}
          className="chat-input"
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="send-button" onClick={sendMessage}>
          <FaPaperPlane />
        </button>
      </div>
      <small style={{fontFamily: "google-sans", width: '100%', textAlign: 'center'}}>The AI agent can make mistakes, so double-check it</small>

      
    </div>
  );
}
