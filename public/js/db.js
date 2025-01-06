class ChatDatabase {
    constructor() {
        this.dbName = 'openWebUIDB';
        this.dbVersion = 3;
        this.storeName = 'chatHistory';
        this.initPromise = this.init();
    }

    async init() {
        try {
            return await new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        const store = db.createObjectStore(this.storeName, {
                            keyPath: 'id',
                            autoIncrement: true
                        });
                        store.createIndex('timestamp', 'timestamp');
                        store.createIndex('conversationId', 'conversationId');
                    }
                };
            });
        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    }

    async addMessage(message) {
        const db = await this.initPromise;
        return await new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add({
                ...message,
                timestamp: Date.now()
            });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getMessages(conversationId) {
        const db = await this.initPromise;
        return await new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
} 