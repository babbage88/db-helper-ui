import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function PostgresUrlBuilder() {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("5432");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [database, setDatabase] = useState("");
  const [url, setUrl] = useState("");

  const buildUrl = () => {
    const encodedUser = encodeURIComponent(username);
    const encodedPass = encodeURIComponent(password);
    const encodedHost = encodeURIComponent(host);
    const encodedDb = encodeURIComponent(database);

    const connectionUrl = `postgresql://${encodedUser}:${encodedPass}@${encodedHost}:${port}/${encodedDb}`;
    setUrl(connectionUrl);
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div>
        <Label>Host</Label>
        <Input value={host} onChange={e => setHost(e.target.value)} />
      </div>
      <div>
        <Label>Port</Label>
        <Input value={port} onChange={e => setPort(e.target.value)} />
      </div>
      <div>
        <Label>Username</Label>
        <Input value={username} onChange={e => setUsername(e.target.value)} />
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      </div>
      <div>
        <Label>Database</Label>
        <Input value={database} onChange={e => setDatabase(e.target.value)} />
      </div>
      <Button onClick={buildUrl}>Generate URL</Button>
      {url && (
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <Label>Connection URL:</Label>
          <p className="break-words">{url}</p>
        </div>
      )}
    </div>
  );
}

