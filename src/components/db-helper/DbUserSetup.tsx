// src/components/DbUserSetup.tsx

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { downloadZip } from "@/lib/db-helper-svc"
import { Copy } from "lucide-react"
import { toast } from "sonner"


interface PgDevDbSetupScriptsResponse {
  "create_dev_db.sh": string
  "pg_create_db.sql": string
  "pg_app_db.sql": string
}

export function DbUserSetup() {
  const [dbHostname, setDbHostname] = useState("localhost")
  const [dbPort, setDbPort] = useState(5432)
  const [superuserUsername, setSuperuserUsername] = useState("postgres")
  const [superuserPassword, setSuperuserPassword] = useState("")
  const [databaseName, setDatabaseName] = useState("")
  const [serviceUsername, setServiceUsername] = useState("")
  const [servicePassword, setServicePassword] = useState("")
  const [scripts, setScripts] = useState<PgDevDbSetupScriptsResponse | null>(null)

  const generateScript = async () => {
    try {
      const res = await fetch("https://dbhelperui.trahan.dev/api/generate-pg-setup-scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dbHostname: dbHostname,
          dbPort: 5432,
          superuserUsername: superuserUsername,
          superuserPassword: superuserPassword,
          serviceUsername: serviceUsername,
          servicePassword: servicePassword,
          databaseName: databaseName,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to generate scripts")
      }

      const data: PgDevDbSetupScriptsResponse = await res.json()
      setScripts(data)
    } catch (err) {
      console.error(err)
      alert("An error occurred while generating scripts.")
    }
  }

  const copyToClipboard = (text: string) => {
    toast("copied to clipboard.")
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-4 p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold">Database/User Setup</h2>

      <div className="space-y-2">
        <Label htmlFor="dbHostname">DB Hostname</Label>
        <Input
          id="dbHostname"
          value={dbHostname}
          onChange={(e) => setDbHostname(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dbPort">DB Port</Label>
        <Input
          id="dbPort"
          type="number"
          value={dbPort}
          onChange={(e) => {
            const parsed = parseInt(e.target.value, 10)
            if (!isNaN(parsed)) {
              setDbPort(parsed)
            }
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="superuserUsername">Superuser Name</Label>
        <Input
          id="superuserUsername"
          value={superuserUsername}
          onChange={(e) => setSuperuserUsername(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="superuserPassword">Superuser Password</Label>
        <Input
          id="superuserPassword"
          type="password"
          value={superuserPassword}
          onChange={(e) => setSuperuserPassword(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="databaseName">Application Database Name</Label>
        <Input
          id="databaseName"
          value={databaseName}
          onChange={(e) => setDatabaseName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="serviceUsername">Service Account Username</Label>
        <Input
          id="serviceUsername"
          value={serviceUsername}
          onChange={(e) => setServiceUsername(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="servicePassword">Service Account Password</Label>
        <Input
          id="servicePassword"
          type="password"
          value={servicePassword}
          onChange={(e) => setServicePassword(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Button onClick={generateScript}>Generate Setup Scripts</Button>
      </div>

      {scripts && (
        <div className="space-y-6">
          {[
            { label: "Shell Script (create_dev_db.sh)", value: scripts["create_dev_db.sh"] },
            { label: "Postgres Admin SQL (pg_create_db.sql)", value: scripts["pg_create_db.sql"] },
            { label: "App DB SQL (pg_app_db.sql)", value: scripts["pg_app_db.sql"] },
          ].map((script, idx) => (
            <div key={idx} className="space-y-2">
              <Label>{script.label}</Label>
              <Textarea value={script.value} readOnly rows={10} />
              <Button variant="outline" onClick={() => copyToClipboard(script.value)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy to Clipboard
              </Button>
              <Button variant="default" onClick={() => downloadZip(dbHostname, dbPort, superuserUsername, superuserPassword, serviceUsername, servicePassword, databaseName)}>
                <Copy className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
