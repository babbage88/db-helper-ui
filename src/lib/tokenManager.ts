// tokenManager.ts (browser pseudo-async using localStorage)

const ACCESS_TOKEN_KEY = "authToken";
const REFRESH_TOKEN_KEY = "authToken";

export async function setToken(value: string): Promise<void> {
  localStorage.setItem(ACCESS_TOKEN_KEY, value);
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





