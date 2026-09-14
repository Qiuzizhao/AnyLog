const fs = require('fs');
const path = require('path');
const {
  IOSConfig,
  withAppDelegate,
  withDangerousMod,
  withInfoPlist,
  withPodfile,
  withXcodeProject,
} = require('@expo/config-plugins');

const SCENE_DELEGATE_FILE = 'SceneDelegate.swift';
const SCENE_CONFIGURATION_NAME = 'Default Configuration';
const SCENE_DELEGATE_CLASS_NAME = '$(PRODUCT_MODULE_NAME).SceneDelegate';
const IOS_DEPLOYMENT_TARGET = '15.1';

const sceneDelegateContents = `import React
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
`;

function setSceneManifest(infoPlist) {
  infoPlist.UIApplicationSceneManifest = {
    UIApplicationSupportsMultipleScenes: false,
    UISceneConfigurations: {
      UIWindowSceneSessionRoleApplication: [
        {
          UISceneConfigurationName: SCENE_CONFIGURATION_NAME,
          UISceneDelegateClassName: SCENE_DELEGATE_CLASS_NAME,
        },
      ],
    },
  };

  return infoPlist;
}

function patchSwiftAppDelegate(contents) {
  if (contents.includes('UIWindow is created by SceneDelegate when the UIScene lifecycle is active.')) {
    return contents;
  }

  const legacyWindowStart = /#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\(\n\s*withModuleName: "main",\n\s*in: window,\n\s*launchOptions: launchOptions\)\n#endif/;

  const sceneAwareWindowStart = `#if os(iOS) || os(tvOS)
    if #available(iOS 13.0, tvOS 13.0, *) {
      // UIWindow is created by SceneDelegate when the UIScene lifecycle is active.
    } else {
      window = UIWindow(frame: UIScreen.main.bounds)
      factory.startReactNative(
        withModuleName: "main",
        in: window,
        launchOptions: launchOptions)
    }
#endif`;

  if (!legacyWindowStart.test(contents)) {
    throw new Error('Unable to patch AppDelegate.swift for UIScene lifecycle startup.');
  }

  return contents.replace(legacyWindowStart, sceneAwareWindowStart);
}

function patchPodfile(contents) {
  if (contents.includes('Keep all pod targets within the iOS SDK supported deployment target range.')) {
    return contents;
  }

  const reactNativePostInstallCall = /(\s+react_native_post_install\(\n\s+installer,\n\s+config\[:reactNativePath\],\n\s+:mac_catalyst_enabled => false,\n\s+:ccache_enabled => ccache_enabled\?\(podfile_properties\),\n\s+\)\n)/;

  const podDeploymentTargetPatch = `$1
    # Keep all pod targets within the iOS SDK supported deployment target range.
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${IOS_DEPLOYMENT_TARGET}'
      end
    end
`;

  if (!reactNativePostInstallCall.test(contents)) {
    throw new Error('Unable to patch Podfile post_install deployment targets.');
  }

  return contents.replace(reactNativePostInstallCall, podDeploymentTargetPatch);
}

function withIosSceneLifecycle(config) {
  config = withInfoPlist(config, (config) => {
    config.modResults = setSceneManifest(config.modResults);
    return config;
  });

  config = withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      throw new Error('with-ios-scene-lifecycle expects a Swift AppDelegate.');
    }

    config.modResults.contents = patchSwiftAppDelegate(config.modResults.contents);
    return config;
  });

  config = withPodfile(config, (config) => {
    config.modResults.contents = patchPodfile(config.modResults.contents);
    return config;
  });

  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosProjectRoot = path.join(
        config.modRequest.platformProjectRoot,
        config.modRequest.projectName
      );
      const sceneDelegatePath = path.join(iosProjectRoot, SCENE_DELEGATE_FILE);

      fs.writeFileSync(sceneDelegatePath, sceneDelegateContents);
      return config;
    },
  ]);

  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName = config.modRequest.projectName;
    const sceneDelegateProjectPath = path.join(projectName, SCENE_DELEGATE_FILE);

    if (!project.hasFile(sceneDelegateProjectPath)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath: sceneDelegateProjectPath,
        groupName: projectName,
        project,
      });
    }

    return config;
  });

  return config;
}

module.exports = withIosSceneLifecycle;
