// tokenManager.ts (browser pseudo-async using localStorage)

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export async function setToken(value: string): Promise<void> {
  localStorage.setItem(ACCESS_TOKEN_KEY, value);
  return Promise.resolve();
}

export async function setRefreshToken(value: string): Promise<void> {
  localStorage.setItem(REFRESH_TOKEN_KEY, value);
  return Promise.resolve();
}

export async function getRefreshToken(): Promise<string | null> {
  const token = localStorage.getItem(REFRESH_TOKEN_KEY);
  return Promise.resolve(token);
}

export async function getAccessToken(): Promise<string | null> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return Promise.resolve(token);
}

// src/auth/tokenService.ts
export const TokenService = {
    getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
    setAccessToken: (token: string) => localStorage.setItem(ACCESS_TOKEN_KEY, token),
    getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
    setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
    clearTokens: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    },
};


