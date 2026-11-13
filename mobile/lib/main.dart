import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';

import 'agent/mobile_agent_runtime.dart';
import 'agent/mobile_chat_stream.dart';
import 'agent/mobile_chat_history_store.dart';
import 'agent/mobile_chat_persistence_controller.dart';
import 'agent/mobile_diagnostics.dart';
import 'agent/mobile_lifecycle_coordinator.dart';
import 'agent/mobile_document_picker.dart';
import 'agent/mobile_feedback_report.dart';
import 'agent/mobile_html_pdf_tools.dart';
import 'agent/mobile_markdown_renderer.dart';
import 'agent/mobile_provider_session.dart';
import 'auth/mobile_auth_session.dart';
import 'design/aurict_typography.dart';
import 'design/platform_blur.dart';
import 'remote/mobile_remote_event_codec.dart';
import 'remote/mobile_backend_client.dart';
import 'remote/mobile_device_identity.dart';
import 'remote/mobile_remote_models.dart';
import 'remote/mobile_remote_runtime.dart';

import 'agent/mobile_artifact_index_store.dart';
import 'ui/widgets/error_retry_widget.dart';

void main() {
  runZonedGuarded(
    () async {
      WidgetsFlutterBinding.ensureInitialized();
      await Firebase.initializeApp();
      FlutterError.onError = (details) {
        FlutterError.presentError(details);
        mobileDiagnostics.record(
          details.exception,
          stackTrace: details.stack,
          source: 'flutter',
        );
      };
      PlatformDispatcher.instance.onError = (error, stack) {
        mobileDiagnostics.record(error, stackTrace: stack, source: 'platform');
        return true;
      };
      runApp(const AurictMobileApp());
    },
    (error, stack) {
      mobileDiagnostics.record(error, stackTrace: stack, source: 'zone');
    },
  );
}

class AurictMobileApp extends StatefulWidget {
  const AurictMobileApp({super.key});

  @override
  State<AurictMobileApp> createState() => _AurictMobileAppState();
}

class _AurictMobileAppState extends State<AurictMobileApp> {
  late final _providerSession = MobileProviderSession(
    errorReporter: (error, source) =>
        mobileDiagnostics.record(error, source: source),
  );
  late final _authSession = MobileAuthSession();
  final _documentContext = MobileDocumentContextStore();
  var _themeIndex = 0;
  var _onboardingComplete = false;

  @override
  void dispose() {
    _providerSession.dispose();
    _authSession.dispose();
    _documentContext.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = aurictThemes[_themeIndex];
    return TokensScope(
      tokens: tokens,
      onThemeChanged: (index) => setState(() => _themeIndex = index),
      themeIndex: _themeIndex,
      child: MobileProviderSessionScope(
        session: _providerSession,
        child: MobileAuthScope(
          session: _authSession,
          child: MobileDocumentContextScope(
            store: _documentContext,
            child: MaterialApp(
              title: 'Aurict',
              debugShowCheckedModeBanner: false,
              restorationScopeId: 'aurict_mobile',
              theme: tokens.materialTheme,
              home: _onboardingComplete
                  ? const AppShell()
                  : OnboardingFlow(
                      onComplete: () =>
                          setState(() => _onboardingComplete = true),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}

class MobileDocumentContextScope
    extends InheritedNotifier<MobileDocumentContextStore> {
  const MobileDocumentContextScope({
    required MobileDocumentContextStore store,
    required super.child,
    super.key,
  }) : super(notifier: store);

  static MobileDocumentContextStore of(BuildContext context) {
    final scope = context
        .dependOnInheritedWidgetOfExactType<MobileDocumentContextScope>();
    assert(scope != null, 'MobileDocumentContextScope not found');
    return scope!.notifier!;
  }
}

enum AppSection { chat, remote, documents, keys, settings, account }

enum AppMode { chat, remote }

bool isAndroidUi(BuildContext context) {
  return Theme.of(context).platform == TargetPlatform.android ||
      defaultTargetPlatform == TargetPlatform.android;
}

double adaptiveBlur(BuildContext context, double base) {
  final android = isAndroidUi(context);
  final factor = android ? .34 : .42;
  final max = android ? 9.0 : 16.0;
  return (base * factor).clamp(4.0, max).toDouble();
}

double adaptiveShadow(BuildContext context, double base) {
  return isAndroidUi(context) ? (base * .48).clamp(6, 14).toDouble() : base;
}

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

// Drawer'ın kayma animasyonuyla aynı süre — açık/kapalı geçişi sırasında
// SideRail içindeki GlassPanel'in blur'unu geçici olarak atlamak için kullanılır.
const _drawerAnimationDuration = Duration(milliseconds: 280);

class _AppShellState extends State<AppShell> {
  AppSection _section = AppSection.chat;
  AppMode _mode = AppMode.chat;
  var _drawerOpen = false;
  // Drawer yalnızca geçiş sürerken veya açıkken monte edilir. İlk görünür
  // frame kapalı konumda çizilir; sonraki frame'de açılarak animasyon korunur.
  var _drawerMounted = false;
  var _drawerAnimating = false;
  Timer? _drawerAnimationTimer;
  var _drawerTransition = 0;
  final _visitedSections = <AppSection>{AppSection.chat};
  late MobileRemoteRuntime _remoteRuntime;
  var _remoteRuntimeReady = false;
  late final MobileLifecycleCoordinator _lifecycleCoordinator =
      MobileLifecycleCoordinator(
        onEnterBackground: () {
          if (_remoteRuntimeReady) _remoteRuntime.pauseForBackground();
        },
        onEnterForeground: () {
          if (_remoteRuntimeReady) _remoteRuntime.resumeFromBackground();
        },
      );

  @override
  void initState() {
    super.initState();
    _lifecycleCoordinator.attach();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_remoteRuntimeReady) {
      _remoteRuntime = MobileRemoteRuntime(auth: MobileAuthScope.of(context));
      _remoteRuntimeReady = true;
    }
  }

  @override
  void dispose() {
    _lifecycleCoordinator.detach();
    _drawerAnimationTimer?.cancel();
    if (_remoteRuntimeReady) {
      _remoteRuntime.dispose();
    }
    super.dispose();
  }

  void _finishDrawerTransition(int transition) {
    _drawerAnimationTimer?.cancel();
    _drawerAnimationTimer = Timer(_drawerAnimationDuration, () {
      if (!mounted || transition != _drawerTransition) return;
      setState(() {
        _drawerAnimating = false;
        if (!_drawerOpen) _drawerMounted = false;
      });
    });
  }

  void _setDrawerOpen(bool open) {
    if (open && _drawerOpen) return;
    if (!open && !_drawerOpen && !_drawerMounted) return;
    final transition = ++_drawerTransition;
    _drawerAnimationTimer?.cancel();

    if (open && !_drawerMounted) {
      setState(() {
        _drawerMounted = true;
        _drawerAnimating = true;
      });
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted || transition != _drawerTransition) return;
        setState(() => _drawerOpen = true);
        _finishDrawerTransition(transition);
      });
      return;
    }

    setState(() {
      _drawerOpen = open;
      _drawerAnimating = true;
    });
    _finishDrawerTransition(transition);
  }

  void _select(AppSection section) {
    setState(() {
      _section = section;
      _visitedSections.add(section);
      _mode = section == AppSection.remote ? AppMode.remote : AppMode.chat;
    });
    _setDrawerOpen(false);
  }

  void _setMode(AppMode mode) {
    setState(() {
      _mode = mode;
      _section = mode == AppMode.remote ? AppSection.remote : AppSection.chat;
      _visitedSections.add(_section);
    });
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.paddingOf(context).bottom;
    final bottomControlsHeight = 92 + bottomInset;
    final railWidth = (MediaQuery.sizeOf(context).width - 28)
        .clamp(280.0, 320.0)
        .toDouble();
    return AppShellScope(
      onSelect: _select,
      child: Scaffold(
        body: Stack(
          children: [
            const AtmosphericBackground(),
            SafeArea(
              bottom: false,
              child: Padding(
                padding: EdgeInsets.only(bottom: bottomControlsHeight),
                child: Stack(
                  children: [
                    for (final section in AppSection.values)
                      if (_visitedSections.contains(section))
                        Offstage(
                          offstage: section != _section,
                          child: TickerMode(
                            enabled: section == _section,
                            child: _screenForSection(section),
                          ),
                        ),
                  ],
                ),
              ),
            ),
            if (_drawerMounted) ...[
              Positioned.fill(
                child: IgnorePointer(
                  ignoring: !_drawerOpen,
                  child: AnimatedOpacity(
                    duration: _drawerAnimationDuration,
                    opacity: _drawerOpen ? 1 : 0,
                    child: GestureDetector(
                      onTap: () => _setDrawerOpen(false),
                      child: Container(
                        color: Colors.black.withValues(alpha: .26),
                      ),
                    ),
                  ),
                ),
              ),
              AnimatedPositioned(
                duration: _drawerAnimationDuration,
                curve: Curves.easeOutCubic,
                left: _drawerOpen ? 14 : -(railWidth + 40),
                top: 68,
                bottom: bottomControlsHeight,
                width: railWidth,
                child: IgnorePointer(
                  ignoring: !_drawerOpen,
                  child: SheetTransitionScope(
                    reduceEffects: _drawerAnimating,
                    child: SideRail(
                      selected: _section,
                      onSelect: _select,
                      remoteConnected:
                          _remoteRuntimeReady && _remoteRuntime.connected,
                    ),
                  ),
                ),
              ),
            ],
            Positioned(
              left: 18,
              bottom: 18 + bottomInset,
              child: GlassIconButton(
                icon: _drawerOpen
                    ? CupertinoIcons.xmark
                    : CupertinoIcons.ellipsis,
                label: 'Menu',
                onTap: () => _setDrawerOpen(!_drawerOpen),
              ),
            ),
            Positioned(
              right: 18,
              bottom: 18 + bottomInset,
              child: ModeSwitcher(mode: _mode, onChanged: _setMode),
            ),
          ],
        ),
      ),
    );
  }

  Widget _screenForSection(AppSection section) {
    switch (section) {
      case AppSection.chat:
        return const ChatScreen(key: PageStorageKey('chat'));
      case AppSection.remote:
        return RemoteScreen(
          key: const PageStorageKey('remote'),
          runtime: _remoteRuntime,
        );
      case AppSection.documents:
        return const DocumentsScreen(key: PageStorageKey('documents'));
      case AppSection.keys:
        return const KeysScreen(key: PageStorageKey('keys'));
      case AppSection.settings:
        return const SettingsScreen(key: PageStorageKey('settings'));
      case AppSection.account:
        return const AccountScreen(key: PageStorageKey('account'));
    }
  }
}

class AppShellScope extends InheritedWidget {
  const AppShellScope({
    required this.onSelect,
    required super.child,
    super.key,
  });

  final ValueChanged<AppSection> onSelect;

  static AppShellScope? of(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<AppShellScope>();
  }

  void select(AppSection section) => onSelect(section);

  @override
  bool updateShouldNotify(AppShellScope oldWidget) {
    return onSelect != oldWidget.onSelect;
  }
}

class OnboardingFlow extends StatefulWidget {
  const OnboardingFlow({required this.onComplete, super.key});

  final VoidCallback onComplete;

  @override
  State<OnboardingFlow> createState() => _OnboardingFlowState();
}

class _OnboardingFlowState extends State<OnboardingFlow> {
  var _page = 0;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final pages = [
      _OnboardingPage(
        icon: CupertinoIcons.command,
        title: 'Your AI agent, wherever your work is.',
        body:
            'Use Aurict as a premium mobile AI workspace, then connect to your desktop CLI when remote control is enabled.',
        chips: const ['Mobile AI chat', 'Desktop remote', 'Local-first keys'],
      ),
      _OnboardingPage(
        icon: CupertinoIcons.lock_shield_fill,
        title: 'Secure by default.',
        body:
            'Remote control requires /remote on desktop. Trusted devices can be remembered or revoked. API keys stay on device.',
        chips: const ['Trusted devices', 'Peer-to-peer', 'Secure storage'],
      ),
      _OnboardingPage(
        icon: CupertinoIcons.sparkles,
        title: 'Start with chat, remote, or documents.',
        body:
            'This frontend is ready to plug into auth, provider keys, document workflows, and the remote relay protocol.',
        chips: const ['Add API key', 'Connect CLI', 'Upload PDF'],
      ),
    ];

    return Scaffold(
      body: Stack(
        children: [
          const AtmosphericBackground(),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Expanded(
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 260),
                      child: pages[_page],
                    ),
                  ),
                  GlassPanel(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            for (var i = 0; i < pages.length; i++)
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 180),
                                margin: const EdgeInsets.symmetric(
                                  horizontal: 4,
                                ),
                                height: 7,
                                width: i == _page ? 24 : 7,
                                decoration: BoxDecoration(
                                  color: i == _page
                                      ? tokens.accent
                                      : tokens.border,
                                  borderRadius: BorderRadius.circular(99),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        LayoutBuilder(
                          builder: (context, constraints) {
                            final backButton = SecondaryButton(
                              label: _page == 0 ? 'Sign in' : 'Back',
                              color: tokens.muted,
                              onTap: () {
                                if (_page == 0) {
                                  widget.onComplete();
                                } else {
                                  setState(() => _page--);
                                }
                              },
                            );
                            final nextButton = PrimaryButton(
                              label: _page == pages.length - 1
                                  ? 'Enter Aurict'
                                  : 'Continue',
                              icon: CupertinoIcons.arrow_right,
                              onTap: () {
                                if (_page == pages.length - 1) {
                                  widget.onComplete();
                                } else {
                                  setState(() => _page++);
                                }
                              },
                            );
                            if (constraints.maxWidth < 310) {
                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  nextButton,
                                  const SizedBox(height: 10),
                                  backButton,
                                ],
                              );
                            }
                            return Row(
                              children: [
                                Expanded(child: backButton),
                                const SizedBox(width: 10),
                                Expanded(child: nextButton),
                              ],
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OnboardingPage extends StatelessWidget {
  const _OnboardingPage({
    required this.icon,
    required this.title,
    required this.body,
    required this.chips,
  });

  final IconData icon;
  final String title;
  final String body;
  final List<String> chips;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final compact = MediaQuery.sizeOf(context).height < 680;
    return GlassPanel(
      child: SingleChildScrollView(
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: compact ? 360 : 480),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Container(
                height: compact ? 54 : 66,
                width: compact ? 54 : 66,
                decoration: BoxDecoration(
                  color: tokens.accent,
                  borderRadius: BorderRadius.circular(compact ? 19 : 24),
                  border: Border.all(
                    color: tokens.accent.withValues(alpha: .9),
                  ),
                  boxShadow: isAndroidUi(context)
                      ? null
                      : [
                          BoxShadow(
                            color: tokens.accent.withValues(alpha: .22),
                            blurRadius: adaptiveShadow(context, 32),
                            offset: const Offset(0, 14),
                          ),
                        ],
                ),
                child: Icon(
                  icon,
                  color: tokens.background,
                  size: compact ? 25 : 30,
                ),
              ),
              SizedBox(height: compact ? 18 : 28),
              Text(
                title,
                style: TextStyle(
                  color: tokens.text,
                  fontSize: compact ? 27 : 34,
                  fontWeight: FontWeight.w900,
                  height: 1.04,
                  letterSpacing: -1.1,
                ),
              ),
              const SizedBox(height: 14),
              Text(
                body,
                style: TextStyle(
                  color: tokens.muted,
                  fontSize: 15,
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 18),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final chip in chips) ActionChipLite(label: chip),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

enum ChatRole { user, assistant }

class ChatEntry {
  const ChatEntry({
    required this.role,
    required this.text,
    this.events = const [],
    this.skills = const [],
    this.reasoning = '',
    this.streamTools = const [],
    this.artifacts = const [],
    this.status,
    this.error,
  });

  final ChatRole role;
  final String text;
  final List<MobileToolEvent> events;
  final List<MobileSkillDef> skills;
  final String reasoning;
  final List<MobileToolStreamBlock> streamTools;
  final List<ChatArtifact> artifacts;
  final String? status;
  final String? error;

  ChatEntry copyWith({
    String? text,
    List<MobileToolEvent>? events,
    List<MobileSkillDef>? skills,
    String? reasoning,
    List<MobileToolStreamBlock>? streamTools,
    List<ChatArtifact>? artifacts,
    String? status,
    String? error,
  }) {
    return ChatEntry(
      role: role,
      text: text ?? this.text,
      events: events ?? this.events,
      skills: skills ?? this.skills,
      reasoning: reasoning ?? this.reasoning,
      streamTools: streamTools ?? this.streamTools,
      artifacts: artifacts ?? this.artifacts,
      status: status,
      error: error,
    );
  }
}

class ChatArtifact {
  const ChatArtifact({
    required this.id,
    required this.name,
    required this.mimeType,
    required this.sizeBytes,
    this.preview = '',
    this.saved = false,
    this.shared = false,
  });

  final String id;
  final String name;
  final String mimeType;
  final int sizeBytes;
  final String preview;
  final bool saved;
  final bool shared;

  ChatArtifact copyWith({bool? saved, bool? shared}) {
    return ChatArtifact(
      id: id,
      name: name,
      mimeType: mimeType,
      sizeBytes: sizeBytes,
      preview: preview,
      saved: saved ?? this.saved,
      shared: shared ?? this.shared,
    );
  }

  Map<String, Object?> toJson() => {
    'id': id,
    'name': name,
    'mimeType': mimeType,
    'sizeBytes': sizeBytes,
    'preview': preview,
    'saved': saved,
    'shared': shared,
  };

  static ChatArtifact? fromToolResult(String? raw) {
    if (raw == null || raw.trim().isEmpty) return null;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, Object?> || decoded['ok'] != true) {
        return null;
      }
      final tool = decoded['tool']?.toString() ?? '';
      if (tool != 'html_to_pdf' && tool != 'document_export') return null;
      final name = decoded['artifactName']?.toString() ?? '';
      if (name.isEmpty) return null;
      return ChatArtifact(
        id:
            decoded['artifactId']?.toString() ??
            'artifact-${name.hashCode.abs()}',
        name: name,
        mimeType: decoded['mimeType']?.toString() ?? 'application/octet-stream',
        sizeBytes: int.tryParse(decoded['sizeBytes']?.toString() ?? '') ?? 0,
        preview:
            decoded['htmlPreview']?.toString() ??
            decoded['preview']?.toString() ??
            '',
        saved: decoded['saved'] == true,
        shared: decoded['shared'] == true,
      );
    } catch (_) {
      return null;
    }
  }

  static ChatArtifact fromJson(Map<String, Object?> json) {
    return ChatArtifact(
      id: json['id']?.toString() ?? 'artifact',
      name: json['name']?.toString() ?? 'artifact',
      mimeType: json['mimeType']?.toString() ?? 'application/octet-stream',
      sizeBytes: int.tryParse(json['sizeBytes']?.toString() ?? '') ?? 0,
      preview: json['preview']?.toString() ?? '',
      saved: json['saved'] == true,
      shared: json['shared'] == true,
    );
  }

  MobileHtmlToPdfArtifact toBridgeArtifact() {
    final registered = MobileArtifactRegistry.get(id);
    if (registered != null) return registered;
    return MobileHtmlToPdfArtifact(
      artifactId: id,
      fileName: name,
      mimeType: mimeType,
      bytes: Uint8List(0),
      htmlPreview: preview,
      saved: saved,
      shared: shared,
    );
  }
}

enum ArtifactAction {
  open('Open'),
  save('Save'),
  share('Share'),
  delete('Delete');

  const ArtifactAction(this.label);

  final String label;
}

/// Aktif streaming yanıtının ANLIK görüntüsü. `_ChatScreenState._streamingSnapshot`
/// üzerinden yalnızca en son mesaj balonuna (ValueListenableBuilder ile) yayılır —
/// `setState()` YOK, bu yüzden ChatHistoryStrip/ChatComposer/diğer balonlar bu
/// güncellemelerden etkilenmez. Bkz. `flushStream()`.
class _StreamingSnapshot {
  const _StreamingSnapshot({
    required this.text,
    required this.reasoning,
    required this.tools,
    required this.artifacts,
    required this.status,
    required this.error,
  });

  final String text;
  final String reasoning;
  final List<MobileToolStreamBlock> tools;
  final List<ChatArtifact> artifacts;
  final String? status;
  final String? error;
}

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> with RestorationMixin {
  final _messages = <ChatEntry>[];
  final _localRuntime = const MobileAgentRuntime();
  final _streamingService = const MobileChatStreamingService();
  final _artifactBridge = const MobileHtmlToPdfRenderer();
  final _historyStore = EncryptedMobileChatHistoryStore();
  // ARCH/QA: seri yazma + diagnostics mantığı ayrı bir modüle taşındı,
  // bkz. agent/mobile_chat_persistence_controller.dart.
  late final _persistenceController = MobileChatPersistenceController(
        _historyStore,
  );
  final _artifactIndexStore = MethodChannelMobileArtifactIndexStore();
  final _chatSnapshot = RestorableString('');
  final _scrollController = ScrollController();
  final _threads = <MobileChatThreadMeta>[];
  StreamSubscription<MobileChatStreamEvent>? _streamSubscription;
  Timer? _streamFlushTimer;
  Timer? _historyWriteDebounce;
  List<Map<String, Object?>>? _pendingHistoryWrite;
  // Ara (writeHistory:false) flush'lar yalnızca bunu günceller — setState YOK.
  final _streamingSnapshot = ValueNotifier<_StreamingSnapshot?>(null);
  int _lastSnapshotWriteMs = 0;
  String? _activeThreadId;
  var _scrollPending = false;
  var _isStreaming = false;
  var _userPinnedScroll = false;
  var _showJumpToLatest = false;
  var _historyLoaded = false;
  var _historyQuery = '';
  late final MobileLifecycleCoordinator _lifecycleCoordinator =
      MobileLifecycleCoordinator(
        onEnterBackground: _handleAppEnterBackground,
        onEnterForeground: () {},
      );

  @override
  void initState() {
    super.initState();
    _loadHistory();
    _lifecycleCoordinator.attach();
  }

  @override
  String? get restorationId => 'aurict_chat_screen';

  @override
  void restoreState(RestorationBucket? oldBucket, bool initialRestore) {
    registerForRestoration(_chatSnapshot, 'messages');
    final restored = _decodeChatSnapshot(_chatSnapshot.value);
    if (restored.isNotEmpty) {
      _messages
        ..clear()
        ..addAll(restored);
      _scheduleAutoScroll(jump: true);
    }
  }

  Future<void> _loadHistory() async {
    final threads = await _persistenceController.listThreads();
    if (!mounted) return;
    setState(() {
      _threads
        ..clear()
        ..addAll(threads);
      _historyLoaded = true;
    });
    if (_messages.isEmpty && threads.isNotEmpty) {
      await _openThread(threads.first.id);
    }
  }

  Future<void> _openThread(String id) async {
    if (_isStreaming) _cancelStreaming();
    final snapshot = await _persistenceController.readThread(id);
    if (!mounted || snapshot == null) return;
    final documentContext = MobileDocumentContextScope.of(context);
    documentContext.clear();
    for (final document in snapshot.documents) {
      documentContext.attach(document);
    }
    setState(() {
      _activeThreadId = id;
      _messages
        ..clear()
        ..addAll(_decodeChatEntries(snapshot.messages));
    });
    _persistMessages(writeHistory: false);
    _scheduleAutoScroll(jump: true);
  }

  void _newThread() {
    if (_isStreaming) _cancelStreaming();
    setState(() {
      _activeThreadId = null;
      _messages.clear();
      _showJumpToLatest = false;
      _userPinnedScroll = false;
    });
    MobileDocumentContextScope.of(context).clear();
    _persistMessages(writeHistory: false);
  }

  Future<void> _confirmDeleteThread(String id) async {
    final thread = _threadById(id);
    if (thread == null) return;
    showAurictSheet(
      context,
      ConfirmDeleteChatSheet(
        title: thread.title,
        onDelete: () async {
          Navigator.pop(context);
          await _deleteThread(id);
        },
      ),
    );
  }

  Future<void> _deleteThread(String id) async {
    if (_activeThreadId == id && _isStreaming) _cancelStreaming();
    await _persistenceController.deleteThread(id);
    unawaited(_artifactIndexStore.removeThread(id));
    if (!mounted) return;
    final shouldClearDocuments = _activeThreadId == id;
    if (shouldClearDocuments) {
      MobileDocumentContextScope.of(context).clear();
    }
    setState(() {
      _threads.removeWhere((thread) => thread.id == id);
      if (shouldClearDocuments) {
        _activeThreadId = null;
        _messages.clear();
      }
    });
    _persistMessages(writeHistory: false);
  }

  void _showRenameThread(String id) {
    final thread = _threadById(id);
    if (thread == null) return;
    showAurictSheet(
      context,
      RenameChatSheet(
        initialTitle: thread.title,
        onRename: (title) async {
          Navigator.pop(context);
          await _renameThread(id, title);
        },
      ),
    );
  }

  Future<void> _renameThread(String id, String title) async {
    final normalized = title.trim();
    if (normalized.isEmpty) return;
    final snapshot = await _persistenceController.readThread(id);
    if (!mounted || snapshot == null) return;
    final updatedMeta = snapshot.meta.copyWith(
      title: normalized.length <= 56
          ? normalized
          : '${normalized.substring(0, 56)}...',
      updatedAt: DateTime.now(),
    );
    await _persistThreadSnapshot(
      MobileChatThreadSnapshot(
        meta: updatedMeta,
        messages: snapshot.messages,
        documents: snapshot.documents,
      ),
    );
    unawaited(
      _artifactIndexStore.upsertThreadArtifacts(
        threadId: id,
        threadTitle: updatedMeta.title,
        updatedAt: updatedMeta.updatedAt,
        artifacts: _artifactMapsFromEncoded(snapshot.messages),
      ),
    );
    if (!mounted) return;
    setState(() {
      _threads
        ..removeWhere((thread) => thread.id == id)
        ..insert(0, updatedMeta);
    });
  }

  MobileChatThreadMeta? _threadById(String id) {
    for (final thread in _threads) {
      if (thread.id == id) return thread;
    }
    return null;
  }

  List<MobileChatThreadMeta> get _visibleThreads {
    final query = _historyQuery.trim().toLowerCase();
    if (query.isEmpty) return _threads;
    return _threads
        .where((thread) {
          return thread.title.toLowerCase().contains(query) ||
              thread.preview.toLowerCase().contains(query) ||
              (thread.provider ?? '').toLowerCase().contains(query) ||
              (thread.model ?? '').toLowerCase().contains(query);
        })
        .toList(growable: false);
  }

  void _sendMessage(String rawText) {
    final text = rawText.trim();
    if (text.isEmpty || _isStreaming) return;
    final providerSession = MobileProviderSessionScope.of(context);
    final effectiveText = _withDocumentContext(text);
    if (providerSession.canUseSelectedModel) {
      _sendStreamingMessage(
        providerSession,
        text,
        effectiveText: effectiveText,
      );
      return;
    }
    final result = _localRuntime.run(effectiveText);
    setState(() {
      _messages
        ..add(ChatEntry(role: ChatRole.user, text: text))
        ..add(
          ChatEntry(
            role: ChatRole.assistant,
            text: result.text,
            events: result.events,
            skills: result.activeSkills,
            status: 'local planner',
          ),
        );
    });
    _persistMessages();
    _scheduleAutoScroll();
  }

  void _sendStreamingMessage(
    MobileProviderSession providerSession,
    String text, {
    String? effectiveText,
    bool appendUser = true,
  }) {
    final entry = providerSession.selectedEntry;
    final apiKey = providerSession.selectedKey!.trim();
    final model = providerSession.selectedModel!.trim();
    final history = <MobileChatMessage>[
      for (final message in _messages)
        if (message.text.trim().isNotEmpty)
          MobileChatMessage(
            role: message.role == ChatRole.user ? 'user' : 'assistant',
            content: message.text,
          ),
      if (appendUser)
        MobileChatMessage(role: 'user', content: effectiveText ?? text),
    ];
    setState(() {
      _isStreaming = true;
      if (appendUser) _messages.add(ChatEntry(role: ChatRole.user, text: text));
      _messages.add(
        const ChatEntry(role: ChatRole.assistant, text: '', status: 'queued'),
      );
    });
    _persistMessages();
    _scheduleAutoScroll();

    var assistantText = '';
    var reasoning = '';
    var status = 'thinking';
    var errorText = '';
    var tools = <MobileToolStreamBlock>[];
    final toolIndexes = <String, int>{};
    var artifacts = <ChatArtifact>[];

    void flushStream({bool writeHistory = false}) {
      _streamFlushTimer?.cancel();
      _streamFlushTimer = null;
      if (!writeHistory) {
        // Ara güncelleme: TÜM ChatScreen'i (ChatHistoryStrip/Composer dahil)
        // yeniden build ETMEDEN yalnızca aktif streaming balonunu güncelle.
        _streamingSnapshot.value = _StreamingSnapshot(
          text: assistantText,
          reasoning: reasoning,
          tools: tools,
          artifacts: artifacts,
          status: status,
          error: errorText.isEmpty ? null : errorText,
        );
        _scheduleAutoScroll();
        return;
      }
      // Final commit (stream bitti/hata/araç sınırı) — _replaceLastAssistant
      // snapshot'ı sıfırlar (bkz. orada), kalıcı duruma yazar.
      _replaceLastAssistant(
        text: assistantText,
        reasoning: reasoning,
        streamTools: tools,
        artifacts: artifacts,
        status: status,
        error: errorText.isEmpty ? null : errorText,
        writeHistory: writeHistory,
      );
    }

    void scheduleFlush({bool immediate = false}) {
      if (!mounted) return;
      if (immediate) {
        flushStream(writeHistory: true);
        return;
      }
      _streamFlushTimer ??= Timer(
        const Duration(milliseconds: 24),
        flushStream,
      );
    }

    _streamSubscription = _streamingService
        .stream(
          MobileChatRequest(
            config: entry.config,
            apiKey: apiKey,
            model: model,
            messages: history,
            latestUserText: effectiveText ?? text,
          ),
        )
        .listen(
          (event) {
            if (!mounted) return;
            switch (event.type) {
              case MobileChatEventType.queued:
                status = 'queued';
              case MobileChatEventType.thinkingDelta:
                reasoning += event.delta;
                status = 'thinking';
              case MobileChatEventType.textDelta:
                assistantText += event.delta;
                status = 'streaming';
              case MobileChatEventType.toolCallStarted:
                final tool = event.tool;
                if (tool != null) {
                  final index = toolIndexes[tool.id];
                  if (index == null) {
                    toolIndexes[tool.id] = tools.length;
                    tools = [...tools, tool];
                  } else {
                    tools = [...tools]..[index] = tool;
                  }
                  status = tool.name;
                }
              case MobileChatEventType.toolCallDelta:
                final tool = event.tool;
                if (tool != null) {
                  final index = toolIndexes[tool.id];
                  if (index != null) {
                    tools = [...tools]
                      ..[index] = tools[index].copyWith(
                        arguments: tools[index].arguments + tool.arguments,
                      );
                  }
                }
              case MobileChatEventType.toolCallCompleted:
                final tool = event.tool;
                if (tool != null) {
                  final artifact = ChatArtifact.fromToolResult(tool.result);
                  if (artifact != null) {
                    artifacts = [
                      ...artifacts.where((item) => item.id != artifact.id),
                      artifact,
                    ];
                  }
                  final index = toolIndexes[tool.id];
                  if (index != null) {
                    tools = [...tools]
                      ..[index] = tools[index].copyWith(
                        pending: false,
                        result: tool.result,
                      );
                  }
                }
              case MobileChatEventType.done:
                status = 'done';
                setState(() {
                  _isStreaming = false;
                  _showJumpToLatest = false;
                });
                scheduleFlush(immediate: true);
                return;
              case MobileChatEventType.error:
                errorText = event.error?.toString() ?? 'Unknown stream error';
                unawaited(
                  mobileDiagnostics.record(
                    event.error ?? errorText,
                    source: 'chat_stream',
                  ),
                );
                status = 'error';
                setState(() {
                  _isStreaming = false;
                  _showJumpToLatest = false;
                });
                scheduleFlush(immediate: true);
                return;
            }
            scheduleFlush();
          },
          onDone: () {
            if (!mounted) return;
            _streamFlushTimer?.cancel();
            _streamFlushTimer = null;
            setState(() => _isStreaming = false);
            _replaceLastAssistant(
              text: assistantText.isEmpty ? null : assistantText,
              reasoning: reasoning.isEmpty ? null : reasoning,
              streamTools: tools,
              artifacts: artifacts,
              status: errorText.isEmpty ? 'done' : 'error',
              error: errorText.isEmpty ? null : errorText,
              writeHistory: true,
            );
          },
        );
  }

  void _replaceLastAssistant({
    String? text,
    String? reasoning,
    List<MobileToolStreamBlock>? streamTools,
    List<ChatArtifact>? artifacts,
    String? status,
    String? error,
    bool writeHistory = false,
  }) {
    // Bu, her zaman bir FINAL commit'tir (done/error/cancel) — canlı streaming
    // ValueNotifier'ı temizle, itemBuilder artık _messages'tan okuyacak.
    _streamingSnapshot.value = null;
    setState(() {
      final index = _messages.lastIndexWhere(
        (message) => message.role == ChatRole.assistant,
      );
      if (index == -1) return;
      _messages[index] = _messages[index].copyWith(
        text: text,
        reasoning: reasoning,
        streamTools: streamTools,
        artifacts: artifacts,
        status: status,
        error: error,
      );
    });
    _persistMessages(writeHistory: writeHistory);
    _scheduleAutoScroll();
  }

  void _cancelStreaming() {
    _streamSubscription?.cancel();
    _streamSubscription = null;
    _streamFlushTimer?.cancel();
    _streamFlushTimer = null;
    if (!mounted) return;
    setState(() => _isStreaming = false);
    _replaceLastAssistant(status: 'cancelled');
  }

  void _retryLastResponse() {
    if (_isStreaming) return;
    final providerSession = MobileProviderSessionScope.of(context);
    final prompt = _lastUserPrompt();
    if (prompt == null) return;
    setState(() {
      if (_messages.isNotEmpty && _messages.last.role == ChatRole.assistant) {
        _messages.removeLast();
      }
    });
    _persistMessages();
    if (providerSession.canUseSelectedModel) {
      _sendStreamingMessage(
        providerSession,
        prompt,
        effectiveText: _withDocumentContext(prompt),
        appendUser: false,
      );
      return;
    }
    final result = _localRuntime.run(_withDocumentContext(prompt));
    setState(() {
      _messages.add(
        ChatEntry(
          role: ChatRole.assistant,
          text: result.text,
          events: result.events,
          skills: result.activeSkills,
          status: 'local planner',
        ),
      );
    });
    _persistMessages();
  }

  void _clearChat() {
    if (_isStreaming) _cancelStreaming();
    setState(_messages.clear);
    MobileDocumentContextScope.of(context).clear();
    _persistMessages();
  }

  Future<void> _handleArtifactAction(
    ChatArtifact artifact,
    ArtifactAction action,
  ) async {
    final result = await _runArtifactAction(artifact, action);
    final succeeded = _artifactActionSucceeded(result, action);
    if (!succeeded) {
      unawaited(
        mobileDiagnostics.record(
          result['message'] ?? '${action.label} failed for ${artifact.name}',
          source: 'artifact',
        ),
      );
    }
    if (!mounted) return;
    setState(() {
      for (var i = 0; i < _messages.length; i++) {
        final message = _messages[i];
        final index = message.artifacts.indexWhere(
          (item) => item.id == artifact.id,
        );
        if (index == -1) continue;
        if (action == ArtifactAction.delete && succeeded) {
          _messages[i] = message.copyWith(
            artifacts: [
              for (final item in message.artifacts)
                if (item.id != artifact.id) item,
            ],
          );
          continue;
        }
        final updated = [
          for (var j = 0; j < message.artifacts.length; j++)
            if (j == index)
              message.artifacts[j].copyWith(
                saved: action == ArtifactAction.save
                    ? succeeded
                    : message.artifacts[j].saved,
                shared: action == ArtifactAction.share
                    ? succeeded
                    : message.artifacts[j].shared,
              )
            else
              message.artifacts[j],
        ];
        _messages[i] = message.copyWith(artifacts: updated);
      }
    });
    _persistMessages();
    final message = result['message']?.toString();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          succeeded
              ? '${action.label} completed for ${artifact.name}.'
              : message ??
                    '${action.label} requires native iOS/Android artifact bridge.',
        ),
      ),
    );
  }

  void _showReportSheet(int messageIndex, ChatEntry message) {
    if (message.text.trim().isEmpty) return;
    showAurictSheet(
      context,
      ReportAnswerSheet(
        onSubmit: (reason, note) async {
          Navigator.pop(context);
          await _submitAssistantReport(messageIndex, message, reason, note);
        },
      ),
    );
  }

  Future<void> _submitAssistantReport(
    int messageIndex,
    ChatEntry message,
    MobileFeedbackReportReason reason,
    String note,
  ) async {
    final auth = MobileAuthScope.of(context);
    final providerSession = MobileProviderSessionScope.of(context);
    final client = MobileBackendClient(auth: auth);
    final service = MobileFeedbackReportService(backend: client);
    try {
      await service.submit(
        MobileFeedbackReportPayload(
          reason: reason,
          note: note,
          userMessage: _previousUserMessage(messageIndex),
          assistantMessage: message.text,
          provider: providerSession.selectedEntry.name,
          model: providerSession.selectedModel,
          toolSummary: [
            for (final tool in message.streamTools)
              MobileFeedbackToolSummary(
                name: tool.name,
                status: tool.pending ? 'pending' : 'completed',
                ok: tool.result?.contains('"ok":true'),
              ),
          ],
          metadata: {
            'messageStatus': message.status ?? 'unknown',
            'toolCount': message.streamTools.length,
            'artifactCount': message.artifacts.length,
            'client': 'aurict-mobile',
          },
        ),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Report sent to Aurict.')));
    } catch (error, stack) {
      unawaited(
        mobileDiagnostics.record(error, stackTrace: stack, source: 'report'),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Report failed: $error')));
    } finally {
      client.close();
    }
  }

  String? _previousUserMessage(int messageIndex) {
    for (var i = messageIndex - 1; i >= 0; i--) {
      final message = _messages[i];
      if (message.role == ChatRole.user && message.text.trim().isNotEmpty) {
        return message.text;
      }
    }
    return null;
  }

  Future<Map<String, Object?>> _runArtifactAction(
    ChatArtifact artifact,
    ArtifactAction action,
  ) {
    final bridgeArtifact = artifact.toBridgeArtifact();
    return switch (action) {
      ArtifactAction.open => _artifactBridge.open(bridgeArtifact),
      ArtifactAction.save => _artifactBridge.save(bridgeArtifact),
      ArtifactAction.share => _artifactBridge.share(bridgeArtifact),
      ArtifactAction.delete => _artifactBridge.delete(bridgeArtifact),
    };
  }

  bool _artifactActionSucceeded(
    Map<String, Object?> result,
    ArtifactAction action,
  ) {
    return switch (action) {
      ArtifactAction.open => result['opened'] == true,
      ArtifactAction.save => result['saved'] == true,
      ArtifactAction.share => result['shared'] == true,
      ArtifactAction.delete => result['deleted'] == true,
    };
  }

  void _scheduleAutoScroll({bool jump = false}) {
    if (_scrollPending) return;
    _scrollPending = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _scrollPending = false;
      if (!mounted || !_scrollController.hasClients) return;
      final target = _scrollController.position.maxScrollExtent;
      if (jump) {
        _scrollController.jumpTo(target);
        _setScrollPinned(false);
        return;
      }
      if (!_isNearBottom && _messages.isNotEmpty) {
        _setScrollPinned(true);
        return;
      }
      _scrollController.animateTo(
        target,
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOutCubic,
      );
    });
  }

  bool get _isNearBottom {
    if (!_scrollController.hasClients) return true;
    final distance =
        _scrollController.position.maxScrollExtent -
        _scrollController.position.pixels;
    return distance < 140;
  }

  bool _handleScrollNotification(ScrollNotification notification) {
    if (notification.metrics.axis != Axis.vertical) return false;
    final distance =
        notification.metrics.maxScrollExtent - notification.metrics.pixels;
    if (distance < 80) {
      _setScrollPinned(false);
    } else if (notification is UserScrollNotification) {
      _setScrollPinned(true);
    }
    return false;
  }

  void _setScrollPinned(bool pinned) {
    if (!mounted) return;
    final show = pinned && _isStreaming;
    if (_userPinnedScroll == pinned && _showJumpToLatest == show) return;
    setState(() {
      _userPinnedScroll = pinned;
      _showJumpToLatest = show;
    });
  }

  void _jumpToLatest() {
    if (!_scrollController.hasClients) return;
    _setScrollPinned(false);
    _scrollController.animateTo(
      _scrollController.position.maxScrollExtent,
      duration: const Duration(milliseconds: 180),
      curve: Curves.easeOutCubic,
    );
  }

  // Uygulama arka plana geçerken çağrılır. Devam eden bir stream varsa,
  // o ana kadar biriken metin/reasoning/tool durumunu (_streamingSnapshot)
  // kalıcı _messages listesine işler. Bu sayede stream devam etsin ya da
  // OS süreci öldürsün, yarım yanıt kaybolmaz veya boş assistant mesajına
  // dönüşmez. Stream'in kendisi İPTAL EDİLMEZ; yalnızca o ana kadarki
  // ilerleme kaydedilir.
  void _checkpointStreamingMessage() {
    final snapshot = _streamingSnapshot.value;
    if (!_isStreaming || snapshot == null) return;
    final index = _messages.lastIndexWhere(
      (message) => message.role == ChatRole.assistant,
    );
    if (index == -1) return;
    _messages[index] = _messages[index].copyWith(
      text: snapshot.text.isEmpty ? null : snapshot.text,
      reasoning: snapshot.reasoning.isEmpty ? null : snapshot.reasoning,
      streamTools: snapshot.tools,
      artifacts: snapshot.artifacts,
      status: snapshot.status,
      error: snapshot.error,
    );
  }

  // Bekleyen (debounce'ta bekleyen) bir disk yazımı varsa, beklemeden hemen
  // uygular. Arka plana geçişte kullanılır — 650ms'lik debounce penceresi
  // içinde process öldürülürse bekleyen yazım kaybolabilir.
  void _flushPendingHistoryWriteImmediately() {
    _historyWriteDebounce?.cancel();
    _historyWriteDebounce = null;
    final pending = _pendingHistoryWrite;
    _pendingHistoryWrite = null;
    if (pending != null && pending.isNotEmpty) {
      unawaited(_writeActiveThread(pending));
    }
  }

  // STAB-02: uygulama inactive/paused/detached olduğunda tetiklenir.
  // Sırasıyla: (1) devam eden stream varsa ilerlemeyi _messages'a işler,
  // (2) tüm durumu gecikmeden (debounce beklemeden) diske yazar.
  void _handleAppEnterBackground() {
    _checkpointStreamingMessage();
    _persistMessages(forceImmediate: true);
    _flushPendingHistoryWriteImmediately();
  }

  void _persistMessages({
    bool writeHistory = true,
    bool forceImmediate = false,
  }) {
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    if (!forceImmediate &&
        !writeHistory &&
        _isStreaming &&
        nowMs - _lastSnapshotWriteMs < 250) {
      return;
    }
    _lastSnapshotWriteMs = nowMs;
    final trimmedMessages = _messages.length > 120
        ? _messages.sublist(_messages.length - 120)
        : _messages;
    final encodedMessages = [
      for (final message in trimmedMessages) _encodeChatEntry(message),
    ];
    _chatSnapshot.value = jsonEncode(encodedMessages);
    if (writeHistory && encodedMessages.isNotEmpty) {
      _scheduleHistoryWrite(
        encodedMessages,
        immediate: forceImmediate || !_isStreaming,
      );
    }
  }

  void _scheduleHistoryWrite(
    List<Map<String, Object?>> encodedMessages, {
    bool immediate = false,
  }) {
    _pendingHistoryWrite = encodedMessages;
    _historyWriteDebounce?.cancel();
    if (immediate) {
      final pending = _pendingHistoryWrite;
      _pendingHistoryWrite = null;
      if (pending != null && pending.isNotEmpty) {
        unawaited(_writeActiveThread(pending));
      }
      return;
    }
    _historyWriteDebounce = Timer(const Duration(milliseconds: 650), () {
      final pending = _pendingHistoryWrite;
      _pendingHistoryWrite = null;
      if (pending != null && pending.isNotEmpty) {
        unawaited(_writeActiveThread(pending));
      }
    });
  }

  Future<void> _writeActiveThread(
    List<Map<String, Object?>> encodedMessages,
  ) async {
    // Yeni sohbet kimliğini ilk asenkron kayıt tamamlanmadan ÖNCE, herhangi
    // bir await'ten geçmeden senkron olarak sabitle. Aksi halde hızlı
    // ardışık gönderimlerde her çağrı _activeThreadId hâlâ null görüp
    // kendi thread id'sini üretir ve birden fazla yanlış thread oluşur.
    final now = DateTime.now();
    final isNewThread = _activeThreadId == null;
    final id =
        _activeThreadId ?? 'chat-${now.microsecondsSinceEpoch.toString()}';
    if (isNewThread) {
      if (!mounted) return;
      setState(() => _activeThreadId = id);
    }

    MobileChatThreadMeta? existing;
    for (final thread in _threads) {
      if (thread.id == id) {
        existing = thread;
        break;
      }
    }
    final providerSession = MobileProviderSessionScope.of(context);
    final meta = MobileChatThreadMeta(
      id: id,
      title: existing?.title ?? _threadTitle(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      messageCount: _messages.length,
      preview: _threadPreview(),
      provider: providerSession.selectedProvider,
      model: providerSession.selectedModel,
    );
    final documents = MobileDocumentContextScope.of(context).documents;

    await _persistThreadSnapshot(
      MobileChatThreadSnapshot(
        meta: meta,
        messages: encodedMessages,
        documents: documents,
      ),
    );

    unawaited(
      _artifactIndexStore.upsertThreadArtifacts(
        threadId: id,
        threadTitle: meta.title,
        updatedAt: meta.updatedAt,
        artifacts: _artifactMapsFromEntries(_messages),
      ),
    );
    if (!mounted) return;
    setState(() {
      _threads
        ..removeWhere((thread) => thread.id == id)
        ..insert(0, meta);
    });
  }

  // ARCH/QA: seri yazma/diagnostics mantığı main.dart dışına,
  // MobileChatPersistenceController'a taşındı (bkz.
  // agent/mobile_chat_persistence_controller.dart). Bu, yalnızca ince bir
  // delegasyon katmanıdır.
  Future<void> _persistThreadSnapshot(MobileChatThreadSnapshot snapshot) {
    return _persistenceController.writeThread(snapshot);
  }

  String _threadTitle() {
    final firstUser = _messages
        .where((message) => message.role == ChatRole.user)
        .map((message) => message.text.trim())
        .firstWhere((text) => text.isNotEmpty, orElse: () => 'New chat');
    return firstUser.length <= 42
        ? firstUser
        : '${firstUser.substring(0, 42)}...';
  }

  String _threadPreview() {
    final last = _messages
        .map((message) => message.text.trim())
        .lastWhere((text) => text.isNotEmpty, orElse: () => '');
    return last.length <= 88 ? last : '${last.substring(0, 88)}...';
  }

  Map<String, Object?> _encodeChatEntry(ChatEntry message) {
    return {
      'role': message.role.name,
      'text': message.text,
      'reasoning': message.reasoning,
      'status': message.status,
      'error': message.error,
      'streamTools': [
        for (final tool in message.streamTools)
          {
            'id': tool.id,
            'name': tool.name,
            'arguments': tool.arguments,
            'result': tool.result,
            'pending': tool.pending,
          },
      ],
      'artifacts': [
        for (final artifact in message.artifacts) artifact.toJson(),
      ],
    };
  }

  List<Map<String, Object?>> _artifactMapsFromEntries(List<ChatEntry> entries) {
    return [
      for (final message in entries)
        for (final artifact in message.artifacts) artifact.toJson(),
    ];
  }

  List<Map<String, Object?>> _artifactMapsFromEncoded(
    List<Map<String, Object?>> messages,
  ) {
    return [
      for (final message in messages)
        if (message['artifacts'] is List)
          for (final artifact in (message['artifacts'] as List))
            if (artifact is Map<String, Object?>) artifact,
    ];
  }

  List<ChatEntry> _decodeChatSnapshot(String raw) {
    if (raw.trim().isEmpty) return const [];
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) return const [];
      return _decodeChatEntries(
        decoded.whereType<Map<String, Object?>>().toList(growable: false),
      );
    } catch (_) {
      return const [];
    }
  }

  List<ChatEntry> _decodeChatEntries(List<Map<String, Object?>> items) {
    return items
        .map((item) {
          final role = item['role'] == 'user'
              ? ChatRole.user
              : ChatRole.assistant;
          final toolItems = item['streamTools'];
          return ChatEntry(
            role: role,
            text: item['text']?.toString() ?? '',
            reasoning: item['reasoning']?.toString() ?? '',
            status: item['status']?.toString(),
            error: item['error']?.toString(),
            artifacts: item['artifacts'] is List
                ? (item['artifacts'] as List)
                      .whereType<Map<String, Object?>>()
                      .map(ChatArtifact.fromJson)
                      .toList(growable: false)
                : const [],
            streamTools: toolItems is List
                ? toolItems
                      .whereType<Map<String, Object?>>()
                      .map(
                        (tool) => MobileToolStreamBlock(
                          id: tool['id']?.toString() ?? 'tool',
                          name: tool['name']?.toString() ?? 'tool',
                          arguments: tool['arguments']?.toString() ?? '',
                          result: tool['result']?.toString(),
                          pending: tool['pending'] == true,
                        ),
                      )
                      .toList(growable: false)
                : const [],
          );
        })
        .toList(growable: false);
  }

  String? _lastUserPrompt() {
    for (var i = _messages.length - 1; i >= 0; i--) {
      final message = _messages[i];
      if (message.role == ChatRole.user && message.text.trim().isNotEmpty) {
        return message.text;
      }
    }
    return null;
  }

  String _withDocumentContext(String text) {
    final documentContext = MobileDocumentContextScope.of(context);
    final contextBlock = documentContext.promptContext();
    if (contextBlock.trim().isEmpty) return text;
    return '$text\n$contextBlock';
  }

  bool get _lastAssistantNeedsRecovery {
    if (_messages.isEmpty) return false;
    final last = _messages.last;
    return last.role == ChatRole.assistant &&
        (last.error != null || last.status == 'cancelled');
  }

  @override
  void dispose() {
    _lifecycleCoordinator.detach();
    _streamSubscription?.cancel();
    _streamFlushTimer?.cancel();
    _historyWriteDebounce?.cancel();
    _scrollController.dispose();
    _chatSnapshot.dispose();
    _streamingSnapshot.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final providerSession = MobileProviderSessionScope.of(context);
    final documentContext = MobileDocumentContextScope.of(context);
    final hasMessages = _messages.isNotEmpty;
    return ScreenFrame(
      title: 'Aurict Chat',
      subtitle: providerSession.canUseSelectedModel
          ? '${providerSession.selectedEntry.name} · ${providerSession.selectedModel}'
          : 'Local planner until a provider key and model are selected',
      trailing: const ModelPill(),
      child: Column(
        children: [
          if (_threads.isNotEmpty) ...[
            ChatHistorySearchBar(
              query: _historyQuery,
              onChanged: (value) => setState(() => _historyQuery = value),
            ),
            const SizedBox(height: 8),
          ],
          ChatHistoryStrip(
            threads: _visibleThreads,
            activeThreadId: _activeThreadId,
            loading: !_historyLoaded,
            query: _historyQuery,
            onNew: _newThread,
            onOpen: _openThread,
            onRename: _showRenameThread,
            onDelete: _confirmDeleteThread,
          ),
          const SizedBox(height: 10),
          Expanded(
            child: Stack(
              children: [
                NotificationListener<ScrollNotification>(
                  onNotification: _handleScrollNotification,
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.only(bottom: 14),
                    itemCount:
                        (hasMessages ? _messages.length : 2) +
                        (_lastAssistantNeedsRecovery ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (!hasMessages) {
                        return index == 0
                            ? const PromptHeroCard()
                            : const SizedBox(height: 16);
                      }
                      if (index < _messages.length) {
                        final message = _messages[index];
                        if (message.role == ChatRole.user) {
                          return RepaintBoundary(
                            child: UserBubble(text: message.text),
                          );
                        }
                        Widget buildBubble(_StreamingSnapshot? snapshot) {
                          final effectiveError =
                              snapshot?.error ?? message.error;
                          final isLastAssistant =
                              index == _messages.length - 1 &&
                              message.role == ChatRole.assistant;
                          return AssistantBubble(
                            text: snapshot?.text ?? message.text,
                            events: message.events,
                            skills: message.skills,
                            reasoning: snapshot?.reasoning ?? message.reasoning,
                            streamTools: snapshot?.tools ?? message.streamTools,
                            artifacts: snapshot?.artifacts ?? message.artifacts,
                            onArtifactAction: _handleArtifactAction,
                            onReport: () => _showReportSheet(index, message),
                            status: snapshot?.status ?? message.status,
                            error: effectiveError,
                            onRetry: effectiveError != null && isLastAssistant
                                ? () async => _retryLastResponse()
                                : null,
                          );
                        }

                        // Yalnızca ŞU AN aktif olarak stream edilen (son) balon
                        // ValueListenableBuilder ile sarılır — 24ms flush'larda
                        // yalnızca BU widget yeniden çalışır, ChatScreen'in
                        // tamamı (ChatHistoryStrip/Composer dahil) değil.
                        final isLiveStreamingBubble =
                            _isStreaming && index == _messages.length - 1;
                        return RepaintBoundary(
                          child: isLiveStreamingBubble
                              ? ValueListenableBuilder<_StreamingSnapshot?>(
                                  valueListenable: _streamingSnapshot,
                                  builder: (context, snapshot, _) =>
                                      buildBubble(snapshot),
                                )
                              : buildBubble(null),
                        );
                      }
                      return ChatRecoveryCard(
                        onRetry: _retryLastResponse,
                        onClear: _clearChat,
                      );
                    },
                  ),
                ),
                if (_showJumpToLatest)
                  Positioned(
                    right: 6,
                    bottom: 12,
                    child: JumpToLatestChip(onTap: _jumpToLatest),
                  ),
              ],
            ),
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (documentContext.hasDocuments) ...[
                  AttachedDocumentTray(
                    documents: documentContext.documents,
                    onRemove: documentContext.detach,
                    onClear: documentContext.clear,
                  ),
                  const SizedBox(height: 8),
                ],
                ChatComposer(
                  placeholder:
                      'Ask Aurict to code, write, reason, or read documents...',
                  accent: tokens.accent,
                  onSubmit: _sendMessage,
                  busy: _isStreaming,
                  onCancel: _cancelStreaming,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ChatHistoryStrip extends StatelessWidget {
  const ChatHistoryStrip({
    required this.threads,
    required this.activeThreadId,
    required this.loading,
    required this.query,
    required this.onNew,
    required this.onOpen,
    required this.onRename,
    required this.onDelete,
    super.key,
  });

  final List<MobileChatThreadMeta> threads;
  final String? activeThreadId;
  final bool loading;
  final String query;
  final VoidCallback onNew;
  final ValueChanged<String> onOpen;
  final ValueChanged<String> onRename;
  final ValueChanged<String> onDelete;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    // 18'e kadar thread chip'i + "New chat" + (yükleniyor/boş durum) — hepsi
    // her rebuild'de eagerly inşa edilmesin diye ListView.separated (lazy).
    final visibleThreads = threads.take(18).toList(growable: false);
    final showsFallbackChip = loading || visibleThreads.isEmpty;
    final itemCount = 1 + (showsFallbackChip ? 1 : visibleThreads.length);
    return SizedBox(
      height: 58,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: itemCount,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          if (index == 0) {
            return _HistoryActionChip(
              icon: CupertinoIcons.plus,
              label: 'New chat',
              color: tokens.accent,
              onTap: onNew,
            );
          }
          if (loading) {
            return _HistoryActionChip(
              icon: CupertinoIcons.clock,
              label: 'Loading history',
              color: tokens.muted,
              onTap: () {},
            );
          }
          if (visibleThreads.isEmpty) {
            return _HistoryActionChip(
              icon: CupertinoIcons.chat_bubble_2,
              label: query.trim().isEmpty ? 'No saved chats' : 'No matches',
              color: tokens.muted,
              onTap: () {},
            );
          }
          final thread = visibleThreads[index - 1];
          return _HistoryThreadChip(
            thread: thread,
            active: thread.id == activeThreadId,
            onOpen: () => onOpen(thread.id),
            onRename: () => onRename(thread.id),
            onDelete: () => onDelete(thread.id),
          );
        },
      ),
    );
  }
}

class AttachedDocumentTray extends StatelessWidget {
  const AttachedDocumentTray({
    required this.documents,
    required this.onRemove,
    required this.onClear,
    super.key,
  });

  final List<MobilePickedDocument> documents;
  final ValueChanged<MobilePickedDocument> onRemove;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      padding: const EdgeInsets.all(10),
      child: Row(
        children: [
          Icon(CupertinoIcons.paperclip, color: tokens.accent, size: 17),
          const SizedBox(width: 8),
          Expanded(
            child: SizedBox(
              height: 34,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: documents.length,
                separatorBuilder: (_, _) => const SizedBox(width: 7),
                itemBuilder: (context, index) {
                  final document = documents[index];
                  return AttachedDocumentChip(
                    document: document,
                    onRemove: () => onRemove(document),
                  );
                },
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: onClear,
            child: Text(
              'Clear',
              style: TextStyle(
                color: tokens.muted,
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class AttachedDocumentChip extends StatelessWidget {
  const AttachedDocumentChip({
    required this.document,
    required this.onRemove,
    super.key,
  });

  final MobilePickedDocument document;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return Container(
      constraints: const BoxConstraints(maxWidth: 190),
      padding: const EdgeInsets.only(left: 10, right: 7, top: 7, bottom: 7),
      decoration: BoxDecoration(
        color: tokens.surface.withValues(alpha: .72),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: tokens.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(CupertinoIcons.doc_text, color: tokens.success, size: 14),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              document.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: tokens.text,
                fontWeight: FontWeight.w800,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(width: 6),
          GestureDetector(
            onTap: onRemove,
            child: Icon(
              CupertinoIcons.xmark_circle_fill,
              color: tokens.muted,
              size: 15,
            ),
          ),
        ],
      ),
    );
  }
}

class ChatHistorySearchBar extends StatefulWidget {
  const ChatHistorySearchBar({
    required this.query,
    required this.onChanged,
    super.key,
  });

  final String query;
  final ValueChanged<String> onChanged;

  @override
  State<ChatHistorySearchBar> createState() => _ChatHistorySearchBarState();
}

class _ChatHistorySearchBarState extends State<ChatHistorySearchBar> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.query);
  }

  @override
  void didUpdateWidget(ChatHistorySearchBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.query != _controller.text) {
      _controller.text = widget.query;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: tokens.surface.withValues(alpha: .52),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: tokens.border),
      ),
      child: Row(
        children: [
          Icon(CupertinoIcons.search, color: tokens.muted, size: 16),
          const SizedBox(width: 9),
          Expanded(
            child: TextField(
              controller: _controller,
              onChanged: widget.onChanged,
              style: TextStyle(color: tokens.text, fontSize: 12.5),
              decoration: InputDecoration.collapsed(
                hintText: 'Search chats, providers, models...',
                hintStyle: TextStyle(color: tokens.muted, fontSize: 12.5),
              ),
            ),
          ),
          if (widget.query.isNotEmpty)
            GestureDetector(
              onTap: () => widget.onChanged(''),
              child: Icon(
                CupertinoIcons.xmark_circle_fill,
                color: tokens.muted,
                size: 17,
              ),
            ),
        ],
      ),
    );
  }
}

class _HistoryActionChip extends StatelessWidget {
  const _HistoryActionChip({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 54,
        padding: const EdgeInsets.symmetric(horizontal: 13),
        decoration: BoxDecoration(
          color: color.withValues(alpha: .12),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: color.withValues(alpha: .28)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 16),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: tokens.text,
                fontWeight: FontWeight.w900,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryThreadChip extends StatelessWidget {
  const _HistoryThreadChip({
    required this.thread,
    required this.active,
    required this.onOpen,
    required this.onRename,
    required this.onDelete,
  });

  final MobileChatThreadMeta thread;
  final bool active;
  final VoidCallback onOpen;
  final VoidCallback onRename;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final color = active ? tokens.accent : tokens.border;
    return GestureDetector(
      onTap: onOpen,
      onLongPress: onRename,
      child: Container(
        width: 190,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: tokens.surface.withValues(alpha: active ? .82 : .54),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: color.withValues(alpha: active ? .55 : 1)),
        ),
        child: Row(
          children: [
            Icon(
              active
                  ? CupertinoIcons.chat_bubble_fill
                  : CupertinoIcons.chat_bubble,
              color: active ? tokens.accent : tokens.muted,
              size: 16,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    thread.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: tokens.text,
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${thread.messageCount} messages',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: tokens.muted, fontSize: 10.5),
                  ),
                ],
              ),
            ),
            GestureDetector(
              onTap: onDelete,
              child: Icon(CupertinoIcons.xmark, color: tokens.muted, size: 14),
            ),
          ],
        ),
      ),
    );
  }
}

class RenameChatSheet extends StatefulWidget {
  const RenameChatSheet({
    required this.initialTitle,
    required this.onRename,
    super.key,
  });

  final String initialTitle;
  final Future<void> Function(String title) onRename;

  @override
  State<RenameChatSheet> createState() => _RenameChatSheetState();
}

class _RenameChatSheetState extends State<RenameChatSheet> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialTitle);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(CupertinoIcons.pencil, color: tokens.accent),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Rename chat',
                  style: TextStyle(
                    color: tokens.text,
                    fontWeight: FontWeight.w900,
                    fontSize: 20,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 13),
            decoration: BoxDecoration(
              color: tokens.surface.withValues(alpha: .72),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: tokens.border),
            ),
            child: TextField(
              controller: _controller,
              autofocus: true,
              maxLength: 72,
              style: TextStyle(color: tokens.text),
              decoration: InputDecoration.collapsed(
                hintText: 'Chat title',
                hintStyle: TextStyle(color: tokens.muted),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: SecondaryButton(
                  label: 'Cancel',
                  color: tokens.muted,
                  onTap: () => Navigator.pop(context),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: PrimaryButton(
                  label: 'Rename',
                  icon: CupertinoIcons.checkmark_alt,
                  onTap: () {
                    unawaited(widget.onRename(_controller.text));
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class ConfirmDeleteChatSheet extends StatelessWidget {
  const ConfirmDeleteChatSheet({
    required this.title,
    required this.onDelete,
    super.key,
  });

  final String title;
  final Future<void> Function() onDelete;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      borderColor: tokens.danger.withValues(alpha: .32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(CupertinoIcons.trash, color: tokens.danger),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Delete chat?',
                  style: TextStyle(
                    color: tokens.text,
                    fontWeight: FontWeight.w900,
                    fontSize: 20,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'This removes "$title" from local chat history on this device.',
            style: TextStyle(color: tokens.muted, height: 1.4),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: SecondaryButton(
                  label: 'Cancel',
                  color: tokens.muted,
                  onTap: () => Navigator.pop(context),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: SecondaryButton(
                  label: 'Delete',
                  color: tokens.danger,
                  onTap: () {
                    unawaited(onDelete());
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class RemoteScreen extends StatelessWidget {
  const RemoteScreen({required this.runtime, super.key});

  final MobileRemoteRuntime runtime;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: runtime,
      builder: (context, _) {
        if (runtime.connected) {
          return RemoteSessionScreen(runtime: runtime);
        }
        final sessions = runtime.sessions;
        return ScreenFrame(
          title: 'Remote Control',
          subtitle: 'Control a desktop Aurict CLI session',
          trailing: GestureDetector(
            onTap: () => unawaited(runtime.bootstrap()),
            child: StatusPill(
              label: _remoteStatusLabel(runtime.status),
              color: _remoteStatusColor(context, runtime.status),
            ),
          ),
          child: ListView(
            padding: const EdgeInsets.only(bottom: 112),
            children: [
              const RemoteEmptyCard(),
              const SizedBox(height: 16),
              RemoteControlStatusCard(runtime: runtime),
              if (sessions.isNotEmpty) ...[
                const SizedBox(height: 16),
                for (final session in sessions) ...[
                  RemoteSessionCard(
                    session: session,
                    busy: runtime.status == MobileRemoteStatus.accepting,
                    onConnect: () => showAurictSheet(
                      context,
                      TrustDeviceSheet(
                        onTrust: () => unawaited(runtime.accept(session)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              ],
              const SizedBox(height: 4),
              const TrustExplainerCard(),
            ],
          ),
        );
      },
    );
  }
}

class RemoteSessionScreen extends StatefulWidget {
  const RemoteSessionScreen({required this.runtime, super.key});

  final MobileRemoteRuntime runtime;

  @override
  State<RemoteSessionScreen> createState() => _RemoteSessionScreenState();
}

class _RemoteSessionScreenState extends State<RemoteSessionScreen> {
  MobileRemoteEvent? _lastPromptEvent;

  void _submitPrompt(String text) {
    unawaited(
      widget.runtime.createPromptEvent(text).then((event) {
        if (!mounted || event == null) return;
        setState(() => _lastPromptEvent = event);
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final session = widget.runtime.currentSession;
    return ScreenFrame(
      title: session == null
          ? 'Remote session'
          : 'Desktop ${session.desktopDeviceId}',
      subtitle: session == null
          ? 'Peer data-plane pending'
          : '${session.connectionMode.toUpperCase()} · seq ${widget.runtime.lastSequence}',
      trailing: GestureDetector(
        onTap: () => unawaited(widget.runtime.disconnect()),
        child: StatusPill(label: 'Disconnect', color: tokens.danger),
      ),
      child: Column(
        children: [
          RemoteStatusStrip(runtime: widget.runtime),
          const SizedBox(height: 14),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.only(bottom: 104),
              children: [
                TimelineCard(
                  step: 'Session accepted',
                  detail: session == null
                      ? 'Waiting for session state'
                      : 'Backend signaling accepted · data-plane stays peer-to-peer',
                  state: TimelineState.done,
                ),
                const ToolCallCard(
                  tool: 'remote.identity',
                  detail: 'Verified mobile device key · signed session answer',
                  risk: 'low',
                ),
                const ToolCallCard(
                  tool: 'remote.transport',
                  detail: 'Desktop WebRTC transport pending CLI integration',
                  risk: 'medium',
                ),
                if (_lastPromptEvent != null)
                  TimelineCard(
                    step: 'Prompt event prepared',
                    detail:
                        'seq ${_lastPromptEvent!.seq} · signed locally · not sent through backend',
                    state: TimelineState.waiting,
                  ),
              ],
            ),
          ),
          ChatComposer(
            placeholder: 'Send instruction to desktop Aurict...',
            accent: tokens.success,
            onSubmit: _submitPrompt,
          ),
        ],
      ),
    );
  }
}

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  final _historyStore = EncryptedMobileChatHistoryStore();
  final _artifactIndexStore = MethodChannelMobileArtifactIndexStore();
  final _artifactBridge = const MobileHtmlToPdfRenderer();
  final _documentPicker = const MobileDocumentPicker();
  final _records = <DocumentArtifactRecord>[];
  final _pickedDocuments = <MobilePickedDocument>[];
  var _loading = true;
  var _pickingDocument = false;

  @override
  void initState() {
    super.initState();
    _loadArtifacts();
  }

  Future<void> _loadArtifacts() async {
    final indexed = await _artifactIndexStore.readAll();
    if (indexed.isNotEmpty) {
      final records = indexed
          .map(
            (record) => DocumentArtifactRecord(
              artifact: ChatArtifact.fromJson(record.artifact),
              threadId: record.threadId,
              threadTitle: record.threadTitle,
              updatedAt: record.updatedAt,
            ),
          )
          .toList(growable: false);
      if (!mounted) return;
      setState(() {
        _records
          ..clear()
          ..addAll(records);
        _loading = false;
      });
      return;
    }
    final threads = await _historyStore.listThreads();
    final snapshots = await Future.wait(
      threads.map((thread) async {
        final snapshot = await _historyStore.readThread(thread.id);
        return (thread: thread, snapshot: snapshot);
      }),
    );
    final byId = <String, DocumentArtifactRecord>{};
    for (final item in snapshots) {
      final thread = item.thread;
      final snapshot = item.snapshot;
      if (snapshot == null) continue;
      for (final message in snapshot.messages) {
        final artifacts = message['artifacts'];
        if (artifacts is! List) continue;
        for (final raw in artifacts.whereType<Map<String, Object?>>()) {
          final artifact = ChatArtifact.fromJson(raw);
          byId[artifact.id] = DocumentArtifactRecord(
            artifact: artifact,
            threadId: thread.id,
            threadTitle: thread.title,
            updatedAt: thread.updatedAt,
          );
        }
      }
    }
    final records = byId.values.toList()
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    if (records.isNotEmpty) {
      unawaited(
        _artifactIndexStore.writeAll([
          for (final record in records)
            MobileArtifactIndexRecord(
              artifact: record.artifact.toJson(),
              threadId: record.threadId,
              threadTitle: record.threadTitle,
              updatedAt: record.updatedAt,
            ),
        ]),
      );
    }
    if (!mounted) return;
    setState(() {
      _records
        ..clear()
        ..addAll(records);
      _loading = false;
    });
  }

  Future<void> _handleArtifactAction(
    DocumentArtifactRecord record,
    ArtifactAction action,
  ) async {
    final artifact = record.artifact.toBridgeArtifact();
    final result = switch (action) {
      ArtifactAction.open => await _artifactBridge.open(artifact),
      ArtifactAction.save => await _artifactBridge.save(artifact),
      ArtifactAction.share => await _artifactBridge.share(artifact),
      ArtifactAction.delete => await _artifactBridge.delete(artifact),
    };
    final succeeded = _artifactActionSucceeded(result, action);
    if (!mounted) return;
    if (!succeeded) {
      unawaited(
        mobileDiagnostics.record(
          result['message'] ??
              '${action.label} failed for ${record.artifact.name}',
          source: 'artifact',
        ),
      );
    }
    if (action == ArtifactAction.delete && succeeded) {
      await _deleteArtifact(record, showSnackBar: false);
      return;
    }
    setState(() {
      final index = _records.indexWhere(
        (item) => item.artifact.id == record.artifact.id,
      );
      if (index == -1) return;
      _records[index] = record.copyWith(
        artifact: record.artifact.copyWith(
          saved: action == ArtifactAction.save
              ? succeeded
              : record.artifact.saved,
          shared: action == ArtifactAction.share
              ? succeeded
              : record.artifact.shared,
        ),
      );
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          succeeded
              ? '${action.label} completed for ${record.artifact.name}.'
              : result['message']?.toString() ??
                    '${action.label} requires native artifact bridge.',
        ),
      ),
    );
  }

  bool _artifactActionSucceeded(
    Map<String, Object?> result,
    ArtifactAction action,
  ) {
    return switch (action) {
      ArtifactAction.open => result['opened'] == true,
      ArtifactAction.save => result['saved'] == true,
      ArtifactAction.share => result['shared'] == true,
      ArtifactAction.delete => result['deleted'] == true,
    };
  }

  void _previewArtifact(DocumentArtifactRecord record) {
    showAurictSheet(context, ArtifactPreviewSheet(record: record));
  }

  Future<void> _deleteArtifact(
    DocumentArtifactRecord record, {
    bool showSnackBar = true,
  }) async {
    final snapshot = await _historyStore.readThread(record.threadId);
    if (snapshot == null) return;
    final messages = [
      for (final message in snapshot.messages)
        {
          ...message,
          if (message['artifacts'] is List)
            'artifacts': [
              for (final raw in (message['artifacts'] as List))
                if (raw is! Map<String, Object?> ||
                    raw['id']?.toString() != record.artifact.id)
                  raw,
            ],
        },
    ];
    await _historyStore.writeThread(
      MobileChatThreadSnapshot(
        meta: snapshot.meta,
        messages: messages,
        documents: snapshot.documents,
      ),
    );
    await _artifactIndexStore.removeArtifact(record.artifact.id);
    if (!mounted) return;
    setState(() {
      _records.removeWhere((item) => item.artifact.id == record.artifact.id);
    });
    if (showSnackBar) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${record.artifact.name} removed from library.'),
        ),
      );
    }
  }

  Future<void> _pickDocument() async {
    if (_pickingDocument) return;
    setState(() => _pickingDocument = true);
    final result = await _documentPicker.pickDocument();
    if (!mounted) return;
    final documentContext = MobileDocumentContextScope.of(context);
    final document = result.document;
    if (result.ok && document != null) {
      documentContext.attach(document);
    }
    setState(() {
      _pickingDocument = false;
      if (result.ok && document != null) {
        _pickedDocuments.removeWhere(
          (item) =>
              item.sourceUri == document.sourceUri &&
              item.name == document.name,
        );
        _pickedDocuments.insert(0, document);
      }
    });
    if (!result.ok || result.message != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result.message ?? 'Document selected.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // Üretilen dosya sayısı zamanla büyüyebildiği için (kullanıcı geçmişi
    // boyunca birikir), eager `ListView(children:)` yerine lazy
    // `ListView.builder` kullanılıyor — off-screen kartlar (her biri bir
    // GlassPanel) artık scroll edilene kadar build edilmiyor.
    final pickedCount = _pickedDocuments.length;
    final pickedBlockItems = pickedCount == 0 ? 0 : pickedCount + 1;
    final showEmptyState = _loading || _records.isEmpty;
    final recordsStart = 2 + pickedBlockItems;
    final itemCount = recordsStart + (showEmptyState ? 1 : _records.length);
    return ScreenFrame(
      title: 'Documents',
      subtitle: 'Generated files, PDFs, reports',
      child: ListView.builder(
        padding: const EdgeInsets.only(bottom: 112),
        itemCount: itemCount,
        itemBuilder: (context, index) {
          if (index == 0) {
            return DocumentUploadCard(
              count: _records.length,
              selectedCount: pickedCount,
              loading: _loading,
              importing: _pickingDocument,
              onImport: _pickDocument,
              onRefresh: _loadArtifacts,
            );
          }
          if (index == 1) return const SizedBox(height: 14);
          if (pickedCount > 0) {
            if (index < 2 + pickedCount) {
              return PickedDocumentCard(document: _pickedDocuments[index - 2]);
            }
            if (index == 2 + pickedCount) return const SizedBox(height: 4);
          }
          if (showEmptyState) {
            return _loading
                ? const DocumentStateCard(
                    icon: CupertinoIcons.clock,
                    title: 'Loading generated files',
                    body: 'Scanning local chat history for artifact metadata.',
                  )
                : const DocumentStateCard(
                    icon: CupertinoIcons.doc_text_search,
                    title: 'No generated files yet',
                    body:
                        'Ask Aurict to create a PDF or export a document; '
                        'it will appear here after the tool completes.',
                  );
          }
          final record = _records[index - recordsStart];
          return ArtifactDocumentCard(
            record: record,
            onPreview: () => _previewArtifact(record),
            onOpen: () => _handleArtifactAction(record, ArtifactAction.open),
            onSave: () => _handleArtifactAction(record, ArtifactAction.save),
            onShare: () => _handleArtifactAction(record, ArtifactAction.share),
            onDelete: () =>
                _handleArtifactAction(record, ArtifactAction.delete),
          );
        },
      ),
    );
  }
}

class DocumentArtifactRecord {
  const DocumentArtifactRecord({
    required this.artifact,
    required this.threadId,
    required this.threadTitle,
    required this.updatedAt,
  });

  final ChatArtifact artifact;
  final String threadId;
  final String threadTitle;
  final DateTime updatedAt;

  DocumentArtifactRecord copyWith({ChatArtifact? artifact}) {
    return DocumentArtifactRecord(
      artifact: artifact ?? this.artifact,
      threadId: threadId,
      threadTitle: threadTitle,
      updatedAt: updatedAt,
    );
  }
}

class KeysScreen extends StatefulWidget {
  const KeysScreen({super.key});

  @override
  State<KeysScreen> createState() => _KeysScreenState();
}

class _KeysScreenState extends State<KeysScreen> {
  @override
  Widget build(BuildContext context) {
    final providerSession = MobileProviderSessionScope.of(context);
    return ScreenFrame(
      title: 'Keys & Models',
      subtitle: 'Provider keys stay on this device',
      child: ListView.builder(
        padding: const EdgeInsets.only(bottom: 112),
        itemCount: providerSession.entries.length + 2,
        itemBuilder: (context, index) {
          if (index == 0) return const SecurityNoticeCard();
          if (index == 1) return const SizedBox(height: 14);
          final provider = providerSession.entries[index - 2];
          final models = providerSession.modelsFor(provider.name);
          return ProviderCard(
            name: provider.name,
            status: providerSession.isLoading(provider.name)
                ? 'Fetching...'
                : providerSession.hasKey(provider.name)
                ? 'Secure key'
                : 'Not connected',
            model: models.isNotEmpty
                ? '${models.length} real models'
                : provider.model,
            active: providerSession.hasKey(provider.name),
            error: providerSession.errorFor(provider.name),
            models: models,
            onTap: () => showAurictSheet(
              context,
              SecureKeySheet(
                provider: provider.name,
                active: providerSession.hasKey(provider.name),
                initialKey: '',
                maskedKey: providerSession.maskedKeyFor(provider.name),
                fingerprint: providerSession.keyFingerprintFor(provider.name),
                models: models,
                error: providerSession.errorFor(provider.name),
                loading: providerSession.isLoading(provider.name),
                onSave: (key) =>
                    providerSession.saveTemporaryKey(provider.name, key),
                onFetchModels: () =>
                    providerSession.fetchModels(provider, force: true),
              ),
            ),
          );
        },
      ),
    );
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final scope = TokensScope.maybeOf(context);
    final selectedIndex = scope?.themeIndex ?? 0;
    final tokens = TokensScope.of(context);
    final sections = <WidgetBuilder>[
      (_) => const SettingsGroup(
        title: 'Security Model',
        rows: [
          SettingsRow(
            icon: Icons.vpn_key_rounded,
            title: 'Provider keys',
            value: 'Device secure storage',
          ),
          SettingsRow(
            icon: CupertinoIcons.eye_slash_fill,
            title: 'Aurict server visibility',
            value: 'No provider keys',
          ),
          SettingsRow(
            icon: CupertinoIcons.lock_shield,
            title: 'High-risk answers',
            value: 'Verifier gated',
          ),
        ],
      ),
      (_) => const SizedBox(height: 14),
      (_) => const SettingsGroup(
        title: 'Export Pipeline',
        rows: [
          SettingsRow(
            icon: CupertinoIcons.doc_richtext,
            title: 'PDF source',
            value: 'Sanitized HTML/CSS',
          ),
          SettingsRow(
            icon: CupertinoIcons.square_arrow_down,
            title: 'Save to phone',
            value: 'Native bridge required',
          ),
          SettingsRow(
            icon: CupertinoIcons.share,
            title: 'Share sheet',
            value: 'Native bridge required',
          ),
          SettingsRow(
            icon: CupertinoIcons.checkmark_shield,
            title: 'Export claim',
            value: 'After save/share event',
          ),
        ],
      ),
      (_) => const SizedBox(height: 14),
      (_) => const SettingsGroup(
        title: 'Remote Control',
        rows: [
          SettingsRow(
            icon: CupertinoIcons.desktopcomputer,
            title: 'Remote mode',
            value: 'Opt-in from CLI',
          ),
          SettingsRow(
            icon: CupertinoIcons.timer,
            title: 'Session trust',
            value: 'Temporary by default',
          ),
          SettingsRow(
            icon: CupertinoIcons.lock_shield,
            title: 'Approvals',
            value: 'Required by desktop policy',
          ),
        ],
      ),
      (_) => const SizedBox(height: 14),
      (_) => GlassPanel(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionLabel('Themes'),
            const SizedBox(height: 10),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                for (var i = 0; i < aurictThemes.length; i++)
                  ThemeChip(
                    tokens: aurictThemes[i],
                    selected: i == selectedIndex,
                    onTap: () => scope?.onThemeChanged(i),
                  ),
              ],
            ),
          ],
        ),
      ),
      (_) => const SizedBox(height: 14),
      (_) => const MobileCapabilitiesCard(),
      (_) => const SizedBox(height: 14),
      (_) => const DiagnosticsSettingsCard(),
      (_) => const SizedBox(height: 14),
      (_) => SettingsGroup(
        title: 'Data & Privacy',
        rows: [
          SettingsRow(
            icon: CupertinoIcons.person_crop_circle,
            title: 'Account',
            value: 'Local session',
            onTap: () => AppShellScope.of(context)?.select(AppSection.account),
          ),
          SettingsRow(
            icon: CupertinoIcons.doc_text,
            title: 'Privacy Policy',
            value: 'View',
            onTap: () => showAurictSheet(
              context,
              const LegalDocumentSheet(document: LegalDocument.privacy),
            ),
          ),
          SettingsRow(
            icon: CupertinoIcons.doc_checkmark,
            title: 'Terms of Use',
            value: 'View',
            onTap: () => showAurictSheet(
              context,
              const LegalDocumentSheet(document: LegalDocument.terms),
            ),
          ),
          SettingsRow(
            icon: CupertinoIcons.square_stack_3d_up,
            title: 'Model lists',
            value: 'Fetched per provider',
          ),
          SettingsRow(
            icon: CupertinoIcons.exclamationmark_bubble,
            title: 'Diagnostics',
            value: 'Local only',
          ),
          SettingsRow(
            icon: CupertinoIcons.doc_text_search,
            title: 'Document previews',
            value: 'Bounded metadata',
          ),
        ],
      ),
      (_) => const SizedBox(height: 14),
      (_) => GlassPanel(
        borderColor: tokens.danger.withValues(alpha: .22),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionLabel('Production Controls'),
            const SizedBox(height: 9),
            Text(
              'These actions affect only this phone. Provider keys are removed from the native secure store; generated export cache is removed from local artifact storage.',
              style: TextStyle(color: tokens.muted, height: 1.4),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: SecondaryButton(
                    label: 'Clear exports',
                    color: tokens.warning,
                    onTap: () => _clearExportCache(context),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: SecondaryButton(
                    label: 'Clear all keys',
                    color: tokens.danger,
                    onTap: () => _clearAllKeys(
                      context,
                      MobileProviderSessionScope.read(context),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: SecondaryButton(
                    label: 'Clear chats',
                    color: tokens.warning,
                    onTap: () => _clearChatHistory(context),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: SecondaryButton(
                    label: 'Clear models',
                    color: tokens.muted,
                    onTap: () => _clearModelCache(
                      context,
                      MobileProviderSessionScope.read(context),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ];
    return ScreenFrame(
      title: 'Settings',
      subtitle: 'Security, exports, themes, privacy',
      child: ListView.builder(
        padding: const EdgeInsets.only(bottom: 112),
        itemCount: sections.length,
        itemBuilder: (context, index) => sections[index](context),
      ),
    );
  }

  Future<void> _clearExportCache(BuildContext context) async {
    final result = await const MobileHtmlToPdfRenderer().clearCache();
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          result['cleared'] == true
              ? 'Local export cache cleared.'
              : 'Export cache could not be fully cleared.',
        ),
      ),
    );
  }

  Future<void> _clearAllKeys(
    BuildContext context,
    MobileProviderSession providerSession,
  ) async {
    await providerSession.clearAllProviders();
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('All provider keys cleared from this device.'),
      ),
    );
  }

  Future<void> _clearChatHistory(BuildContext context) async {
    await EncryptedMobileChatHistoryStore().clearAllThreads();
    await MethodChannelMobileArtifactIndexStore().clear();
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Local chat history cleared.')),
    );
  }

  Future<void> _clearModelCache(
    BuildContext context,
    MobileProviderSession providerSession,
  ) async {
    await providerSession.clearModelCache();
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Cached model lists cleared.')),
    );
  }
}

class MobileCapabilitiesCard extends StatelessWidget {
  const MobileCapabilitiesCard({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final skills = MobileSkillRegistry.skills;
    return GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionLabel('Built-in mobile skills'),
          const SizedBox(height: 10),
          Text(
            '${skills.length} mobile skills are available. Full skill content is lazy-loaded through load_mobile_skill; standalone mobile uses advisory mode when shell/repo access would be required.',
            style: TextStyle(color: tokens.muted, height: 1.4, fontSize: 12.5),
          ),
          const SizedBox(height: 12),
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 220),
            child: ListView.builder(
              itemCount: skills.length,
              itemBuilder: (context, index) {
                final skill = skills[index];
                return Padding(
                  padding: EdgeInsets.only(
                    bottom: index == skills.length - 1 ? 0 : 10,
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        skill.autoContinue
                            ? CupertinoIcons.arrow_2_circlepath
                            : CupertinoIcons.bolt,
                        color: skill.autoContinue
                            ? tokens.success
                            : tokens.accent,
                        size: 17,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              skill.name,
                              style: TextStyle(
                                color: tokens.text,
                                fontWeight: FontWeight.w900,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              skill.tools.join(' · '),
                              style: TextStyle(
                                color: tokens.muted,
                                fontSize: 11.5,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      if (skill.autoContinue)
                        StatusPill(label: 'continue', color: tokens.success),
                    ],
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 2),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: const [
              ActionChipLite(label: 'lazy-loaded'),
              ActionChipLite(label: 'markdown output'),
              ActionChipLite(label: 'policy v2'),
              ActionChipLite(label: 'verifier gated'),
              ActionChipLite(label: 'local file intake'),
              ActionChipLite(label: 'OCR-ready'),
            ],
          ),
        ],
      ),
    );
  }
}

class DiagnosticsSettingsCard extends StatefulWidget {
  const DiagnosticsSettingsCard({super.key});

  @override
  State<DiagnosticsSettingsCard> createState() =>
      _DiagnosticsSettingsCardState();
}

class _DiagnosticsSettingsCardState extends State<DiagnosticsSettingsCard> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) unawaited(mobileDiagnostics.load());
    });
  }

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return AnimatedBuilder(
      animation: mobileDiagnostics,
      builder: (context, _) {
        final events = mobileDiagnostics.events.take(4).toList();
        return GlassPanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Expanded(child: SectionLabel('Diagnostics')),
                  StatusPill(
                    label: events.isEmpty ? 'clean' : '${events.length} recent',
                    color: events.isEmpty ? tokens.success : tokens.warning,
                  ),
                ],
              ),
              const SizedBox(height: 9),
              Text(
                'Crash and runtime diagnostics stay on this device. They help debug provider, export, and tool failures without sending logs to Aurict servers.',
                style: TextStyle(color: tokens.muted, height: 1.4),
              ),
              const SizedBox(height: 12),
              if (events.isEmpty)
                Text(
                  mobileDiagnostics.loaded
                      ? 'No local diagnostics recorded.'
                      : 'Loading diagnostics...',
                  style: TextStyle(color: tokens.muted, fontSize: 12.5),
                )
              else
                for (final event in events) DiagnosticEventRow(event: event),
              const SizedBox(height: 12),
              SecondaryButton(
                label: 'Clear diagnostics',
                color: tokens.muted,
                onTap: events.isEmpty
                    ? null
                    : () async {
                        await mobileDiagnostics.clear();
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Local diagnostics cleared.'),
                          ),
                        );
                      },
              ),
            ],
          ),
        );
      },
    );
  }
}

class DiagnosticEventRow extends StatelessWidget {
  const DiagnosticEventRow({required this.event, super.key});

  final MobileDiagnosticEvent event;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final color = event.level == 'error' ? tokens.danger : tokens.warning;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: tokens.surface.withValues(alpha: .48),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: .22)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          StatusDot(color: color),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${event.source} · ${_timeLabel(event.createdAt)}',
                  style: TextStyle(
                    color: tokens.text,
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  event.message,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: tokens.muted,
                    height: 1.35,
                    fontSize: 11.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _timeLabel(DateTime value) {
    final local = value.toLocal();
    return '${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
  }
}

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final auth = MobileAuthScope.of(context);
    return ScreenFrame(
      title: 'Account',
      subtitle: 'Identity, secure tokens, devices, and privacy',
      child: AnimatedBuilder(
        animation: auth,
        builder: (context, _) {
          final account = auth.account;
          return ListView(
            padding: const EdgeInsets.only(bottom: 112),
            children: [
              GlassPanel(
                child: Row(
                  children: [
                    Container(
                      height: 58,
                      width: 58,
                      decoration: BoxDecoration(
                        color: tokens.accent,
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(
                          color: tokens.accent.withValues(alpha: .9),
                        ),
                      ),
                      child: Icon(
                        CupertinoIcons.person_fill,
                        color: tokens.background,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            account?.email ?? 'Sign in to Aurict',
                            style: TextStyle(
                              color: tokens.text,
                              fontWeight: FontWeight.w900,
                              fontSize: 17,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            account == null
                                ? 'Use Google or GitHub. API keys stay on this device.'
                                : '${account.provider} auth · secure device token store',
                            style: TextStyle(
                              color: tokens.muted,
                              fontSize: 12.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    StatusPill(
                      label: account == null ? 'signed out' : 'secure',
                      color: account == null ? tokens.warning : tokens.success,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              GlassPanel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SectionLabel(account == null ? 'Sign in' : 'Session'),
                    const SizedBox(height: 10),
                    if (auth.error != null) ...[
                      Text(
                        auth.error!,
                        style: TextStyle(color: tokens.danger, height: 1.35),
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (account == null) ...[
                      PrimaryButton(
                        label: auth.loading
                            ? 'Connecting...'
                            : 'Continue with Google',
                        icon: Icons.g_mobiledata_rounded,
                        onTap: auth.loading
                            ? () {}
                            : () => unawaited(auth.signInWithGoogle()),
                      ),
                      const SizedBox(height: 10),
                      SecondaryButton(
                        label: 'Continue with GitHub',
                        color: tokens.text,
                        onTap: auth.loading
                            ? null
                            : () => unawaited(auth.signInWithGitHub()),
                      ),
                    ] else ...[
                      SettingsRow(
                        icon: CupertinoIcons.person_crop_circle_fill,
                        title: 'Aurict account',
                        value: account.userId.isEmpty
                            ? 'Linked'
                            : account.userId.substring(
                                0,
                                account.userId.length < 10
                                    ? account.userId.length
                                    : 10,
                              ),
                      ),
                      SettingsRow(
                        icon: CupertinoIcons.lock_shield_fill,
                        title: 'Token storage',
                        value: 'Device secure',
                      ),
                      SettingsRow(
                        icon: CupertinoIcons.link,
                        title: 'Backend',
                        value: Uri.parse(aurictBackendBaseUrl).host,
                      ),
                      const SizedBox(height: 8),
                      SecondaryButton(
                        label: auth.loading ? 'Signing out...' : 'Sign out',
                        color: tokens.danger,
                        onTap: auth.loading
                            ? null
                            : () => unawaited(auth.signOut()),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 14),
              const SettingsGroup(
                title: 'Devices',
                rows: [
                  SettingsRow(
                    icon: Icons.phone_iphone_rounded,
                    title: 'This phone',
                    value: 'Ready',
                  ),
                  SettingsRow(
                    icon: Icons.desktop_mac_rounded,
                    title: 'Desktop CLI',
                    value: 'Remote capable',
                  ),
                  SettingsRow(
                    icon: CupertinoIcons.xmark_shield,
                    title: 'Revoked devices',
                    value: '0',
                  ),
                ],
              ),
              const SizedBox(height: 14),
              SettingsGroup(
                title: 'Privacy',
                rows: [
                  SettingsRow(
                    icon: CupertinoIcons.eye_slash_fill,
                    title: 'Server prompt visibility',
                    value: 'Never uploaded',
                  ),
                  SettingsRow(
                    icon: Icons.vpn_key_rounded,
                    title: 'Plaintext API keys',
                    value: 'Never uploaded',
                  ),
                  SettingsRow(
                    icon: CupertinoIcons.doc_text,
                    title: 'Privacy Policy',
                    value: 'View',
                    onTap: () => showAurictSheet(
                      context,
                      const LegalDocumentSheet(document: LegalDocument.privacy),
                    ),
                  ),
                  SettingsRow(
                    icon: CupertinoIcons.doc_checkmark,
                    title: 'Terms of Use',
                    value: 'View',
                    onTap: () => showAurictSheet(
                      context,
                      const LegalDocumentSheet(document: LegalDocument.terms),
                    ),
                  ),
                ],
              ),
              if (account != null) ...[
                const SizedBox(height: 14),
                GlassPanel(
                  borderColor: tokens.danger.withValues(alpha: .28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SectionLabel('Danger zone'),
                      const SizedBox(height: 9),
                      Text(
                        'Delete your Aurict account, revoke backend sessions, close trusted device metadata, and clear this phone session.',
                        style: TextStyle(color: tokens.muted, height: 1.4),
                      ),
                      const SizedBox(height: 12),
                      SecondaryButton(
                        label: 'Delete account',
                        color: tokens.danger,
                        onTap: auth.loading
                            ? null
                            : () => showAurictSheet(
                                context,
                                DeleteAccountSheet(account: account),
                              ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

enum LegalDocument { privacy, terms }

class LegalDocumentSheet extends StatelessWidget {
  const LegalDocumentSheet({required this.document, super.key});

  final LegalDocument document;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final spec = _legalSpec(document);
    return GlassPanel(
      child: SafeArea(
        top: false,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxHeight: 680),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Icon(spec.icon, color: tokens.accent, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        spec.title,
                        style: TextStyle(
                          color: tokens.text,
                          fontWeight: FontWeight.w900,
                          fontSize: 19,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  spec.updated,
                  style: TextStyle(color: tokens.muted, fontSize: 12),
                ),
                const SizedBox(height: 16),
                for (final section in spec.sections) ...[
                  Text(
                    section.title,
                    style: TextStyle(
                      color: tokens.text,
                      fontWeight: FontWeight.w900,
                      fontSize: 14.5,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    section.body,
                    style: TextStyle(
                      color: tokens.muted,
                      height: 1.45,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 14),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class DeleteAccountSheet extends StatefulWidget {
  const DeleteAccountSheet({required this.account, super.key});

  final AurictAccount account;

  @override
  State<DeleteAccountSheet> createState() => _DeleteAccountSheetState();
}

class _DeleteAccountSheetState extends State<DeleteAccountSheet> {
  final _controller = TextEditingController();
  var _submitting = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final auth = MobileAuthScope.of(context);
    final confirmed =
        _controller.text.trim().toLowerCase() ==
        widget.account.email.toLowerCase();
    return GlassPanel(
      borderColor: tokens.danger.withValues(alpha: .32),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(CupertinoIcons.trash, color: tokens.danger, size: 21),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Delete account',
                    style: TextStyle(
                      color: tokens.text,
                      fontWeight: FontWeight.w900,
                      fontSize: 19,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              'This revokes backend sessions, trusted device metadata, secret transfers, and remote sessions tied to ${widget.account.email}. Local provider keys and chats remain device-local unless you clear them from Settings.',
              style: TextStyle(color: tokens.muted, height: 1.45),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _controller,
              onChanged: (_) => setState(() {}),
              style: TextStyle(color: tokens.text),
              decoration: InputDecoration(
                labelText: 'Type your email to confirm',
                hintText: widget.account.email,
                labelStyle: TextStyle(color: tokens.muted),
                hintStyle: TextStyle(color: tokens.muted),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(color: tokens.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(color: tokens.danger),
                ),
              ),
            ),
            if (auth.error != null) ...[
              const SizedBox(height: 10),
              Text(
                auth.error!,
                style: TextStyle(color: tokens.danger, height: 1.35),
              ),
            ],
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: SecondaryButton(
                    label: 'Cancel',
                    color: tokens.muted,
                    onTap: _submitting ? null : () => Navigator.pop(context),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: SecondaryButton(
                    label: _submitting ? 'Deleting...' : 'Delete',
                    color: tokens.danger,
                    onTap: !confirmed || _submitting
                        ? null
                        : () => unawaited(_delete(context, auth)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _delete(BuildContext context, MobileAuthSession auth) async {
    setState(() => _submitting = true);
    final deleted = await auth.deleteAccount(
      confirmation: _controller.text.trim(),
    );
    if (!context.mounted) return;
    if (deleted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Aurict account deleted.')));
    } else {
      setState(() => _submitting = false);
    }
  }
}

class _LegalSpec {
  const _LegalSpec({
    required this.title,
    required this.updated,
    required this.icon,
    required this.sections,
  });

  final String title;
  final String updated;
  final IconData icon;
  final List<_LegalSection> sections;
}

class _LegalSection {
  const _LegalSection(this.title, this.body);

  final String title;
  final String body;
}

_LegalSpec _legalSpec(LegalDocument document) {
  switch (document) {
    case LegalDocument.privacy:
      return const _LegalSpec(
        title: 'Privacy Policy',
        updated: 'Effective July 2, 2026',
        icon: CupertinoIcons.eye_slash_fill,
        sections: [
          _LegalSection(
            'What Aurict stores',
            'Aurict Mobile stores provider API keys, local chats, generated artifacts, diagnostics, and model cache on your device unless a feature explicitly uses Aurict Backend for account, remote, or encrypted relay metadata.',
          ),
          _LegalSection(
            'What Aurict Backend sees',
            'The backend handles account identity, refresh tokens, trusted device metadata, encrypted secret transfer envelopes, and remote signaling metadata. Plaintext provider keys, prompts, terminal output, and model responses are not intentionally uploaded by the mobile app.',
          ),
          _LegalSection(
            'Firebase authentication',
            'Google and GitHub sign-in use Firebase Auth. The app exchanges a Firebase ID token for Aurict backend tokens, then stores Aurict tokens in secure device storage.',
          ),
          _LegalSection(
            'Diagnostics',
            'Runtime diagnostics are kept locally for debugging. If future versions add server-side diagnostics or analytics, the policy may change and the app should disclose that behavior.',
          ),
          _LegalSection(
            'Account deletion',
            'Deleting your account revokes Aurict backend sessions and account-linked device metadata. Device-local chats, exports, provider keys, and caches can be cleared from Settings because they are stored outside the backend account record.',
          ),
          _LegalSection(
            'Policy changes',
            'Aurict and the repository owner reserve the right to update this policy as the software, backend, or data model changes.',
          ),
        ],
      );
    case LegalDocument.terms:
      return const _LegalSpec(
        title: 'Terms of Use',
        updated: 'Effective July 2, 2026',
        icon: CupertinoIcons.doc_checkmark,
        sections: [
          _LegalSection(
            'Use of the software',
            'Aurict is provided as an open-source AI assistant and remote companion. You are responsible for your model provider keys, prompts, outputs, and how you use generated content.',
          ),
          _LegalSection(
            'Bring your own key',
            'Aurict does not sell model access in the mobile app. You connect your own providers and remain responsible for provider billing, provider terms, quotas, and key security.',
          ),
          _LegalSection(
            'No warranty',
            'The software is provided without warranties. AI outputs may be incomplete, inaccurate, unsafe, or unsuitable for your use case. Review important outputs before relying on them.',
          ),
          _LegalSection(
            'Security and remote control',
            'Remote control and secret transfer features must be used only with devices, systems, and accounts you own or are authorized to access. Misuse of security tooling or remote control is prohibited.',
          ),
          _LegalSection(
            'Account actions',
            'Aurict may revoke sessions, disable accounts, or change account-related behavior to protect the service, users, or infrastructure.',
          ),
          _LegalSection(
            'Terms changes',
            'Aurict and the repository owner reserve the right to modify these terms as the project, license posture, backend, or product model evolves.',
          ),
        ],
      );
  }
}

class ScreenFrame extends StatelessWidget {
  const ScreenFrame({
    required this.title,
    required this.subtitle,
    required this.child,
    this.trailing,
    super.key,
  });

  final String title;
  final String subtitle;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final compactWidth = MediaQuery.sizeOf(context).width < 390;
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        color: tokens.text,
                        fontSize: compactWidth ? 27 : 31,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -1.05,
                        height: 1.02,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: tokens.muted,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
              if (trailing != null) ...[
                const SizedBox(width: 10),
                Flexible(
                  child: Align(alignment: Alignment.topRight, child: trailing),
                ),
              ],
            ],
          ),
          const SizedBox(height: 18),
          Expanded(child: child),
        ],
      ),
    );
  }
}

class SideRail extends StatelessWidget {
  const SideRail({
    required this.selected,
    required this.onSelect,
    required this.remoteConnected,
    super.key,
  });

  final AppSection selected;
  final ValueChanged<AppSection> onSelect;
  final bool remoteConnected;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      padding: const EdgeInsets.all(16),
      blur: 44,
      opacity: isAndroidUi(context) ? .9 : .66,
      elevation: 3,
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  height: 40,
                  width: 40,
                  decoration: BoxDecoration(
                    color: tokens.accent,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: tokens.accent.withValues(alpha: .9),
                    ),
                    boxShadow: isAndroidUi(context)
                        ? null
                        : [
                            BoxShadow(
                              color: tokens.accent.withValues(alpha: .18),
                              blurRadius: 24,
                            ),
                          ],
                  ),
                  child: Icon(
                    CupertinoIcons.command,
                    color: tokens.background,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Aurict',
                        style: TextStyle(
                          color: tokens.text,
                          fontSize: 19,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      Text(
                        'Mobile agent console',
                        style: TextStyle(color: tokens.muted, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            NavItem(
              icon: CupertinoIcons.chat_bubble_2_fill,
              label: 'Chat',
              selected: selected == AppSection.chat,
              onTap: () => onSelect(AppSection.chat),
            ),
            NavItem(
              icon: Icons.desktop_mac_rounded,
              label: 'Remote',
              selected: selected == AppSection.remote,
              badge: remoteConnected ? 'live' : 'off',
              onTap: () => onSelect(AppSection.remote),
            ),
            NavItem(
              icon: CupertinoIcons.doc_text_fill,
              label: 'Documents',
              selected: selected == AppSection.documents,
              onTap: () => onSelect(AppSection.documents),
            ),
            NavItem(
              icon: Icons.vpn_key_rounded,
              label: 'API Keys',
              selected: selected == AppSection.keys,
              onTap: () => onSelect(AppSection.keys),
            ),
            NavItem(
              icon: CupertinoIcons.gear_alt_fill,
              label: 'Settings',
              selected: selected == AppSection.settings,
              onTap: () => onSelect(AppSection.settings),
            ),
            NavItem(
              icon: CupertinoIcons.person_crop_circle_fill,
              label: 'Account',
              selected: selected == AppSection.account,
              onTap: () => onSelect(AppSection.account),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: tokens.surface.withValues(alpha: .72),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: tokens.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    CupertinoIcons.lock_shield_fill,
                    color: tokens.success,
                    size: 21,
                  ),
                  const SizedBox(height: 9),
                  Text(
                    'Local-first security',
                    style: TextStyle(
                      color: tokens.text,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Keys stay on device. Remote uses trusted sessions.',
                    style: TextStyle(
                      color: tokens.muted,
                      height: 1.35,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class NavItem extends StatelessWidget {
  const NavItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
    this.badge,
    super.key,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final String? badge;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          decoration: BoxDecoration(
            color: selected
                ? tokens.accent.withValues(alpha: .16)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: selected
                  ? tokens.accent.withValues(alpha: .38)
                  : Colors.transparent,
            ),
          ),
          child: Row(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                width: 3,
                height: selected ? 22 : 10,
                decoration: BoxDecoration(
                  color: selected ? tokens.accent : Colors.transparent,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              const SizedBox(width: 10),
              Icon(
                icon,
                color: selected ? tokens.accent : tokens.muted,
                size: 19,
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    color: selected ? tokens.text : tokens.muted,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              if (badge != null)
                StatusPill(
                  label: badge!,
                  color: badge == 'live' ? tokens.success : tokens.muted,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class ModeSwitcher extends StatelessWidget {
  const ModeSwitcher({required this.mode, required this.onChanged, super.key});

  final AppMode mode;
  final ValueChanged<AppMode> onChanged;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final android = isAndroidUi(context);
    final panel = Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: tokens.glass.withValues(alpha: android ? .9 : .84),
        border: Border.all(color: tokens.border),
        borderRadius: BorderRadius.circular(999),
        boxShadow: android
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: .26),
                  blurRadius: adaptiveShadow(context, 28),
                  offset: const Offset(0, 16),
                ),
              ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          ModeButton(
            label: 'Chat',
            icon: CupertinoIcons.sparkles,
            active: mode == AppMode.chat,
            onTap: () => onChanged(AppMode.chat),
          ),
          ModeButton(
            label: 'Remote',
            icon: Icons.desktop_mac_rounded,
            active: mode == AppMode.remote,
            onTap: () => onChanged(AppMode.remote),
          ),
        ],
      ),
    );
    if (android) return panel;
    return ClipRRect(
      borderRadius: BorderRadius.circular(999),
      child: BackdropFilter(
        filter: ImageFilter.blur(
          sigmaX: adaptiveBlur(context, 30),
          sigmaY: adaptiveBlur(context, 30),
        ),
        child: panel,
      ),
    );
  }
}

class ModeButton extends StatelessWidget {
  const ModeButton({
    required this.label,
    required this.icon,
    required this.active,
    required this.onTap,
    super.key,
  });

  final String label;
  final IconData icon;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 9),
        decoration: BoxDecoration(
          color: active
              ? tokens.accent.withValues(alpha: .2)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          children: [
            Icon(icon, color: active ? tokens.accent : tokens.muted, size: 15),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: active ? tokens.text : tokens.muted,
                fontWeight: FontWeight.w900,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class PromptHeroCard extends StatelessWidget {
  const PromptHeroCard({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final compactWidth = MediaQuery.sizeOf(context).width < 390;
    return GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(CupertinoIcons.bolt_fill, color: tokens.accent, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Today workspace',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: tokens.text,
                    fontWeight: FontWeight.w900,
                    fontSize: compactWidth ? 15 : 16,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              StatusPill(label: 'multi-provider', color: tokens.success),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            'Build, read, write, summarize, and export from your phone.',
            style: TextStyle(
              color: tokens.text,
              fontSize: compactWidth ? 22 : 24,
              height: 1.05,
              fontWeight: FontWeight.w900,
              letterSpacing: -.8,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Use mobile keys for direct AI chat, or switch to Remote when desktop Aurict is online.',
            style: TextStyle(color: tokens.muted, height: 1.45, fontSize: 14),
          ),
          const SizedBox(height: 14),
          const Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ActionChipLite(label: 'Draft PDF'),
              ActionChipLite(label: 'Review code'),
              ActionChipLite(label: 'Read document'),
              ActionChipLite(label: 'Generate plan'),
            ],
          ),
        ],
      ),
    );
  }
}

class UserBubble extends StatelessWidget {
  const UserBubble({required this.text, super.key});
  final String text;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(left: 52, bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 13),
        decoration: BoxDecoration(
          color: tokens.accent.withValues(alpha: .16),
          border: Border.all(color: tokens.accent.withValues(alpha: .26)),
          boxShadow: isAndroidUi(context)
              ? null
              : [
                  BoxShadow(
                    color: tokens.accent.withValues(alpha: .06),
                    blurRadius: adaptiveShadow(context, 18),
                    offset: const Offset(0, 8),
                  ),
                ],
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(22),
            topRight: Radius.circular(22),
            bottomLeft: Radius.circular(22),
            bottomRight: Radius.circular(7),
          ),
        ),
        child: Text(
          text,
          style: TextStyle(color: tokens.text, height: 1.48, fontSize: 15),
        ),
      ),
    );
  }
}

class JumpToLatestChip extends StatelessWidget {
  const JumpToLatestChip({required this.onTap, super.key});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GestureDetector(
      onTap: onTap,
      child: GlassPanel(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(CupertinoIcons.arrow_down, color: tokens.accent, size: 14),
            const SizedBox(width: 7),
            Text(
              'Jump to latest',
              style: TextStyle(
                color: tokens.text,
                fontWeight: FontWeight.w900,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AssistantBubble extends StatefulWidget {
  const AssistantBubble({
    this.text =
        'I’ll convert the architecture note into a phased implementation plan, then produce a clean PDF-ready outline with risks, dependencies, and validation steps.',
    this.events = const [],
    this.skills = const [],
    this.reasoning = '',
    this.streamTools = const [],
    this.artifacts = const [],
    this.onArtifactAction,
    this.onReport,
    this.status,
    this.error,
    this.onRetry,
    super.key,
  });

  final String text;
  final List<MobileToolEvent> events;
  final List<MobileSkillDef> skills;
  final String reasoning;
  final List<MobileToolStreamBlock> streamTools;
  final List<ChatArtifact> artifacts;
  final Future<void> Function(ChatArtifact artifact, ArtifactAction action)?
  onArtifactAction;
  final VoidCallback? onReport;
  final String? status;
  final String? error;
  final Future<void> Function()? onRetry;

  @override
  State<AssistantBubble> createState() => _AssistantBubbleState();
}

class _AssistantBubbleState extends State<AssistantBubble> {
  var _showThinking = false;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final hasThinking = widget.reasoning.trim().isNotEmpty;
    return GlassPanel(
      margin: const EdgeInsets.only(right: 28, bottom: 12),
      opacity: isAndroidUi(context) ? .88 : .76,
      elevation: 1.25,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(CupertinoIcons.command, color: tokens.accent, size: 17),
              const SizedBox(width: 8),
              Text(
                'Aurict',
                style: TextStyle(
                  color: tokens.text,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(width: 8),
              StatusPill(
                label: widget.status ?? 'ready',
                color: widget.error == null ? tokens.accent : tokens.danger,
              ),
              const Spacer(),
              if (widget.onReport != null)
                GestureDetector(
                  onTap: widget.onReport,
                  child: Container(
                    height: 34,
                    width: 34,
                    decoration: BoxDecoration(
                      color: tokens.surface.withValues(alpha: .54),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: tokens.border),
                    ),
                    child: Icon(
                      CupertinoIcons.flag,
                      color: tokens.muted,
                      size: 16,
                      semanticLabel: 'Report answer',
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          if (hasThinking) ...[
            ThinkingToggleButton(
              expanded: _showThinking,
              onTap: () => setState(() => _showThinking = !_showThinking),
            ),
            if (_showThinking) ...[
              const SizedBox(height: 10),
              ReasoningPreview(text: widget.reasoning),
            ],
            const SizedBox(height: 10),
          ],
          if (widget.text.trim().isNotEmpty)
            if (widget.status == 'streaming' && widget.text.length > 4000)
              Text(
                widget.text,
                style: TextStyle(
                  color: tokens.text,
                  height: 1.45,
                  fontSize: 14,
                ),
              )
            else
              MobileMarkdownRenderer(
                content: widget.text,
                textColor: tokens.text,
                mutedColor: tokens.muted,
                borderColor: tokens.border,
                surfaceColor: tokens.surface,
                accentColor: tokens.accent,
                codeColor: tokens.code,
              )
          else if (widget.error == null)
            Text(
              'Thinking...',
              style: TextStyle(color: tokens.muted, height: 1.45, fontSize: 14),
            ),
          if (widget.error != null) ...[
            const SizedBox(height: 10),
            ErrorRetryWidget(
              message: 'Yanıt tamamlanamadı. Lütfen tekrar deneyin.',
              technicalDetail: widget.error,
              onRetry: widget.onRetry,
            ),
          ],
          if (widget.streamTools.isNotEmpty) ...[
            const SizedBox(height: 14),
            for (final tool in widget.streamTools) StreamToolCard(tool: tool),
          ],
          if (widget.skills.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final skill in widget.skills)
                  ActionChipLite(label: 'skill:${skill.id}'),
              ],
            ),
          ],
          if (widget.events.isNotEmpty) ...[
            const SizedBox(height: 14),
            MobileToolLedgerCard(events: widget.events),
          ],
          if (widget.artifacts.isNotEmpty) ...[
            const SizedBox(height: 14),
            ArtifactListCard(
              artifacts: widget.artifacts,
              onArtifactAction: widget.onArtifactAction,
            ),
          ],
        ],
      ),
    );
  }
}

class ArtifactListCard extends StatelessWidget {
  const ArtifactListCard({
    required this.artifacts,
    this.onArtifactAction,
    super.key,
  });

  final List<ChatArtifact> artifacts;
  final Future<void> Function(ChatArtifact artifact, ArtifactAction action)?
  onArtifactAction;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: tokens.surface.withValues(alpha: .58),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: tokens.accent.withValues(alpha: .30)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(CupertinoIcons.doc_richtext, color: tokens.accent, size: 17),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Generated files',
                  style: TextStyle(
                    color: tokens.text,
                    fontWeight: FontWeight.w900,
                    fontSize: 12.5,
                  ),
                ),
              ),
              StatusPill(label: '${artifacts.length}', color: tokens.accent),
            ],
          ),
          const SizedBox(height: 10),
          for (final artifact in artifacts)
            Padding(
              padding: const EdgeInsets.only(bottom: 9),
              child: ArtifactDownloadRow(
                artifact: artifact,
                onArtifactAction: onArtifactAction,
              ),
            ),
        ],
      ),
    );
  }
}

class ArtifactDownloadRow extends StatelessWidget {
  const ArtifactDownloadRow({
    required this.artifact,
    this.onArtifactAction,
    super.key,
  });

  final ChatArtifact artifact;
  final Future<void> Function(ChatArtifact artifact, ArtifactAction action)?
  onArtifactAction;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: .20),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: tokens.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                CupertinoIcons.arrow_down_doc,
                color: tokens.success,
                size: 16,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  artifact.name,
                  style: TextStyle(
                    color: tokens.text,
                    fontWeight: FontWeight.w900,
                    fontSize: 12.5,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              StatusPill(
                label: _sizeLabel(artifact.sizeBytes),
                color: tokens.success,
              ),
            ],
          ),
          const SizedBox(height: 7),
          Text(
            '${artifact.mimeType} · Save/share gate open until user exports it on device.',
            style: TextStyle(color: tokens.muted, height: 1.35, fontSize: 11.5),
          ),
          if (artifact.saved || artifact.shared) ...[
            const SizedBox(height: 7),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (artifact.saved)
                  StatusPill(label: 'saved', color: tokens.success),
                if (artifact.shared)
                  StatusPill(label: 'shared', color: tokens.success),
              ],
            ),
          ],
          const SizedBox(height: 9),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              SizedBox(
                width: 82,
                child: SecondaryButton(
                  label: 'Open',
                  color: tokens.accent,
                  onTap: () => _runAction(context, ArtifactAction.open),
                ),
              ),
              SizedBox(
                width: 116,
                child: SecondaryButton(
                  label: 'Save to phone',
                  color: tokens.accent,
                  onTap: () => _runAction(context, ArtifactAction.save),
                ),
              ),
              SizedBox(
                width: 86,
                child: SecondaryButton(
                  label: 'Share',
                  color: tokens.success,
                  onTap: () => _runAction(context, ArtifactAction.share),
                ),
              ),
              SizedBox(
                width: 92,
                child: SecondaryButton(
                  label: 'Delete',
                  color: tokens.danger,
                  onTap: () => _runAction(context, ArtifactAction.delete),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _sizeLabel(int bytes) {
    if (bytes <= 0) return 'preview';
    if (bytes < 1024) return '${bytes}B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)}KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)}MB';
  }

  void _runAction(BuildContext context, ArtifactAction action) {
    final handler = onArtifactAction;
    if (handler != null) {
      handler(artifact, action);
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          '${action.label} requested for ${artifact.name}. Native save/share bridge must complete the phone export gate.',
        ),
      ),
    );
  }
}

class ThinkingToggleButton extends StatelessWidget {
  const ThinkingToggleButton({
    required this.expanded,
    required this.onTap,
    super.key,
  });

  final bool expanded;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 8),
        decoration: BoxDecoration(
          color: tokens.surface.withValues(alpha: .58),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: tokens.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(CupertinoIcons.sparkles, color: tokens.muted, size: 14),
            const SizedBox(width: 7),
            Text(
              expanded ? 'Hide thinking' : 'Show thinking',
              style: TextStyle(
                color: tokens.muted,
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(width: 5),
            Icon(
              expanded
                  ? CupertinoIcons.chevron_up
                  : CupertinoIcons.chevron_down,
              color: tokens.muted,
              size: 12,
            ),
          ],
        ),
      ),
    );
  }
}

class ReasoningPreview extends StatelessWidget {
  const ReasoningPreview({required this.text, super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: tokens.surface.withValues(alpha: .58),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: tokens.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(CupertinoIcons.sparkles, color: tokens.muted, size: 15),
          const SizedBox(width: 8),
          Expanded(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 220),
              child: SingleChildScrollView(
                child: Text(
                  text.trim(),
                  style: TextStyle(
                    color: tokens.muted,
                    height: 1.35,
                    fontSize: 12,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class StreamToolCard extends StatelessWidget {
  const StreamToolCard({required this.tool, super.key});

  final MobileToolStreamBlock tool;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final detail = tool.arguments.trim().replaceAll(RegExp(r'\s+'), ' ');
    final result = ToolResultView.from(tool.result);
    final ok = result.ok ?? !tool.pending;
    final color = tool.pending
        ? tokens.warning
        : ok
        ? tokens.success
        : tokens.danger;
    return Container(
      margin: const EdgeInsets.only(bottom: 9),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: .24),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withValues(alpha: .34)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              StatusDot(color: color),
              const SizedBox(width: 9),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tool.name,
                      style: TextStyle(
                        color: tokens.text,
                        fontWeight: FontWeight.w900,
                        fontSize: 12.5,
                      ),
                    ),
                    if (detail.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(
                        detail.length > 180
                            ? '${detail.substring(0, 180)}...'
                            : detail,
                        style: TextStyle(
                          color: tokens.muted,
                          height: 1.35,
                          fontSize: 11.5,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              StatusPill(
                label: tool.pending
                    ? 'running'
                    : ok
                    ? 'done'
                    : 'failed',
                color: color,
              ),
            ],
          ),
          if (result.summary.isNotEmpty) ...[
            const SizedBox(height: 9),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: tokens.surface.withValues(alpha: .54),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: tokens.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    result.summary,
                    style: TextStyle(
                      color: ok ? tokens.text : tokens.danger,
                      height: 1.35,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if (result.policy.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      result.policy,
                      style: TextStyle(
                        color: tokens.muted,
                        height: 1.35,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class ToolResultView {
  const ToolResultView({this.ok, required this.summary, required this.policy});

  final bool? ok;
  final String summary;
  final String policy;

  static ToolResultView from(String? raw) {
    if (raw == null || raw.trim().isEmpty) {
      return const ToolResultView(ok: null, summary: '', policy: '');
    }
    final cached = _ToolResultViewCache.read(raw);
    if (cached != null) return cached;
    late final ToolResultView parsed;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, Object?>) {
        parsed = ToolResultView(ok: null, summary: _short(raw), policy: '');
        _ToolResultViewCache.write(raw, parsed);
        return parsed;
      }
      final ok = decoded['ok'] is bool ? decoded['ok'] as bool : null;
      final tool = decoded['tool']?.toString() ?? 'tool';
      final error = decoded['error']?.toString() ?? '';
      final policy = decoded['policy'];
      final policyNote = policy is Map<String, Object?>
          ? policy['note']?.toString() ?? ''
          : '';
      parsed = ToolResultView(
        ok: ok,
        summary: _summaryFor(tool, decoded, error),
        policy: policyNote,
      );
      _ToolResultViewCache.write(raw, parsed);
      return parsed;
    } catch (_) {
      parsed = ToolResultView(ok: null, summary: _short(raw), policy: '');
      _ToolResultViewCache.write(raw, parsed);
      return parsed;
    }
  }

  static String _summaryFor(
    String tool,
    Map<String, Object?> data,
    String error,
  ) {
    if (error.isNotEmpty) return 'Error: ${_short(error)}';
    switch (tool) {
      case 'web_search':
        final hits = data['hits'];
        final count = hits is List ? hits.length : 0;
        return 'Found $count public source candidate(s).';
      case 'source_distill':
        return 'Distilled ${data['citationCount'] ?? 0} citation-ready evidence item(s).';
      case 'document_export':
        return 'Artifact preview: ${data['artifactName'] ?? 'document'} · ${data['mimeType'] ?? 'unknown type'}.';
      case 'html_document_create':
        return 'HTML document ready: ${data['title'] ?? 'Aurict document'} · ${data['pageSize'] ?? 'A4'}.';
      case 'html_sanitize':
        final issues = data['issues'];
        final count = issues is List ? issues.length : 0;
        return count == 0
            ? 'HTML passed sanitizer.'
            : 'HTML sanitized with $count issue(s) removed.';
      case 'html_to_pdf':
        return 'PDF artifact rendered: ${data['artifactName'] ?? 'document.pdf'} · ${data['sizeBytes'] ?? 0} bytes. Save/share gate is still open.';
      case 'artifact_save':
        return data['saved'] == true
            ? 'Artifact saved to phone.'
            : 'Save needs native Files/SAF handler: ${_short(data['message']?.toString() ?? '')}';
      case 'artifact_share':
        return data['shared'] == true
            ? 'Share sheet opened for artifact.'
            : 'Share needs native share handler: ${_short(data['message']?.toString() ?? '')}';
      case 'task_ledger':
        final open = data['openGates'];
        final count = open is List ? open.length : 0;
        return count == 0
            ? 'Ledger gates satisfied.'
            : 'Ledger open gates: $count · current phase ${data['currentPhase'] ?? 'unknown'}.';
      case 'answer_verifier':
        return 'Verifier verdict: ${data['verdict'] ?? 'unknown'} · confidence ${data['confidence'] ?? 'unknown'}.';
      case 'safety_classifier':
        return 'Safety risks: ${data['risks'] ?? 'normal'}.';
      case 'calculator':
        return '${data['expression'] ?? 'expression'} = ${data['formatted'] ?? data['result'] ?? 'unknown'}.';
      case 'table_tool':
        return 'Generated markdown table with ${data['rowCount'] ?? 0} row(s).';
      case 'citation_manager':
        final citations = data['citations'];
        final count = citations is List ? citations.length : 0;
        return 'Formatted $count citation(s).';
      case 'ocr_read':
        return 'OCR text processed: ${_short(data['summary']?.toString() ?? '')}';
      case 'file_intake_policy':
        return 'File intake policy ready for ${data['requestedAction'] ?? 'user-selected content'}.';
      default:
        return 'Tool completed.';
    }
  }

  static String _short(String value) {
    final compact = value.replaceAll(RegExp(r'\s+'), ' ').trim();
    return compact.length > 180 ? '${compact.substring(0, 180)}...' : compact;
  }
}

class _ToolResultViewCache {
  _ToolResultViewCache._();

  static const _maxEntries = 80;
  static final _cache = <String, ToolResultView>{};

  static ToolResultView? read(String raw) {
    final view = _cache.remove(raw);
    if (view == null) return null;
    _cache[raw] = view;
    return view;
  }

  static void write(String raw, ToolResultView view) {
    _cache[raw] = view;
    if (_cache.length > _maxEntries) {
      _cache.remove(_cache.keys.first);
    }
  }
}

class ChatRecoveryCard extends StatelessWidget {
  const ChatRecoveryCard({
    required this.onRetry,
    required this.onClear,
    super.key,
  });

  final VoidCallback onRetry;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      margin: const EdgeInsets.only(right: 28, bottom: 12),
      borderColor: tokens.warning.withValues(alpha: .38),
      child: Column(
        children: [
          Row(
            children: [
              Icon(
                CupertinoIcons.arrow_counterclockwise,
                color: tokens.warning,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'The last response did not finish cleanly.',
                  style: TextStyle(
                    color: tokens.text,
                    fontWeight: FontWeight.w800,
                    fontSize: 12.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: SecondaryButton(
                  label: 'Clear',
                  color: tokens.muted,
                  onTap: onClear,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: PrimaryButton(
                  label: 'Retry',
                  icon: CupertinoIcons.refresh,
                  onTap: onRetry,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class MobileToolLedgerCard extends StatelessWidget {
  const MobileToolLedgerCard({required this.events, super.key});

  final List<MobileToolEvent> events;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: .24),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: tokens.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                CupertinoIcons.list_bullet_indent,
                color: tokens.success,
                size: 16,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Task ledger · auto-continue',
                  style: TextStyle(
                    color: tokens.text,
                    fontWeight: FontWeight.w900,
                    fontSize: 12.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          for (final event in events)
            Padding(
              padding: const EdgeInsets.only(bottom: 9),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 3),
                    child: StatusDot(
                      color: event.done ? tokens.success : tokens.warning,
                    ),
                  ),
                  const SizedBox(width: 9),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          event.title,
                          style: TextStyle(
                            color: tokens.text,
                            fontWeight: FontWeight.w900,
                            fontSize: 12.5,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          event.detail,
                          style: TextStyle(
                            color: tokens.muted,
                            height: 1.35,
                            fontSize: 11.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class CodeBlockCard extends StatelessWidget {
  const CodeBlockCard({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: .38),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: tokens.border),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 9),
            child: Row(
              children: [
                Text(
                  'implementation_plan.md',
                  style: TextStyle(
                    color: tokens.text,
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                  ),
                ),
                const Spacer(),
                Icon(CupertinoIcons.doc_on_doc, color: tokens.muted, size: 16),
              ],
            ),
          ),
          Container(height: 1, color: tokens.border),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Text(
              '## Phase 1\n- Create mobile shell\n- Add provider key vault\n- Build remote session cards\n\n## Phase 2\n- E2E relay protocol\n- Approval queue\n- Secure key sync',
              style: TextStyle(
                color: tokens.code,
                fontFamily: AurictTypography.mono,
                height: 1.45,
                fontSize: 12.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ChatComposer extends StatefulWidget {
  const ChatComposer({
    required this.placeholder,
    required this.accent,
    this.onSubmit,
    this.busy = false,
    this.onCancel,
    super.key,
  });

  final String placeholder;
  final Color accent;
  final ValueChanged<String>? onSubmit;
  final bool busy;
  final VoidCallback? onCancel;

  @override
  State<ChatComposer> createState() => _ChatComposerState();
}

class _ChatComposerState extends State<ChatComposer> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() {
    if (widget.busy) {
      widget.onCancel?.call();
      return;
    }
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    widget.onSubmit?.call(text);
    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final android = isAndroidUi(context);
    return PlatformBlur(
      enabled: !android,
      borderRadius: BorderRadius.circular(28),
      sigma: adaptiveBlur(context, 34),
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 11, 11, 11),
        decoration: BoxDecoration(
          color: tokens.glass.withValues(alpha: android ? .9 : .84),
          border: Border.all(color: tokens.border),
          borderRadius: BorderRadius.circular(28),
          boxShadow: android
              ? null
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: .3),
                    blurRadius: adaptiveShadow(context, 36),
                    offset: const Offset(0, 16),
                  ),
                  BoxShadow(
                    color: tokens.accent.withValues(alpha: .04),
                    blurRadius: adaptiveShadow(context, 28),
                  ),
                ],
        ),
        child: Row(
          children: [
            Icon(CupertinoIcons.paperclip, color: tokens.muted, size: 19),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: _controller,
                enabled: !widget.busy,
                minLines: 1,
                maxLines: 3,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _submit(),
                style: TextStyle(
                  color: tokens.text,
                  fontSize: 15,
                  height: 1.34,
                ),
                decoration: InputDecoration.collapsed(
                  hintText: widget.placeholder,
                  hintStyle: TextStyle(
                    color: tokens.muted,
                    fontSize: 14,
                    height: 1.34,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            GestureDetector(
              onTap: _submit,
              child: Container(
                height: 42,
                width: 42,
                decoration: BoxDecoration(
                  color: widget.accent,
                  borderRadius: BorderRadius.circular(17),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: .12),
                  ),
                  boxShadow: android
                      ? null
                      : [
                          BoxShadow(
                            color: widget.accent.withValues(alpha: .35),
                            blurRadius: adaptiveShadow(context, 20),
                            offset: const Offset(0, 10),
                          ),
                        ],
                ),
                child: Icon(
                  widget.busy
                      ? CupertinoIcons.stop_fill
                      : CupertinoIcons.arrow_up,
                  color: Colors.white,
                  size: 19,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ModelPill extends StatelessWidget {
  const ModelPill({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final providerSession = MobileProviderSessionScope.of(context);
    final compactWidth = MediaQuery.sizeOf(context).width < 390;
    final label = providerSession.selectedModel == null
        ? (compactWidth ? 'Local' : 'Local planner')
        : providerSession.selectedModel!;
    return GestureDetector(
      onTap: () => showAurictSheet(context, const ModelPickerSheet()),
      child: GlassPanel(
        padding: EdgeInsets.symmetric(
          horizontal: compactWidth ? 10 : 12,
          vertical: 9,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.memory_rounded, color: tokens.accent, size: 16),
            SizedBox(width: compactWidth ? 5 : 7),
            Flexible(
              child: Text(
                compactWidth ? _compactModelLabel(label) : label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: tokens.text,
                  fontWeight: FontWeight.w800,
                  fontSize: 12,
                ),
              ),
            ),
            SizedBox(width: compactWidth ? 3 : 5),
            Icon(CupertinoIcons.chevron_down, color: tokens.muted, size: 13),
          ],
        ),
      ),
    );
  }

  String _compactModelLabel(String label) {
    if (label == 'Local planner') return 'Local';
    if (label.length <= 12) return label;
    return '${label.substring(0, 10)}...';
  }
}

class ModelPickerSheet extends StatefulWidget {
  const ModelPickerSheet({super.key});

  @override
  State<ModelPickerSheet> createState() => _ModelPickerSheetState();
}

class _ModelPickerSheetState extends State<ModelPickerSheet> {
  final _searchController = TextEditingController();
  Timer? _searchDebounce;
  var _query = '';

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      _searchDebounce?.cancel();
      _searchDebounce = Timer(const Duration(milliseconds: 160), () {
        if (!mounted) return;
        setState(() => _query = _searchController.text.trim().toLowerCase());
      });
    });
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  // Arama sırasında hiçbir modeli eşleşmeyen provider kartlarını tamamen
  // gizler (önceden boş kart yine tam boyutuyla render edilip scroll'u
  // uzatıyordu). Arama yokken seçili provider'ı listenin başına taşır, böylece
  // sheet her açıldığında mevcut model için scroll gerekmez.
  List<MobileProviderEntry> _visibleProviders(
    MobileProviderSession providerSession,
  ) {
    final all = providerSession.entries;
    if (_query.isEmpty) {
      final selectedIndex = all.indexWhere(
        (provider) => provider.name == providerSession.selectedProvider,
      );
      if (selectedIndex <= 0) return all;
      return [
        all[selectedIndex],
        for (var i = 0; i < all.length; i++)
          if (i != selectedIndex) all[i],
      ];
    }
    return all
        .where(
          (provider) => providerSession
              .modelsFor(provider.name)
              .any((model) => model.toLowerCase().contains(_query)),
        )
        .toList(growable: false);
  }

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final providerSession = MobileProviderSessionScope.of(context);
    final providers = _visibleProviders(providerSession);
    final sheetHeight = math.min(
      MediaQuery.sizeOf(context).height * .78,
      560.0,
    );
    return GlassPanel(
      // Arama debounce'ı her tuş vuruşunda setState tetikliyor — kalıcı düz panel.
      disableBlur: true,
      child: SizedBox(
        height: sheetHeight,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.memory_rounded, color: tokens.accent),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Model selection',
                    style: TextStyle(
                      color: tokens.text,
                      fontWeight: FontWeight.w900,
                      fontSize: 20,
                    ),
                  ),
                ),
                StatusPill(
                  label: providerSession.canUseSelectedModel
                      ? 'ready'
                      : 'local',
                  color: providerSession.canUseSelectedModel
                      ? tokens.success
                      : tokens.muted,
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Fetch models from API Keys, then pick any provider/model used by Chat streaming. Search filters across long model lists.',
              style: TextStyle(color: tokens.muted, height: 1.4),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 12),
              decoration: BoxDecoration(
                color: tokens.surface.withValues(alpha: .72),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: tokens.border),
              ),
              child: Row(
                children: [
                  Icon(CupertinoIcons.search, color: tokens.muted, size: 17),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      style: TextStyle(color: tokens.text, fontSize: 13.5),
                      decoration: InputDecoration.collapsed(
                        hintText: 'Search all fetched models...',
                        hintStyle: TextStyle(
                          color: tokens.muted,
                          fontSize: 13.5,
                        ),
                      ),
                    ),
                  ),
                  if (_query.isNotEmpty)
                    GestureDetector(
                      onTap: _searchController.clear,
                      child: Icon(
                        CupertinoIcons.xmark_circle_fill,
                        color: tokens.muted,
                        size: 18,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Expanded(
              child: providers.isEmpty
                  ? Center(
                      child: Text(
                        'No providers have a model matching "$_query".',
                        style: TextStyle(color: tokens.muted),
                      ),
                    )
                  : ListView.builder(
                      itemCount: providers.length,
                      itemBuilder: (context, index) {
                        final provider = providers[index];
                        final models = providerSession.modelsFor(provider.name);
                        final selected =
                            providerSession.selectedProvider == provider.name;
                        return Padding(
                          padding: EdgeInsets.only(
                            bottom: index == providers.length - 1 ? 0 : 8,
                          ),
                          child: ModelProviderPickerRow(
                            provider: provider,
                            query: _query,
                            models: models,
                            favorites: providerSession.favoriteModelsFor(
                              provider.name,
                            ),
                            recent: providerSession.recentModelsFor(
                              provider.name,
                            ),
                            selected: selected,
                            selectedModel: selected
                                ? providerSession.selectedModel
                                : null,
                            hasKey: providerSession.hasKey(provider.name),
                            loading: providerSession.isLoading(provider.name),
                            onFetchModels: () => providerSession.fetchModels(
                              provider,
                              force: true,
                            ),
                            onSelect: (model) {
                              providerSession.selectModel(provider.name, model);
                              Navigator.pop(context);
                            },
                            isFavorite: (model) => providerSession
                                .isFavoriteModel(provider.name, model),
                            onToggleFavorite: (model) => providerSession
                                .toggleFavoriteModel(provider.name, model),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class ModelProviderPickerRow extends StatelessWidget {
  const ModelProviderPickerRow({
    required this.provider,
    required this.query,
    required this.models,
    required this.favorites,
    required this.recent,
    required this.selected,
    required this.hasKey,
    required this.loading,
    required this.onFetchModels,
    required this.onSelect,
    required this.isFavorite,
    required this.onToggleFavorite,
    this.selectedModel,
    super.key,
  });

  static const _collapsedModelLimit = 12;
  static const _searchResultLimit = 80;

  final MobileProviderEntry provider;
  final String query;
  final List<String> models;
  final List<String> favorites;
  final List<String> recent;
  final bool selected;
  final bool hasKey;
  final bool loading;
  final VoidCallback onFetchModels;
  final ValueChanged<String> onSelect;
  final bool Function(String model) isFavorite;
  final ValueChanged<String> onToggleFavorite;
  final String? selectedModel;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final filteredModels = _filteredModels();
    final visibleModels = _visibleModels(filteredModels);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: selected
            ? tokens.accent.withValues(alpha: .12)
            : tokens.surface.withValues(alpha: .62),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: selected
              ? tokens.accent.withValues(alpha: .34)
              : tokens.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  provider.name,
                  style: TextStyle(
                    color: tokens.text,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              StatusPill(
                label: hasKey ? '${models.length} models' : 'no key',
                color: hasKey ? tokens.success : tokens.muted,
              ),
            ],
          ),
          const SizedBox(height: 9),
          if (models.isEmpty)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  hasKey ? 'No cached models yet.' : provider.model,
                  style: TextStyle(color: tokens.muted, fontSize: 12.5),
                ),
                if (hasKey) ...[
                  const SizedBox(height: 9),
                  SecondaryButton(
                    label: loading ? 'Fetching...' : 'Fetch models',
                    color: tokens.accent,
                    onTap: loading ? null : onFetchModels,
                  ),
                ],
              ],
            )
          else if (filteredModels.isEmpty)
            Text(
              'No models match "$query".',
              style: TextStyle(color: tokens.muted, fontSize: 12.5),
            )
          else
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (query.isEmpty &&
                    (favorites.isNotEmpty || recent.isNotEmpty)) ...[
                  QuickModelSection(
                    title: 'Quick picks',
                    models: [
                      ...favorites,
                      for (final model in recent)
                        if (!favorites.contains(model)) model,
                    ],
                    selectedModel: selectedModel,
                    onSelect: onSelect,
                  ),
                  const SizedBox(height: 10),
                ],
                Text(
                  _resultLabel(filteredModels.length, visibleModels.length),
                  style: TextStyle(color: tokens.muted, fontSize: 11.5),
                ),
                const SizedBox(height: 8),
                ModelOptionList(
                  provider: provider.name,
                  models: visibleModels,
                  selectedModel: selectedModel,
                  isFavorite: isFavorite,
                  onToggleFavorite: onToggleFavorite,
                  onSelect: onSelect,
                ),
              ],
            ),
        ],
      ),
    );
  }

  List<String> _filteredModels() {
    if (query.isEmpty) return models;
    return models
        .where((model) => model.toLowerCase().contains(query))
        .take(_searchResultLimit)
        .toList(growable: false);
  }

  List<String> _visibleModels(List<String> filteredModels) {
    if (query.isNotEmpty || selected) return filteredModels;
    return filteredModels.take(_collapsedModelLimit).toList(growable: false);
  }

  String _resultLabel(int filteredCount, int visibleCount) {
    if (query.isNotEmpty) {
      if (filteredCount >= _searchResultLimit) {
        return 'Showing first $_searchResultLimit matches. Refine search for more.';
      }
      return 'Showing $filteredCount of ${models.length} matching models';
    }
    if (selected || visibleCount == models.length) {
      return 'Showing all ${models.length} models';
    }
    return 'Showing $visibleCount of ${models.length} models. Search to narrow the full list.';
  }
}

class QuickModelSection extends StatelessWidget {
  const QuickModelSection({
    required this.title,
    required this.models,
    required this.onSelect,
    this.selectedModel,
    super.key,
  });

  final String title;
  final List<String> models;
  final String? selectedModel;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    if (models.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            color: tokens.text,
            fontWeight: FontWeight.w900,
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 7),
        Wrap(
          spacing: 7,
          runSpacing: 7,
          children: [
            for (final model in models.take(10))
              GestureDetector(
                onTap: () => onSelect(model),
                child: ActionChipLite(
                  label: model == selectedModel ? '$model ✓' : model,
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class ModelOptionList extends StatelessWidget {
  const ModelOptionList({
    required this.provider,
    required this.models,
    required this.onSelect,
    required this.isFavorite,
    required this.onToggleFavorite,
    this.selectedModel,
    super.key,
  });

  final String provider;
  final List<String> models;
  final String? selectedModel;
  final ValueChanged<String> onSelect;
  final bool Function(String model) isFavorite;
  final ValueChanged<String> onToggleFavorite;

  @override
  Widget build(BuildContext context) {
    if (models.length <= 12) {
      return Wrap(
        spacing: 7,
        runSpacing: 7,
        children: [
          for (final model in models)
            GestureDetector(
              onTap: () => onSelect(model),
              child: ActionChipLite(
                label:
                    '${isFavorite(model) ? '★ ' : ''}${model == selectedModel ? '$model ✓' : model}',
              ),
            ),
        ],
      );
    }
    return ConstrainedBox(
      constraints: const BoxConstraints(maxHeight: 260),
      child: ListView.builder(
        shrinkWrap: true,
        itemCount: models.length,
        itemBuilder: (context, index) {
          final model = models[index];
          return ModelOptionTile(
            provider: provider,
            model: model,
            selected: model == selectedModel,
            favorite: isFavorite(model),
            onTap: () => onSelect(model),
            onToggleFavorite: () => onToggleFavorite(model),
          );
        },
      ),
    );
  }
}

class ModelOptionTile extends StatelessWidget {
  const ModelOptionTile({
    required this.provider,
    required this.model,
    required this.selected,
    required this.favorite,
    required this.onTap,
    required this.onToggleFavorite,
    super.key,
  });

  final String provider;
  final String model;
  final bool selected;
  final bool favorite;
  final VoidCallback onTap;
  final VoidCallback onToggleFavorite;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 7),
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 10),
        decoration: BoxDecoration(
          color: selected
              ? tokens.accent.withValues(alpha: .14)
              : tokens.surface.withValues(alpha: .42),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected
                ? tokens.accent.withValues(alpha: .36)
                : tokens.border,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                model,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: tokens.text,
                  fontWeight: FontWeight.w800,
                  fontSize: 12.5,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              provider,
              style: TextStyle(color: tokens.muted, fontSize: 10.5),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: onToggleFavorite,
              child: Icon(
                favorite ? CupertinoIcons.star_fill : CupertinoIcons.star,
                color: favorite ? tokens.accent : tokens.muted,
                size: 17,
              ),
            ),
            if (selected) ...[
              const SizedBox(width: 7),
              Icon(
                CupertinoIcons.checkmark_alt,
                color: tokens.accent,
                size: 14,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class RemoteEmptyCard extends StatelessWidget {
  const RemoteEmptyCard({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(CupertinoIcons.power, color: tokens.warning, size: 24),
          const SizedBox(height: 12),
          Text(
            'Remote is opt-in from desktop.',
            style: TextStyle(
              color: tokens.text,
              fontSize: 22,
              fontWeight: FontWeight.w900,
              letterSpacing: -.5,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Run /remote in Aurict CLI. This phone can discover sessions only after desktop explicitly enables remote control.',
            style: TextStyle(color: tokens.muted, height: 1.45),
          ),
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: .32),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: tokens.border),
            ),
            child: Text(
              '~/Desktop/Aurict  aurict\n> /remote\nRemote control enabled.',
              style: TextStyle(
                color: tokens.code,
                fontFamily: AurictTypography.mono,
                fontSize: 12.5,
                height: 1.45,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class RemoteSessionCard extends StatelessWidget {
  const RemoteSessionCard({
    required this.session,
    required this.busy,
    required this.onConnect,
    super.key,
  });

  final MobileRemoteSession session;
  final bool busy;
  final VoidCallback onConnect;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final compactWidth = MediaQuery.sizeOf(context).width < 390;
    return GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                height: 46,
                width: 46,
                decoration: BoxDecoration(
                  color: tokens.success.withValues(alpha: .16),
                  borderRadius: BorderRadius.circular(17),
                ),
                child: Icon(
                  CupertinoIcons.desktopcomputer,
                  color: tokens.success,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Desktop ${_shortDeviceId(session.desktopDeviceId)}',
                      style: TextStyle(
                        color: tokens.text,
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text(
                      '${session.connectionMode.toUpperCase()} · expires ${_relativeTime(session.expiresAt)}',
                      style: TextStyle(color: tokens.muted, fontSize: 12.5),
                    ),
                  ],
                ),
              ),
              StatusPill(
                label: compactWidth ? 'trust' : session.status,
                color: tokens.warning,
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: MetricTile(
                  label: 'Protocol',
                  value: 'v${session.protocolVersion}',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: MetricTile(
                  label: 'Seq',
                  value: session.lastSequence.toString(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          PrimaryButton(
            label: busy ? 'Connecting...' : 'Connect and trust session',
            icon: CupertinoIcons.lock_open,
            onTap: busy ? () {} : onConnect,
          ),
        ],
      ),
    );
  }
}

class RemoteControlStatusCard extends StatelessWidget {
  const RemoteControlStatusCard({required this.runtime, super.key});

  final MobileRemoteRuntime runtime;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final error = runtime.error;
    final identity = runtime.identity;
    return GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(_remoteStatusIcon(runtime.status), color: tokens.accent),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  _remoteStatusTitle(runtime.status),
                  style: TextStyle(
                    color: tokens.text,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              StatusPill(
                label: '${runtime.sessions.length} session',
                color: runtime.sessions.isEmpty ? tokens.muted : tokens.success,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            _remoteStatusDescription(runtime.status, error),
            style: TextStyle(color: tokens.muted, height: 1.45),
          ),
          if (identity != null) ...[
            const SizedBox(height: 12),
            SettingsRow(
              icon: CupertinoIcons.device_phone_portrait,
              title: 'Mobile device',
              value: _shortDeviceId(identity.deviceId),
            ),
            SettingsRow(
              icon: CupertinoIcons.signature,
              title: 'Safety code',
              value: remoteSafetyCode(identity.signingKeyFingerprint),
            ),
          ],
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: SecondaryButton(
                  label: 'Refresh sessions',
                  color: tokens.accent,
                  onTap: _remoteStatusBusy(runtime.status)
                      ? null
                      : () => unawaited(runtime.bootstrap()),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class TrustExplainerCard extends StatelessWidget {
  const TrustExplainerCard({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionLabel('Trusted device model'),
          const SizedBox(height: 10),
          Text(
            'Session trust is temporary by default. Persistent trust can be remembered and revoked from CLI or mobile settings.',
            style: TextStyle(color: tokens.muted, height: 1.45),
          ),
          const SizedBox(height: 12),
          const Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ActionChipLite(label: 'Trust session'),
              ActionChipLite(label: 'Remember device'),
              ActionChipLite(label: 'Revoke anytime'),
            ],
          ),
        ],
      ),
    );
  }
}

class RemoteStatusStrip extends StatelessWidget {
  const RemoteStatusStrip({required this.runtime, super.key});

  final MobileRemoteRuntime runtime;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final session = runtime.currentSession;
    return GlassPanel(
      padding: const EdgeInsets.all(13),
      child: Row(
        children: [
          StatusDot(color: runtime.connected ? tokens.success : tokens.warning),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              session == null
                  ? 'Connecting · peer transport pending'
                  : 'Connected · ${_relativeTime(session.expiresAt)} TTL · seq ${runtime.lastSequence}',
              style: TextStyle(
                color: tokens.text,
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
            ),
          ),
          Icon(
            CupertinoIcons.waveform_path_ecg,
            color: tokens.accent,
            size: 18,
          ),
        ],
      ),
    );
  }
}

String _remoteStatusLabel(MobileRemoteStatus status) {
  return switch (status) {
    MobileRemoteStatus.signedOut => 'sign in',
    MobileRemoteStatus.registeringDevice => 'device',
    MobileRemoteStatus.discovering => 'scan',
    MobileRemoteStatus.empty => 'idle',
    MobileRemoteStatus.available => 'ready',
    MobileRemoteStatus.accepting => 'trust',
    MobileRemoteStatus.connected => 'live',
    MobileRemoteStatus.reconnecting => 'resume',
    MobileRemoteStatus.expired => 'expired',
    MobileRemoteStatus.error => 'error',
  };
}

String _remoteStatusTitle(MobileRemoteStatus status) {
  return switch (status) {
    MobileRemoteStatus.signedOut => 'Sign in to use remote control',
    MobileRemoteStatus.registeringDevice => 'Registering trusted device',
    MobileRemoteStatus.discovering => 'Looking for desktop sessions',
    MobileRemoteStatus.empty => 'No desktop session is available',
    MobileRemoteStatus.available => 'Desktop session discovered',
    MobileRemoteStatus.accepting => 'Requesting trusted connection',
    MobileRemoteStatus.connected => 'Connected to desktop Aurict',
    MobileRemoteStatus.reconnecting => 'Resuming remote session',
    MobileRemoteStatus.expired => 'Remote session expired',
    MobileRemoteStatus.error => 'Remote setup needs attention',
  };
}

String _remoteStatusDescription(MobileRemoteStatus status, String? error) {
  if (status == MobileRemoteStatus.error && error != null) {
    if (error.contains('device_not_trusted')) {
      return 'This phone is verified, but the desktop has not trusted it yet. Keep /remote open on CLI and approve this device there when CLI support is connected.';
    }
    return error;
  }
  return switch (status) {
    MobileRemoteStatus.signedOut =>
      'Use the Account tab to sign in with Google or GitHub. Remote sessions are account-bound.',
    MobileRemoteStatus.registeringDevice =>
      'The phone is generating a local signing key and proving ownership to Aurict backend.',
    MobileRemoteStatus.discovering =>
      'Aurict is checking for CLI sessions opened with /remote. Backend carries signaling only, never prompts or terminal output.',
    MobileRemoteStatus.empty =>
      'Run /remote on desktop CLI while signed into the same account, then refresh here.',
    MobileRemoteStatus.available =>
      'Select the desktop session below to send a signed answer and start peer-to-peer setup.',
    MobileRemoteStatus.accepting =>
      'The session answer is being signed locally. If trust is missing, desktop approval will be required.',
    MobileRemoteStatus.connected =>
      'Heartbeat is active. Prompt payloads are prepared for the peer data-plane, not the backend.',
    MobileRemoteStatus.reconnecting =>
      'Aurict is using the stored resume token to restore session state.',
    MobileRemoteStatus.expired =>
      'The desktop session TTL or idle timeout ended. Re-enable /remote from CLI.',
    MobileRemoteStatus.error =>
      'Remote setup failed. Refresh after fixing the issue.',
  };
}

bool _remoteStatusBusy(MobileRemoteStatus status) {
  return status == MobileRemoteStatus.registeringDevice ||
      status == MobileRemoteStatus.discovering ||
      status == MobileRemoteStatus.accepting ||
      status == MobileRemoteStatus.reconnecting;
}

IconData _remoteStatusIcon(MobileRemoteStatus status) {
  return switch (status) {
    MobileRemoteStatus.signedOut =>
      CupertinoIcons.person_crop_circle_badge_xmark,
    MobileRemoteStatus.registeringDevice =>
      CupertinoIcons.device_phone_portrait,
    MobileRemoteStatus.discovering => CupertinoIcons.dot_radiowaves_left_right,
    MobileRemoteStatus.empty => CupertinoIcons.power,
    MobileRemoteStatus.available => CupertinoIcons.desktopcomputer,
    MobileRemoteStatus.accepting => CupertinoIcons.lock_shield,
    MobileRemoteStatus.connected => CupertinoIcons.checkmark_shield,
    MobileRemoteStatus.reconnecting => CupertinoIcons.arrow_clockwise,
    MobileRemoteStatus.expired => CupertinoIcons.timer,
    MobileRemoteStatus.error => CupertinoIcons.exclamationmark_triangle,
  };
}

Color _remoteStatusColor(BuildContext context, MobileRemoteStatus status) {
  final tokens = TokensScope.of(context);
  return switch (status) {
    MobileRemoteStatus.available ||
    MobileRemoteStatus.connected => tokens.success,
    MobileRemoteStatus.error || MobileRemoteStatus.expired => tokens.danger,
    MobileRemoteStatus.signedOut || MobileRemoteStatus.empty => tokens.muted,
    _ => tokens.warning,
  };
}

String _shortDeviceId(String value) {
  if (value.length <= 14) return value;
  return '${value.substring(0, 8)}…${value.substring(value.length - 4)}';
}

String _relativeTime(DateTime value) {
  final delta = value.difference(DateTime.now());
  if (delta.isNegative) return 'expired';
  if (delta.inHours >= 1) return '${delta.inHours}h';
  if (delta.inMinutes >= 1) return '${delta.inMinutes}m';
  return '${delta.inSeconds.clamp(0, 59)}s';
}

enum TimelineState { done, running, waiting }

class TimelineCard extends StatelessWidget {
  const TimelineCard({
    required this.step,
    required this.detail,
    required this.state,
    super.key,
  });

  final String step;
  final String detail;
  final TimelineState state;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final color = state == TimelineState.done
        ? tokens.success
        : state == TimelineState.waiting
        ? tokens.warning
        : tokens.accent;
    return GlassPanel(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          StatusDot(color: color),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  step,
                  style: TextStyle(
                    color: tokens.text,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  detail,
                  style: TextStyle(color: tokens.muted, fontSize: 12.5),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ToolCallCard extends StatelessWidget {
  const ToolCallCard({
    required this.tool,
    required this.detail,
    required this.risk,
    super.key,
  });

  final String tool;
  final String detail;
  final String risk;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      margin: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Container(
            height: 40,
            width: 40,
            decoration: BoxDecoration(
              color: tokens.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: tokens.border),
            ),
            child: Icon(
              CupertinoIcons.hammer_fill,
              color: tokens.accent,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tool,
                  style: TextStyle(
                    color: tokens.text,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  detail,
                  style: TextStyle(color: tokens.muted, fontSize: 12.5),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          StatusPill(
            label: risk,
            color: risk == 'low' ? tokens.success : tokens.warning,
          ),
        ],
      ),
    );
  }
}

class ApprovalCard extends StatelessWidget {
  const ApprovalCard({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      margin: const EdgeInsets.only(bottom: 10),
      borderColor: tokens.warning.withValues(alpha: .45),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                CupertinoIcons.exclamationmark_triangle_fill,
                color: tokens.warning,
                size: 19,
              ),
              const SizedBox(width: 8),
              Text(
                'Approval required',
                style: TextStyle(
                  color: tokens.text,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const Spacer(),
              StatusPill(label: 'write', color: tokens.warning),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'Apply patch to 3 files and run tests.',
            style: TextStyle(color: tokens.muted),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: SecondaryButton(label: 'Deny', color: tokens.danger),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: PrimaryButton(
                  label: 'Approve',
                  icon: CupertinoIcons.checkmark_alt,
                  onTap: () {},
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class DiffPreviewCard extends StatelessWidget {
  const DiffPreviewCard({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      margin: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(CupertinoIcons.arrow_branch, color: tokens.accent, size: 18),
              const SizedBox(width: 8),
              Text(
                'Diff preview',
                style: TextStyle(
                  color: tokens.text,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const Spacer(),
              Text(
                '+128 / -31',
                style: TextStyle(
                  color: tokens.success,
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const FileChangeRow(
            path: 'lib/features/remote/session.dart',
            change: '+76',
          ),
          const FileChangeRow(
            path: 'lib/app/theme/theme_tokens.dart',
            change: '+38',
          ),
          const FileChangeRow(
            path: 'lib/features/chat/chat_screen.dart',
            change: '-12',
          ),
        ],
      ),
    );
  }
}

class TestResultCard extends StatelessWidget {
  const TestResultCard({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      margin: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(
            CupertinoIcons.checkmark_seal_fill,
            color: tokens.success,
            size: 22,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'flutter analyze · 0 issues',
              style: TextStyle(color: tokens.text, fontWeight: FontWeight.w900),
            ),
          ),
          StatusPill(label: 'passed', color: tokens.success),
        ],
      ),
    );
  }
}

class FileChangeRow extends StatelessWidget {
  const FileChangeRow({required this.path, required this.change, super.key});
  final String path;
  final String change;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              path,
              style: TextStyle(
                color: tokens.muted,
                fontFamily: AurictTypography.mono,
                fontSize: 12,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text(
            change,
            style: TextStyle(
              color: change.startsWith('+') ? tokens.success : tokens.danger,
              fontWeight: FontWeight.w900,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class DocumentUploadCard extends StatelessWidget {
  const DocumentUploadCard({
    required this.count,
    required this.selectedCount,
    required this.loading,
    required this.importing,
    required this.onImport,
    required this.onRefresh,
    super.key,
  });

  final int count;
  final int selectedCount;
  final bool loading;
  final bool importing;
  final VoidCallback onRefresh;
  final VoidCallback onImport;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(CupertinoIcons.folder_fill, color: tokens.accent, size: 25),
              const Spacer(),
              GestureDetector(
                onTap: onRefresh,
                child: StatusPill(
                  label: loading ? 'scanning' : 'refresh',
                  color: loading ? tokens.muted : tokens.accent,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            count == 0
                ? selectedCount == 0
                      ? 'Generated file library.'
                      : '$selectedCount selected document(s).'
                : '$count generated file(s).',
            style: TextStyle(
              color: tokens.text,
              fontSize: 21,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Pick PDFs, Markdown, TXT, JSON, or CSV from this device. Aurict stores metadata and short previews only; generated exports still require explicit save/share.',
            style: TextStyle(color: tokens.muted, height: 1.45),
          ),
          const SizedBox(height: 14),
          SecondaryButton(
            label: importing ? 'Opening picker...' : 'Import local document',
            color: tokens.accent,
            onTap: importing ? () {} : onImport,
          ),
        ],
      ),
    );
  }
}

class PickedDocumentCard extends StatelessWidget {
  const PickedDocumentCard({required this.document, super.key});

  final MobilePickedDocument document;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      // Belge listesi scroll ederken tekrarlanan gerçek zamanlı blur maliyetini
      // önler.
      disableBlur: true,
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                height: 48,
                width: 48,
                decoration: BoxDecoration(
                  color: tokens.success.withValues(alpha: .13),
                  borderRadius: BorderRadius.circular(17),
                ),
                child: Icon(CupertinoIcons.doc_text, color: tokens.success),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      document.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: tokens.text,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${document.mimeType} · ${_sizeLabel(document.sizeBytes)}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: tokens.muted, fontSize: 12.5),
                    ),
                  ],
                ),
              ),
              StatusPill(label: 'local', color: tokens.success),
            ],
          ),
          if (document.hasTextPreview) ...[
            const SizedBox(height: 10),
            Text(
              document.textPreview.replaceAll(RegExp(r'\s+'), ' ').trim(),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: tokens.muted, height: 1.35, fontSize: 12),
            ),
          ],
        ],
      ),
    );
  }

  String _sizeLabel(int bytes) {
    if (bytes <= 0) return 'unknown size';
    if (bytes < 1024) return '${bytes}B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)}KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)}MB';
  }
}

class DocumentStateCard extends StatelessWidget {
  const DocumentStateCard({
    required this.icon,
    required this.title,
    required this.body,
    super.key,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: tokens.muted, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: tokens.text,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 5),
                Text(body, style: TextStyle(color: tokens.muted, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ArtifactDocumentCard extends StatelessWidget {
  const ArtifactDocumentCard({
    required this.record,
    required this.onPreview,
    required this.onOpen,
    required this.onSave,
    required this.onShare,
    required this.onDelete,
    super.key,
  });

  final DocumentArtifactRecord record;
  final VoidCallback onPreview;
  final VoidCallback onOpen;
  final VoidCallback onSave;
  final VoidCallback onShare;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final artifact = record.artifact;
    return GlassPanel(
      // Belge listesi scroll ederken tekrarlanan gerçek zamanlı blur maliyetini
      // önler.
      disableBlur: true,
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                height: 48,
                width: 48,
                decoration: BoxDecoration(
                  color: tokens.accent.withValues(alpha: .15),
                  borderRadius: BorderRadius.circular(17),
                ),
                child: Icon(CupertinoIcons.doc_richtext, color: tokens.accent),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      artifact.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: tokens.text,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${artifact.mimeType} · ${_sizeLabel(artifact.sizeBytes)} · ${record.threadTitle}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: tokens.muted, fontSize: 12.5),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (artifact.preview.trim().isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              artifact.preview.replaceAll(RegExp(r'\s+'), ' ').trim(),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: tokens.muted, height: 1.35, fontSize: 12),
            ),
          ],
          if (artifact.saved || artifact.shared) ...[
            const SizedBox(height: 9),
            Wrap(
              spacing: 8,
              children: [
                if (artifact.saved)
                  StatusPill(label: 'saved', color: tokens.success),
                if (artifact.shared)
                  StatusPill(label: 'shared', color: tokens.success),
              ],
            ),
          ],
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              SizedBox(
                width: 104,
                child: SecondaryButton(
                  label: 'Preview',
                  color: tokens.muted,
                  onTap: onPreview,
                ),
              ),
              SizedBox(
                width: 82,
                child: SecondaryButton(
                  label: 'Open',
                  color: tokens.accent,
                  onTap: onOpen,
                ),
              ),
              SizedBox(
                width: 86,
                child: SecondaryButton(
                  label: 'Save',
                  color: tokens.accent,
                  onTap: onSave,
                ),
              ),
              SizedBox(
                width: 86,
                child: SecondaryButton(
                  label: 'Share',
                  color: tokens.success,
                  onTap: onShare,
                ),
              ),
              SizedBox(
                width: 92,
                child: SecondaryButton(
                  label: 'Delete',
                  color: tokens.danger,
                  onTap: onDelete,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _sizeLabel(int bytes) {
    if (bytes <= 0) return 'preview';
    if (bytes < 1024) return '${bytes}B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)}KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)}MB';
  }
}

class ArtifactPreviewSheet extends StatelessWidget {
  const ArtifactPreviewSheet({required this.record, super.key});

  final DocumentArtifactRecord record;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final artifact = record.artifact;
    return GlassPanel(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxHeight: 520),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(CupertinoIcons.doc_richtext, color: tokens.accent),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      artifact.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: tokens.text,
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  StatusPill(label: artifact.mimeType, color: tokens.accent),
                  StatusPill(
                    label: _sizeLabel(artifact.sizeBytes),
                    color: tokens.muted,
                  ),
                  StatusPill(
                    label: 'source: ${record.threadTitle}',
                    color: tokens.success,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                artifact.preview.trim().isEmpty
                    ? 'No preview text was stored for this artifact. Use Save or Share to export the generated file if native bytes are still cached.'
                    : artifact.preview.replaceAll(RegExp(r'\s+'), ' ').trim(),
                style: TextStyle(color: tokens.muted, height: 1.45),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _sizeLabel(int bytes) {
    if (bytes <= 0) return 'preview';
    if (bytes < 1024) return '${bytes}B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)}KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)}MB';
  }
}

class DocumentCard extends StatelessWidget {
  const DocumentCard({
    required this.title,
    required this.type,
    required this.meta,
    super.key,
  });

  final String title;
  final String type;
  final String meta;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      margin: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            height: 48,
            width: 48,
            decoration: BoxDecoration(
              color: tokens.accent.withValues(alpha: .15),
              borderRadius: BorderRadius.circular(17),
            ),
            child: Icon(CupertinoIcons.doc_text_fill, color: tokens.accent),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: tokens.text,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '$type · $meta',
                  style: TextStyle(color: tokens.muted, fontSize: 12.5),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Icon(CupertinoIcons.chevron_right, color: tokens.muted, size: 17),
        ],
      ),
    );
  }
}

class ProviderCard extends StatelessWidget {
  const ProviderCard({
    required this.name,
    required this.status,
    required this.model,
    required this.active,
    required this.onTap,
    this.models = const [],
    this.error,
    super.key,
  });

  final String name;
  final String status;
  final String model;
  final bool active;
  final VoidCallback onTap;
  final List<String> models;
  final String? error;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GestureDetector(
      onTap: onTap,
      child: GlassPanel(
        // Uzun provider listesinde scroll ederken gerçek zamanlı blur'un
        // maliyetini önlemek için sabit panele düş.
        disableBlur: true,
        margin: const EdgeInsets.only(bottom: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  height: 48,
                  width: 48,
                  decoration: BoxDecoration(
                    color: (active ? tokens.success : tokens.surface)
                        .withValues(alpha: active ? .16 : 1),
                    borderRadius: BorderRadius.circular(17),
                    border: Border.all(color: tokens.border),
                  ),
                  child: Icon(
                    active
                        ? CupertinoIcons.checkmark_shield_fill
                        : CupertinoIcons.plus,
                    color: active ? tokens.success : tokens.muted,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: TextStyle(
                          color: tokens.text,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        model,
                        style: TextStyle(color: tokens.muted, fontSize: 12.5),
                      ),
                    ],
                  ),
                ),
                StatusPill(
                  label: status,
                  color: active ? tokens.success : tokens.muted,
                ),
              ],
            ),
            if (error != null) ...[
              const SizedBox(height: 10),
              Text(
                error!,
                style: TextStyle(color: tokens.danger, fontSize: 12),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            if (models.isNotEmpty) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 7,
                runSpacing: 7,
                children: [
                  for (final model in models.take(3))
                    ActionChipLite(label: model),
                  if (models.length > 3)
                    ActionChipLite(label: '+${models.length - 3} more'),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Sheet açılış/kapanış geçişi sürerken `true` — `GlassPanel` bunu okuyup iOS
/// blur'unu (BackdropFilter) geçici olarak atlar, çünkü blur'lu katmanın konumu
/// her karede değiştiğinde yeniden hesaplanması pahalıdır. Bulunamazsa (sheet
/// dışında her yerde) `false` döner — davranış hiç değişmez.
class SheetTransitionScope extends InheritedWidget {
  const SheetTransitionScope({
    required this.reduceEffects,
    required super.child,
    super.key,
  });

  final bool reduceEffects;

  static bool of(BuildContext context) =>
      context
          .dependOnInheritedWidgetOfExactType<SheetTransitionScope>()
          ?.reduceEffects ??
      false;

  @override
  bool updateShouldNotify(SheetTransitionScope oldWidget) =>
      reduceEffects != oldWidget.reduceEffects;
}

void showAurictSheet(BuildContext context, Widget child) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) {
      final route = ModalRoute.of(context);
      final padded = Padding(
        padding: EdgeInsets.only(
          left: 14,
          right: 14,
          bottom: MediaQuery.viewInsetsOf(context).bottom + 14,
        ),
        child: child,
      );
      final routeAnimation = route?.animation;
      if (routeAnimation == null) return padded;
      return AnimatedBuilder(
        animation: routeAnimation,
        child: padded,
        builder: (context, sheetChild) {
          return SheetTransitionScope(
            reduceEffects: routeAnimation.status != AnimationStatus.completed,
            child: sheetChild!,
          );
        },
      );
    },
  );
}

class ReportAnswerSheet extends StatefulWidget {
  const ReportAnswerSheet({required this.onSubmit, super.key});

  final Future<void> Function(MobileFeedbackReportReason reason, String note)
  onSubmit;

  @override
  State<ReportAnswerSheet> createState() => _ReportAnswerSheetState();
}

class _ReportAnswerSheetState extends State<ReportAnswerSheet> {
  final _noteController = TextEditingController();
  var _reason = MobileFeedbackReportReason.incorrect;
  var _submitting = false;

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      // Chip seçimi/gönderme durumu sık setState tetikliyor — BackdropFilter
      // her seferinde reblur olmasın diye kalıcı olarak düz panele geç.
      disableBlur: true,
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(CupertinoIcons.flag_fill, color: tokens.danger),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Report answer',
                    style: TextStyle(
                      color: tokens.text,
                      fontWeight: FontWeight.w900,
                      fontSize: 20,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              'Aurict will receive this AI answer, the related user prompt, model metadata, tool summary, and your note. API keys, full chat history, and local files are not sent.',
              style: TextStyle(color: tokens.muted, height: 1.45, fontSize: 13),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final reason in MobileFeedbackReportReason.values)
                  _ReportReasonChip(
                    label: reason.label,
                    selected: _reason == reason,
                    onTap: () => setState(() => _reason = reason),
                  ),
              ],
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _noteController,
              maxLines: 4,
              maxLength: 1500,
              style: TextStyle(color: tokens.text, fontSize: 13.5),
              decoration: InputDecoration(
                hintText: 'Optional note',
                hintStyle: TextStyle(color: tokens.muted),
                filled: true,
                fillColor: tokens.surface.withValues(alpha: .46),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(color: tokens.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(color: tokens.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(color: tokens.accent),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: SecondaryButton(
                    label: 'Cancel',
                    color: tokens.muted,
                    onTap: _submitting ? null : () => Navigator.pop(context),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: PrimaryButton(
                    label: _submitting ? 'Sending' : 'Send report',
                    icon: CupertinoIcons.paperplane_fill,
                    onTap: _submitting ? () {} : _submit,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      await widget.onSubmit(_reason, _noteController.text);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}

class _ReportReasonChip extends StatelessWidget {
  const _ReportReasonChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final color = selected ? tokens.accent : tokens.muted;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 9),
        decoration: BoxDecoration(
          color: color.withValues(alpha: selected ? .18 : .08),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: color.withValues(alpha: selected ? .44 : .20),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? tokens.text : tokens.muted,
            fontSize: 12,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}

class TrustDeviceSheet extends StatelessWidget {
  const TrustDeviceSheet({required this.onTrust, super.key});

  final VoidCallback onTrust;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(CupertinoIcons.lock_shield_fill, color: tokens.success),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Trust this desktop session?',
                  style: TextStyle(
                    color: tokens.text,
                    fontWeight: FontWeight.w900,
                    fontSize: 20,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'f0x017-debian wants to allow prompt input, live output, tool approvals, and diff/test visibility from this phone.',
            style: TextStyle(color: tokens.muted, height: 1.45),
          ),
          const SizedBox(height: 14),
          const SettingsRow(
            icon: Icons.desktop_mac_rounded,
            title: 'Workdir',
            value: '~/Desktop/Aurict',
          ),
          const SettingsRow(
            icon: CupertinoIcons.timer,
            title: 'Trust duration',
            value: 'This session',
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: SecondaryButton(
                  label: 'Don’t trust',
                  color: tokens.danger,
                  onTap: () => Navigator.pop(context),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: PrimaryButton(
                  label: 'Trust',
                  icon: CupertinoIcons.checkmark_alt,
                  onTap: () {
                    Navigator.pop(context);
                    onTrust();
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class SecureKeySheet extends StatefulWidget {
  const SecureKeySheet({
    required this.provider,
    required this.active,
    required this.initialKey,
    required this.maskedKey,
    required this.fingerprint,
    required this.models,
    required this.loading,
    required this.onSave,
    required this.onFetchModels,
    this.error,
    super.key,
  });

  final String provider;
  final bool active;
  final String initialKey;
  final String? maskedKey;
  final String? fingerprint;
  final List<String> models;
  final bool loading;
  final String? error;
  final Future<void> Function(String key) onSave;
  final VoidCallback onFetchModels;

  @override
  State<SecureKeySheet> createState() => _SecureKeySheetState();
}

class _SecureKeySheetState extends State<SecureKeySheet> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialKey);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.vpn_key_rounded, color: tokens.accent),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  '${widget.provider} API key',
                  style: TextStyle(
                    color: tokens.text,
                    fontWeight: FontWeight.w900,
                    fontSize: 20,
                  ),
                ),
              ),
              StatusPill(
                label: widget.active ? 'secure' : 'not set',
                color: widget.active ? tokens.success : tokens.muted,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Production mode: this key is stored through the device secure storage bridge (iOS Keychain / Android Keystore). It is used directly from the device and is not sent to Aurict servers.',
            style: TextStyle(color: tokens.muted, height: 1.45),
          ),
          if (widget.maskedKey != null) ...[
            const SizedBox(height: 10),
            StatusPill(
              label: '${widget.maskedKey} · fp ${widget.fingerprint}',
              color: tokens.success,
            ),
          ],
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 14),
            decoration: BoxDecoration(
              color: tokens.surface.withValues(alpha: .72),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: tokens.border),
            ),
            child: Row(
              children: [
                Icon(CupertinoIcons.lock_fill, color: tokens.muted, size: 17),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _controller,
                    obscureText: true,
                    enableSuggestions: false,
                    autocorrect: false,
                    style: TextStyle(color: tokens.text, fontSize: 13.5),
                    decoration: InputDecoration.collapsed(
                      hintText: widget.active
                          ? 'Paste replacement API key'
                          : 'Paste API key',
                      hintStyle: TextStyle(color: tokens.muted, fontSize: 13.5),
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (widget.error != null) ...[
            const SizedBox(height: 10),
            Text(
              widget.error!,
              style: TextStyle(color: tokens.danger, fontSize: 12.5),
            ),
          ],
          if (widget.models.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              '${widget.models.length} models available',
              style: TextStyle(
                color: tokens.text,
                fontWeight: FontWeight.w800,
                fontSize: 12.5,
              ),
            ),
            const SizedBox(height: 8),
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 150),
              child: SingleChildScrollView(
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final model in widget.models)
                      ActionChipLite(label: model),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 12),
          SecondaryButton(
            label: widget.loading
                ? 'Fetching models...'
                : 'Fetch real model list',
            color: tokens.accent,
            onTap: widget.loading
                ? null
                : () async {
                    await widget.onSave(_controller.text);
                    widget.onFetchModels();
                  },
          ),
          const SizedBox(height: 8),
          Text(
            'Model lists are fetched directly from each provider when available. Providers without a reliable model-list endpoint use a curated fallback list. Stored keys remain local to this device.',
            style: TextStyle(color: tokens.muted, height: 1.35, fontSize: 11.5),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: SecondaryButton(
                  label: 'Clear',
                  color: tokens.danger,
                  onTap: () async {
                    _controller.clear();
                    await widget.onSave('');
                    if (!context.mounted) return;
                    Navigator.pop(context);
                  },
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: PrimaryButton(
                  label: widget.active ? 'Replace securely' : 'Save securely',
                  icon: CupertinoIcons.checkmark_alt,
                  onTap: () async {
                    await widget.onSave(_controller.text);
                    if (!context.mounted) return;
                    Navigator.pop(context);
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class SecurityNoticeCard extends StatelessWidget {
  const SecurityNoticeCard({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GlassPanel(
      borderColor: tokens.success.withValues(alpha: .34),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            CupertinoIcons.lock_shield_fill,
            color: tokens.success,
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Keys stay on this device',
                  style: TextStyle(
                    color: tokens.text,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  'Provider keys are stored in secure device storage. Aurict servers only coordinate account and encrypted relay metadata.',
                  style: TextStyle(color: tokens.muted, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SettingsGroup extends StatelessWidget {
  const SettingsGroup({required this.title, required this.rows, super.key});
  final String title;
  final List<SettingsRow> rows;

  @override
  Widget build(BuildContext context) {
    return GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionLabel(title),
          const SizedBox(height: 9),
          for (final row in rows) row,
        ],
      ),
    );
  }
}

class SettingsRow extends StatelessWidget {
  const SettingsRow({
    required this.icon,
    required this.title,
    required this.value,
    this.onTap,
    super.key,
  });
  final IconData icon;
  final String title;
  final String value;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final row = Padding(
      padding: const EdgeInsets.symmetric(vertical: 9),
      child: Row(
        children: [
          Icon(icon, color: tokens.accent, size: 18),
          const SizedBox(width: 11),
          Expanded(
            child: Text(
              title,
              style: TextStyle(color: tokens.text, fontWeight: FontWeight.w800),
            ),
          ),
          Text(value, style: TextStyle(color: tokens.muted, fontSize: 12.5)),
          if (onTap != null) ...[
            const SizedBox(width: 8),
            Icon(CupertinoIcons.chevron_right, color: tokens.muted, size: 14),
          ],
        ],
      ),
    );
    if (onTap == null) return row;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: row,
    );
  }
}

class ThemeChip extends StatelessWidget {
  const ThemeChip({
    required this.tokens,
    required this.selected,
    required this.onTap,
    super.key,
  });
  final AppTokens tokens;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final current = TokensScope.of(context);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: 128,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [tokens.surface, tokens.background3],
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? current.accent : current.border,
            width: selected ? 1.6 : 1,
          ),
          boxShadow: selected && !isAndroidUi(context)
              ? [
                  BoxShadow(
                    color: current.accent.withValues(alpha: .18),
                    blurRadius: adaptiveShadow(context, 22),
                    offset: const Offset(0, 10),
                  ),
                ]
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(radius: 8, backgroundColor: tokens.background),
                const SizedBox(width: 5),
                CircleAvatar(radius: 8, backgroundColor: tokens.accent),
                const SizedBox(width: 5),
                CircleAvatar(radius: 8, backgroundColor: tokens.success),
                const SizedBox(width: 5),
                CircleAvatar(radius: 8, backgroundColor: tokens.glass),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              tokens.name,
              style: TextStyle(
                color: tokens.text,
                fontWeight: FontWeight.w900,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class QuickActionRow extends StatelessWidget {
  const QuickActionRow({super.key});

  @override
  Widget build(BuildContext context) {
    return const Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        ActionChipLite(label: 'Export PDF'),
        ActionChipLite(label: 'Save as note'),
        ActionChipLite(label: 'Continue'),
      ],
    );
  }
}

class MetricTile extends StatelessWidget {
  const MetricTile({required this.label, required this.value, super.key});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: tokens.surface.withValues(alpha: .58),
        borderRadius: BorderRadius.circular(17),
        border: Border.all(color: tokens.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: tokens.muted,
              fontSize: 11,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            value,
            style: TextStyle(
              color: tokens.text,
              fontWeight: FontWeight.w900,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    required this.label,
    required this.icon,
    required this.onTap,
    super.key,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        decoration: BoxDecoration(
          color: tokens.accent,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: tokens.accent.withValues(alpha: .92)),
          boxShadow: isAndroidUi(context)
              ? null
              : [
                  BoxShadow(
                    color: tokens.accent.withValues(alpha: .18),
                    blurRadius: adaptiveShadow(context, 16),
                    offset: const Offset(0, 8),
                  ),
                ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: tokens.background, size: 17),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: tokens.background,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class SecondaryButton extends StatelessWidget {
  const SecondaryButton({
    required this.label,
    required this.color,
    this.onTap,
    super.key,
  });
  final String label;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        decoration: BoxDecoration(
          color: color.withValues(alpha: enabled ? .14 : .06),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: color.withValues(alpha: enabled ? .32 : .14),
          ),
          boxShadow: enabled && !isAndroidUi(context)
              ? [
                  BoxShadow(
                    color: color.withValues(alpha: .055),
                    blurRadius: adaptiveShadow(context, 16),
                    offset: const Offset(0, 8),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: color.withValues(alpha: enabled ? 1 : .52),
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
    );
  }
}

class GlassIconButton extends StatelessWidget {
  const GlassIconButton({
    required this.icon,
    required this.label,
    required this.onTap,
    super.key,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final android = isAndroidUi(context);
    return GestureDetector(
      onTap: onTap,
      child: PlatformBlur(
        enabled: !android,
        borderRadius: BorderRadius.circular(20),
        sigma: adaptiveBlur(context, 30),
        child: Container(
          height: 52,
          width: 52,
          decoration: BoxDecoration(
            color: tokens.glass.withValues(alpha: android ? .9 : .84),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: tokens.border),
          ),
          child: Icon(icon, color: tokens.text, size: 21, semanticLabel: label),
        ),
      ),
    );
  }
}

class GlassPanel extends StatelessWidget {
  const GlassPanel({
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin,
    this.borderColor,
    this.blur = 24,
    this.opacity,
    this.elevation = 1,
    this.disableBlur = false,
    super.key,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final Color? borderColor;
  final double blur;
  final double? opacity;
  final double elevation;
  // Sık güncellenen etkileşimli sheet'ler için (form/chip/arama) kalıcı blur
  // kapatma: BackdropFilter, içeriği DEĞİŞTİĞİNDE bile yeniden compositing
  // gerektirir (bu içeriğin arkasını her seferinde yeniden örnekleyip
  // bulanıklaştırır) — chip seçimi/klavye girişi gibi sık `setState`'lerde bu
  // her dokunuşta bir reblur maliyeti demektir. Bu widget'lar için Android'in
  // zaten kullandığı düz panel yoluna kalıcı olarak geç.
  final bool disableBlur;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    final android = isAndroidUi(context);
    // Sheet açılış/kapanış animasyonu sürerken blur'lu katmanın konumu her
    // karede değiştiği için yeniden hesaplanması pahalıdır — geçiş sırasında
    // Android'deki no-blur yoluna geçici olarak düş, yerleşince gerçek blur'a dön.
    final reduceBlur = SheetTransitionScope.of(context);
    final radius = BorderRadius.circular(26);
    final panelOpacity = opacity ?? (android ? .88 : .84);
    // Android yüzeyleri blur, gölge, foreground gradient ve ek clip/layer
    // olmadan çizilir. Uzun listelerde bu kartların her biri compositing
    // maliyeti eklediğinden düz yüzey yolu özellikle önemlidir.
    final boxShadow = android
        ? null
        : [
            BoxShadow(
              color: Colors.black.withValues(alpha: .16 + (.04 * elevation)),
              blurRadius: adaptiveShadow(context, 22 + (8 * elevation)),
              offset: Offset(0, 12 + (4 * elevation)),
            ),
            if (elevation >= 2)
              BoxShadow(
                color: tokens.accent.withValues(alpha: .02 * elevation),
                blurRadius: adaptiveShadow(context, 34),
                offset: const Offset(0, 0),
              ),
          ];
    final panel = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: tokens.glass.withValues(alpha: panelOpacity),
        borderRadius: radius,
        border: Border.all(color: borderColor ?? tokens.border),
        boxShadow: boxShadow,
      ),
      foregroundDecoration: android
          ? null
          : BoxDecoration(
              borderRadius: radius,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white.withValues(alpha: .028),
                  Colors.transparent,
                  Colors.black.withValues(alpha: .12),
                ],
                stops: const [0, .42, 1],
              ),
            ),
      child: child,
    );

    if (android) return Container(margin: margin, child: panel);
    final flat = reduceBlur || disableBlur;
    return RepaintBoundary(
      child: Container(
        margin: margin,
        child: ClipRRect(
          borderRadius: radius,
          // ClipRect yalnızca BackdropFilter'ın örnekleme alanını sınırlamak
          // için gerekli; düz panelde ClipRRect zaten yeterli olduğundan
          // fazladan bir clip/katman ekliyordu — flat yolda tamamen kaldırıldı.
          child: flat
              ? panel
              : ClipRect(
                  child: BackdropFilter(
                    filter: ImageFilter.blur(
                      sigmaX: adaptiveBlur(context, blur),
                      sigmaY: adaptiveBlur(context, blur),
                    ),
                    child: panel,
                  ),
                ),
        ),
      ),
    );
  }
}

class StatusPill extends StatelessWidget {
  const StatusPill({required this.label, required this.color, super.key});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .14),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: .28)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10.5,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class StatusDot extends StatelessWidget {
  const StatusDot({required this.color, super.key});
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 10,
      width: 10,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        boxShadow: isAndroidUi(context)
            ? null
            : [BoxShadow(color: color.withValues(alpha: .55), blurRadius: 14)],
      ),
    );
  }
}

class ActionChipLite extends StatelessWidget {
  const ActionChipLite({required this.label, super.key});
  final String label;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 8),
      decoration: BoxDecoration(
        color: tokens.surface.withValues(alpha: .62),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: tokens.border),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: tokens.text,
          fontWeight: FontWeight.w800,
          fontSize: 12,
        ),
      ),
    );
  }
}

class SectionLabel extends StatelessWidget {
  const SectionLabel(this.label, {super.key});
  final String label;

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    return Text(
      label.toUpperCase(),
      style: TextStyle(
        color: tokens.muted,
        fontSize: 11,
        fontWeight: FontWeight.w900,
        letterSpacing: 1.2,
      ),
    );
  }
}

class AtmosphericBackground extends StatelessWidget {
  const AtmosphericBackground({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = TokensScope.of(context);
    if (isAndroidUi(context)) {
      return RepaintBoundary(
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [tokens.background, tokens.background3],
            ),
          ),
          child: const SizedBox.expand(),
        ),
      );
    }
    return RepaintBoundary(
      child: DecoratedBox(
        decoration: BoxDecoration(color: tokens.background),
        child: Stack(
          children: [
            Positioned.fill(
              child: CustomPaint(
                isComplex: true,
                willChange: false,
                painter: CleanBackgroundPainter(
                  baseColor: tokens.background,
                  surfaceGlow: tokens.background3,
                  accentColor: tokens.accent,
                  borderColor: tokens.border,
                  vignetteColor: Colors.black.withValues(alpha: .52),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CleanBackgroundPainter extends CustomPainter {
  CleanBackgroundPainter({
    required this.baseColor,
    required this.surfaceGlow,
    required this.accentColor,
    required this.borderColor,
    required this.vignetteColor,
  });

  final Color baseColor;
  final Color surfaceGlow;
  final Color accentColor;
  final Color borderColor;
  final Color vignetteColor;

  @override
  void paint(Canvas canvas, Size size) {
    final basePaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [baseColor, surfaceGlow.withValues(alpha: .34), baseColor],
        stops: const [0, .48, 1],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, basePaint);

    final accentGlow = Paint()
      ..shader = RadialGradient(
        center: const Alignment(.82, -.82),
        radius: .9,
        colors: [
          accentColor.withValues(alpha: .105),
          accentColor.withValues(alpha: .026),
          Colors.transparent,
        ],
        stops: const [0, .45, 1],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, accentGlow);

    final lowGlow = Paint()
      ..shader = RadialGradient(
        center: const Alignment(-.94, .92),
        radius: .86,
        colors: [
          surfaceGlow.withValues(alpha: .17),
          surfaceGlow.withValues(alpha: .04),
          Colors.transparent,
        ],
        stops: const [0, .55, 1],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, lowGlow);

    final topLinePaint = Paint()
      ..shader = LinearGradient(
        colors: [
          Colors.transparent,
          accentColor.withValues(alpha: .2),
          Colors.transparent,
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, 1));
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, 1), topLinePaint);

    final dustPaint = Paint()
      ..color = borderColor.withValues(alpha: .105)
      ..strokeWidth = .5;
    for (var y = 22.0; y < size.height; y += 96) {
      canvas.drawLine(
        Offset(size.width * .16, y),
        Offset(size.width * .84, y + 8),
        dustPaint,
      );
    }

    final vignettePaint = Paint()
      ..shader = RadialGradient(
        center: const Alignment(0, -.68),
        radius: 1.08,
        colors: [Colors.transparent, vignetteColor],
        stops: const [.56, 1],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, vignettePaint);
  }

  @override
  bool shouldRepaint(covariant CleanBackgroundPainter oldDelegate) =>
      oldDelegate.baseColor != baseColor ||
      oldDelegate.surfaceGlow != surfaceGlow ||
      oldDelegate.accentColor != accentColor ||
      oldDelegate.borderColor != borderColor ||
      oldDelegate.vignetteColor != vignetteColor;
}

class AppTokens {
  const AppTokens({
    required this.name,
    required this.background,
    required this.background2,
    required this.background3,
    required this.surface,
    required this.glass,
    required this.text,
    required this.muted,
    required this.border,
    required this.accent,
    required this.success,
    required this.warning,
    required this.danger,
    required this.code,
  });

  final String name;
  final Color background;
  final Color background2;
  final Color background3;
  final Color surface;
  final Color glass;
  final Color text;
  final Color muted;
  final Color border;
  final Color accent;
  final Color success;
  final Color warning;
  final Color danger;
  final Color code;

  ThemeData get materialTheme {
    final scheme = ColorScheme.fromSeed(
      seedColor: accent,
      brightness: Brightness.dark,
    );
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: scheme.copyWith(
        surface: surface,
        primary: accent,
        secondary: success,
        error: danger,
      ),
      scaffoldBackgroundColor: background,
      fontFamily: AurictTypography.serif,
      textTheme: ThemeData.dark().textTheme.apply(
        fontFamily: AurictTypography.serif,
        bodyColor: text,
        displayColor: text,
      ),
      primaryTextTheme: ThemeData.dark().primaryTextTheme.apply(
        fontFamily: AurictTypography.serif,
        bodyColor: text,
        displayColor: text,
      ),
      textSelectionTheme: TextSelectionThemeData(cursorColor: accent),
    );
  }
}

class TokensScope extends InheritedWidget {
  const TokensScope({
    required this.tokens,
    required this.themeIndex,
    required this.onThemeChanged,
    required super.child,
    super.key,
  });

  final AppTokens tokens;
  final int themeIndex;
  final ValueChanged<int> onThemeChanged;

  static AppTokens of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<TokensScope>()!.tokens;

  static TokensScope? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<TokensScope>();

  @override
  bool updateShouldNotify(TokensScope oldWidget) =>
      tokens != oldWidget.tokens || themeIndex != oldWidget.themeIndex;
}

const aurictThemes = [
  AppTokens(
    name: 'Aurict',
    background: Color(0xFF0D0808),
    background2: Color(0xFF130D0C),
    background3: Color(0xFF181210),
    surface: Color(0xFF171110),
    glass: Color(0xFF1D1614),
    text: Color(0xFFF0EEEB),
    muted: Color(0xFF67635D),
    border: Color(0x14F0EEEB),
    accent: Color(0xFFD8625C),
    success: Color(0xFF61BD67),
    warning: Color(0xFFE9AB2B),
    danger: Color(0xFFEF6661),
    code: Color(0xFFD9D7D4),
  ),
  AppTokens(
    name: 'Graphite Blue',
    background: Color(0xFF07090D),
    background2: Color(0xFF0D1118),
    background3: Color(0xFF151B25),
    surface: Color(0xFF141A23),
    glass: Color(0xFF18202B),
    text: Color(0xFFF4F7FB),
    muted: Color(0xFF97A2B3),
    border: Color(0x22FFFFFF),
    accent: Color(0xFF5C7CFF),
    success: Color(0xFF6EC6A5),
    warning: Color(0xFFD6B15F),
    danger: Color(0xFFE07078),
    code: Color(0xFFC7D6FF),
  ),
  AppTokens(
    name: 'Obsidian Mono',
    background: Color(0xFF050506),
    background2: Color(0xFF0B0C0E),
    background3: Color(0xFF111318),
    surface: Color(0xFF131519),
    glass: Color(0xFF191C22),
    text: Color(0xFFF1F0EC),
    muted: Color(0xFF9B9FA8),
    border: Color(0x24F1F0EC),
    accent: Color(0xFFB8C0CC),
    success: Color(0xFF85B99B),
    warning: Color(0xFFD4B66A),
    danger: Color(0xFFD9797D),
    code: Color(0xFFDDE3EA),
  ),
  AppTokens(
    name: 'Warm Slate',
    background: Color(0xFF090806),
    background2: Color(0xFF11100C),
    background3: Color(0xFF1A1711),
    surface: Color(0xFF1A1712),
    glass: Color(0xFF231F18),
    text: Color(0xFFF6F0E5),
    muted: Color(0xFFA99D89),
    border: Color(0x26F0DEC2),
    accent: Color(0xFFD0A96B),
    success: Color(0xFF94BD8F),
    warning: Color(0xFFD8B25E),
    danger: Color(0xFFD87570),
    code: Color(0xFFE3CE9C),
  ),
  AppTokens(
    name: 'Violet Arc',
    background: Color(0xFF08070D),
    background2: Color(0xFF100D1A),
    background3: Color(0xFF191326),
    surface: Color(0xFF171321),
    glass: Color(0xFF211A31),
    text: Color(0xFFF6F2FF),
    muted: Color(0xFFA99BBE),
    border: Color(0x2DE2D4FF),
    accent: Color(0xFF9B6CFF),
    success: Color(0xFF70C7B4),
    warning: Color(0xFFD8B468),
    danger: Color(0xFFE17788),
    code: Color(0xFFD9C7FF),
  ),
];
