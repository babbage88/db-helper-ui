import { SecretsService } from "./api/services/SecretsService";
import { CertificatesService } from "./api/services/CertificatesService";
import type { CertDnsRenewReq } from "./api/models/CertDnsRenewReq";
import type { CertificateData } from "./api/models/CertificateData";
import { OpenAPI } from "@/lib/api/core/OpenAPI";
import { getAccessToken } from "./tokenManager";

// src/lib/downloadZip.ts
OpenAPI.BASE = import.meta.env.VITE_API_WEB_INFRA_URL;
OpenAPI.TOKEN = async () => (await getAccessToken()) ?? "";

/**
 * Renew an SSL certificate using a secret token stored by ID
 * @param secretId The ID of the secret to fetch
 * @param certReq Partial cert renewal request (without the token)
 */
export async function renewCertificateWithSecret(
  certReq: Omit<CertDnsRenewReq, "token">
): Promise<CertificateData> {
  try {
    certReq.pushS3 = true;
    const uid = localStorage.getItem("userId") ?? "";
    const appName = "CloudflareDNS";
    // Step 1: Get List of CloudflareDNS secrets for the current user
    const secretEntries = await SecretsService.getUserSecretEntriesByAppName(
      uid,
      appName
    );

    if (secretEntries.length < 1) {
      throw new Error(
        `No secrets configured for UserID: ${uid} AppName: ${appName}`
      );
    }

    if (!secretEntries[0].secretMetadata?.id) {
      throw new Error(`No ID found in secreEntry metadata`);
    }

    const secretId = secretEntries[0].secretMetadata?.id ?? "";

    // Step 2: Get the token from secret store
    const secret = await SecretsService.getUserSecretById(secretId);

    if (!secret?.secret) {
      throw new Error(`No token found in secret with ID: ${secretId}`);
    }

    let zipDir = "certs";
    if (Array.isArray(certReq.domainName) && certReq.domainName.length > 0) {
      let firstDomain = certReq.domainName[0];
      if (firstDomain.startsWith("*")) {
        firstDomain = firstDomain.slice(1);
      }
      zipDir = `${firstDomain}.zip`;
    }

    // Step 3: Merge token into the request body
    const fullReq: CertDnsRenewReq = {
      ...certReq,
      token: secret.secret,
      zipDir: zipDir
    };

    // Step 4: Call certificate renewal API
    const pemCert = await CertificatesService.renew(fullReq);

    console.log("Certificate successfully renewed.");
    return pemCert;
  } catch (error) {
    console.error("Error renewing certificate:", error);
    throw error;
  }
}
