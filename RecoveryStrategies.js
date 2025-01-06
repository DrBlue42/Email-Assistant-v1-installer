// RecoveryStrategies.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

class RecoveryStrategies {
    constructor(emailService) {
        this.emailService = emailService;
        this.recoveryLog = [];
        this.recoveryState = {
            inProgress: false,
            lastRecoveryAttempt: null,
            failedAttempts: 0
        };
        
        // Recovery operation queue
        this.recoveryQueue = new Map();
        
        // Strategy definitions
        this.strategies = {
            mailConnection: {
                check: this.checkMailConnection.bind(this),
                recover: this.recoverMailConnection.bind(this),
                maxAttempts: 5,
                cooldownPeriod: 5 * 60 * 1000 // 5 minutes
            },
            networkConnectivity: {
                check: this.checkNetworkConnectivity.bind(this),
                recover: this.recoverNetworkConnectivity.bind(this),
                maxAttempts: 3,
                cooldownPeriod: 2 * 60 * 1000 // 2 minutes
            },
            dataIntegrity: {
                check: this.checkDataIntegrity.bind(this),
                recover: this.recoverDataIntegrity.bind(this),
                maxAttempts: 2,
                cooldownPeriod: 1 * 60 * 1000 // 1 minute
            },
            permissionIssues: {
                check: this.checkPermissions.bind(this),
                recover: this.recoverPermissions.bind(this),
                maxAttempts: 3,
                cooldownPeriod: 10 * 60 * 1000 // 10 minutes
            },
            stateConsistency: {
                check: this.checkStateConsistency.bind(this),
                recover: this.recoverStateConsistency.bind(this),
                maxAttempts: 2,
                cooldownPeriod: 30 * 1000 // 30 seconds
            }
        };
    }

    // Core recovery logic
    async initiateRecovery(errorType, context) {
        if (this.recoveryState.inProgress) {
            console.log('Recovery already in progress, queueing...');
            this.queueRecovery(errorType, context);
            return;
        }

        try {
            this.recoveryState.inProgress = true;
            this.recoveryState.lastRecoveryAttempt = Date.now();

            const strategy = this.strategies[errorType];
            if (!strategy) {
                throw new Error(`No recovery strategy found for ${errorType}`);
            }

            // Check if we're within cooldown period
            if (this.isInCooldown(errorType)) {
                console.log(`In cooldown period for ${errorType}`);
                return;
            }

            // Attempt recovery
            const needsRecovery = await strategy.check(context);
            if (needsRecovery) {
                await this.executeRecoveryStrategy(strategy, context);
            }

        } finally {
            this.recoveryState.inProgress = false;
            this.processRecoveryQueue();
        }
    }

    // Queue management
    queueRecovery(errorType, context) {
        const queueKey = `${errorType}_${Date.now()}`;
        this.recoveryQueue.set(queueKey, {
            errorType,
            context,
            timestamp: Date.now()
        });
    }

    async processRecoveryQueue() {
        for (const [key, recovery] of this.recoveryQueue.entries()) {
            this.recoveryQueue.delete(key);
            await this.initiateRecovery(recovery.errorType, recovery.context);
        }
    }

    // Strategy Implementations
    async checkMailConnection(context) {
        if (Platform.OS !== 'ios') return false;

        try {
            const script = `
                tell application "Mail"
                    return true
                end tell
            `;
            await this.emailService.executeAppleScript(script);
            return false; // Connection is good
        } catch (error) {
            return true; // Needs recovery
        }
    }

    async recoverMailConnection(context) {
        if (Platform.OS !== 'ios') return;

        try {
            // Attempt to relaunch Mail.app
            const script = `
                tell application "Mail"
                    quit
                    delay 2
                    activate
                end tell
            `;
            await this.emailService.executeAppleScript(script);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for Mail to launch
            
            // Verify recovery
            const checkScript = `
                tell application "Mail"
                    return true
                end tell
            `;
            await this.emailService.executeAppleScript(checkScript);
            
            // Restore email processing state
            await this.restoreProcessingState();
            
        } catch (error) {
            throw new Error('Failed to recover Mail connection: ' + error.message);
        }
    }

    async checkNetworkConnectivity() {
        const netInfo = await NetInfo.fetch();
        return !netInfo.isConnected;
    }

    async recoverNetworkConnectivity() {
        return new Promise((resolve, reject) => {
            const unsubscribe = NetInfo.addEventListener(state => {
                if (state.isConnected) {
                    unsubscribe();
                    resolve();
                }
            });

            // Set timeout for network recovery
            setTimeout(() => {
                unsubscribe();
                reject(new Error('Network recovery timeout'));
            }, 30000);
        });
    }

    async checkDataIntegrity() {
        try {
            const storedData = await AsyncStorage.multiGet([
                'email_assistant_config',
                'email_categories',
                'processing_queue'
            ]);

            for (const [key, value] of storedData) {
                if (!value) return true; // Data missing, needs recovery
                try {
                    JSON.parse(value);
                } catch {
                    return true; // Data corrupted, needs recovery
                }
            }

            return false; // Data is intact
        } catch {
            return true; // Storage error, needs recovery
        }
    }

    async recoverDataIntegrity() {
        try {
            // Backup corrupted data
            const timestamp = Date.now();
            const corruptedData = await AsyncStorage.multiGet([
                'email_assistant_config',
                'email_categories',
                'processing_queue'
            ]);
            
            await AsyncStorage.setItem(
                `backup_${timestamp}`,
                JSON.stringify(corruptedData)
            );

            // Reset to default state
            await this.emailService.clearData();
            await this.emailService.initialize();

            // Attempt to merge salvageable data
            for (const [key, value] of corruptedData) {
                try {
                    const data = JSON.parse(value);
                    await AsyncStorage.setItem(key, JSON.stringify(data));
                } catch {
                    console.log(`Could not recover data for ${key}`);
                }
            }
        } catch (error) {
            throw new Error('Failed to recover data integrity: ' + error.message);
        }
    }

    async checkPermissions() {
        if (Platform.OS !== 'ios') return false;

        try {
            const script = `
                tell application "System Events"
                    tell application "Mail"
                        get name
                    end tell
                end tell
            `;
            await this.emailService.executeAppleScript(script);
            return false;
        } catch {
            return true;
        }
    }

    async recoverPermissions() {
        if (Platform.OS !== 'ios') return;

        // Request permissions via system dialog
        const script = `
            tell application "System Preferences"
                activate
                set current pane to pane "com.apple.preference.security"
                reveal anchor "Privacy_Automation"
            end tell
        `;

        await this.emailService.executeAppleScript(script);
        
        // Wait for user action
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(async () => {
                try {
                    if (!await this.checkPermissions()) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                } catch (error) {
                    clearInterval(checkInterval);
                    reject(error);
                }
            }, 5000);

            // Timeout after 2 minutes
            setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error('Permission recovery timeout'));
            }, 120000);
        });
    }

    async checkStateConsistency() {
        try {
            const processingState = await AsyncStorage.getItem('processing_state');
            if (!processingState) return false;

            const state = JSON.parse(processingState);
            const now = Date.now();
            
            // Check for stuck operations
            return state.lastUpdate && (now - state.lastUpdate > 300000); // 5 minutes
        } catch {
            return true;
        }
    }

    async recoverStateConsistency() {
        try {
            // Get current processing state
            const processingState = await AsyncStorage.getItem('processing_state');
            const state = processingState ? JSON.parse(processingState) : {};

            // Reset stuck operations
            if (state.inProgress) {
                await this.emailService.resetProcessingState();
            }

            // Restore from last known good state
            const lastGoodState = await AsyncStorage.getItem('last_good_state');
            if (lastGoodState) {
                await AsyncStorage.setItem('processing_state', lastGoodState);
            }

            // Verify mail folders
            await this.verifyMailFolders();

        } catch (error) {
            throw new Error('Failed to recover state consistency: ' + error.message);
        }
    }

    // Utility methods
    isInCooldown(errorType) {
        const strategy = this.strategies[errorType];
        const lastAttempt = this.recoveryState.lastRecoveryAttempt;
        
        return lastAttempt && 
               (Date.now() - lastAttempt < strategy.cooldownPeriod);
    }

    async verifyMailFolders() {
        if (Platform.OS !== 'ios') return;

        const script = `
            tell application "Mail"
                -- Verify essential folders exist
                set requiredFolders to {"Commercial", "Personal", "Business"}
                repeat with folderName in requiredFolders
                    if not (exists mailbox folderName) then
                        make new mailbox with properties {name:folderName}
                    end if
                end repeat
            end tell
        `;

        await this.emailService.executeAppleScript(script);
    }

    async restoreProcessingState() {
        // Implement state restoration logic
        const processingQueue = await AsyncStorage.getItem('processing_queue');
        if (processingQueue) {
            const queue = JSON.parse(processingQueue);
            await this.emailService.addToProcessingQueue(queue);
        }
    }

    // Logging and monitoring
    logRecoveryAttempt(errorType, success, error = null) {
        this.recoveryLog.push({
            timestamp: Date.now(),
            errorType,
            success,
            error: error ? error.message : null
        });

        // Keep log size manageable
        if (this.recoveryLog.length > 100) {
            this.recoveryLog = this.recoveryLog.slice(-100);
        }
    }

    async getRecoveryStats() {
        return {
            totalAttempts: this.recoveryLog.length,
            successRate: this.calculateSuccessRate(),
            mostCommonIssues: this.getMostCommonIssues(),
            lastRecoveryAttempt: this.recoveryState.lastRecoveryAttempt
        };
    }

    calculateSuccessRate() {
        if (this.recoveryLog.length === 0) return 100;
        const successful = this.recoveryLog.filter(log => log.success).length;
        return (successful / this.recoveryLog.length) * 100;
    }

    getMostCommonIssues() {
        return Object.entries(
            this.recoveryLog.reduce((acc, log) => {
                acc[log.errorType] = (acc[log.errorType] || 0) + 1;
                return acc;
            }, {})
        )
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
    }
}

export { RecoveryStrategies };
