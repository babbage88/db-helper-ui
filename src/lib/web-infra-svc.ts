import { OpenAPI } from "@/lib/api/core/OpenAPI";

// src/lib/downloadZip.ts
const baseUrl = import.meta.env.VITE_API_WEB_INFRA_URL;
const cfCertUrl = baseUrl + "/certs";
OpenAPI.BASE = import.meta.env.VITE_API_WEB_INFRA_URL;
OpenAPI.WITH_CREDENTIALS = true;
OpenAPI.CREDENTIALS = "include";

export interface CertificateRequest {
  acmeEmail: string;
  acmeUrl: string;
  domainName: string[];
  pushS3: boolean;
  recurseServers: string[];
  saveZip: boolean;
  timeout: number;
  token: string;
  zipDir: string;
}

export async function sendCertificateRequest(
  _jwtToken: string,
  requestBody: CertificateRequest
): Promise<Response> {
  try {
    const response = await fetch(cfCertUrl, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed with status ${response.status}: ${errorText}`);
    }

    return response;
  } catch (error) {
    console.error('Failed to send certificate request:', error);
    throw error;
  }
}

