// Admin configuration
// Only admin@perlasngsilangan.com can access the admin dashboard

const ADMIN_EMAIL = 'admin@perlasngsilangan.com';

export const ADMIN_EMAILS: string[] = [ADMIN_EMAIL];

// Check if an email is an admin
export const isAdminEmail = (email: string | null | undefined): boolean => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};
