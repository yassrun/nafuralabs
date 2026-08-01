enum ParticipationStatus {
  notRequested,
  requested,
  shortlisted,
  accepted,
  rejected,
  canceled,
  left;

  String get displayText {
    switch (this) {
      case ParticipationStatus.notRequested:
        return "I'm in";
      case ParticipationStatus.requested:
        return "Requested";
      case ParticipationStatus.shortlisted:
        return "Shortlisted";
      case ParticipationStatus.accepted:
        return "You're in 🎉";
      case ParticipationStatus.rejected:
        return "Rejected";
      case ParticipationStatus.canceled:
        return "Canceled";
      case ParticipationStatus.left:
        return "Left";
    }
  }

  bool get isDisabled {
    // Allow joining only when status is notRequested or left
    return this != ParticipationStatus.notRequested && 
           this != ParticipationStatus.left;
  }
}

