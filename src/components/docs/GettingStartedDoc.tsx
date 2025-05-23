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
    <div className="prose max-w-none dark:prose-headings:text-gray-100 p-4 dark:text-gray-50 rounded-lg px-6 py-8 ring shadow-xl ring-gray-900/5" >
      <Markdown remarkPlugins={[remarkGfm]}>
        {readmeMDText}
      </Markdown>
    </div>
  )
}

export default DocsMarkdown
