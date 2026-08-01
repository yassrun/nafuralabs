import 'blan_model.dart';
import 'participation_status.dart';

class MockBlanRepository {
  Future<List<Blan>> getBlans({String? filter}) async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 800));

    final allBlans = _generateMockBlans();

    if (filter == null || filter == 'Trending') {
      return allBlans;
    }

    // Simple filtering logic
    switch (filter) {
      case 'Nearby':
        return allBlans.where((b) => b.distanceKm < 5).toList();
      case 'For you':
        return allBlans.take(3).toList();
      case 'Coffee':
        return allBlans.where((b) => b.category == 'Coffee').toList();
      case 'Sport':
        return allBlans.where((b) => b.category == 'Sport').toList();
      case 'Cinema':
        return allBlans.where((b) => b.category == 'Cinema').toList();
      case 'Games':
        return allBlans.where((b) => b.category == 'Games').toList();
      case 'Food & Drinks':
        return allBlans
            .where((b) => b.category == 'Food & Drinks')
            .toList();
      default:
        return allBlans;
    }
  }

  List<Blan> _generateMockBlans() {
    final now = DateTime.now();
    return [
      Blan(
        id: '1',
        title: 'Morning Coffee & Networking',
        category: 'Coffee',
        dateTime: now.add(const Duration(days: 2, hours: 10)),
        locationName: 'Blue Bottle Coffee',
        distanceKm: 0.8,
        imageUrl: 'https://picsum.photos/400/300?random=1',
        priceType: 'Free',
        currentParticipants: 12,
        maxParticipants: 20,
        organizerName: 'Sarah Chen',
        status: ParticipationStatus.notRequested,
        userLiked: false,
        userSaved: true,
        likeCount: 12,
        saveCount: 5,
      ),
      Blan(
        id: '2',
        title: 'Basketball Game at Central Park',
        category: 'Sport',
        dateTime: now.add(const Duration(days: 3, hours: 15)),
        locationName: 'Central Park Basketball Court',
        distanceKm: 2.3,
        imageUrl: 'https://picsum.photos/400/300?random=2',
        priceType: 'Free',
        currentParticipants: 8,
        maxParticipants: 10,
        organizerName: 'Mike Johnson',
        status: ParticipationStatus.requested,
        userLiked: true,
        userSaved: false,
        likeCount: 8,
        saveCount: 2,
      ),
      Blan(
        id: '3',
        title: 'Movie Night: Latest Blockbuster',
        category: 'Cinema',
        dateTime: now.add(const Duration(days: 5, hours: 19)),
        locationName: 'AMC Theater Downtown',
        distanceKm: 1.5,
        imageUrl: 'https://picsum.photos/400/300?random=3',
        priceType: 'Paid',
        currentParticipants: 15,
        maxParticipants: 25,
        organizerName: 'Emma Wilson',
        status: ParticipationStatus.notRequested,
        userLiked: false,
        userSaved: false,
        likeCount: 15,
        saveCount: 3,
      ),
      Blan(
        id: '4',
        title: 'Board Games & Pizza Night',
        category: 'Games',
        dateTime: now.add(const Duration(days: 4, hours: 18)),
        locationName: 'Game Hub Cafe',
        distanceKm: 3.2,
        imageUrl: 'https://picsum.photos/400/300?random=4',
        priceType: 'Paid',
        currentParticipants: 6,
        maxParticipants: 12,
        organizerName: 'David Lee',
        status: ParticipationStatus.accepted,
        userLiked: true,
        userSaved: true,
        likeCount: 6,
        saveCount: 4,
      ),
      Blan(
        id: '5',
        title: 'Weekend Brunch & Mimosas',
        category: 'Food & Drinks',
        dateTime: now.add(const Duration(days: 6, hours: 11)),
        locationName: 'The Brunch Spot',
        distanceKm: 1.8,
        imageUrl: 'https://picsum.photos/400/300?random=5',
        priceType: 'Paid',
        currentParticipants: 9,
        maxParticipants: 15,
        organizerName: 'Lisa Anderson',
        status: ParticipationStatus.notRequested,
        userLiked: false,
        userSaved: false,
        likeCount: 15,
        saveCount: 3,
      ),
      Blan(
        id: '6',
        title: 'Sunset Yoga Session',
        category: 'Sport',
        dateTime: now.add(const Duration(days: 7, hours: 17)),
        locationName: 'Beach Park',
        distanceKm: 4.5,
        imageUrl: 'https://picsum.photos/400/300?random=6',
        priceType: 'Free',
        currentParticipants: 20,
        maxParticipants: 30,
        organizerName: 'Yoga Master Zen',
        status: ParticipationStatus.notRequested,
        userLiked: true,
        userSaved: false,
        likeCount: 20,
        saveCount: 6,
      ),
      Blan(
        id: '7',
        title: 'Tech Meetup & Networking',
        category: 'Coffee',
        dateTime: now.add(const Duration(days: 8, hours: 18)),
        locationName: 'Tech Hub Co-working',
        distanceKm: 2.1,
        imageUrl: 'https://picsum.photos/400/300?random=7',
        priceType: 'Free',
        currentParticipants: 25,
        maxParticipants: 40,
        organizerName: 'Alex Tech',
        status: ParticipationStatus.notRequested,
        userLiked: false,
        userSaved: true,
        likeCount: 12,
        saveCount: 5,
      ),
      Blan(
        id: '8',
        title: 'Sushi Night Out',
        category: 'Food & Drinks',
        dateTime: now.add(const Duration(days: 9, hours: 19)),
        locationName: 'Sakura Sushi Bar',
        distanceKm: 1.2,
        imageUrl: 'https://picsum.photos/400/300?random=8',
        priceType: 'Paid',
        currentParticipants: 4,
        maxParticipants: 8,
        organizerName: 'Tom Sushi',
        status: ParticipationStatus.notRequested,
        userLiked: false,
        userSaved: false,
        likeCount: 15,
        saveCount: 3,
      ),
    ];
  }
}

