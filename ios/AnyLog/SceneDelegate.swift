import React
import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else {
      return
    }

    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else {
      return
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    guard let factory = appDelegate.reactNativeFactory else {
      window.rootViewController = UIViewController()
      window.makeKeyAndVisible()
      return
    }

    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: nil)
  }
}
