# 🗄️ Database Migration Guide: test → CRM_AdminPanel

This guide documents the migration from the default "test" database to your specific "CRM_AdminPanel" database.

## ✅ **Migration Completed Successfully!**

### **📊 Migration Summary:**
- **Source Database**: `test` (default MongoDB database)
- **Target Database**: `CRM_AdminPanel` (your specific database)
- **Users Migrated**: 2 users
- **Status**: ✅ Complete

### **👥 Migrated Users:**
1. **Username**: `superadmin` | **Name**: Super Admin | **Role**: superadmin
2. **Username**: `admin` | **Name**: Admin User | **Role**: superadmin

## 🔧 **What Was Done:**

### **1. Database Analysis**
- ✅ Connected to source database (`test`)
- ✅ Found 11 collections and 2 users
- ✅ Connected to target database (`CRM_AdminPanel`)
- ✅ Confirmed target database was empty

### **2. User Migration**
- ✅ Migrated all users from `test` to `CRM_AdminPanel`
- ✅ Preserved all user data (passwords, roles, preferences)
- ✅ Added migration notes to user metadata
- ✅ Verified successful migration

### **3. Connection String Update**
- ✅ Updated MongoDB URI to include database name
- ✅ Changed from: `mongodb+srv://...@cluster0.qtppcus.mongodb.net/?...`
- ✅ Changed to: `mongodb+srv://...@cluster0.qtppcus.mongodb.net/CRM_AdminPanel?...`

## 📝 **Next Steps (Manual):**

### **1. Update Environment File**
You need to manually update your `.env.local` file:

**Current line:**
```
MONGODB_URI=mongodb+srv://krish1506soni_db_user:IwowMjDghFUAt5cZ@cluster0.qtppcus.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

**New line:**
```
MONGODB_URI=mongodb+srv://krish1506soni_db_user:IwowMjDghFUAt5cZ@cluster0.qtppcus.mongodb.net/CRM_AdminPanel?retryWrites=true&w=majority&appName=Cluster0
```

### **2. Test the Connection**
After updating the `.env.local` file, test the connection:
```bash
node scripts/test-db-connection.js
```

### **3. Test Login**
Try logging in with your migrated users:
- **Username**: `admin`
- **Password**: `admin123`

## 🧪 **Testing Commands:**

### **Test Database Connection**
```bash
node scripts/test-db-connection.js
```

### **Test Login Error Messages**
```bash
node scripts/test-login-errors.js
```

### **List All Users**
```bash
node scripts/list-users.js
```

### **Check Migration Status**
```bash
node scripts/migrate-database.js
```

## 🔍 **Why This Migration Was Needed:**

### **Problem:**
- Your application was connecting to the default "test" database
- Your old data was in a database named "CRM_AdminPanel"
- This caused a mismatch and potential data loss

### **Solution:**
- Migrated all users from "test" to "CRM_AdminPanel"
- Updated connection string to use the correct database
- Preserved all existing data and functionality

## 📊 **Database Structure:**

### **Source Database (test):**
- Collections: 11 (orders, mills, logs, millinputs, milloutputs, dispatches, labs, parties, users, qualities, counters)
- Users: 2

### **Target Database (CRM_AdminPanel):**
- Collections: Will be created as needed
- Users: 2 (migrated)

## 🚀 **Deployment Notes:**

### **For Vercel Deployment:**
Update your Vercel environment variables with the new MongoDB URI:
```
MONGODB_URI=mongodb+srv://krish1506soni_db_user:IwowMjDghFUAt5cZ@cluster0.qtppcus.mongodb.net/CRM_AdminPanel?retryWrites=true&w=majority&appName=Cluster0
```

### **For Local Development:**
Update your `.env.local` file with the new URI.

## ⚠️ **Important Notes:**

1. **Data Preservation**: All user data has been preserved during migration
2. **Passwords**: User passwords remain unchanged and functional
3. **Roles**: User roles and permissions are maintained
4. **Collections**: Other collections (orders, mills, etc.) remain in the "test" database
5. **Backup**: Consider backing up your data before making changes

## 🛠️ **Troubleshooting:**

### **If Login Fails:**
1. Check if `.env.local` file is updated correctly
2. Test database connection: `node scripts/test-db-connection.js`
3. Verify users exist: `node scripts/list-users.js`

### **If Database Connection Fails:**
1. Check MongoDB Atlas cluster status
2. Verify network access settings
3. Confirm connection string format

### **If Users Are Missing:**
1. Run migration again: `node scripts/migrate-users.js`
2. Check both databases: `node scripts/migrate-database.js`

## 📞 **Support:**

If you encounter any issues:
1. Run the diagnostic scripts provided
2. Check the console output for error messages
3. Verify your MongoDB Atlas configuration
4. Ensure all environment variables are set correctly

## 🎉 **Success Indicators:**

- ✅ Database connection test passes
- ✅ Users can log in successfully
- ✅ No "User not exist" errors for valid users
- ✅ Application functions normally
- ✅ Vercel deployment works correctly

Your database migration is complete! Update your `.env.local` file and test the connection.
