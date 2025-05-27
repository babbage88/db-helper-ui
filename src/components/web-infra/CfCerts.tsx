import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import type { CertDnsRenewReq } from "@/lib/models/CertDnsRenewReq";
import type { CertificateData } from "@/lib/models/CertificateData";
import { renewCertificateWithSecret } from "@/lib/renewCertWithStoredSecret";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function CertificateRequestForm() {
  const [acmeEmail, setAcmeEmail] = useState("");
  const [acmeUrl, setAcmeUrl] = useState(
    "https://acme-v02.api.letsencrypt.org/directory"
  );
  const [domainName, setDomainName] = useState([""]);
  const [recurseServers, setRecurseServers] = useState(["1.1.1.1", "1.0.0.1"]);
  const [timeout, setTimeout] = useState(120);
  const [certData, setCertData] = useState<CertificateData | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleChangeList = (
    list: string[],
    index: number,
    value: string,
    setter: (val: string[]) => void
  ) => {
    const newList = [...list];
    newList[index] = value;
    setter(newList);
  };

  const handleAddField = (list: string[], setter: (val: string[]) => void) => {
    setter([...list, ""]);
  };

  const handleRemoveField = (
    list: string[],
    index: number,
    setter: (val: string[]) => void
  ) => {
    const newList = list.filter((_, i) => i !== index);
    setter(newList);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleSubmit = async () => {
    let zipDir = "certs"
    try {
      const certReq: Omit<CertDnsRenewReq, "token"> = {
        acmeEmail,
        acmeUrl,
        domainName: domainName.filter(Boolean),
        recurseServers: recurseServers.filter(Boolean),
        timeout,
        zipDir,
      };

      const response = await renewCertificateWithSecret(certReq);
      setCertData(response);
      toast.success("Certificate renewed successfully.");

      window.setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch (error) {
      toast.error("Failed to renew certificate. See console for details.");
      console.error(error);
    }
  };

  const renderPemBlock = (label: string, content: string) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{label}</Label>
        <Button variant="ghost" size="sm" onClick={() => handleCopy(content)}>
          <Copy className="w-4 h-4 mr-1" /> Copy
        </Button>
      </div>
      <pre
        className={cn(
          "p-4 border rounded-xl text-sm overflow-x-auto whitespace-pre-wrap font-mono",
          "bg-muted text-foreground border-muted-foreground/20",
          "dark:bg-zinc-900 dark:text-gray-100 dark:border-zinc-700"
        )}
      >
        {content}
      </pre>
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-12">
      <div
        className={cn(
          "space-y-6 transition-opacity duration-700",
          certData
            ? "opacity-40 pointer-events-none select-none blur-sm"
            : "opacity-100"
        )}
      >
        <h2 className="text-2xl font-bold">
          Let's Encrypt Certificate Request
        </h2>

        <div className="space-y-2">
          <Label htmlFor="acmeEmail">ACME Email</Label>
          <Input
            id="acmeEmail"
            value={acmeEmail}
            onChange={(e) => setAcmeEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="acmeUrl">ACME URL</Label>
          <Input
            id="acmeUrl"
            value={acmeUrl}
            onChange={(e) => setAcmeUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Domains</Label>
          {domainName.map((domain, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={domain}
                onChange={(e) =>
                  handleChangeList(
                    domainName,
                    index,
                    e.target.value,
                    setDomainName
                  )
                }
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  handleRemoveField(domainName, index, setDomainName)
                }
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleAddField(domainName, setDomainName)}
          >
            Add Domain
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Recurse Servers</Label>
          {recurseServers.map((server, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={server}
                onChange={(e) =>
                  handleChangeList(
                    recurseServers,
                    index,
                    e.target.value,
                    setRecurseServers
                  )
                }
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  handleRemoveField(recurseServers, index, setRecurseServers)
                }
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleAddField(recurseServers, setRecurseServers)}
          >
            Add Server
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeout">Timeout (seconds)</Label>
          <Input
            id="timeout"
            type="number"
            value={timeout}
            onChange={(e) => setTimeout(parseInt(e.target.value))}
          />
        </div>

        <Button onClick={handleSubmit}>Submit Certificate Request</Button>
      </div>

      {certData && (
        <div
          ref={resultRef}
          className="space-y-6 border-t pt-6 animate-in fade-in duration-500"
        >
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium text-lg">
            <CheckCircle className="w-5 h-5" />
            Certificate successfully created
          </div>

          {Array.isArray(certData.domainName) &&
            certData.domainName.length > 0 && (
              <div>
                <Label className="font-semibold">Domains:</Label>
                <ul className="list-disc pl-6">
                  {certData.domainName.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

          {certData.cert_pem &&
            renderPemBlock("Certificate (PEM)", certData.cert_pem)}
          {certData.chain_pem &&
            renderPemBlock("Chain (PEM)", certData.chain_pem)}
          {certData.fullchain_pem &&
            renderPemBlock("Full Chain (PEM)", certData.fullchain_pem)}
          {certData.priv_key &&
            renderPemBlock("Private Key", certData.priv_key)}

          {certData.s3DownloadUrl && (
            <div>
              <Label className="font-semibold">Download Link</Label>
              <a
                href={certData.s3DownloadUrl}
                className="text-blue-600 dark:text-blue-400 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download ZIP
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
