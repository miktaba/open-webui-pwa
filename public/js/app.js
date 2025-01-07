class OpenWebUI {
    constructor() {
            this.api = new OpenWebUIApi();
        this.messages = [];
        this.initializeApp();
        this.initKeyboardHandlers();
        this.initScrollHandlers();
    }

    getMessagesStorageKey() {
        const apiKey = this.api.getApiKey();
        return apiKey ? `${CONFIG.STORAGE.MESSAGES}_${apiKey}` : null;
    }

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
                messageElement.classList.add('message', msg.role);
                messageElement.textContent = msg.content;
                messagesContainer.insertBefore(messageElement, messagesContainer.firstChild);
            });
        }
    }

    saveMessages() {
        const storageKey = this.getMessagesStorageKey();
        if (!storageKey) return;
        
        localStorage.setItem(storageKey, JSON.stringify(this.messages));
    }

    initKeyboardHandlers() {
        // Обработка появления клавиатуры
        window.visualViewport.addEventListener('resize', () => {
            const viewport = window.visualViewport;
            document.documentElement.style.height = `${viewport.height}px`;
            
            // Прокручиваем к нижней части при появлении клавиатуры
            if (this.messageInput === document.activeElement) {
                this.scrollToBottom();
            }
        });

        // Обработка скролла при вводе
        this.messageInput.addEventListener('input', () => {
            this.scrollToBottom();
            
            // Автоматическая высота textarea
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = 
                Math.min(this.messageInput.scrollHeight, CONFIG.UI.MAX_INPUT_HEIGHT) + 'px';
        });
    }

    scrollToBottom(smooth = true) {
        requestAnimationFrame(() => {
        const container = document.querySelector('.messages-container');
            container.scrollTo({
                top: container.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto'
            });
        });
    }

    scrollToTop(smooth = true) {
        requestAnimationFrame(() => {
            const container = document.querySelector('.messages-container');
            container.scrollTo({
                top: 0,
                behavior: smooth ? 'smooth' : 'auto'
            });
        });
    }

    async initializeApp() {
        // Получаем элементы интерфейса
        this.apiKeyContainer = document.querySelector('.api-key-container');
        this.apiKeyForm = document.querySelector('.api-key-form');
        this.chatInterface = document.querySelector('.chat-interface');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-message');
        this.modelSelect = document.getElementById('model-select');
        
        // Проверяем наличие API ключа
        const apiKey = localStorage.getItem(CONFIG.STORAGE.API_KEY);
        if (!apiKey) {
            this.showApiKeyForm();
        } else {
            this.api.setApiKey(apiKey);
            await this.initializeChat();
        }
    }

    showApiKeyForm() {
        const input = document.getElementById('api-key-input');
        const button = document.getElementById('save-api-key');

        // Clear input field
        input.value = '';

        button.addEventListener('click', async () => {
            const apiKey = input.value.trim();
            if (!apiKey) {
                this.showError('Please enter API key');
                return;
            }

            try {
                const isValid = await this.api.checkApiKey(apiKey);
                
                if (isValid) {
                    this.api.setApiKey(apiKey);
                    await this.initializeChat();
                } else {
                    this.showError('Invalid API key');
                }
            } catch (error) {
                console.error('Error checking API key:', error);
                this.showError('Error checking API key');
            }
        });

        this.apiKeyContainer.style.display = 'flex';
        this.chatInterface.style.display = 'none';
    }

    async initializeChat() {
        try {
            // Скрываем форму API ключа и показываем чат
            this.apiKeyContainer.style.display = 'none';
            this.chatInterface.style.display = 'block';

            // Load messages for this API key
            this.loadMessages();

            // Инициализируем кнопку сброса
            const resetButton = document.getElementById('reset-chat');
            resetButton.addEventListener('click', () => this.resetChat());

            // Logout functionality
            const logoutButton = document.getElementById('logout');
            logoutButton.addEventListener('click', () => {
                // Clear chat history from UI
                this.clearMessages(false); // Don't remove from storage
                
                // Clear API key
                this.api.clearApiKey();
                
                // Show API key form and hide chat interface
                document.querySelector('.api-key-container').style.display = 'flex';
                document.querySelector('.chat-interface').style.display = 'none';
                
                // Show success message
                this.showAlert('Logged out successfully', 'success');
            });

            // Получаем список моделей и ждем результат
            const response = await this.api.getModels();
            console.log('API Response:', response);

            // Проверяем формат ответа
            const models = response.data || response.models || response;
            console.log('Models data:', models);

            if (!models || !Array.isArray(models) || models.length === 0) {
                throw new Error('No models available');
            }

            // Заполняем select моделями
            this.modelSelect.innerHTML = '';
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id || model.name || model;
                option.textContent = model.name || model;
                this.modelSelect.appendChild(option);
            });

            // Выбираем первую модель
            this.api.model = models[0].id || models[0].name || models[0];
            this.modelSelect.value = this.api.model;
            console.log('Selected model:', this.api.model);

            // Добавляем обработчик изменения модели
            this.modelSelect.addEventListener('change', () => {
                this.api.model = this.modelSelect.value;
                console.log('Model changed to:', this.api.model);
            });

            // Настраиваем обработчики событий
            this.sendButton.addEventListener('click', () => this.sendMessage());
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Автоскролл при новых сообщениях
            const messagesContainer = document.querySelector('.messages-container');
            const observer = new MutationObserver(() => {
                this.scrollToBottom();
            });
            observer.observe(messagesContainer, { childList: true });

        } catch (error) {
            console.error('Chat initialization error:', error);
            this.showError('Failed to initialize chat: ' + error.message);
            
            // Возвращаемся к форме API ключа при ошибке
            this.apiKeyContainer.style.display = 'flex';
            this.chatInterface.style.display = 'none';
            localStorage.removeItem('openwebui_api_key');
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        try {
            // Добавляем сообщение пользователя
            this.addMessage(message, 'user');
            this.messageInput.value = '';

            // Отправляем запрос
            const response = await this.api.sendMessage(message);
            
            // Добавляем ответ от API
            if (response && response.choices && response.choices[0]) {
                this.addMessage(response.choices[0].message.content, 'assistant');
            }

        } catch (error) {
            console.error('Send message error:', error);
            this.showError('Failed to send message');
        }
    }

    addMessage(content, role) {
        const messagesContainer = document.querySelector('.messages-container');
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', role);
        messageElement.textContent = content;
        
        // Add to UI
        messagesContainer.insertBefore(messageElement, messagesContainer.firstChild);
        
        // Add to messages array and save
        this.messages.push({ content, role });
        this.saveMessages();
        
        // Scroll to new message
        this.scrollToTop(true);
    }

    showError(message) {
        alert(message); // Можно заменить на более красивое уведомление
    }

    showAlert(message, type = 'default') {
        const alertContainer = document.getElementById('alert-container');
        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        alert.textContent = message;
        alertContainer.appendChild(alert);

        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => alertContainer.removeChild(alert), 300);
        }, 3000);
    }

    resetChat() {
        this.clearMessages();
        this.showAlert('Chat has been reset', 'success');
    }

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

    initScrollHandlers() {
        console.log('Initializing scroll handlers...'); // Лог 1

        if (!this.messageInput || !document.querySelector('.messages-container')) {
            console.log('Elements not ready, retrying...'); // Лог 2
            setTimeout(() => this.initScrollHandlers(), 100);
            return;
        }

        const container = document.querySelector('.messages-container');
        const scrollButton = document.getElementById('scroll-bottom');

        console.log('Elements found:', { // Лог 3
            container: !!container,
            scrollButton: !!scrollButton,
            messageInput: !!this.messageInput
        });

        // Показываем/скрываем кнопку при скролле
        container.addEventListener('scroll', () => {
            const scrollHeight = container.scrollHeight;
            const scrollTop = container.scrollTop;
            const clientHeight = container.clientHeight;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            
            console.log('Scroll info:', { // Лог 4
                scrollHeight,
                scrollTop,
                clientHeight,
                isNearBottom
            });
            
            scrollButton.classList.toggle('visible', !isNearBottom);
        });

        // Плавный скролл по клику
        scrollButton.addEventListener('click', () => {
            console.log('Scroll button clicked'); // Лог 5
            this.scrollToBottom(true);
        });

        // Быстрый скролл при клавиатуре
        this.messageInput.addEventListener('focus', () => {
            this.scrollToBottom(false);
        });
    }
}

// Инициализация приложения
window.addEventListener('load', () => {
            new OpenWebUI();
}); 