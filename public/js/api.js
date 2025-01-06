class OpenWebUIApi {
    constructor() {
        this.baseUrl = window.__ENV__.OPENWEBUI_URL || 'http://localhost:3000';
        this.model = null; // Добавим хранение текущей модели
    }

    // Базовый метод для запросов
    async fetchApi(endpoint, options = {}) {
        const apiKey = localStorage.getItem('openwebui_api_key');
        console.log('Using API key:', apiKey);
        
        if (!apiKey) {
            throw new Error('API key not found');
        }

        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...defaultOptions,
                ...options
            });

            if (!response.ok) {
                console.error('API error:', response.status, response.statusText);
                const text = await response.text();
                console.error('Error response:', text);
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Получение списка моделей
    async getModels() {
        try {
            const response = await this.fetchApi('/api/models');
            console.log('Available models:', response);
            
            // Сохраняем первую доступную модель как текущую
            if (response && response.length > 0) {
                this.model = response[0].id || response[0].name;
                console.log('Using model:', this.model);
            }
            
            return response;
        } catch (error) {
            console.error('Get models error:', error);
            throw error;
        }
    }

    // Отправка сообщения
    async sendMessage(message) {
        try {
            // Если модель не выбрана, получаем список моделей
            if (!this.model) {
                await this.getModels();
            }

            console.log('Sending message:', message);
            console.log('Using model:', this.model);
            
            const response = await this.fetchApi('/api/chat/completions', {
                method: 'POST',
                body: JSON.stringify({
                    messages: [{
                        role: 'user',
                        content: message
                    }],
                    model: this.model, // Используем выбранную модель
                    stream: false
                })
            });
            
            console.log('API Response:', response);
            return response;
        } catch (error) {
            console.error('Send message error:', error);
            throw error;
        }
    }

    // Проверка API ключа
    async checkApiKey(apiKey) {
        try {
            console.log('Checking API key:', apiKey);
            console.log('Base URL:', this.baseUrl);
            
            const response = await fetch(`${this.baseUrl}/api/models`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error('API check failed:', response.status, response.statusText);
                const text = await response.text();
                console.error('Response:', text);
            }
            
            return response.ok;
        } catch (error) {
            console.error('API key check failed:', error);
            return false;
        }
    }
} 