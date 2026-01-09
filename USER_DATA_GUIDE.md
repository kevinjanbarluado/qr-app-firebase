# User Data Fetching Guide

This guide shows you how to fetch user data (name, photo, address, etc.) from Firestore and your API.

## Quick Start

### 1. Import the User Service

```typescript
import { getUserData, getUserDataWithAuth, UserData } from '../services/userService';
```

### 2. Fetch User Data in a Component

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserDataWithAuth, UserData } from '../services/userService';

const MyComponent: React.FC = () => {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState<UserData | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (currentUser) {
                const data = await getUserDataWithAuth(currentUser);
                setUserData(data);
            }
        };
        loadData();
    }, [currentUser]);

    if (!userData) return <div>Loading...</div>;

    return (
        <div>
            <h1>{userData.firstName} {userData.lastName}</h1>
            <p>Email: {userData.email}</p>
            <p>Phone: {userData.phoneNumber}</p>
            {userData.address && <p>Address: {userData.address}</p>}
            {userData.photo && <img src={userData.photo} alt="Profile" />}
        </div>
    );
};
```

## Available Functions

### `getUserData(userId: string)`
Fetches user data by ID. Tries Firestore first, then API, then stores in Firestore.

```typescript
const userData = await getUserData('user123');
```

### `getUserDataWithAuth(firebaseUser)`
Gets user data and merges it with Firebase Auth data (displayName, photoURL, etc.)

```typescript
const { currentUser } = useAuth();
const userData = await getUserDataWithAuth(currentUser);
```

### `getUserFromFirestore(userId: string)`
Fetches user data directly from Firestore only.

```typescript
const userData = await getUserFromFirestore('user123');
```

### `getUserFromAPI(userId: string)`
Fetches user data directly from your API only.

```typescript
const userData = await getUserFromAPI('user123');
```

### `saveUserToFirestore(userId: string, userData: UserData)`
Saves user data to Firestore.

```typescript
await saveUserToFirestore('user123', {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phoneNumber: '123-456-7890',
    address: '123 Main St',
    photo: 'https://example.com/photo.jpg'
});
```

### `updateUserInFirestore(userId: string, updates: Partial<UserData>)`
Updates specific fields in Firestore.

```typescript
await updateUserInFirestore('user123', {
    address: '456 New St',
    phoneNumber: '987-654-3210'
});
```

### `registerUser(userData)`
Registers a new user via API and saves to Firestore.

```typescript
const newUser = await registerUser({
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phoneNumber: '555-1234',
    address: '789 Oak Ave'
});
```

## UserData Interface

```typescript
interface UserData {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address?: string;        // Optional
    photo?: string;          // Optional - URL to photo
    dob?: string;           // Optional - Date of birth
    createdAt?: Date;        // Optional - Auto-set
    updatedAt?: Date;        // Optional - Auto-set
}
```

## Complete Example

See `src/components/UserProfileExample.tsx` for a complete working example.

## How It Works

1. **First Load**: Checks Firestore for user data
2. **If Not Found**: Fetches from your API
3. **Auto-Save**: Stores API data in Firestore for faster future access
4. **Merging**: Combines Firebase Auth data (from Google Sign-In) with stored data

## Data Flow

```
User Signs In with Google
    ↓
Firebase Auth provides: displayName, email, photoURL
    ↓
getUserDataWithAuth() merges:
    - Firebase Auth data (if available)
    - Firestore data (if exists)
    - API data (if Firestore empty)
    ↓
Component displays: name, photo, address, etc.
```

## Tips

- Use `getUserDataWithAuth()` for the best experience - it automatically merges Google Sign-In data
- User data is cached in Firestore after first fetch for faster loading
- Always check if data exists before displaying: `{userData?.address && <p>{userData.address}</p>}`
- Use optional chaining (`?.`) to safely access nested properties

## Error Handling

```typescript
try {
    const userData = await getUserData(userId);
    if (userData) {
        // Use the data
    } else {
        // User not found
    }
} catch (error) {
    console.error('Error fetching user:', error);
    // Handle error
}
```

