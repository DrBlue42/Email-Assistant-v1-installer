// First, the Swift code for the native bridge
// AppleScriptBridge.swift

import Foundation

@objc(AppleScriptBridge)
class AppleScriptBridge: NSObject {
    
    // Constants for retry logic
    private let maxRetries = 3
    private let retryDelay: TimeInterval = 2.0
    private let exponentialBackoff = true
    
    // Error types
    enum BridgeError: Error {
        case scriptExecutionFailed(String)
        case mailAppNotRunning
        case mailAccessDenied
        case scriptCompilationFailed
        case networkTimeout
        case unknownError
    }
    
    // Track failed operations for potential retry
    private var failedOperations: [(script: String, retryCount: Int)] = []
    
    @objc(execute:withResolver:withRejecter:)
    func execute(script: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        executeWithRetry(script: script, retryCount: 0, resolve: resolve, reject: reject)
    }
    
    private func executeWithRetry(script: String, retryCount: Int, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // Check if Mail.app is running
        guard isMailAppRunning() else {
            handleMailAppNotRunning(script: script, retryCount: retryCount, resolve: resolve, reject: reject)
            return
        }
        
        // Compile AppleScript
        var errorDict: NSDictionary?
        guard let appleScript = NSAppleScript(source: script) else {
            reject("compilation_failed", "Failed to compile AppleScript", BridgeError.scriptCompilationFailed)
            return
        }
        
        // Execute with timeout monitoring
        let timeout = DispatchTimeInterval.seconds(30)
        let timeoutQueue = DispatchQueue(label: "com.emailassistant.timeout")
        
        let timeoutWorkItem = DispatchWorkItem {
            reject("timeout", "Script execution timed out", BridgeError.networkTimeout)
        }
        
        timeoutQueue.asyncAfter(deadline: .now() + timeout, execute: timeoutWorkItem)
        
        // Execute script
        let result = appleScript.executeAndReturnError(&errorDict)
        timeoutWorkItem.cancel()
        
        if let error = errorDict {
            handleExecutionError(error: error, script: script, retryCount: retryCount, resolve: resolve, reject: reject)
        } else {
            // Success - serialize and return result
            do {
                let serializedResult = try serializeAppleEventDescriptor(result)
                resolve(serializedResult)
            } catch {
                reject("serialization_failed", "Failed to serialize result", error)
            }
        }
    }
    
    private func handleExecutionError(error: NSDictionary, script: String, retryCount: Int, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let errorNumber = error[NSAppleScript.errorNumber] as? Int ?? 0
        
        // Handle specific error cases
        switch errorNumber {
        case -1728: // Access denied
            handleAccessDenied(reject: reject)
        case -600: // Application not running
            handleMailAppNotRunning(script: script, retryCount: retryCount, resolve: resolve, reject: reject)
        default:
            if retryCount < maxRetries {
                retryOperation(script: script, retryCount: retryCount, resolve: resolve, reject: reject)
            } else {
                // Log failed operation for potential recovery
                failedOperations.append((script, retryCount))
                reject("execution_failed", "Script execution failed after \(maxRetries) retries", BridgeError.scriptExecutionFailed(error.description))
            }
        }
    }
    
    private func retryOperation(script: String, retryCount: Int, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let delay = exponentialBackoff ? 
            pow(Double(retryDelay), Double(retryCount + 1)) : 
            Double(retryDelay)
        
        DispatchQueue.global().asyncAfter(deadline: .now() + delay) {
            self.executeWithRetry(
                script: script,
                retryCount: retryCount + 1,
                resolve: resolve,
                reject: reject
            )
        }
    }
    
    private func handleMailAppNotRunning(script: String, retryCount: Int, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // Attempt to launch Mail.app
        let workspace = NSWorkspace.shared
        if workspace.launchApplication("Mail") {
            // Wait for app to initialize
            DispatchQueue.global().asyncAfter(deadline: .now() + 3.0) {
                self.executeWithRetry(
                    script: script,
                    retryCount: retryCount,
                    resolve: resolve,
                    reject: reject
                )
            }
        } else {
            reject("mail_not_running", "Failed to launch Mail.app", BridgeError.mailAppNotRunning)
        }
    }
    
    private func handleAccessDenied(reject: RCTPromiseRejectBlock) {
        // Request permissions via system dialog
        let alert = NSAlert()
        alert.messageText = "Mail Access Required"
        alert.informativeText = "Email Assistant needs permission to access Mail.app"
        alert.alertStyle = .warning
        alert.addButton(withTitle: "Open System Preferences")
        alert.addButton(withTitle: "Cancel")
        
        if alert.runModal() == .alertFirstButtonReturn {
            NSWorkspace.shared.open(URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Automation")!)
        }
        
        reject("access_denied", "Permission to access Mail.app is required", BridgeError.mailAccessDenied)
    }
    
    private func isMailAppRunning() -> Bool {
        let runningApps = NSWorkspace.shared.runningApplications
        return runningApps.contains { $0.bundleIdentifier == "com.apple.mail" }
    }
    
    private func serializeAppleEventDescriptor(_ descriptor: NSAppleEventDescriptor) throws -> Any {
        switch descriptor.descriptorType {
        case typeText:
            return descriptor.stringValue ?? ""
        case typeInteger:
            return descriptor.int32Value
        case typeBoolean:
            return descriptor.booleanValue
        case typeAEList:
            var array: [Any] = []
            for i in 1...descriptor.numberOfItems {
                if let item = descriptor.atIndex(i) {
                    array.append(try serializeAppleEventDescriptor(item))
                }
            }
            return array
        case typeAERecord:
            var dict: [String: Any] = [:]
            for i in 1...descriptor.numberOfItems {
                if let key = descriptor.keywordForDescriptor(at: i),
                   let item = descriptor.atIndex(i) {
                    dict[key] = try serializeAppleEventDescriptor(item)
                }
            }
            return dict
        default:
            return descriptor.stringValue ?? ""
        }
    }
    
    // Recovery system for failed operations
    @objc(retryFailedOperations:withRejecter:)
    func retryFailedOperations(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let operations = failedOperations
        failedOperations.removeAll()
        
        let group = DispatchGroup()
        var results: [Result<Any, Error>] = []
        
        for operation in operations {
            group.enter()
            executeWithRetry(script: operation.script, retryCount: 0) { result in
                results.append(.success(result))
                group.leave()
            } rejecter: { code, message, error in
                results.append(.failure(error ?? BridgeError.unknownError))
                group.leave()
            }
        }
        
        group.notify(queue: .main) {
            let successCount = results.filter { $0.isSuccess }.count
            resolve([
                "total": operations.count,
                "successful": successCount,
                "failed": operations.count - successCount
            ])
        }
    }
}


export { ErrorRecoveryManager };
Last edited 6 days ago


