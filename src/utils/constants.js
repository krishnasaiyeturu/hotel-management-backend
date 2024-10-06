module.exports = {
    ROLES:['guest', 'frontdesk', 'manager', 'admin', 'housekeeping', 'maintenance'],
    S3_BUCKET_NAME: 'aspenhotelsmangement',
    S3_BUCKET_EXPIRES:3600,
    DEFAULT_EXPIRATION: 3600, // Expiration time for presigned URLs (1 hour)
    SUPPORTED_ROOM_TYPES: [
      'Standard Room',
      '2 Queen Beds Suite',
      '1 King Bed One Bedroom Suite',
      '1 Bedroom Suite'
    ],
    ROOM_STATUS:['available', 'booked', 'maintenance'],
    BOOKING_STATUS: ['booked', 'checked-in', 'checked-out', 'canceled','no-show'],
    DEFAULT_HOTEL:{
        name: 'ASPEN GRAND HOTELS',
        location: {
          address: '908 West G Street',
          city: 'La Porte',
          state: 'Texas',
          country: 'United States',
          postalCode: '77571'
        },
        contact: {
          phone: '+1-234-567-890',
          email: 'contact@grandluxuryhotel.com'
        },
        amenities: ['Free Wi-Fi', 'Pool', 'Gym', 'Spa'],
        rating: 4.2,
      },
    TAX_RATE:0.17,
  };
  