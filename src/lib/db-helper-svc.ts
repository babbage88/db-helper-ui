// src/lib/downloadZip.ts
const baseUrl = import.meta.env.VITE_DBHELPER_API_BASE_URL

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
    console.log(`${baseUrl}/download-pg-scripts`)
    const res = await fetch(`/download-pg-scripts`, {
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

async function fetchStringFromFile(fileUrl: string): Promise<string> {
  try {
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    return text;
  } catch (error) {
    console.error("Error fetching or processing the file:", error);
    throw error;
  }
}

export { fetchStringFromFile }

