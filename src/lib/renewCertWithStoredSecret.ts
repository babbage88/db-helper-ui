import { SecretsService } from './services/SecretsService';
import { CertificatesService } from './services/CertificatesService';
import type { CertDnsRenewReq } from './models/CertDnsRenewReq';

/**
 * Renew an SSL certificate using a secret token stored by ID
 * @param secretId The ID of the secret to fetch
 * @param certReq Partial cert renewal request (without the token)
 */
async function renewCertificateWithSecret(secretId: string, certReq: Omit<CertDnsRenewReq, 'token'>): Promise<string> {
    try {
        // Step 1: Get the token from secret store
        const secret = await SecretsService.getUserSecretById(secretId);

        if (!secret?.token) {
            throw new Error(`No token found in secret with ID: ${secretId}`);
        }

        // Step 2: Merge token into the request body
        const fullReq: CertDnsRenewReq = {
            ...certReq,
            token: secret.token,
        };

        // Step 3: Call certificate renewal API
        const pemCert = await CertificatesService.renew(fullReq);

        console.log('Certificate successfully renewed.');
        return pemCert;

    } catch (error) {
        console.error('Error renewing certificate:', error);
        throw error;
    }
}
