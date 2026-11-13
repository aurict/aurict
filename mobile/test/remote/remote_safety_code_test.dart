import 'package:flutter_test/flutter_test.dart';

import 'package:aurict_mobile/remote/mobile_device_identity.dart';

void main() {
  // Same vectors as packages/cli/test/remote-peer-trust.test.ts: the desktop asks the
  // user to type this code, so both sides must derive it identically.
  test('safety code matches the CLI derivation', () {
    expect(remoteSafetyCode('fp_abc-_DEF123ghi456XYZ'), 'ABCD-EF12-3GHI');
    expect(remoteSafetyCode('fp_ab'), 'AB');
    expect(remoteSafetyCode('fp_abcdefgh'), 'ABCD-EFGH');
  });
}
