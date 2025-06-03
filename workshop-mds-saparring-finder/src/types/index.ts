// This file exports TypeScript interfaces and types used throughout the application.

export interface RegisterRequest {
    email: string;
    password: string;
}

export interface RegisterResponse {
    message: string;
    user: UserProfile;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    message: string;
    user: UserProfile;
    accessToken: string;
    refreshToken: string;
}

export interface VerifyEmailRequest {
    code: string;
}

export interface VerifyEmailResponse {
    message: string;
}

export interface ResendVerificationEmailRequest {
    email: string;
}

export interface ResendVerificationEmailResponse {
    message: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    code: string;
    newPassword: string;
}

export interface UserProfile {
    id: number;
    email: string;
    is_verified: boolean;
    is_active: boolean;
}

export interface ErrorResponse {
    error: string;
}