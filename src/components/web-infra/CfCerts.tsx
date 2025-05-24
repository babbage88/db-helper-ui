import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { sendCertificateRequest, type CertificateRequest } from "@/lib/web-infra-svc"

export function CertificateRequestForm() {
  const [acmeEmail, setAcmeEmail] = useState("")
  const [acmeUrl, setAcmeUrl] = useState("https://acme-v02.api.letsencrypt.org/directory")
  const [domainName, setDomainName] = useState([""])
  const [recurseServers, setRecurseServers] = useState([""])
  const [pushS3, setPushS3] = useState(false)
  const [saveZip, setSaveZip] = useState(true)
  const [timeout, setTimeout] = useState(120)
  const [zipDir, setZipDir] = useState("/tmp")

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

  const handleSubmit = async () => {
    const token = localStorage.getItem("jwt")
    if (!token) {
      toast.error("No JWT token found in localStorage.")
      return
    }

    const requestBody: CertificateRequest = {
      acmeEmail,
      acmeUrl,
      domainName: domainName.filter(Boolean),
      recurseServers: recurseServers.filter(Boolean),
      pushS3,
      saveZip,
      timeout,
      zipDir,
      token: token,
    }

    try {
      const response = await sendCertificateRequest(token, requestBody)
      const resultText = await response.text()
      toast.success("Certificate request submitted successfully.")
      console.log(resultText)
    } catch (err) {
      console.error(err)
      toast.error("Failed to submit certificate request.")
    }
  }

  return (
    <div className="space-y-4 p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold">Let's Encrypt Certificate Request</h2>

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
          <div key={index} className="flex space-x-2">
            <Input
              value={domain}
              onChange={(e) => handleChangeList(domainName, index, e.target.value, setDomainName)}
            />
            <Button type="button" variant="outline" onClick={() => handleRemoveField(domainName, index, setDomainName)}>
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
          <div key={index} className="flex space-x-2">
            <Input
              value={server}
              onChange={(e) => handleChangeList(recurseServers, index, e.target.value, setRecurseServers)}
            />
            <Button type="button" variant="outline" onClick={() => handleRemoveField(recurseServers, index, setRecurseServers)}>
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
          onChange={(e) => setTimeout(parseInt(e.target.value))}
        />
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="pushS3" checked={pushS3} onChange={(e) => setPushS3(e.target.checked)} />
          <Label htmlFor="pushS3">Push to S3</Label>
        </div>

        <div className="flex items-center space-x-2">
          <input type="checkbox" id="saveZip" checked={saveZip} onChange={(e) => setSaveZip(e.target.checked)} />
          <Label htmlFor="saveZip">Save ZIP</Label>
        </div>
      </div>

      <Button onClick={handleSubmit}>Submit Certificate Request</Button>
    </div>
  )
}
