---
name: flutter-patterns
description: "Flutter: Cross-platform UI, Widget composition, State management, Platform channels, Performance patterns."
triggers:
  files: ["pubspec.yaml", "main.dart"]
  directories: ["lib/", "flutter/"]
  keywords: ["Flutter", "Dart", "widget", "StatefulWidget", "Provider", "BLoC", "cross-platform"]
auto_load_when: "Building mobile apps with Flutter or maintaining Flutter codebase"
agent: mobile-ops
tools: ["Read", "Write", "Bash"]
---

# Flutter Architecture Patterns

**Focus:** Widget design, state management, platform integration, performance

## 1. Project Structure

```
Standard Flutter Project:
lib/
├── main.dart                    # App entry point
├── app.dart                     # App widget
├── config/
│   ├── theme.dart               # Theme configuration
│   ├── routes.dart              # Route definitions
│   └── constants.dart           # App constants
├── core/
│   ├── network/
│   │   ├── api_client.dart      # HTTP client
│   │   └── api_response.dart    # Response wrapper
│   ├── storage/
│   │   └── local_storage.dart   # SharedPreferences/Hive
│   └── utils/
│       └── extensions.dart      # Dart extensions
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   └── repositories/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   └── usecases/
│   │   └── presentation/
│   │       ├── bloc/
│   │       ├── pages/
│   │       └── widgets/
│   └── home/
│       └── ...
└── shared/
    ├── widgets/                  # Reusable widgets
    └── theme/                   # Theme data
```

---

## 2. Widget Patterns

```
Stateless Widget (Simple UI):
class MyButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;

  const MyButton({
    super.key,
    required this.label,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      child: Text(label),
    );
  }
}

Stateful Widget (With State):
class Counter extends StatefulWidget {
  const Counter({super.key});

  @override
  State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int _count = 0;

  void _increment() => setState(() => _count++);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('$_count'),
        ElevatedButton(onPressed: _increment, child: const Text('+'))
      ],
    );
  }
}

Widget Composition:
class UserCard extends StatelessWidget {
  final User user;

  const UserCard({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          UserAvatar(photoUrl: user.photoUrl),
          UserName(name: user.name),
          UserEmail(email: user.email),
        ],
      ),
    );
  }
}
```

---

## 3. State Management

```
Provider Pattern:
class CounterModel extends ChangeNotifier {
  int _count = 0;
  int get count => _count;

  void increment() {
    _count++;
    notifyListeners();
  }
}

// Usage
Consumer<CounterModel>(
  builder: (context, model, _) => Text('${model.count}'),
)

// Watch with context
context.watch<CounterModel>().count

// Read without rebuild
context.read<CounterModel>().increment()

ChangeNotifierProvider:
ChangeNotifierProvider(
  create: (_) => CounterModel(),
  child: const MyApp(),
)

BLoC Pattern:
import 'package:flutter_bloc/flutter_bloc.dart'

// Events
abstract class CounterEvent {}
class Increment extends CounterEvent {}
class Decrement extends CounterEvent {}

// State
class CounterState {
  final int count;
  CounterState(this.count);
}

// BLoC
class CounterBloc extends Bloc<CounterEvent, CounterState> {
  CounterBloc() : super(CounterState(0)) {
    on<Increment>((event, emit) => emit(CounterState(state.count + 1)));
    on<Decrement>((event, emit) => emit(CounterState(state.count - 1)));
  }
}

// Usage
BlocProvider(
  create: (_) => CounterBloc(),
  child: BlocBuilder<CounterBloc, CounterState>(
    builder: (context, state) => Text('${state.count}'),
  ),
)
```

---

## 4. Navigation

```
Basic Navigation:
Navigator.push(context, MaterialPageRoute(
  builder: (_) => const DetailScreen()
))

Navigator.pop(context)

Named Routes:
routes:
  '/': (context) => const HomePage()
  '/detail': (context) => const DetailPage()
  '/profile': (context) => const ProfilePage()

Navigator.pushNamed(context, '/detail')

With Arguments:
Navigator.pushNamed(
  context,
  '/detail',
  arguments: {'id': 123}
)

// In destination
final args = ModalRoute.of(context).settings.arguments as Map;

GoRouter (Recommended):
final router = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const HomePage(),
    ),
    GoRoute(
      path: '/user/:id',
      builder: (context, state) {
        final id = state.pathParameters['id'];
        return UserPage(userId: id!);
      },
    ),
  ],
)

MaterialApp.router(routerConfig: router)

Deep Linking:
GoRoute(
  path: '/products/:id',
  builder: (context, state) => ProductPage(
    id: state.pathParameters['id']!,
  ),
)
```

---

## 5. API & Data Layer

```
API Client:
class ApiClient {
  final Dio _dio;

  ApiClient() : _dio = Dio(BaseOptions(
    baseUrl: 'https://api.example.com',
    connectTimeout: 5000,
    receiveTimeout: 3000,
  ));

  Future<T> get<T>(String path) async {
    final response = await _dio.get(path);
    return response.data as T;
  }

  Future<T> post<T>(String path, dynamic data) async {
    final response = await _dio.post(path, data: data);
    return response.data as T;
  }
}

Repository Pattern:
class UserRepository {
  final ApiClient _client;

  UserRepository(this._client);

  Future<List<User>> getUsers() async {
    final jsonList = await _client.get<List>('/users');
    return jsonList.map((json) => User.fromJson(json)).toList();
  }

  Future<User> getUser(String id) async {
    final json = await _client.get<Map>('/users/$id');
    return User.fromJson(json!);
  }
}

Dependency Injection:
final dio = Dio();
final apiClient = ApiClient(dio);
final userRepository = UserRepository(apiClient);

Provider(
  create: (_) => userRepository,
  child: const UserListPage(),
)
```

---

## 6. Platform Channels

```
Method Channel (Dart → Native):
import 'package:flutter/services.dart';

const channel = MethodChannel('com.example/battery');

Future<int> getBatteryLevel() async {
  final level = await channel.invokeMethod<int>('getBatteryLevel');
  return level ?? -1;
}

Platform Channel (iOS - Swift):
let channel = FlutterMethodChannel(
  name: "com.example/battery",
  binaryMessenger: controller.binaryMessenger
)

channel.setMethodCallHandler { call, result in
  if call.method == "getBatteryLevel" {
    result(UIDevice.current.batteryLevel)
  }
}

Platform Channel (Android - Kotlin):
MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "com.example/battery")
  .setMethodCallHandler { call, result ->
    if (call.method == "getBatteryLevel") {
      val level = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
      result.success(level)
    }
  }

Event Channel (Streaming):
const eventChannel = EventChannel('com.example/stream');

Stream<String> get stream =>
  eventChannel.receiveBroadcastStream().map((event) => event as String);
```

---

## 7. Performance Patterns

```
ListView Optimization:
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => items[index],
)

const UserTile() // Use const for static items

Image Caching:
Image.network(
  url,
  cache: true,
  loadingBuilder: (child, loadingProgress) =>
    loadingProgress == null ? child : CircularProgressIndicator(),
  errorBuilder: (context, error, stack) => const Icon(Icons.error),
)

RepaintBoundary:
RepaintBoundary(
  child: HeavyWidget(),
)

Avoid Rebuilds:
- Use const constructors
- Split into smaller widgets
- Use selector in BlocBuilder:
  BlocBuilder<Bloc, State>(
    selector: (state) => state.isLoading,
    builder: ...
  )

Memory Management:
- Use dispose() for controllers
- Cancel streams in dispose
- Use WeakReference for callbacks
```

---

## 8. Testing

```
Widget Test:
testWidgets('Counter increments', (WidgetTester tester) async {
  await tester.pumpWidget(const MyApp());

  expect(find.text('0'), findsOneWidget);

  await tester.tap(find.byType(ElevatedButton));
  await tester.pump();

  expect(find.text('1'), findsOneWidget);
})

Unit Test:
test('UserRepository returns users', () async {
  final mockClient = MockApiClient();
  final repo = UserRepository(mockClient);

  when(mockClient.get<List>('/users'))
    .thenAnswer((_) async => [{'id': 1, 'name': 'John'}]);

  final users = await repo.getUsers();

  expect(users.length, 1);
  expect(users.first.name, 'John');
})

Integration Test:
integrationTest('User can login', (tester) async {
  await tester.pumpWidget(const MyApp());

  await tester.enterText(find.byType(TextField).first, 'user@test.com');
  await tester.enterText(find.byType(TextField).last, 'password');
  await tester.tap(find.byType(ElevatedButton));

  await tester.pumpAndSettle();

  expect(find.byType(HomePage), findsOneWidget);
})
```

---

## Key Patterns

1. **Widget composition** — Build UI from small reusable widgets
2. **State management** — Provider or BLoC for global state
3. **Repository pattern** — Separate data layer from UI
4. **GoRouter** — Declarative navigation
5. **Platform channels** — Native functionality access
6. **ListView.builder** — Efficient long lists

---

## Anti-Patterns

```
❌ Large monolithic widgets
✅ Split into smaller reusable widgets

❌ setState everywhere
✅ Use Provider/BLoC for shared state

❌ No separation of concerns
✅ Use repository pattern, separate data from UI

❌ Hardcoded strings
✅ Use l10n or constants

❌ No error handling in UI
✅ Show error states, use try-catch

❌ Loading without feedback
✅ Show loading indicators, skeletons

❌ Ignoring platform differences
✅ Use platform channels, adaptive widgets

❌ No dependency injection
✅ Use Provider, GetIt, or Riverpod
```

---

## Quick Reference

| Feature | Syntax | Note |
|---|---|---|
| Create widget | extends StatelessWidget | For UI without state |
| Create state | extends StatefulWidget | For UI with state |
| State access | context.watch/read | Provider pattern |
| Navigation | GoRouter | Declarative routing |
| HTTP client | Dio | Most common |
| State | ChangeNotifier | Provider |
| State | Bloc | For complex state |
| Platform channel | MethodChannel | Dart → Native |
