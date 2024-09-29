# REST API with Node.js, MongoDB, JWT



## Build Setup

```bash
# install dependencies
npm install

# serve at http://localhost:4000/

npm start
```

## Prerequisites

- Nodejs
- MongoDB

## Production

```
npm i -g pm2
```

# Build

```
npm run build

```

## dev

```
# serve at http://localhost:4000/

npm run pm2:dev
```

## prod

```
# serve at http://localhost:4000/

npm run pm2:prod

```

**Request:**

### User

```

POST user/register
{
"name": "Elon",
"email": "elon@tesla.com",
"password": "elon@1234",
"role": "author"
}

```

```

POST user/login
{
"email": "elon@tesla.com",
"password": "elon@1234"
}

```

## Authorization

### Post

```

POST posts/

{
"postTitle": "Deno",
"postBody": "New Nodejs Framework",
"genre": "tech"
}

```

```

PUT posts/:id
{
"postTitle": "Deno",
"postBody": "New Nodejs Framework by Nodejs Creator",
"genre": "tech"
}

```

```

GET posts/

GET posts/?page=1&limit=1

GET posts/:id

DELETE posts/:id

```

### Comments

```

POST comments/
{
"postId": "603b77052fbc1c1038573518",
"commentText": "Nice"
}

```

```

PUT comments/:id
{
"postTitle": "Deno",
"postBody": "New Nodejs Framework by Nodejs Creator",
"genre": "tech"
}

```

```

GET comments/

GET comments/:id

DELETE comments/:id

```

### Create Admin User

```

POST admin/register
{
"name": "admin",
"email": "admin@tesla.com",
"password": "admin@1234",
"role": "admin"
}

```

```

POST admin/login
{
"email": "admin@tesla.com",
"password": "admin@1234"
}

```

### Admin Authorization

```

GET admin/users

```


### Roles 

### Detailed Role Breakdown:
Role	Permissions/Capabilities
Guest (user)	- Browse available rooms
                - Make/Cancel bookings
                - View booking history
                - Check-in/check-out online
Receptionist	- Create/Manage bookings for offline guests
                - Check-in/check-out guests
                - Modify booking details
                - View current room status (available, occupied, maintenance)
Manager	        - Oversee reception and housekeeping activities
                - Handle customer escalations
                - View financial reports and booking summaries
                - Adjust room pricing or policies
Admin	- Manage users (create/edit roles)
        - Configure system settings
        - Full access to all reports and room management
        - Configure pricing strategies and rules for inventory
Housekeeping	- Update room statuses (cleaned, needs cleaning)
                - Mark rooms as ready for check-in
                - Track room cleaning schedules
Maintenance Staff	- Mark rooms as "Under Maintenance"
                    - Report/resolve maintenance issues
                    - Coordinate with the manager on room availability



### API End Points

1. Authentication & User Management
1.1 User Registration & Login
POST /api/auth/register
Register a new user (e.g., guest, receptionist, admin).
POST /api/auth/login
Login for any user (guest, staff, admin).
POST /api/auth/logout
Logout the user.
1.2 Role-based Access
GET /api/auth/me
Get the logged-in user’s profile details (based on JWT).
PUT /api/auth/update-profile
Update the user’s profile (e.g., name, email).
GET /api/users
Admin Only: View all users.
POST /api/users/assign-role
Admin Only: Assign roles to users (receptionist, manager, housekeeping).
2. Room Inventory Management
2.1 Room Operations
POST /api/rooms
Admin/Manager Only: Create a new room.
GET /api/rooms
View all rooms and their status (available, occupied, maintenance).
GET /api/rooms/:id
Get specific room details.
PUT /api/rooms/:id
Admin/Manager Only: Update room details (e.g., pricing, description).
DELETE /api/rooms/:id
Admin Only: Delete a room from inventory.
2.2 Room Status Management
PUT /api/rooms/:id/status
Housekeeping Only: Update room status (e.g., cleaned, needs cleaning, maintenance).
PUT /api/rooms/:id/maintenance
Maintenance Staff Only: Mark room as "Under Maintenance".
3. Booking Management
3.1 Booking Operations
POST /api/bookings
Guests/Receptionists Only: Create a booking.
GET /api/bookings
Guests: View current bookings.
Receptionists: View bookings of all guests.
Managers/Admins: View all bookings.
GET /api/bookings/:id
Get specific booking details.
PUT /api/bookings/:id
Receptionist/Manager: Update booking (check-in, check-out).
DELETE /api/bookings/:id
Receptionist/Manager: Cancel booking.
3.2 Guest Check-In/Out
PUT /api/bookings/:id/check-in
Receptionist Only: Mark guest as checked-in.
PUT /api/bookings/:id/check-out
Receptionist Only: Mark guest as checked-out.
4. Guest & Customer Management
4.1 Guest Profiles
GET /api/guests
Manager/Receptionist: View all guests.
GET /api/guests/:id
View specific guest details (booking history, room preferences).
PUT /api/guests/:id
Receptionist/Manager Only: Update guest information.
5. Reports & Analytics
5.1 Financial and Booking Reports
GET /api/reports/bookings
Manager/Admin Only: View booking reports (e.g., occupancy rate, cancellations).
GET /api/reports/revenue
Manager/Admin Only: View financial reports (room revenue, total income).
6. Housekeeping and Maintenance Management
6.1 Room Cleaning
PUT /api/housekeeping/room/:id/clean
Housekeeping Only: Mark room as cleaned and ready for new guests.
6.2 Maintenance Requests
POST /api/maintenance/room/:id/request
Housekeeping/Receptionist: Report maintenance issues.
PUT /api/maintenance/room/:id/resolve
Maintenance Staff Only: Mark maintenance as completed.

