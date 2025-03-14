# Digital Signage System for Dolce Vita Gelateria  

The Digital Signage System is a dynamic menu and video display system designed for Dolce Vita Gelateria. It allows real-time updates of menu items, promotional videos, and business hours through Firebase Firestore, Storage, and Authentication. The system ensures that only authorized users can modify menu content while providing an automated, engaging display for customers.  

## Overview  

The system consists of two main components:  

- The Public Display System, which rotates between promotional videos and menu items every 45 seconds  
- The Admin Panel, which allows authorized users to update menu items, modify stock availability, and manage videos in real time  

The system automatically redirects users to a "Too Early" page outside of business hours and ensures smooth content transitions throughout the day.  

## Features  

- Real-time dynamic menu and video updates using Firestore  
- Secure admin authentication with Firebase Authentication  
- Automatic video and menu rotation with smooth transitions  
- Business hours-based redirection to prevent access outside working hours  
- Fully responsive design for both tablet and large screen displays  
- Admin panel for managing menu items, videos, and business hours  
- Internet connectivity detection to ensure content is always up-to-date  

## How It Works  

The system operates based on business hours retrieved from Firestore. If accessed outside these hours, it redirects to the early page. Within business hours, it alternates between displaying videos and menu items every 45 seconds.  

The admin panel allows authorized users to upload new videos, update menu items, remove unavailable products, and set new business hours. These updates are immediately reflected in the public display.  

## File Overview  

index.html - The main signage display page that rotates between menu items and promotional videos  
script.js - Controls the timing and transitions between videos and menu items  
early.html - The page displayed when accessed outside business hours  
admin.html - The admin panel for managing content and business hours  
admin-script.js - Handles Firestore communication for menu and video management  
admin-style.css - Styling for the admin panel layout  
login.html - Login page for admin authentication  
login.css - Styles for the login page  
signInScript.js - Handles Firebase authentication logic  
firebaseConfig.js - Configuration file for Firebase authentication and database access  
hoursConfig.js - Manages business hours and ensures the system follows the correct opening and closing times  
network-status.js - Checks for internet connectivity and reloads the page when a connection is restored  

## Business Hours Management  

The system retrieves business hours from Firestore. If accessed outside of working hours, users are redirected to early.html. If accessed during business hours, the signage content is displayed. Business hours can be updated through the admin panel, and changes apply immediately.  

## Video and Menu Management  

- Videos are uploaded via the admin panel and stored in Firebase Storage  
- Menu items are retrieved from Firestore and displayed dynamically  
- Out-of-stock items are indicated with a special image overlay  
- Admins can add, remove, or update menu items at any time  

## Additional Notes  

- The system is optimized for large screen displays and tablets  
- Only authorized users can modify content using the admin panel  
- Business hours and content updates are reflected in real-time  
- The system is designed to automatically restart videos and menus when an internet connection is restored  

This project provides a fully automated digital menu and promotional display for Dolce Vita Gelateria, ensuring an engaging and efficient customer experience.  
