import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { macosSign } from './macos-sign';
import { windowsSign } from './windows-sign';

const sidecarResource = process.platform === 'win32' ? 'resources/aurict-sidecar.exe' : 'resources/aurict-sidecar';
const configuredMacosSign = macosSign();
const configuredWindowsSign = windowsSign();
const productIcon = process.platform === 'win32'
  ? 'resources/hoprel-icon.ico'
  : process.platform === 'darwin'
    ? 'resources/hoprel-icon.icns'
    : 'resources/hoprel-icon.png';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    appBundleId: 'com.aurict.hoprel',
    appCategoryType: 'public.app-category.developer-tools',
    appCopyright: 'Copyright (c) Aurict',
    executableName: 'hoprel',
    icon: productIcon,
    ...(configuredMacosSign ?? {}),
    ...(configuredWindowsSign ? { windowsSign: configuredWindowsSign as never } : {}),
    extraResource: [
      sidecarResource,
      'resources/aurict-data',
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      authors: 'Aurict',
      description: 'Hoprel by Aurict — a local-first desktop AI workspace',
      ...(configuredWindowsSign ? { windowsSign: configuredWindowsSign as never } : {}),
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({ options: { icon: 'resources/hoprel-icon-256.png' } }),
    new MakerDeb({ options: { icon: 'resources/hoprel-icon-256.png' } }),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
