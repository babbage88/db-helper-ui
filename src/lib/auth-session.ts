import apiClient from "@/lib/api/apiClient";

export type SessionUser = {
  user_id: string;
  userName: string;
  email: string;
  roles: string[];
};

export const authSessionApi = {
  async getSession() {
    const response = await apiClient.get<SessionUser>("/auth/session");
    return response.data;
  },

  async logout() {
    await apiClient.post("/logout");
  },
};
