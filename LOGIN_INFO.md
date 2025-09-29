# Smart Crowd Management System

## Login Credentials

After running the password reset script, use any of these accounts:

- Admin: admin@crowdmanagement.com / password123
- User: user@crowdmanagement.com / password123
- Test Admin: admin@test.com / password123

## Setup Instructions

1. **Backend Setup**

   ```bash
   cd dashboard/backend
   npm install
   ```

2. **Seed Database**

   ```bash
   npm run seed
   ```

3. **Reset Passwords** (if having login issues)

   ```bash
   node update-password.js
   ```

4. **Start Backend**

   ```bash
   npm run dev
   ```

5. **Start Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

For more detailed instructions, see the full documentation.
