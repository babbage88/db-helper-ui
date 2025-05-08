// src/components/DocsMarkdown.tsx
import React, { useEffect, useState } from 'react'
import { fetchStringFromFile } from '@/lib/db-helper-svc'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm' // GitHub Flavored Markdown support

const DocsMarkdown: React.FC = () => {
  const [readmeMDText, setReadmeMDText] = useState<string>("Loading...")

  useEffect(() => {
    const loadMarkdown = async () => {
      try {
        const docsUrl = import.meta.env.VITE_DOCS_README_URL
        const text = await fetchStringFromFile(docsUrl)
        setReadmeMDText(text)
      } catch (error) {
        setReadmeMDText("Error loading documentation.")
        console.error(error)
      }
    }

    loadMarkdown()
  }, [])

  return (
    <div className="prose max-w-none p-4">
      <Markdown remarkPlugins={[remarkGfm]}>
        {readmeMDText}
      </Markdown>
    </div>
  )
}

export default DocsMarkdown
