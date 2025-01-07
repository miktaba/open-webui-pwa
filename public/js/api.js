class OpenWebUIApi {
    constructor() {
        this.baseUrl = CONFIG.API.BASE_URL;
        this.model = CONFIG.UI.DEFAULT_MODEL;
        this.apiKey = null;
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem(CONFIG.STORAGE.API_KEY, key);
    }

    clearApiKey() {
        this.apiKey = null;
        localStorage.removeItem(CONFIG.STORAGE.API_KEY);
    }

    getApiKey() {
        if (!this.apiKey) {
            this.apiKey = localStorage.getItem(CONFIG.STORAGE.API_KEY);
        }
        return this.apiKey;
    }

    async fetchApi(endpoint, options = {}) {
        const apiKey = this.getApiKey();
        
        if (!apiKey) {
            throw new Error('API key not found');
        }

        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                ...CONFIG.API.HEADERS.JSON
            }
        };

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...defaultOptions,
                ...options
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async getModels() {
        return this.fetchApi(CONFIG.API.ENDPOINTS.MODELS);
    }

    async sendMessage(message) {
        if (!this.model) {
            throw new Error('Model not selected');
        }

        return this.fetchApi(CONFIG.API.ENDPOINTS.CHAT, {
            method: 'POST',
            body: JSON.stringify({
                messages: [{
                    role: 'user',
                    content: message
                }],
                model: this.model,
                stream: false
            })
        });
    }

    async checkApiKey(apiKey) {
        try {
            const response = await fetch(`${this.baseUrl}${CONFIG.API.ENDPOINTS.MODELS}`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    ...CONFIG.API.HEADERS.JSON
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
} 