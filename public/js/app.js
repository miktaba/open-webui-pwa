class OpenWebUI {
    /**
     * Constructor for the OpenWebUI class.
     * Initializes the API client, messages array, and sets up event listeners.
     */
    constructor() {
        this.api = new OpenWebUIApi();
        this.messages = [];
        this.initializeApp();
        this.initKeyboardHandlers();
        this.initScrollHandlers();
    }

    /**
     * Returns the storage key for messages based on the API key.
     * @returns {string|null} The storage key or null if no API key is set.
     */
    getMessagesStorageKey() {
        const apiKey = this.api.getApiKey();
        return apiKey ? `${CONFIG.STORAGE.MESSAGES}_${apiKey}` : null;
    }

    /**
     * Loads messages from local storage and updates the UI.
     */
    loadMessages() {
        const storageKey = this.getMessagesStorageKey();
        if (!storageKey) return;

        const savedMessages = localStorage.getItem(storageKey);
        if (savedMessages) {
            this.messages = JSON.parse(savedMessages);
            // Restore messages to UI
            const messagesContainer = document.querySelector('.messages-container');
            messagesContainer.innerHTML = '';
            this.messages.forEach(msg => {
                const messageElement = document.createElement('div');
                messageElement.classList.add('message', msg.isUser ? 'user-message' : 'assistant-message');
                messageElement.textContent = msg.text;
                messagesContainer.insertBefore(messageElement, messagesContainer.firstChild);
            });
        }
    }

    /**
     * Saves messages to local storage.
     */
    saveMessages() {
        const storageKey = this.getMessagesStorageKey();
        if (!storageKey) return;
        
        localStorage.setItem(storageKey, JSON.stringify(this.messages));
    }

    /**
     * Initializes keyboard event handlers.
     */
    initKeyboardHandlers() {
        if (!window.visualViewport) {
            console.log('Visual Viewport API not supported');
            return;
        }

        const chatInterface = document.querySelector('.chat-interface');
        const header = document.querySelector('.chat-header');
        const messagesContainer = document.querySelector('.messages-container');
        const inputContainer = document.querySelector('.input-container');
        
        let keyboardHeight = 0;
        let lastHeight = window.visualViewport.height;

        // Handle viewport resize event (keyboard appearance/disappearance)
        window.visualViewport.addEventListener('resize', () => {
            const newKeyboardHeight = Math.max(0, window.innerHeight - window.visualViewport.height);
            
            // If height changes significantly (keyboard appears/disappears)
            if (Math.abs(newKeyboardHeight - keyboardHeight) > 150) {
                keyboardHeight = newKeyboardHeight;
                
                // Update interface height
                chatInterface.style.height = `${window.visualViewport.height}px`;
                
                // Update padding for messages container
                const inputHeight = inputContainer.offsetHeight;
                messagesContainer.style.paddingBottom = `${inputHeight + 16}px`;
                
                // Scroll to active element
                if (keyboardHeight > 0) {
                    requestAnimationFrame(() => {
                        const activeElement = document.activeElement;
                        if (activeElement && activeElement.tagName === 'TEXTAREA') {
                            activeElement.scrollIntoView({ block: 'end' });
                        }
                    });
                }
            }
            
            lastHeight = window.visualViewport.height;
        });

        // Handle focus on input field
        this.messageInput.addEventListener('focus', () => {
            setTimeout(() => {
                this.messageInput.scrollIntoView({ block: 'end' });
            }, 100);
        });

        // Prevent body scroll when keyboard is open
        document.body.addEventListener('touchmove', (e) => {
            if (document.activeElement.tagName === 'TEXTAREA') {
                e.preventDefault();
            }
        }, { passive: false });

        // Auto-height for textarea
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = `${Math.min(this.messageInput.scrollHeight, 120)}px`;
        });
    }

    /**
     * Scrolls to the bottom of the messages container.
     * @param {boolean} smooth Whether to scroll smoothly or not.
     */
    scrollToBottom(smooth = true) {
        requestAnimationFrame(() => {
            const container = document.querySelector('.messages-container');
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            
            container.scrollTo({
                top: Math.max(0, scrollHeight - clientHeight),
                behavior: smooth ? 'smooth' : 'auto'
            });
        });
    }

    /**
     * Scrolls to the top of the messages container.
     * @param {boolean} smooth Whether to scroll smoothly or not.
     */
    scrollToTop(smooth = true) {
        requestAnimationFrame(() => {
            const container = document.querySelector('.messages-container');
            container.scrollTo({
                top: 0,
                behavior: smooth ? 'smooth' : 'auto'
            });
        });
    }

    /**
     * Initializes the application.
     */
    async initializeApp() {
        // Get interface elements
        this.apiKeyContainer = document.querySelector('.api-key-container');
        this.apiKeyForm = document.querySelector('.api-key-form');
        this.chatInterface = document.querySelector('.chat-interface');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-message');
        this.modelSelect = document.getElementById('model-select');
        
        // Initialize adaptive height for textarea
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = (this.messageInput.scrollHeight) + 'px';
        });
        
        // Check for API key
        const apiKey = localStorage.getItem(CONFIG.STORAGE.API_KEY);
        if (!apiKey) {
            this.showApiKeyForm();
        } else {
            this.api.setApiKey(apiKey);
            await this.initializeChat();
        }
    }

    /**
     * Shows the API key form.
     */
    showApiKeyForm() {
        const apiKeyContainer = document.querySelector('.api-key-container');
        const apiKeyInput = document.getElementById('api-key-input');
        const saveButton = document.getElementById('save-api-key');
        const clearButton = document.getElementById('clear-api-key');
        
        apiKeyContainer.style.display = 'flex';
        
        // Clear input field
        clearButton.addEventListener('click', () => {
            apiKeyInput.value = '';
            apiKeyInput.focus();
        });

        // Show/hide clear button based on input content
        apiKeyInput.addEventListener('input', () => {
            clearButton.style.display = apiKeyInput.value ? 'flex' : 'none';
        });

        // Initialize clear button visibility
        clearButton.style.display = 'none';

        // Handle API key save
        saveButton.addEventListener('click', async () => {
            const apiKey = apiKeyInput.value.trim();
            if (!apiKey) {
                this.showError('Please enter API key');
                return;
            }

            try {
                await this.api.setApiKey(apiKey);
                apiKeyContainer.style.display = 'none';
                this.initializeChat();
            } catch (error) {
                console.error('Set API key error:', error);
                this.showError('Failed to set API key');
            }
        });
    }

    /**
     * Initializes the chat interface.
     */
    async initializeChat() {
        try {
            // Hide API key form and show chat
            this.apiKeyContainer.style.display = 'none';
            this.chatInterface.style.display = 'block';
            
            // Load messages for this API key
            this.loadMessages();

            // Initialize reset button
            const resetButton = document.getElementById('reset-chat');
            resetButton.addEventListener('click', () => this.resetChat());

            // Initialize logout functionality
            const logoutButton = document.getElementById('logout');
            logoutButton.addEventListener('click', () => {
                // Clear chat history from UI
                this.clearMessages(false); // Don't remove from storage
                
                // Clear API key
                this.api.clearApiKey();
                
                // Show API key form and hide chat interface
                document.querySelector('.api-key-container').style.display = 'flex';
                document.querySelector('.chat-interface').style.display = 'none';
                
                // Clear API key input
                document.getElementById('api-key-input').value = '';
            });

            // Get available models and wait for result
            const response = await this.api.getModels();
            console.log('API Response:', response);

            // Check response format
            const models = response.data || response.models || response;
            console.log('Models data:', models);

            if (!models || !Array.isArray(models) || models.length === 0) {
                throw new Error('No models available');
            }

            // Populate model select
            this.modelSelect.innerHTML = '';
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id || model.name || model;
                option.textContent = model.name || model;
                this.modelSelect.appendChild(option);
            });

            // Select first model
            this.api.model = models[0].id || models[0].name || models[0];
            this.modelSelect.value = this.api.model;
            console.log('Selected model:', this.api.model);

            // Add model change event listener
            this.modelSelect.addEventListener('change', () => {
                this.api.model = this.modelSelect.value;
                console.log('Model changed to:', this.api.model);
            });

            // Initialize send button and message input event listeners
            this.sendButton.addEventListener('click', () => this.sendMessage());
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Auto-scroll to bottom on new messages
            const messagesContainer = document.querySelector('.messages-container');
            const observer = new MutationObserver(() => {
                this.scrollToBottom();
            });
            observer.observe(messagesContainer, { childList: true });

        } catch (error) {
            console.error('Chat initialization error:', error);
            this.showError('Failed to initialize chat: ' + error.message);
            
            // Return to API key form on error
            this.apiKeyContainer.style.display = 'flex';
            this.chatInterface.style.display = 'none';
            localStorage.removeItem('openwebui_api_key');
        }
    }

    /**
     * Sends a message to the API.
     */
    async sendMessage() {
        const messageText = this.messageInput.value.trim();
        if (!messageText) return;

        // Clear input field
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';

        try {
            // Add user message to UI
            this.addMessage(messageText, true);

            // Send message to API
            const response = await this.api.sendMessage(messageText);

            // Add response to UI
            if (response && response.choices && response.choices[0]) {
                this.addMessage(response.choices[0].message.content, false);
            }

        } catch (error) {
            console.error('Send message error:', error);
            this.showError('Failed to send message');
        }
    }

    /**
     * Adds a message to the UI and local storage.
     * @param {string} text The message text.
     * @param {boolean} isUser Whether the message is from the user or not.
     */
    addMessage(text, isUser) {
        // Add to messages array
        this.messages.push({ text, isUser });
        this.saveMessages();

        // Add to UI
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', isUser ? 'user-message' : 'assistant-message');
        messageDiv.textContent = text;
        
        const messagesContainer = document.querySelector('.messages-container');
        messagesContainer.insertBefore(messageDiv, messagesContainer.firstChild);
        
        // Scroll to bottom
        this.scrollToBottom();
    }

    /**
     * Shows an error message.
     * @param {string} message The error message.
     */
    showError(message) {
        alert(message); // Can be replaced with a more beautiful notification
    }

    /**
     * Shows an alert message.
     * @param {string} message The alert message.
     * @param {string} type The alert type (default, success, error).
     */
    showAlert(message, type = 'default') {
        const alertContainer = document.getElementById('alert-container');
        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        alert.textContent = message;
        alertContainer.appendChild(alert);

        // Remove alert after 3 seconds
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => alertContainer.removeChild(alert), 300);
        }, 3000);
    }

    /**
     * Resets the chat.
     */
    resetChat() {
        this.clearMessages();
        this.showAlert('Chat has been reset', 'success');
    }

    /**
     * Clears messages from UI and local storage.
     * @param {boolean} removeFromStorage Whether to remove from storage or not.
     */
    clearMessages(removeFromStorage = true) {
        const messagesContainer = document.querySelector('.messages-container');
        messagesContainer.innerHTML = '';
        this.messages = [];
        
        if (removeFromStorage) {
            const storageKey = this.getMessagesStorageKey();
            if (storageKey) {
                localStorage.removeItem(storageKey);
            }
        }
    }

    /**
     * Initializes scroll event handlers.
     */
    initScrollHandlers() {
        console.log('Initializing scroll handlers...'); // Log 1

        if (!this.messageInput || !document.querySelector('.messages-container')) {
            console.log('Elements not ready, retrying...'); // Log 2
            setTimeout(() => this.initScrollHandlers(), 100);
            return;
        }

        const container = document.querySelector('.messages-container');
        const scrollButton = document.getElementById('scroll-bottom');

        console.log('Elements found:', { // Log 3
            container: !!container,
            scrollButton: !!scrollButton,
            messageInput: !!this.messageInput
        });

        // Show/hide scroll button on scroll
        container.addEventListener('scroll', () => {
            const scrollHeight = container.scrollHeight;
            const scrollTop = container.scrollTop;
            const clientHeight = container.clientHeight;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            
            console.log('Scroll info:', { // Log 4
                scrollHeight,
                scrollTop,
                clientHeight,
                isNearBottom
            });
            
            scrollButton.classList.toggle('visible', !isNearBottom);
        });

        // Handle scroll button click
        scrollButton.addEventListener('click', () => {
            console.log('Scroll button clicked'); // Log 5
            this.scrollToBottom(true);
        });

        // Scroll to bottom on keyboard focus
        this.messageInput.addEventListener('focus', () => {
            this.scrollToBottom(false);
        });
    }
}

// Initialize the application
window.addEventListener('load', () => {
    new OpenWebUI();
});