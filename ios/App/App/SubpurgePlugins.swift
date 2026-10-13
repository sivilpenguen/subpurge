import UIKit
import Capacitor
import StoreKit

/// Registers the app's own native plugins with the bridge.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(SubpurgeStorePlugin())
    }
}

// MARK: - In-app purchase (StoreKit 2, one-time SubPurge Pro)

/// JS: SubpurgeStore.getProduct / purchase / restore / isOwned, each with { id }.
/// Same shape as Meltix's store plugin; no third-party service involved.
@objc(SubpurgeStorePlugin)
public class SubpurgeStorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SubpurgeStorePlugin"
    public let jsName = "SubpurgeStore"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProduct", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isOwned", returnType: CAPPluginReturnPromise)
    ]

    private var updatesTask: Task<Void, Never>?

    override public func load() {
        // Transactions completed outside the app: Family Sharing, Ask to Buy, refunds.
        updatesTask = Task.detached { [weak self] in
            for await result in Transaction.updates {
                guard case .verified(let transaction) = result else { continue }
                await transaction.finish()
                let owned = await SubpurgeStorePlugin.owns(transaction.productID)
                self?.notifyListeners("entitlementChanged", data: ["id": transaction.productID, "owned": owned])
            }
        }
    }

    deinit { updatesTask?.cancel() }

    static func owns(_ productID: String) async -> Bool {
        for await result in Transaction.currentEntitlements {
            if case .verified(let t) = result, t.productID == productID, t.revocationDate == nil {
                return true
            }
        }
        return false
    }

    @objc func getProduct(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { call.reject("Missing id"); return }
        Task {
            do {
                guard let p = try await Product.products(for: [id]).first else {
                    call.reject("Product not found")
                    return
                }
                call.resolve(["id": p.id, "price": p.displayPrice, "title": p.displayName])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { call.reject("Missing id"); return }
        Task {
            do {
                guard let p = try await Product.products(for: [id]).first else {
                    call.resolve(["state": "unavailable"])
                    return
                }
                let result = try await p.purchase()
                switch result {
                case .success(let verification):
                    if case .verified(let t) = verification {
                        await t.finish()
                        call.resolve(["state": "purchased"])
                    } else {
                        call.resolve(["state": "failed", "error": "unverified"])
                    }
                case .userCancelled:
                    call.resolve(["state": "cancelled"])
                case .pending:
                    call.resolve(["state": "pending"])
                @unknown default:
                    call.resolve(["state": "failed"])
                }
            } catch {
                call.resolve(["state": "failed", "error": error.localizedDescription])
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { call.reject("Missing id"); return }
        Task {
            try? await AppStore.sync()
            call.resolve(["owned": await SubpurgeStorePlugin.owns(id)])
        }
    }

    @objc func isOwned(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { call.reject("Missing id"); return }
        Task {
            call.resolve(["owned": await SubpurgeStorePlugin.owns(id)])
        }
    }
}
