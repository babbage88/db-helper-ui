// src/lib/downloadZip.ts
const baseUrl = import.meta.env.VITE_API_BASE_URL

export const downloadZip = async (
  dbHostname: string,
  dbPort: number,
  superuserUsername: string,
  superuserPassword: string,
  serviceUsername: string,
  servicePassword: string,
  databaseName: string
) => {
  try {
    console.log(`${baseUrl}/api/download-pg-scripts`)
    const res = await fetch(`/api/download-pg-scripts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dbHostname,
        dbPort,
        superuserUsername,
        superuserPassword,
        serviceUsername,
        servicePassword,
        databaseName,
      }),
    })

    if (!res.ok) {
      throw new Error("Failed to download ZIP file")
    }

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "pg_setup_scripts.zip"
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error(err)
    alert("An error occurred while downloading the ZIP.")
  }
}

