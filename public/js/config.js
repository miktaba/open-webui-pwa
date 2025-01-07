const CONFIG = {
    API: {
        BASE_URL: window.__ENV__.OPENWEBUI_URL || 'http://localhost:3000',
        ENDPOINTS: {
            MODELS: '/api/models',
            CHAT: '/api/chat/completions'
        },
        HEADERS: {
            JSON: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }
    },
    STORAGE: {
        API_KEY: 'openwebui_api_key'
    },
    UI: {
        SCROLL_THRESHOLD: 100,
        MAX_INPUT_HEIGHT: 120,
        DEFAULT_MODEL: 'llama3.2:latest'
    }
};