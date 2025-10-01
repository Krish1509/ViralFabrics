# User Management Scripts

This directory contains scripts to manage users in your CRM Admin Panel application.

## 🚀 Quick Start

### 1. Create Default Super Admin
```bash
node scripts/create-test-user.js
```
This creates a default super admin user:
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `superadmin`

### 2. List All Users
```bash
node scripts/list-users.js
```
Shows all users in the database with their details.

### 3. Create Custom Super Admin
```bash
node scripts/create-super-admin.js
```
Creates a super admin with default values, or use custom parameters:

```bash
node scripts/create-super-admin.js "John Doe" "john" "mypassword123" "john@company.com" "+1234567890" "IT"
```

## 📋 Available Scripts

### `create-test-user.js`
- Creates a default super admin user
- Username: `admin`
- Password: `admin123`
- Role: `superadmin`

### `create-super-admin.js`
- Creates a super admin user with custom details
- Supports command line arguments
- Prevents duplicate usernames
- Shows detailed creation information

### `list-users.js`
- Lists all users in the database
- Shows user details, roles, and status
- Provides summary statistics

## 🔧 Usage Examples

### Create a Super Admin with Custom Details
```bash
node scripts/create-super-admin.js "Jane Smith" "jane" "securepass123" "jane@company.com" "+1987654321" "Management"
```

### Create Multiple Users
```bash
# Create super admin
node scripts/create-super-admin.js "Admin User" "admin" "admin123" "admin@company.com" "+1234567890" "IT"

# Create regular user (change role in script if needed)
node scripts/create-super-admin.js "Regular User" "user1" "user123" "user@company.com" "+1234567891" "Sales"
```

### Check User Status
```bash
node scripts/list-users.js
```

## 🔐 User Roles

- **superadmin**: Full system access, can manage all users and data
- **user**: Regular user access, limited permissions

## 📝 User Fields

Each user has the following fields:
- **name**: Full name
- **username**: Unique login username
- **password**: Encrypted password
- **email**: Email address (optional)
- **phoneNumber**: Phone number (optional)
- **role**: User role (superadmin/user)
- **isActive**: Account status
- **preferences**: Theme, language, notifications
- **metadata**: Department, employee ID, notes

## 🛡️ Security Features

- Passwords are automatically hashed with bcrypt
- Username uniqueness is enforced
- Account locking after failed login attempts
- Login count tracking
- Account status management

## 🚨 Important Notes

1. **First Time Setup**: Run `create-test-user.js` first to create your initial super admin
2. **Password Security**: Use strong passwords for production
3. **Database Connection**: Ensure your MongoDB URI is correctly set in `.env.local`
4. **Backup**: Always backup your database before making changes

## 🔍 Troubleshooting

### Connection Issues
- Check your MongoDB URI in `.env.local`
- Ensure MongoDB is running and accessible
- Verify network connectivity

### User Creation Issues
- Username must be unique
- Password must be at least 8 characters
- Email must be valid format (if provided)

### Permission Issues
- Ensure you have write access to the database
- Check user roles and permissions

## 📞 Support

If you encounter issues:
1. Check the console output for error messages
2. Verify your MongoDB connection
3. Ensure all required fields are provided
4. Check for duplicate usernames or emails
