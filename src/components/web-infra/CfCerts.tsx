import { useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Copy } from "lucide-react"
import type { CertDnsRenewReq } from "@/lib/models/CertDnsRenewReq"
import type { CertificateData } from "@/lib/models/CertificateData"
import { renewCertificateWithSecret } from "@/lib/renewCertWithStoredSecret"
import { cn } from "@/lib/utils"

export function CertificateRequestForm() {
  const [acmeEmail, setAcmeEmail] = useState("")
  const [acmeUrl, setAcmeUrl] = useState("https://acme-v02.api.letsencrypt.org/directory")
  const [domainName, setDomainName] = useState([""])
  const [recurseServers, setRecurseServers] = useState([""])
  const [timeout, setTimeout] = useState(120)
  const [zipDir, setZipDir] = useState("/tmp")
  const [certData, setCertData] = useState<CertificateData | null>(null)

  // Instead of scrolling, we conditionally hide form on success
  const showForm = !certData

  // List helpers
  const handleChangeList = (list: string[], index: number, value: string, setter: (val: string[]) => void) => {
    const newList = [...list]
    newList[index] = value
    setter(newList)
  }

  const handleAddField = (list: string[], setter: (val: string[]) => void) => {
    setter([...list, ""])
  }

  const handleRemoveField = (list: string[], index: number, setter: (val: string[]) => void) => {
    const newList = list.filter((_, i) => i !== index)
    setter(newList)
  }

  // Clipboard copy with feedback
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const handleSubmit = async () => {
    try {
      const certReq: Omit<CertDnsRenewReq, "token"> = {
        acmeEmail,
        acmeUrl,
        domainName: domainName.filter(Boolean),
        recurseServers: recurseServers.filter(Boolean),
        timeout,
        zipDir,
      }

      const response = await renewCertificateWithSecret(certReq)
      setCertData(response)
      toast.success("Certificate renewed successfully.")
    } catch (error) {
      toast.error("Failed to renew certificate. See console for details.")
      console.error(error)
    }
  }

  // Consistent PEM block style that fits text, with dark mode support
  const renderPemBlock = (label: string, content: string) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCopy(content)}
          aria-label={`Copy ${label}`}
        >
          <Copy className="w-4 h-4 mr-1" /> Copy
        </Button>
      </div>
      <pre
        className={cn(
          "p-4 border rounded-md text-sm whitespace-pre-wrap break-all overflow-x-auto",
          "bg-white text-gray-900 border-gray-300",
          "dark:bg-zinc-900 dark:text-gray-100 dark:border-zinc-700"
        )}
        tabIndex={0}
      >
        {content}
      </pre>
    </div>
  )

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold">Let's Encrypt Certificate Request</h2>

      {showForm && (
        <>
          <div className="space-y-2">
            <Label htmlFor="acmeEmail">ACME Email</Label>
            <Input id="acmeEmail" value={acmeEmail} onChange={(e) => setAcmeEmail(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acmeUrl">ACME URL</Label>
            <Input id="acmeUrl" value={acmeUrl} onChange={(e) => setAcmeUrl(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Domains</Label>
            {domainName.map((domain, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={domain}
                  onChange={(e) => handleChangeList(domainName, index, e.target.value, setDomainName)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleRemoveField(domainName, index, setDomainName)}
                  aria-label={`Remove domain ${domain}`}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={() => handleAddField(domainName, setDomainName)}>
              Add Domain
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Recurse Servers</Label>
            {recurseServers.map((server, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={server}
                  onChange={(e) => handleChangeList(recurseServers, index, e.target.value, setRecurseServers)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleRemoveField(recurseServers, index, setRecurseServers)}
                  aria-label={`Remove recurse server ${server}`}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={() => handleAddField(recurseServers, setRecurseServers)}>
              Add Server
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipDir">Zip Directory</Label>
            <Input id="zipDir" value={zipDir} onChange={(e) => setZipDir(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeout">Timeout (seconds)</Label>
            <Input
              id="timeout"
              type="number"
              value={timeout}
              onChange={(e) => setTimeout(parseInt(e.target.value) || 0)}
            />
          </div>

          <Button onClick={handleSubmit}>Submit Certificate Request</Button>
        </>
      )}

      {certData && (
        <div className="mt-12 space-y-6 border-t pt-6" tabIndex={-1} aria-live="polite">
          <h3 className="text-xl font-semibold">Certificate Details</h3>

          {certData.domainName && certData.domainName.length > 0 && (
            <div>
              <Label>Domains:</Label>
              <ul className="list-disc pl-6">
                {certData.domainName.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {certData.cert_pem && renderPemBlock("Certificate (PEM)", certData.cert_pem)}
          {certData.chain_pem && renderPemBlock("Chain (PEM)", certData.chain_pem)}
          {certData.fullchain_pem && renderPemBlock("Full Chain (PEM)", certData.fullchain_pem)}
          {certData.priv_key && renderPemBlock("Private Key", certData.priv_key)}

          {certData.s3DownloadUrl && (
            <div>
              <Label>Download Link</Label>
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
  )
}
