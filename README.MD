# Track 3D AI - Construction Analytics Platform

AI-powered construction project analytics and forecasting platform.

## Features

- AI-Powered Analytics: Predict project completion dates, resource needs, and deviations.

- Real-Time Progress Tracking: Compare planned vs. actual progress.
 
- Role-Based Access Control:
 
   - Core User: Access analytics and reports.
 
   - Admin User: Full project management control.
 
- Dashboards & Reports: Generate reports with real-time data insights.

## Chart
![Model For Project](src/Model.png)

## Installation

### Prerequisites

   - Python 3.11+

   - FastAPI & TypeScript
   
   - Docker

## Setup

### Clone the repository
```shell
git clone https://github.com/MisfiT2020/Track-3D.git
cd Track-3D
```
### Install backend dependencies
```cd backend
pip install -r requirements.txt
```

### Install frontend dependencies
```
cd frontend
npm install
```

## Configuration

- Update the address in vite.config.ts as needed.

## Run the Application

### Start the application using Docker
```
sudo docker compose up --build
```

## Screenshots

### ADMIN INTERFACE
|                       |                       |
| --------------------- | --------------------- |
| ![Admin Screen 1](src/login.jpeg) | ![Admin Screen 2](src/sign-up.jpeg) |
| ![Admin Screen 3](src/profile-page.jpeg) | ![Admin Screen 4](src/navbar.jpeg) |
| ![Admin Screen 5](src/dashboard.jpeg) | ![Admin Screen 4](src/dashboard2.jpeg) |
| ![Admin Screen 4](src/manage-users.jpeg) | ![Admin Screen 6](src/update-user.jpeg) |
| ![Admin Screen 5](src/import-csv.jpeg) | ![Admin Screen 6](src/import-csv2.jpeg) |
| ![Admin Screen 5](src/report-pdf.jpeg) | ![Admin Screen 7](src/logs.jpeg) |
| ![Admin Screen 8](src/recents.jpeg)|


### USER INTERFACE
| ![User-1](src/user1.jpeg) | ![User-2](src/user2.jpeg) |
| ---------------------- | ---------------------- |
| ![USer-3](src/user3.jpeg) |                       |



## Usage

- Log in to access your projects.

- Upload project plans and monitor progress.

- View AI-generated insights and analytics.

- Generate and export reports.

## Permissions
 
### CLI Method 

- To create a account as sudo, we need to need make the sudo account from either from
- swagger ui or edit the database.
- To edit the database, 
- `sqlite3 track.db` - to enter the database
- `.tables` - to get the tables from databse
- `.schema users` - to get the schema of the selected table
- `SELECT * FROM users;` - returns the registered users 
- `UPDATE users SET is_sudo = 1 WHERE userid = 225201;` - to update the `is_sudo` to 1, uses Bool

### SWAGGER Method

- To update from swagger ui, go to running backend port `<url>:<port>/docs#/`
- select `sign-up` field
```body
{
  "username": "misfit",
  "email": "misfit",
  "password": "misfit",
  "is_sudo": true
}
```
🔹 change the `is_sudo` to change the admin permission for the user when creating 