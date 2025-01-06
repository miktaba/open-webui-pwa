class OpenWebUI {
    constructor() {
        this.api = new OpenWebUIApi();
        this.initializeApp();
    }

    async initializeApp() {
        // Получаем элементы интерфейса
        this.apiKeyForm = document.querySelector('.api-key-form');
        this.chatInterface = document.querySelector('.chat-interface');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-message');
        this.modelSelect = document.getElementById('model-select');
        
        // Проверяем наличие API ключа
        const apiKey = localStorage.getItem('openwebui_api_key');
        if (!apiKey) {
            this.showApiKeyForm();
        } else {
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
                console.log('Trying API key:', apiKey);
                const isValid = await this.api.checkApiKey(apiKey);
                console.log('API key valid:', isValid);
                
                if (isValid) {
                    localStorage.setItem('openwebui_api_key', apiKey);
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

            // Обработчик выбора модели
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
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showError(message) {
        alert(message); // Можно заменить на более красивое уведомление
    }
}

// Инициализация приложения
window.addEventListener('load', () => {
    new OpenWebUI();
}); 