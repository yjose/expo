import assert from 'assert';
import fs from 'fs-extra';
import path from 'path';

import { podInstallAsync } from '../CocoaPods';
import { getExpoRepositoryRootDir } from '../Directories';
import logger from '../Logger';
import { Package } from '../Packages';
import * as XcodeGen from './XcodeGen';
import { ProjectSpec } from './XcodeGen.types';
import XcodeProject, {
  flavorToFrameworkPath,
  spreadArgs,
  SHARED_DERIVED_DATA_DIR,
} from './XcodeProject';
import { Flavor, Framework, XcodebuildSettings } from './XcodeProject.types';

// Generates working files out from expo-modules-core folder and prevents CocoaPods generates unnecessary files inside expo-modules-core folder
const OUT_OF_TREE_WORKING_DIR = path.join(getExpoRepositoryRootDir(), 'prebuild-ExpoModulesCore');
const MODULEMAP_FILE = 'ExpoModulesCore.modulemap';
const UMBRELLA_HEADER = 'ExpoModulesCore-umbrella.h';

export function isExpoModulesCore(pkg: Package) {
  return pkg.packageName === 'expo-modules-core';
}

export async function generateXcodeProjectAsync(dir: string, spec: ProjectSpec): Promise<string> {
  const workingDir = OUT_OF_TREE_WORKING_DIR;
  await fs.ensureDir(workingDir);
  logger.log(`   Prebuilding expo-modules-core from ${workingDir}`);

  // Links to expo-modules-core source
  if (typeof spec.targets?.['ExpoModulesCore'].sources?.[0].path === 'string') {
    spec.targets['ExpoModulesCore'].sources[0].path = path.join(
      getExpoRepositoryRootDir(),
      'packages',
      'expo-modules-core',
      'ios'
    );
  }
  // Links to generated header from prebuilder script
  spec.targets?.['ExpoModulesCore']?.sources?.push({
    path: '',
    createIntermediateGroups: true,
    name: 'ExpoModulesCore-umbrella',
    includes: ['**/*.h'],
  });

  // Reset search header paths from base settings and leverages CocoaPods' setup
  if (spec.settings?.base['HEADER_SEARCH_PATHS']) {
    spec.settings.base['HEADER_SEARCH_PATHS'] = '$(inherited)';
  }

  if (spec.settings?.base) {
    spec.settings.base['MODULEMAP_FILE'] = MODULEMAP_FILE;
    spec.settings.base['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES';
  }

  await createModulemapAsync(workingDir);
  await createGeneratedHeaderAsync(workingDir);

  const result = await XcodeGen.generateXcodeProjectAsync(workingDir, spec);

  logger.log('   Installing Pods');
  await createPodfileAsync(workingDir);
  await podInstallAsync(workingDir);

  return result;
}

export async function buildFrameworkAsync(
  xcodeProject: XcodeProject,
  target: string,
  flavor: Flavor,
  options?: XcodebuildSettings
): Promise<Framework> {
  await xcodeProject.xcodebuildAsync(
    [
      'build',
      '-workspace',
      `${xcodeProject.name}.xcworkspace`,
      '-scheme',
      `${target}_iOS`,
      '-configuration',
      flavor.configuration,
      '-sdk',
      flavor.sdk,
      ...spreadArgs('-arch', flavor.archs),
      '-derivedDataPath',
      SHARED_DERIVED_DATA_DIR,
    ],
    options
  );

  const frameworkPath = flavorToFrameworkPath(target, flavor);
  const stat = await fs.lstat(path.join(frameworkPath, target));

  // `_CodeSignature` is apparently generated only for simulator, afaik we don't need it.
  await fs.remove(path.join(frameworkPath, '_CodeSignature'));

  return {
    target,
    flavor,
    frameworkPath,
    binarySize: stat.size,
  };
}

export async function cleanTemporaryFilesAsync(xcodeProject: XcodeProject) {
  // Moves created xcframework to package folder
  const xcFrameworkFilename = 'ExpoModulesCore.xcframework';
  await fs.move(
    path.join(OUT_OF_TREE_WORKING_DIR, xcFrameworkFilename),
    path.join(
      getExpoRepositoryRootDir(),
      'packages',
      'expo-modules-core',
      'ios',
      xcFrameworkFilename
    )
  );

  // Cleanups working directory
  await fs.remove(OUT_OF_TREE_WORKING_DIR);
}

async function createPodfileAsync(workDir: string) {
  const content = `\
platform :ios, '12.0'

react_native_dir = File.dirname(\`node --print "require.resolve('react-native/package.json')"\`)
require File.join(react_native_dir, "scripts/react_native_pods")
require File.join(File.dirname(\`node --print "require.resolve('expo/package.json')"\`), "scripts/autolinking")

target 'ExpoModulesCore_iOS' do
  use_react_native!(
    :path => react_native_dir
  )
end`;

  await fs.writeFile(path.join(workDir, 'Podfile'), content);
}

async function createModulemapAsync(workDir: string) {
  const content = `\
framework module ExpoModulesCore {
  umbrella header "ExpoModulesCore.h"

  export *
  module * { export * }
}`;
  await fs.writeFile(path.join(workDir, MODULEMAP_FILE), content);
}

async function createGeneratedHeaderAsync(workDir: string) {
  const srcUmbrellaHeader = path.join(
    getExpoRepositoryRootDir(),
    'apps',
    'bare-expo',
    'ios',
    'Pods',
    'Target Support Files',
    'ExpoModulesCore',
    UMBRELLA_HEADER
  );
  assert(
    await fs.pathExists(srcUmbrellaHeader),
    `Cannot find ${UMBRELLA_HEADER}. Make sure to run \`et pods -f\` before prebuilding.`
  );

  let content = await fs.readFile(srcUmbrellaHeader, 'utf-8');
  content = content.replace(/^#import "ExpoModulesCore\//gm, '#import "');

  await fs.writeFile(path.join(workDir, UMBRELLA_HEADER), content);
}
