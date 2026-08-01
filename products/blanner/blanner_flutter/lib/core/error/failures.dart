abstract class AppFailure implements Exception {
  const AppFailure(this.message, {this.code});

  final String message;
  final String? code;

  @override
  String toString() => 'AppFailure(code: $code, message: $message)';
}

class NetworkFailure extends AppFailure {
  const NetworkFailure(super.message, {super.code});
}

class UnknownFailure extends AppFailure {
  const UnknownFailure(super.message, {super.code});
}
