// src/components/DbUserSetup.tsx

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy } from "lucide-react"

export function DbUserSetup() {
  const [superuserUsername, setSuperuserUsername] = useState("")
  const [superuserPassword, setSuperuserPassword] = useState("")
  const [databaseName, setDatabaseName] = useState("")
  const [serviceUsername, setServiceUsername] = useState("")
  const [servicePassword, setServicePassword] = useState("")
  const [script, setScript] = useState("")

  const generateScript = async () => {
    // Here you would call your backend (Go) to generate the SQL/Bash script
    // For now, we'll mock a simple SQL script generation
    
    const sqlScript = `
      -- SQL Script to create database and user
      CREATE DATABASE ${databaseName};

      CREATE USER ${serviceUsername} WITH ENCRYPTED PASSWORD '${servicePassword}';

      GRANT ALL PRIVILEGES ON DATABASE ${databaseName} TO ${serviceUsername};

      -- You may need to adjust other permissions here.
    `

    setScript(sqlScript)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script)
  }

  return (
    <div className="space-y-4 p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold">Database/User Setup</h2>

      <div className="space-y-2">
        <Label htmlFor="superuserUsername">Superuser Username</Label>
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
        <Button variant="default" onClick={generateScript}>
          Generate Setup Script
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="script">Generated Script</Label>
        <Textarea id="script" value={script} readOnly rows={10} />
        <Button variant="outline" onClick={copyToClipboard}>
          <Copy className="mr-2 h-4 w-4" />
          Copy to Clipboard
        </Button>
      </div>
    </div>
  )
}
