# Password Reset Flow Guide

Complete implementation guide for the password reset feature in AI Candidate Screening.

---

## Overview

The password reset flow consists of 3 steps:

1. **Forgot Password** - User requests password reset via email
2. **Email Link** - User clicks reset link in email
3. **Reset Password** - User sets new password using token

---

## Backend API Endpoints

### 1. Request Password Reset
**POST** `/api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "message": "If this email exists, a password reset link will be sent."
}
```

**Response (Error):**
```json
{
  "message": "Server error",
  "error": "Error message"
}
```

**What Happens:**
- Validates email exists (prevents email enumeration)
- Generates secure reset token
- Sets token expiry to 1 hour
- Sends email with reset link

---

### 2. Reset Password with Token
**POST** `/api/auth/reset-password/:token`

**Parameters:**
- `token` (URL parameter) - Reset token from email link

**Request Body:**
```json
{
  "newPassword": "newSecurePassword123"
}
```

**Response (Success):**
```json
{
  "message": "Password reset successful. You can now log in with your new password."
}
```

**Response (Error - Invalid Token):**
```json
{
  "message": "Invalid or expired reset token."
}
```

**Response (Error - Expired Token):**
```json
{
  "message": "Reset token has expired. Please request a new one."
}
```

**Response (Error - Weak Password):**
```json
{
  "message": "Password must be at least 6 characters long."
}
```

**What Happens:**
- Validates reset token exists in database
- Checks if token has expired (1 hour)
- Hashes new password with bcrypt
- Updates user password in database
- Clears reset token and expiry (one-time use)

---

## Frontend Implementation

### Step 1: Create "Forgot Password" Modal/Page

**File:** `src/features/auth/ForgotPassword.tsx`

```tsx
import React, { useState } from 'react';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post('/api/auth/forgot-password', {
        email: email.trim()
      });

      setMessage('Check your email for password reset instructions.');
      setEmail('');

      // Optionally redirect after 3 seconds
      setTimeout(() => {
        // Redirect to login or close modal
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Reset Your Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ForgotPassword;
```

---

### Step 2: Create "Reset Password" Form

**File:** `src/features/auth/ResetPassword.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`/api/auth/reset-password/${token}`, {
        newPassword
      });

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to reset password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="reset-password-container">
        <div className="success-box">
          <h2>✅ Password Reset Successful!</h2>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <h2>Create New Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={loading}
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            minLength={6}
          />
        </div>

        <button type="submit" disabled={loading || !token}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          {error.includes('expired') && (
            <a href="/forgot-password">Request a new reset link</a>
          )}
        </div>
      )}
    </div>
  );
};

export default ResetPassword;
```

---

### Step 3: Add Routes

**File:** `src/App.tsx`

```tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ForgotPassword from './features/auth/ForgotPassword';
import ResetPassword from './features/auth/ResetPassword';

function App() {
  return (
    <Router>
      <Routes>
        {/* Existing routes */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

### Step 4: Add Link to Login Page

In your login component, add:

```tsx
<p className="forgot-password-link">
  <a href="/forgot-password">Forgot your password?</a>
</p>
```

---

## Email Link Format

The email contains a link in this format:

```
http://localhost:3000/reset-password?token=<uuid-reset-token>
```

**Example:**
```
http://localhost:3000/reset-password?token=550e8400-e29b-41d4-a716-446655440000
```

---

## Database Requirements

Make sure your PostgreSQL `users` table has these columns:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;
```

---

## Testing the Flow

### Test 1: Request Password Reset (Postman)

```
POST http://localhost:5000/api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

Expected response:
```json
{
  "message": "If this email exists, a password reset link will be sent."
}
```

✅ Check your email for reset link

---

### Test 2: Reset Password with Valid Token (Postman)

Copy the token from the email and use it:

```
POST http://localhost:5000/api/auth/reset-password/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "newPassword": "newPassword123"
}
```

Expected response:
```json
{
  "message": "Password reset successful. You can now log in with your new password."
}
```

✅ Try logging in with new password

---

### Test 3: Reset with Expired Token

Wait 1 hour (or modify expiry in code), then try:

```
POST http://localhost:5000/api/auth/reset-password/expired-token
Content-Type: application/json

{
  "newPassword": "newPassword123"
}
```

Expected response:
```json
{
  "message": "Reset token has expired. Please request a new one."
}
```

---

## Security Features ✅

1. **Token Expiry**: Tokens expire after 1 hour
2. **One-Time Use**: Token is cleared after successful reset
3. **Password Hashing**: Uses bcryptjs with salt rounds 10
4. **Email Enumeration Prevention**: Same message for existing/non-existing emails
5. **Token Validation**: Checks both token existence and expiry
6. **Password Requirements**: Minimum 6 characters enforced
7. **HTTPS Ready**: Works with production HTTPS

---

## Troubleshooting

### Issue: Not receiving reset email
- Check backend SMTP configuration in `.env`
- Check spam/junk folder
- Verify email address is correct
- Check backend logs for email sending errors

### Issue: "Invalid or expired reset token"
- Token may have expired (1-hour limit)
- Request a new reset link
- Check if token format is correct in URL

### Issue: Password not updating
- Ensure password meets minimum requirements
- Check if reset_token columns exist in database
- Verify token hasn't been used already

### Issue: Login not working after reset
- Verify new password was saved (check backend logs)
- Try the correct email/password combination
- Clear browser cache and try again

---

## API Error Codes

| Status | Message | Solution |
|--------|---------|----------|
| 400 | Email is required | Provide email in request body |
| 400 | Password must be at least 6 characters | Use stronger password |
| 400 | Invalid or expired reset token | Request new reset link |
| 400 | Reset token has expired | Request new reset link |
| 500 | Server error | Check backend logs |

---

## Production Checklist

- [ ] Update `FRONTEND_URL` in `.env` to production domain
- [ ] Use production email credentials (SendGrid, Mailgun, etc.)
- [ ] Enable HTTPS for reset links
- [ ] Test email delivery with production email service
- [ ] Set stronger JWT_SECRET in `.env`
- [ ] Configure email rate limiting
- [ ] Monitor password reset attempts
- [ ] Set up password reset email template branding
- [ ] Add CSRF protection if needed
- [ ] Log password reset events for audit trail

---

## Support

For issues or questions:
- Check backend logs: `npm run dev`
- Verify `.env` configuration
- Test email endpoint: `POST /api/email/test`
- Check database with: `POST /db-test`
