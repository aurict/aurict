interface MacosSignOptions {
  hardenedRuntime: true;
  keychain: string;
  strictVerify: true;
}

interface MacosNotarizeOptions {
  appleId: string;
  appleIdPassword: string;
  teamId: string;
}

export interface MacosSigningConfig {
  osxSign: MacosSignOptions;
  osxNotarize: MacosNotarizeOptions;
}

const DEVELOPER_ID_MODE = 'developer-id';

function requiredValue(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`macOS signing requires ${name}.`);
  return value;
}

export function macosSign(
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
): MacosSigningConfig | undefined {
  if (platform !== 'darwin') return undefined;

  const mode = env.AURICT_MACOS_SIGNING;
  if (!mode) return undefined;
  if (mode !== DEVELOPER_ID_MODE) {
    throw new Error(`Unsupported AURICT_MACOS_SIGNING mode: ${mode}.`);
  }

  return {
    osxSign: {
      hardenedRuntime: true,
      keychain: requiredValue(env, 'APPLE_SIGNING_KEYCHAIN'),
      strictVerify: true,
    },
    osxNotarize: {
      appleId: requiredValue(env, 'APPLE_ID'),
      appleIdPassword: requiredValue(env, 'APPLE_APP_SPECIFIC_PASSWORD'),
      teamId: requiredValue(env, 'APPLE_TEAM_ID'),
    },
  };
}
