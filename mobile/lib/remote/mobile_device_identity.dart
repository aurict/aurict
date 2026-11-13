// ignore_for_file: prefer_initializing_formals

import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:ed25519_edwards/ed25519_edwards.dart' as ed25519;
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'mobile_backend_client.dart';

class MobileDeviceIdentity {
  const MobileDeviceIdentity({
    required this.deviceId,
    required this.signingPublicKey,
    required this.signingKeyFingerprint,
    required this.encryptionPublicKey,
    required this.verified,
  });

  final String deviceId;
  final String signingPublicKey;
  final String signingKeyFingerprint;
  final String encryptionPublicKey;
  final bool verified;
}

class MobileDeviceIdentityStore extends ChangeNotifier {
  MobileDeviceIdentityStore({
    required MobileBackendClient backend,
    FlutterSecureStorage? secureStorage,
  }) : _backend = backend,
       _secureStorage = secureStorage ?? const FlutterSecureStorage();

  final MobileBackendClient _backend;
  final FlutterSecureStorage _secureStorage;

  MobileDeviceIdentity? _identity;
  String? _error;
  var _loading = false;

  MobileDeviceIdentity? get identity => _identity;
  String? get error => _error;
  bool get loading => _loading;
  bool get verified => _identity?.verified == true;

  Future<String> signPayload(String payload) async {
    final keyPair = await _readOrCreateKeyPair();
    return _signChallenge(keyPair.privateKey, payload);
  }

  Future<MobileDeviceIdentity> ensureRegistered() async {
    _setLoading(true);
    _error = null;
    try {
      final local = await _readLocalIdentity();
      if (local != null && local.verified) {
        _identity = local;
        return local;
      }
      final keyPair = await _readOrCreateKeyPair();
      final signingPublicKey = _publicJwk(keyPair.publicKey);
      final fingerprint = _fingerprint(signingPublicKey);
      final registered = await _backend.postJson('/devices/register', {
        'name': _deviceName(),
        'platform': 'mobile',
        'encryptionPublicKey': signingPublicKey,
        'signingPublicKey': signingPublicKey,
        'signingKeyFingerprint': fingerprint,
      });
      final device = registered['device'] as Map<String, dynamic>;
      final verification = registered['verification'] as Map<String, dynamic>;
      final challenge = verification['challenge'].toString();
      final signature = _signChallenge(keyPair.privateKey, challenge);
      final verified = await _backend.postJson(
        '/devices/${device['id']}/verify',
        {
          'challenge': challenge,
          'signature': signature,
          'algorithm': 'ed25519',
        },
      );
      final verifiedDevice = verified['device'] as Map<String, dynamic>;
      final identity = MobileDeviceIdentity(
        deviceId: verifiedDevice['id'].toString(),
        signingPublicKey: signingPublicKey,
        signingKeyFingerprint: fingerprint,
        encryptionPublicKey: signingPublicKey,
        verified: true,
      );
      await _writeLocalIdentity(identity);
      _identity = identity;
      return identity;
    } catch (error) {
      _error = error.toString();
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<MobileDeviceIdentity?> restore() async {
    _identity = await _readLocalIdentity();
    notifyListeners();
    return _identity;
  }

  Future<void> clear() async {
    for (final key in _StorageKeys.all) {
      await _secureStorage.delete(key: key);
    }
    _identity = null;
    notifyListeners();
  }

  Future<ed25519.KeyPair> _readOrCreateKeyPair() async {
    final seed = await _secureStorage.read(key: _StorageKeys.seed);
    if (seed != null) {
      final privateKey = ed25519.newKeyFromSeed(
        Uint8List.fromList(base64Url.decode(seed)),
      );
      return ed25519.KeyPair(privateKey, ed25519.public(privateKey));
    }
    final generated = ed25519.generateKey();
    await _secureStorage.write(
      key: _StorageKeys.seed,
      value: base64UrlEncode(ed25519.seed(generated.privateKey)),
    );
    return generated;
  }

  Future<MobileDeviceIdentity?> _readLocalIdentity() async {
    final deviceId = await _secureStorage.read(key: _StorageKeys.deviceId);
    final signingPublicKey = await _secureStorage.read(
      key: _StorageKeys.signingPublicKey,
    );
    final fingerprint = await _secureStorage.read(
      key: _StorageKeys.signingKeyFingerprint,
    );
    if (deviceId == null || signingPublicKey == null || fingerprint == null) {
      return null;
    }
    return MobileDeviceIdentity(
      deviceId: deviceId,
      signingPublicKey: signingPublicKey,
      signingKeyFingerprint: fingerprint,
      encryptionPublicKey: signingPublicKey,
      verified: true,
    );
  }

  Future<void> _writeLocalIdentity(MobileDeviceIdentity identity) async {
    await _secureStorage.write(
      key: _StorageKeys.deviceId,
      value: identity.deviceId,
    );
    await _secureStorage.write(
      key: _StorageKeys.signingPublicKey,
      value: identity.signingPublicKey,
    );
    await _secureStorage.write(
      key: _StorageKeys.signingKeyFingerprint,
      value: identity.signingKeyFingerprint,
    );
  }

  String _publicJwk(ed25519.PublicKey publicKey) {
    return jsonEncode({
      'kty': 'OKP',
      'crv': 'Ed25519',
      'x': base64UrlEncode(publicKey.bytes),
      'ext': true,
      'key_ops': ['verify'],
    });
  }

  String _fingerprint(String publicJwk) {
    final digest = sha256.convert(utf8.encode(publicJwk));
    return 'fp_${base64UrlEncode(digest.bytes).replaceAll('=', '')}';
  }

  String _signChallenge(ed25519.PrivateKey privateKey, String challenge) {
    final signature = ed25519.sign(
      privateKey,
      Uint8List.fromList(utf8.encode(challenge)),
    );
    return base64UrlEncode(signature);
  }

  String _deviceName() {
    final platform = defaultTargetPlatform.name;
    return 'Aurict Mobile $platform';
  }

  void _setLoading(bool value) {
    _loading = value;
    notifyListeners();
  }
}

final class _StorageKeys {
  static const seed = 'aurict.remote.device.ed25519.seed';
  static const deviceId = 'aurict.remote.device.id';
  static const signingPublicKey = 'aurict.remote.device.signingPublicKey';
  static const signingKeyFingerprint =
      'aurict.remote.device.signingKeyFingerprint';

  static const all = [seed, deviceId, signingPublicKey, signingKeyFingerprint];
}

/// Short code a person compares between the phone and the desktop before pairing.
/// Must match `safetyCode` in packages/cli/src/remote/peer-trust.ts.
String remoteSafetyCode(String fingerprint) {
  final body = fingerprint
      .replaceFirst(RegExp(r'^fp_'), '')
      .replaceAll(RegExp(r'[^A-Za-z0-9]'), '')
      .toUpperCase();
  final short = body.length > 12 ? body.substring(0, 12) : body;
  final groups = <String>[];
  for (var i = 0; i < short.length; i += 4) {
    groups.add(short.substring(i, i + 4 > short.length ? short.length : i + 4));
  }
  return groups.join('-');
}
