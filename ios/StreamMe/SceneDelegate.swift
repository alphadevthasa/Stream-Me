import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UIKit

class SceneDelegate: RCTDefaultReactNativeFactoryDelegate, UIWindowSceneDelegate {
  var window: UIWindow?
  private var reactNativeFactory: RCTReactNativeFactory?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }

    dependencyProvider = RCTAppDependencyProvider()
    let factory = RCTReactNativeFactory(delegate: self)
    reactNativeFactory = factory

    #if DEBUG
    factory.devMenuConfiguration = RCTDevMenuConfiguration(
      devMenuEnabled: true,
      shakeGestureEnabled: true,
      keyboardShortcutsEnabled: true
    )
    #endif

    let home = HomeViewController(factory: factory)
    home.tabBarItem = UITabBarItem(title: "Beranda", image: UIImage(systemName: "house"), tag: 0)

    let stream = StreamViewController(factory: factory)
    stream.tabBarItem = UITabBarItem(title: "Live Stream", image: UIImage(systemName: "dot.radiowaves.left.and.right"), tag: 1)

    let tabs = UITabBarController()
    tabs.viewControllers = [home, stream]
    if ProcessInfo.processInfo.environment["STREAMME_SHOW_STREAM_ON_LAUNCH"] == "1" {
      tabs.selectedIndex = 1
    }
    tabs.tabBar.tintColor = UIColor(red: 0.145, green: 0.349, blue: 0.957, alpha: 1)
    tabs.tabBar.unselectedItemTintColor = UIColor(red: 0.47, green: 0.51, blue: 0.59, alpha: 1)
    tabs.tabBar.isTranslucent = false
    tabs.tabBar.backgroundColor = .white
    let appearance = UITabBarAppearance()
    appearance.configureWithOpaqueBackground()
    appearance.backgroundColor = UIColor.white
    appearance.backgroundEffect = nil
    tabs.tabBar.standardAppearance = appearance
    tabs.tabBar.scrollEdgeAppearance = appearance
    let appWindow = UIWindow(windowScene: windowScene)
    appWindow.rootViewController = tabs
    appWindow.makeKeyAndVisible()
    window = appWindow
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    RCTLinkingManager.scene(scene, openURLContexts: URLContexts)
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    RCTLinkingManager.scene(scene, continue: userActivity)
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}

private final class StreamViewController: UIViewController {
  private let factory: RCTReactNativeFactory
  private var streamView: UIView?

  init(factory: RCTReactNativeFactory) {
    self.factory = factory
    super.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) { nil }

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = UIColor(red: 0.969, green: 0.973, blue: 0.988, alpha: 1)
  }

  override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
    guard streamView == nil else { return }
    let root = factory.rootViewFactory.view(
      withModuleName: "StreamMe",
      initialProperties: [
        "initialPage": "live",
        "startLive": ProcessInfo.processInfo.environment["STREAMME_START_LIVE"] == "1"
      ]
    )
    root.frame = view.bounds
    root.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.addSubview(root)
    streamView = root
  }

  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    streamView?.removeFromSuperview()
    streamView = nil
  }
}

private final class HomeViewController: UIViewController {
  private let factory: RCTReactNativeFactory
  private var homeView: UIView?

  init(factory: RCTReactNativeFactory) {
    self.factory = factory
    super.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) { nil }

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = UIColor(red: 0.969, green: 0.973, blue: 0.988, alpha: 1)
  }

  override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
    guard homeView == nil else { return }
    let root = factory.rootViewFactory.view(withModuleName: "StreamMe", initialProperties: ["initialPage": "home"])
    root.frame = view.bounds
    root.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.addSubview(root)
    homeView = root
  }

  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    homeView?.removeFromSuperview()
    homeView = nil
  }
}
