// API Configuration
const API_CONFIG = {
    endpoint: 'https://muftiai-hlv9.onrender.com/chat', // Replace with your actual endpoint
    headers: {
        'Content-Type': 'application/json'
    },
    requestFormat: {
        query: 'query',
        userId: 'userId',
        domain: 'domain'
    },
    responseFormat: {
        response: 'response'
    },
    method: 'POST',
    timeout: 30000
};

// OpenAI Configuration
const OPENAI_CONFIG = {
    apiKey: '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', // Replace with your actual API key
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4',
    maxTokens: 10 // Limiting tokens for short titles
};

// Add this at the top of your index.js with other constants
let isAIResponding = false;

// Add this variable at the top of your file to track the currently open menu
let currentOpenMenu = null;

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    initializeSessions();
    const activeSession = getActiveSession();
    if (activeSession) {
        renderSessionList();
        renderChatWindow();  // Add this to show existing messages on load
    }
    setupEventListeners();
});

const USER_ICON = `<img src="https://cdn-icons-png.flaticon.com/512/236/236831.png" alt="User Icon" style="width: 24px; height: 24px;">`;

const BOT_ICON = `<img src="https://cdn-icons-png.flaticon.com/512/2330/2330948.png" alt="Bot Icon" style="width: 24px; height: 24px;">`;

// const USER_ICON = `<svg viewBox="0 0 24 24" fill="currentColor">
//     <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
// </svg>`;

// const BOT_ICON = `<svg viewBox="0 0 24 24" fill="currentColor">
//     <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 14.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z"/>
//     <circle cx="12" cy="12" r="2.5"/>
// </svg>`;

// Helper Functions
function initializeSessions() {
    if (!localStorage.getItem("sessions")) {
        localStorage.setItem("sessions", JSON.stringify([]));
        createNewSession("New chat");
    }
}

function setupEventListeners() {
    document.getElementById("new-session-btn").addEventListener("click", () => createNewSession("New chat"));
    document.getElementById("send-btn").addEventListener("click", sendMessage);
    document.getElementById("user-input").addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            // Only send if AI is not currently responding
            if (!isAIResponding) {
                sendMessage();
            }
        }
    });
    
    // Mobile menu toggle with overlay
    const sidebar = document.querySelector('.sidebar');
    
    // Create simplified control panel header
    const controlPanelHeader = document.createElement('div');
    controlPanelHeader.className = 'control-panel-header';
    controlPanelHeader.innerHTML = `
        <button class="close-panel">
            <svg viewBox="0 0 24 24" width="50" height="50">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
            </svg>
        </button>

    `;
    
    // Create sidebar content wrapper
    const sidebarContent = document.createElement('div');
    sidebarContent.className = 'sidebar-content';
    
    // Create new chat section
    const newChatSection = document.createElement('div');
    newChatSection.className = 'new-chat-section';
    newChatSection.appendChild(document.getElementById('new-session-btn'));
    
    // Create conversations section
    const conversationsSection = document.createElement('div');
    conversationsSection.className = 'conversations-section';
    conversationsSection.appendChild(document.getElementById('session-list'));
    
    // Assemble sidebar content
    sidebarContent.appendChild(newChatSection);
    sidebarContent.appendChild(conversationsSection);
    
    // Clear sidebar and add new structure
    sidebar.innerHTML = '';
    sidebar.appendChild(controlPanelHeader);
    sidebar.appendChild(sidebarContent);
    
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '☰';
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    
    if (window.innerWidth <= 1024) {
        document.body.appendChild(menuToggle);
    }
    
    // Menu toggle click handler
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('expanded');
        overlay.classList.toggle('show');
        document.body.style.overflow = 'hidden';
    });
    
    // Close button click handler
    const closeButton = sidebar.querySelector('.close-panel');
    closeButton.addEventListener('click', () => {
        sidebar.classList.remove('expanded');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    });
    
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('expanded');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    });
    
    // Handle resize
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 1024) {
            if (!document.body.contains(menuToggle)) {
                document.body.appendChild(menuToggle);
            }
        } else {
            if (document.body.contains(menuToggle)) {
                menuToggle.remove();
            }
            sidebar.classList.remove('expanded');
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

}

// Session Management
function createNewSession(title) {
    const sessions = JSON.parse(localStorage.getItem("sessions"));
    const newSession = {
        id: `session_${Date.now()}`,
        name: title || formatDateForSessionName(new Date()),
        history: [],
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };
    sessions.unshift(newSession);
    localStorage.setItem("sessions", JSON.stringify(sessions));
    setActiveSession(newSession.id);
    renderSessionList();
}

function formatDateForSessionName(date) {
    return `Chat ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function groupSessionsByDate(sessions) {
    const groups = {
        'Today': [],
        'Yesterday': [],
        'Previous 7 Days': [],
        'Previous 30 Days': [],
        ...Array.from({ length: 12 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i - 1);
            return d.toLocaleString('default', { month: 'long', year: 'numeric' });
        }).reduce((acc, month) => ({ ...acc, [month]: [] }), {})
    };

    sessions.forEach(session => {
        const date = new Date(session.lastUpdated);
        const today = new Date();
        const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) groups['Today'].push(session);
        else if (diffDays === 1) groups['Yesterday'].push(session);
        else if (diffDays <= 7) groups['Previous 7 Days'].push(session);
        else if (diffDays <= 30) groups['Previous 30 Days'].push(session);
        else {
            const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (groups[monthYear]) groups[monthYear].push(session);
        }
    });

    return groups;
}

function setActiveSession(sessionId) {
    localStorage.setItem("activeSession", sessionId);
    renderSessionList();
    renderChatWindow();
}

function deleteSession(sessionId) {
    let sessions = JSON.parse(localStorage.getItem("sessions"));
    sessions = sessions.filter(session => session.id !== sessionId);
    localStorage.setItem("sessions", JSON.stringify(sessions));
    
    if (localStorage.getItem("activeSession") === sessionId) {
        if (sessions.length > 0) {
            setActiveSession(sessions[0].id);
        } else {
            createNewSession("New chat");
        }
    }
    renderSessionList();
}

function renameSession(sessionId, newName) {
    const sessions = JSON.parse(localStorage.getItem("sessions"));
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
        session.name = newName;
        localStorage.setItem("sessions", JSON.stringify(sessions));
        renderSessionList();
        renderChatWindow();
    }
}

// Function to generate session title
async function generateSessionTitle(userMessage, aiResponse) {
    try {
        const response = await fetch(OPENAI_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: OPENAI_CONFIG.model,
                messages: [
                    {
                        role: "system",
                        content: "Generate a concise 3-5 word title for a conversation based on the following user message and AI response. Make it descriptive but brief. without any special characters or numbers. without inverted commas. The title about islamic perspective."
                    },
                    {
                        role: "user",
                        content: `User: ${userMessage}\nAI: ${aiResponse}`
                    }
                ],
                max_tokens: OPENAI_CONFIG.maxTokens,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate title');
        }

        const data = await response.json();
        const title = data.choices[0].message.content.trim();
        return title;

    } catch (error) {
        console.error('Error generating title:', error);
        return null;
    }
}

function renderSessionList() {
    const sessions = JSON.parse(localStorage.getItem("sessions"));
    const sessionList = document.getElementById("session-list");
    const activeSessionId = localStorage.getItem("activeSession");
    sessionList.innerHTML = "";

    const groupedSessions = groupSessionsByDate(sessions);

    Object.entries(groupedSessions).forEach(([groupName, groupSessions]) => {
        if (groupSessions.length === 0) return;

        const groupHeader = document.createElement("div");
        groupHeader.className = "session-group-header";
        groupHeader.textContent = groupName;
        sessionList.appendChild(groupHeader);

        groupSessions.forEach(session => {
            const li = document.createElement("li");
            li.className = session.id === activeSessionId ? "active" : "";
            
            // Session title and click area
            const titleSpan = document.createElement("span");
            titleSpan.className = "session-title";
            titleSpan.textContent = session.name;
            titleSpan.addEventListener("click", () => setActiveSession(session.id));
            
            // Options menu
            const optionsDiv = document.createElement("div");
            optionsDiv.className = "session-options";
            optionsDiv.innerHTML = `
                <button class="options-btn">⋮</button>
                <div class="options-menu">
                    <button class="rename-btn">Rename</button>
                    <button class="delete-btn">Delete</button>
                </div>
            `;

            li.appendChild(titleSpan);
            li.appendChild(optionsDiv);
            sessionList.appendChild(li);

            // Setup options menu event listeners
            const optionsBtn = optionsDiv.querySelector(".options-btn");
            const optionsMenu = optionsDiv.querySelector(".options-menu");
            
            optionsBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                
                // If there's a currently open menu and it's not this one, close it
                if (currentOpenMenu && currentOpenMenu !== optionsMenu) {
                    currentOpenMenu.classList.remove("show");
                }
                
                // Toggle this menu
                optionsMenu.classList.toggle("show");
                
                // Update the current open menu reference
                currentOpenMenu = optionsMenu.classList.contains("show") ? optionsMenu : null;
            });

            optionsDiv.querySelector(".rename-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                const newName = prompt("Enter new name:", session.name);
                if (newName) {
                    renameSession(session.id, newName);
                }
                optionsMenu.classList.remove("show");
                currentOpenMenu = null;
            });

            optionsDiv.querySelector(".delete-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                if (confirm("Are you sure you want to delete this chat?")) {
                    deleteSession(session.id);
                }
                optionsMenu.classList.remove("show");
                currentOpenMenu = null;
            });
        });
    });
}

// Chat Management
function renderChatWindow() {
    const chatWindow = document.getElementById("chat-window");
    chatWindow.innerHTML = "";
    const activeSession = getActiveSession();

    if (!activeSession || !activeSession.history) return;

    activeSession.history.forEach((message, index) => {
        appendMessage(message, false, index * 100);
    });
}

async function typeResponse(element, text) {
    element.textContent = '';
    const words = text.split(' ');
    
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const span = document.createElement('span');
        span.textContent = (i === words.length - 1) ? word : word + ' ';
        span.style.opacity = '0';
        element.appendChild(span);
        
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                span.style.transition = 'opacity 0.15s ease';
                span.style.opacity = '1';
                setTimeout(resolve, 20 + Math.random() * 30);
            });
        });
    }
}

// Update the typing indicator styles
const TYPING_HTML = `
    <div class="message-icon">${BOT_ICON}</div>
    <div class="message-content-wrapper">
        <div class="typing-animation">
            <span></span>
            <span></span>
            <span></span>
        </div>
    </div>
`;

// Update sendMessage function's typing indicator part
async function sendMessage() {
    // If AI is currently responding, don't allow sending
    if (isAIResponding) return;

    const inputField = document.getElementById("user-input");
    const message = inputField.value.trim();
    if (!message) return;

    // Set the responding flag
    isAIResponding = true;

    // Disable only the send button while processing
    const sendButton = document.getElementById("send-btn");
    sendButton.disabled = true;

    const activeSession = getActiveSession();
    if (!activeSession) return;

    // Add user message
    const userMessage = {
        sender: "user",
        text: message,
        timestamp: new Date().toISOString()
    };

    // Clear input field immediately
    inputField.value = "";

    // Add and display user message
    activeSession.history.push(userMessage);
    updateSession(activeSession);
    appendMessage(userMessage);

    // Show typing indicator
    const typingDiv = document.createElement("div");
    typingDiv.className = "chat-message ai typing-indicator";
    typingDiv.innerHTML = TYPING_HTML;
    document.getElementById("chat-window").appendChild(typingDiv);

    try {
        // Call API with timeout
        const aiResponse = await Promise.race([
            generateAIResponse(message),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), API_CONFIG.timeout)
            )
        ]);

        // Remove typing indicator
        typingDiv.remove();

        if (!aiResponse) {
            throw new Error('Empty response from API');
        }

        const aiMessage = {
            sender: "ai",
            text: aiResponse,
            timestamp: new Date().toISOString()
        };

        activeSession.history.push(aiMessage);
        updateSession(activeSession);
        await appendMessage(aiMessage, true);

        // Generate and update session title if it's the first message
        if (activeSession.history.length === 2) {
            const generatedTitle = await generateSessionTitle(message, aiResponse);
            if (generatedTitle) {
                activeSession.name = generatedTitle;
                updateSession(activeSession);
                renderSessionList();
            }
        }

    } catch (error) {
        console.error('Chat Error:', error);
        typingDiv.remove();

        let errorMessage = "Sorry, there was an error processing your request.";
        if (error.message === 'Request timeout') {
            errorMessage = "The request timed out. Please try again.";
        } else if (error.message === 'Empty response from API') {
            errorMessage = "Received empty response from server. Please try again.";
        }

        const errorResponse = {
            sender: "ai",
            text: errorMessage,
            timestamp: new Date().toISOString(),
            isError: true
        };

        appendErrorMessage(errorResponse);
    } finally {
        // Reset the responding flag and re-enable send button
        isAIResponding = false;
        sendButton.disabled = false;
        inputField.focus();
    }
}

// Add this new function to handle error messages with auto-removal
function appendErrorMessage(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "chat-message ai error";
    errorDiv.innerHTML = `
        <div class="message-icon">${BOT_ICON}</div>
        <div class="message-content-wrapper">
            <div class="message-content" id="massage-content">${message.text}</div>
        </div>
    `;
    
    document.getElementById("chat-window").appendChild(errorDiv);

    // Auto remove error message after 10 seconds
    setTimeout(() => {
        errorDiv.style.opacity = '0';
        setTimeout(() => {
            errorDiv.remove();
        }, 300);
    }, 10000);
}

function getActiveSession() {
    try {
        const sessionId = localStorage.getItem("activeSession");
        const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
        return sessions.find(session => session.id === sessionId) || null;
    } catch (error) {
        console.error('Error getting active session:', error);
        return null;
    }
}

function updateSession(updatedSession) {
    try {
        if (!updatedSession || !updatedSession.id) {
            throw new Error('Invalid session data');
        }
        const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
        const index = sessions.findIndex(session => session.id === updatedSession.id);
        if (index !== -1) {
            sessions[index] = updatedSession;
            localStorage.setItem("sessions", JSON.stringify(sessions));
        }
    } catch (error) {
        console.error('Error updating session:', error);
    }
}

// Update API call function
async function generateAIResponse(userMessage) {
    try {
        const response = await fetch(API_CONFIG.endpoint, {
            method: API_CONFIG.method,
            headers: API_CONFIG.headers,
            body: JSON.stringify({
                [API_CONFIG.requestFormat.query]: userMessage,
                [API_CONFIG.requestFormat.userId]: 'user_' + Date.now(),
                [API_CONFIG.requestFormat.domain]: window.location.hostname
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data[API_CONFIG.responseFormat.response];

    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Close options menus when clicking outside
document.addEventListener("click", (e) => {
    if (!e.target.closest(".session-options")) {
        // Close any open menu
        if (currentOpenMenu) {
            currentOpenMenu.classList.remove("show");
            currentOpenMenu = null;
        }
    }
});

// Update appendMessage function
function appendMessage(message, withTypingEffect = false) {
    const chatWindow = document.getElementById("chat-window");
    
    let messageGroup = chatWindow.lastElementChild;
    const needsNewGroup = !messageGroup?.classList.contains('message-group') || 
                         messageGroup.getAttribute('data-sender') !== message.sender;
    
    if (needsNewGroup) {
        messageGroup = document.createElement('div');
        messageGroup.className = 'message-group';
        messageGroup.setAttribute('data-sender', message.sender);
        chatWindow.appendChild(messageGroup);
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${message.sender}${message.isError ? ' error' : ''}`;
    
    const iconDiv = document.createElement("div");
    iconDiv.className = "message-icon";
    iconDiv.innerHTML = message.sender === 'user' ? USER_ICON : BOT_ICON;
    
    const contentWrapper = document.createElement("div");
    contentWrapper.className = "message-content-wrapper";
    
    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    
    if (!withTypingEffect) {
        // Parse markdown only for AI responses
        if (message.sender === 'ai') {
            contentDiv.innerHTML = marked.parse(message.text);
        } else {
            contentDiv.textContent = message.text;
        }
    }
    
    contentWrapper.appendChild(contentDiv);
    messageDiv.appendChild(iconDiv);
    messageDiv.appendChild(contentWrapper);
    messageGroup.appendChild(messageDiv);

    requestAnimationFrame(() => {
        messageDiv.style.opacity = "1";
        if (withTypingEffect) {
            if (message.sender === 'ai') {
                typeResponse(contentDiv, message.text).then(() => {
                    contentDiv.innerHTML = marked.parse(message.text);
                });
            } else {
                typeResponse(contentDiv, message.text);
            }
        }
    });
    
    setTimeout(() => {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 100);
}

(function() {
    // Create a script tag
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js'; // URL of the marked.js CDN
    script.async = true; // Load script asynchronously

    // Append the script tag to the head or body of the document
    document.head.appendChild(script);

    // Optional: Run a callback function once the script is loaded
    script.onload = function() {
        console.log('marked.js has been loaded successfully!');
    };

    // Optional: Handle script loading error
    script.onerror = function() {
        console.error('Failed to load marked.js');
    };
})();


document.addEventListener('DOMContentLoaded', () => {
    // Function to recursively process text nodes
    function processBoldText(node) {
        // Only process text nodes
        if (node.nodeType === Node.TEXT_NODE) {
            const boldPattern = /\*\*(.*?)\*\*/g;
            
            // Check if the text contains bold markdown
            if (boldPattern.test(node.textContent)) {
                // Create a temporary container to manipulate the text
                const tempContainer = document.createElement('span');
                tempContainer.innerHTML = node.textContent.replace(boldPattern, (match, content) => {
                    // Replace with bold tags
                    return `<b>${content}</b>`;
                });

                // Replace the original text node with the new content
                node.parentNode.replaceChild(tempContainer, node);
            }
        } 
        // Recursively process child nodes
        else if (node.childNodes && node.nodeName !== 'SCRIPT') {
            node.childNodes.forEach(processBoldText);
        }
    }

    // Start processing from the body
    processBoldText(document.body);
});
// Function to render Markdown in a specific element
function renderMarkdown(elementId) {
    const element = document.getElementById(elementId);
    
    // Render the Markdown content
    element.innerHTML = marked.parse(element.textContent);
}

// Render Markdown when the page loads
document.addEventListener('DOMContentLoaded', () => {
    renderMarkdown('message-content');
});




// Add these styles for better typing animation
const typingStyles = `
.typing-indicator {
    padding: 12px 16px;
    margin: 8px 0;
    max-width: 120px !important;
    background: #f0f2f5;
    border-radius: 18px;
    align-self: flex-start;
    position: relative;
    left: 0;
}

.typing-animation {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    justify-content: center;
}

.typing-animation span {
    display: inline-block;
    width: 6px;
    height: 6px;
    background: #0084ff;
    border-radius: 50%;
    animation: bounce 0.8s infinite ease-in-out;
}

.typing-animation span:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-animation span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
}
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.textContent = typingStyles;
document.head.appendChild(styleSheet);


