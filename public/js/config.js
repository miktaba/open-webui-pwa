// Initialize configuration after environment variables are loaded
window.initConfig = function() {
    window.CONFIG = {
        api: {
            version: 'v1',
            timeout: 30000,
            chat: {
                temperature: 0.7,
                max_tokens: 2048
            }
        },
        endpoints: {
            chat: '/api/chat/completions',
            models: '/api/models'
        },
        app: {
            name: 'Open WebUI',
            version: '1.0.0',
            isDev: false
        }
    };
};

if (window.__ENV__) {
    window.initConfig();
}