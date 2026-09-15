/* eslint-disable import/no-unresolved -- Bun provides this test module at runtime. */
import { describe, expect, it } from 'bun:test';
import { macosSign } from '../macos-sign.js';

const completeEnvironment: NodeJS.ProcessEnv = {
  AURICT_MACOS_SIGNING: 'developer-id',
  APPLE_SIGNING_KEYCHAIN: '/tmp/aurict-signing.keychain-db',
  APPLE_ID: 'release@example.com',
  APPLE_APP_SPECIFIC_PASSWORD: 'example-app-password',
  APPLE_TEAM_ID: 'TEAMID1234',
};

describe('macosSign', () => {
  it('does not configure macOS signing for other platforms', () => {
    expect(macosSign('linux', completeEnvironment)).toBeUndefined();
  });

  it('keeps local macOS packages unsigned unless release signing is requested', () => {
    expect(macosSign('darwin', {})).toBeUndefined();
  });

  it('configures strict Developer ID signing and notarization', () => {
    expect(macosSign('darwin', completeEnvironment)).toEqual({
      osxSign: {
        hardenedRuntime: true,
        keychain: '/tmp/aurict-signing.keychain-db',
        strictVerify: true,
      },
      osxNotarize: {
        appleId: 'release@example.com',
        appleIdPassword: 'example-app-password',
        teamId: 'TEAMID1234',
      },
    });
  });

  it('fails closed when a required notarization value is absent', () => {
    const env = { ...completeEnvironment };
    delete env.APPLE_TEAM_ID;
    expect(() => macosSign('darwin', env)).toThrow('macOS signing requires APPLE_TEAM_ID.');
  });

  it('rejects unknown signing modes', () => {
    expect(() => macosSign('darwin', { AURICT_MACOS_SIGNING: 'adhoc' })).toThrow(
      'Unsupported AURICT_MACOS_SIGNING mode: adhoc.',
    );
  });
});
