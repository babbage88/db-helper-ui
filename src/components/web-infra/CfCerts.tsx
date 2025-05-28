import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Loader2, Download } from "lucide-react"; // removed unused CheckCircle and X from here, will import separately
import { cn } from "@/lib/utils";
import type { CertDnsRenewReq } from "@/lib/models/CertDnsRenewReq";
import type { CertificateData } from "@/lib/models/CertificateData";
import { renewCertificateWithSecret } from "@/lib/renewCertWithStoredSecret";
import { ScrollArea } from "@/components/ui/scroll-area";

// Only import CheckCircle, X if certData is shown
import { CheckCircle, X } from "lucide-react";

function ListFieldEditor({
  label,
  list,
  setter,
  inputId,
  addButtonText,
}: {
  label: string;
  list: string[];
  setter: (val: string[]) => void;
  inputId?: string;
  addButtonText: string;
}) {
  const handleChange = (index: number, value: string) => {
    const newList = [...list];
    newList[index] = value;
    setter(newList);
  };

  const handleAdd = () => setter([...list, ""]);

  const handleRemove = (index: number) => {
    const newList = list.filter((_, i) => i !== index);
    setter(newList);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      {list.map((value, index) => (
        <div key={index} className="flex gap-2">
          <Input
            id={index === 0 ? inputId : undefined}
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => handleRemove(index)}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={handleAdd}>
        {addButtonText}
      </Button>
    </div>
  );
}

function PemBlock({ label, content }: { label: string; content: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{label}</Label>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          <Copy className="w-4 h-4 mr-1" /> Copy
        </Button>
      </div>

      <pre
        className={cn(
          "p-4 border rounded-xl text-sm whitespace-pre-wrap font-mono",
          "bg-muted text-foreground border-muted-foreground/20",
          "dark:bg-zinc-900 dark:text-gray-100 dark:border-zinc-700",
          "overflow-auto max-h-[300px]"
        )}
      >
        <ScrollArea>{content}</ScrollArea>
      </pre>
    </div>
  );
}

export function CertificateRequestForm() {
  const [acmeEmail, setAcmeEmail] = useState("");
  const [acmeUrl, setAcmeUrl] = useState(
    "https://acme-v02.api.letsencrypt.org/directory"
  );
  const [domainName, setDomainName] = useState([""]);
  const [recurseServers, setRecurseServers] = useState(["1.1.1.1", "1.0.0.1"]);
  const [timeout, setTimeout] = useState(120);
  const [certData, setCertData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setCertData(null);
    try {
      let first = domainName[0] ?? "certificate";
      if (first.startsWith("*")) first = first.slice(1);
      const zipDir = `_${first}.zip`;

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
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => setCertData(null);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      <div className="p-6 max-w-3xl mx-auto space-y-12">
        {!certData && (
          <div
            className={cn(
              "space-y-6 transition-opacity duration-500",
              loading ? "opacity-40" : "opacity-100"
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

            <ListFieldEditor
              label="Domains"
              list={domainName}
              setter={setDomainName}
              inputId="domains"
              addButtonText="Add Domain"
            />

            <ListFieldEditor
              label="Recurse Servers"
              list={recurseServers}
              setter={setRecurseServers}
              inputId="recurseServers"
              addButtonText="Add Server"
            />

            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                value={timeout}
                onChange={(e) => setTimeout(parseInt(e.target.value))}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Requesting...
                </>
              ) : (
                "Submit Certificate Request"
              )}
            </Button>
          </div>
        )}

        {certData && (
          <div
            className="fixed inset-0 z-40 bg-black/30 overflow-auto p-6"
            onClick={handleReset}
          >
            <ScrollArea
              className="relative max-w-3xl mx-auto bg-background rounded-xl p-6"
              style={{ maxHeight: "90vh" }}
              onClick={(e) => e.stopPropagation()}
              ref={resultRef}
            >
                <button
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                  onClick={handleReset}
                  aria-label="Close certificate result"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium text-lg mb-4">
                  <CheckCircle className="w-5 h-5" /> Certificate successfully
                  created
                </div>
                 <div className="flex flex-row p-2 justify-between">
              {Array.isArray(certData.domainName) &&
                certData.domainName.length > 0 && (
                  <div className="mb-4">
                    <Label className="font-semibold">Domains:</Label>
                    <ul className="list-disc pl-6">
                      {certData.domainName.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {certData.s3DownloadUrl && (
                  <div className="mt-4">
                    <Label className="font-mono"></Label>
                    <a
                      href={certData.s3DownloadUrl}
                      className="text-blue-600 dark:text-blue-400 underline block"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download size={30} color="#00bc7d" strokeWidth={2} />
                    </a>
                  </div>
                )}
              </div>

              {certData.cert_pem && (
                <PemBlock
                  label="Certificate (PEM)"
                  content={certData.cert_pem}
                />
              )}
              {certData.chain_pem && (
                <PemBlock label="Chain (PEM)" content={certData.chain_pem} />
              )}
              {certData.fullchain_pem && (
                <PemBlock
                  label="Full Chain (PEM)"
                  content={certData.fullchain_pem}
                />
              )}
              {certData.priv_key && (
                <PemBlock label="Private Key" content={certData.priv_key} />
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </>
  );
}
