// Create ErrorRecoveryManager.js for the JavaScript side
class ErrorRecoveryManager {
    constructor() {
        this.pendingRetries = new Map();
        this.failedOperations = [];
        this.isRecovering = false;
    }
    
    async handleError(error, operation, context) {
        console.error('Operation failed:', error, context);
        
        if (this.shouldRetry(error)) {
            await this.scheduleRetry(operation, context);
        } else {
            this.failedOperations.push({
                operation,
                error,
                context,
                timestamp: new Date()
            });
            
            // Notify user if needed
            await this.notifyUser(error);
        }
    }
    
    shouldRetry(error) {
        const retryableErrors = [
            'timeout',
            'mail_not_running',
            'network_error',
            'temporary_failure'
        ];
        
        return retryableErrors.includes(error.code);
    }
    
    async scheduleRetry(operation, context) {
        const retryKey = `${operation.id}_${Date.now()}`;
        const retryCount = (this.pendingRetries.get(retryKey)?.count || 0) + 1;
        
        if (retryCount <= 3) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            
            this.pendingRetries.set(retryKey, {
                count: retryCount,
                operation,
                context,
                timeout: setTimeout(() => this.executeRetry(retryKey), delay)
            });
        } else {
            this.failedOperations.push({
                operation,
                error: new Error('Max retries exceeded'),
                context,
                timestamp: new Date()
            });
        }
    }
    
    async executeRetry(retryKey) {
        const retry = this.pendingRetries.get(retryKey);
        if (!retry) return;
        
        try {
            await retry.operation.execute(retry.context);
            this.pendingRetries.delete(retryKey);
        } catch (error) {
            await this.handleError(error, retry.operation, retry.context);
        }
    }
    
    async notifyUser(error) {
        const notification = {
            title: 'Email Assistant Error',
            body: this.getErrorMessage(error),
            data: { error }
        };
        
        await Notifications.scheduleNotificationAsync({
            content: notification,
            trigger: null
        });
    }
    
    getErrorMessage(error) {
        const errorMessages = {
            access_denied: 'Permission needed to access Mail.app',
            mail_not_running: 'Mail.app needs to be running',
            timeout: 'Operation timed out. Will retry automatically.',
            network_error: 'Network connection issues. Will retry when connected.'
        };
        
        return errorMessages[error.code] || 'An unexpected error occurred';
    }
    
    async recoverFailedOperations() {
        if (this.isRecovering) return;
        this.isRecovering = true;
        
        try {
            const operations = [...this.failedOperations];
            this.failedOperations = [];
            
            for (const op of operations) {
                try {
                    await op.operation.execute(op.context);
                } catch (error) {
                    await this.handleError(error, op.operation, op.context);
                }
            }
        } finally {
            this.isRecovering = false;
        }
    }
    
    cleanup() {
        for (const retry of this.pendingRetries.values()) {
            clearTimeout(retry.timeout);
        }
        this.pendingRetries.clear();
    }
}
