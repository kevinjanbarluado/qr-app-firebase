// User types - Shared type definitions
export interface UserData {
    id?: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address?: string;
    photo?: string;
    dob?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

