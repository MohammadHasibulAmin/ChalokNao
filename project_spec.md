## Tech
- MongoDB
- Express
- React
- Node.js

## USE MVC ARCHITECTURE


1. Comprehensive Driver Profile Management
Purpose: Central identity of driver.
How it works (Flow):
Driver fills profile form → saves
Profile visible to owners
Status toggle controls visibility
Backend (Model + Controller):
Driver schema:

 name, photo, age, experienceYears,
licenseNumber, workType,
expectedSalary, status,
ratingAvg, totalReviews,
badges: [], createdAt


Controller:
POST /driver/profile
PUT /driver/profile
GET /driver/:id
Logic:
Badge assignment:
based on rating, completed contracts, years
Frontend (React):
Profile form page
Profile display card
Toggle: Available / Employed

2. Document Upload & Verification Request
Purpose: Trust layer.
Flow:
Upload → stored → marked “pending”
Admin verifies → updates status
Backend:
Schema:

 documents: {
  licenseUrl,
  nidUrl,
  status: pending/approved/rejected
}


API:
POST /driver/upload-docs
PUT /admin/verify-doc/:id
Frontend:
Upload component
Status indicator (Pending / Verified)

3. Employment History Management
Purpose: Experience credibility.
Backend:
Embedded array:

 employmentHistory: [
  { employerName, duration, description }
]


APIs:
POST /driver/employment
PUT /driver/employment/:id
DELETE
Frontend:
Add/Edit/Delete list UI

4. Availability Calendar System
Purpose: Short-term hiring support.
Backend:
availability: [
 { startDate, endDate }
]
API:
POST /driver/availability
GET /driver/availability
Frontend:
Calendar picker (date range)
Highlight unavailable dates

5. Location & Service Area Selection
Purpose: Match geographically.
Backend:
location: {
 city,
 coordinates: { lat, lng }
}
API:
POST /driver/location
Frontend:
OpenStreetMap picker
Dropdown fallback

6. Real-Time Chatting
Purpose: Communication + support.
Tech: Socket.io
Backend:
Message schema:

 senderId, receiverId, message, timestamp


Socket events:
send_message
receive_message
Frontend:
Chat window
Real-time updates

7. Expected Salary Configuration
Backend:
expectedSalary: {
 monthly,
 daily
}
API:
PUT /driver/salary
Frontend:
Input fields (monthly/daily)

8. Interview Request Response Panel
Backend:
Interview: {
 ownerId, driverId,
 type: online/offline/chat,
 date, status
}
API:
POST /owner/interview
PUT /driver/interview/:id
Frontend:
Accept / Reject buttons
Show type clearly

9. Driver Performance Analytics Dashboard
Backend:
Aggregation queries:
count interviews
count hires
avg rating
API:
GET /driver/analytics
Frontend:
Simple cards:
total interviews
hires
rating

10. Driver Skill Progress & Training Tracker
Backend:
Training: { title, content }
Progress: { driverId, trainingId, completed, score }
API:
GET /training
POST /progress
Frontend:
Module list
Progress bar
Badge display

11. Advanced Driver Search & Filtering
Backend:
Query:
/drivers?salary=...&location=...&rating=...
Logic:
Mongo filters
Frontend:
Filter sidebar
Dynamic results list

12. Driver Shortlisting System
Backend:
shortlist: [driverId]
API:
POST /owner/shortlist
Frontend:
Save button
Shortlist page

13. Driver Comparison View
Backend:
Fetch multiple drivers
Frontend:
Table:
salary
rating
experience

14. Custom Salary Offer Submission
Backend:
Offer: {
 ownerId, driverId, amount, status
}
API:
POST /offer
Frontend:
Offer form

15. Interview Scheduling Module
Backend:
Same Interview model
Frontend:
Date picker + location input

16. Short-Term Hiring Request System
Backend:
Request: {
 startDate, endDate
}
API:
POST /request

17. Hire Confirmation Workflow (Stripe)
Flow:
Both confirm → payment → contract created
Backend:
Contract: {
 ownerId, driverId,
 duration, paymentStatus
}
Stripe:
Payment intent
Frontend:
Confirm button
Payment page

18. Contract Management Dashboard
Backend:
Fetch contracts by owner
Frontend:
Tabs:
ongoing
completed

19. Admin Verification Dashboard
Backend:
Admin routes:
verify docs
suspend users
Frontend:
Table:
drivers
status controls

20. Commission & Transaction Tracking System
Backend:
Transaction: {
 contractId,
 amount,
 commission,
 date
}
Logic:
commission = % of payment
Frontend:
Admin financial panel

