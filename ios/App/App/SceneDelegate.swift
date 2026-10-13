import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = MainViewController()
        window?.makeKeyAndVisible()
        showRakuSplash()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    /// RAKU açılış ekranı — Sadrazam ve Meltix ile aynı: beyaz zemin, logo ekran
    /// genişliğinin %60'ı, 2 sn görünür, 0,3 sn'de solar. Arkasında web
    /// katmanındaki 3 saniyelik SubPurge splash'i başlar.
    private func showRakuSplash() {
        guard let window = window else { return }

        let splash = UIView(frame: window.bounds)
        splash.backgroundColor = .white
        splash.autoresizingMask = [.flexibleWidth, .flexibleHeight]

        let logo = UIImageView(image: UIImage(named: "RakuLogo"))
        logo.contentMode = .scaleAspectFit
        logo.translatesAutoresizingMaskIntoConstraints = false
        splash.addSubview(logo)

        NSLayoutConstraint.activate([
            logo.centerXAnchor.constraint(equalTo: splash.centerXAnchor),
            logo.centerYAnchor.constraint(equalTo: splash.centerYAnchor),
            logo.widthAnchor.constraint(equalTo: splash.widthAnchor, multiplier: 0.6),
            logo.heightAnchor.constraint(equalTo: logo.widthAnchor)
        ])

        window.addSubview(splash)

        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            UIView.animate(withDuration: 0.3, animations: {
                splash.alpha = 0
            }, completion: { _ in
                splash.removeFromSuperview()
            })
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
