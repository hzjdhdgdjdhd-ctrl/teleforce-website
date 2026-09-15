import { useEffect } from 'react'
import { company } from '@/config/company'

function setMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    const [key, val] = selector.replace(/meta\[|\]/g, '').split('=')
    el.setAttribute(key, val.replace(/"/g, ''))
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

/** Per-route document title and description. */
export function useSeo(title: string, description: string) {
  useEffect(() => {
    const full = `${title} — ${company.tradingName}`
    document.title = full
    setMeta('meta[name="description"]', 'content', description)
    setMeta('meta[property="og:title"]', 'content', full)
    setMeta('meta[property="og:description"]', 'content', description)
  }, [title, description])
}
