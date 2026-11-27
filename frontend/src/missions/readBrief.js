const maxFileSize = 10 * 1024 * 1024
const maxPages = 30

async function readPdf(file) {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false })
  try {
    const document = await task.promise
    if (document.numPages > maxPages) throw new Error('Choisissez un PDF de 30 pages maximum.')
    const pages = []
    for (let index = 1; index <= document.numPages; index++) {
      const page = await document.getPage(index)
      const { items } = await page.getTextContent()
      pages.push(items.map(item => ('str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '')).join(''))
      page.cleanup()
    }
    const text = pages.join('\n').trim()
    if (!text) throw new Error('Ce PDF ne contient pas de texte lisible. Importez une version avec texte sélectionnable.')
    return text
  } finally {
    await task.destroy()
  }
}

async function readDocx(file) {
  const { unzipSync, strFromU8 } = await import('fflate')
  const source = 'word/document.xml'
  const archive = unzipSync(new Uint8Array(await file.arrayBuffer()), {
    filter: entry => entry.name === source && entry.originalSize <= maxFileSize,
  })
  if (!archive[source]) throw new Error('Le fichier DOCX est invalide ou son texte est trop volumineux.')
  const document = new DOMParser().parseFromString(strFromU8(archive[source]), 'application/xml')
  if (document.querySelector('parsererror')) throw new Error('Le fichier DOCX est illisible.')
  const namespace = document.documentElement.namespaceURI
  return Array.from(document.getElementsByTagNameNS(namespace, 'p'), paragraph =>
    Array.from(paragraph.getElementsByTagNameNS(namespace, 't'), node => node.textContent).join('')
  ).join('\n')
}

export async function readBrief(file) {
  if (file.size > maxFileSize) throw new Error('Le fichier dépasse la limite de 10 Mo.')
  const extension = file.name.split('.').at(-1)?.toLowerCase()
  switch (extension) {
    case 'pdf': return readPdf(file)
    case 'docx': return readDocx(file)
    case 'txt':
    case 'md': return file.text()
    default: throw new Error('Choisissez un fichier PDF, DOCX, TXT ou Markdown.')
  }
}
