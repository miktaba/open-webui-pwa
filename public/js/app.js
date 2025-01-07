class OpenWebUI {
    constructor() {
            this.api = new OpenWebUIApi();
        this.initializeApp();
        this.initKeyboardHandlers();
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

        this.apiKeyForm.style.display = 'block';
        this.chatInterface.style.display = 'none';
    }

    async initializeChat() {
        try {
            // Скрываем форму API ключа и показываем чат
            this.apiKeyForm.style.display = 'none';
            this.chatInterface.style.display = 'block';

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
            this.apiKeyForm.style.display = 'block';
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
        
        // Добавляем в начало контейнера (для отображения снизу вверх)
        messagesContainer.insertBefore(messageElement, messagesContainer.firstChild);
        
        // Скролл к новому сообщению (теперь вверх)
        this.scrollToTop(true);
    }

    showError(message) {
        alert(message); // Можно заменить на более красивое уведомление
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