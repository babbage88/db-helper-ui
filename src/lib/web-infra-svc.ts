// src/lib/downloadZip.ts
const baseUrl = import.meta.env.VITE_API_WEB_INFRA_URL
const cfCertUrl = baseUrl + "/certs";

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
  jwtToken: string,
  requestBody: CertificateRequest
): Promise<Response> {
  try {
    const response = await fetch(cfCertUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
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
