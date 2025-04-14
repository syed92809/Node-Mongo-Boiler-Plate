import crypto from 'crypto';

export const generateOTP = async (length = 4) => {
    const digits = '0123456789';
    const otp = Array.from(crypto.randomBytes(length))
        .map(byte => digits[byte % digits.length])
        .join('');
    return otp;
}

export const generatePassword = async (length = 8) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const password = Array.from(crypto.randomBytes(length))
        .map(byte => characters[byte % characters.length])
        .join('');
    return password;
};