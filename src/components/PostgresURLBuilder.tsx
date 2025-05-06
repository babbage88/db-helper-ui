// src/components/PostgresUrlBuilder.tsx

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy } from "lucide-react"

const encodeURIComponentSafe = (value: string) => {
  return encodeURIComponent(value).replace(/[!'()*]/g, escape)
}

export function PostgresUrlBuilder() {
  const [host, setHost] = useState("")
  const [port, setPort] = useState("5432")
  const [database, setDatabase] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [sslMode, setSslMode] = useState("disable")
  const [connectionString, setConnectionString] = useState("")

  useEffect(() => {
    const safeUsername = encodeURIComponentSafe(username)
    const safePassword = encodeURIComponentSafe(password)
    const safeDatabase = encodeURIComponentSafe(database)

    const url = `postgresql://${safeUsername}:${safePassword}@${host}:${port}/${safeDatabase}?sslmode=${sslMode}`
    setConnectionString(url)
  }, [host, port, database, username, password, sslMode])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(connectionString)
  }

  return (
    <div className="space-y-4 p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold">PostgreSQL URL Builder</h2>

      <div className="space-y-2">
        <Label htmlFor="host">Host</Label>
        <Input id="host" value={host} onChange={(e) => setHost(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="port">Port</Label>
        <Input id="port" value={port} onChange={(e) => setPort(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="database">Database</Label>
        <Input id="database" value={database} onChange={(e) => setDatabase(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ssl">SSL Mode</Label>
        <Input id="ssl" value={sslMode} onChange={(e) => setSslMode(e.target.value)} placeholder="disable, require, verify-ca, etc." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="result">Connection String</Label>
        <Textarea id="result" value={connectionString} readOnly />
        <Button variant="outline" onClick={copyToClipboard}>
          <Copy className="mr-2 h-4 w-4" />
          Copy to Clipboard
        </Button>
      </div>
    </div>
  )
}
