import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import { SiteContentProvider } from '@/hooks/useSiteContent'
import ScrollManager from '@/components/layout/ScrollManager'
import Home from '@/pages/Home'
import Services from '@/pages/Services'
import Technology from '@/pages/Technology'
import Teams from '@/pages/Teams'
import DataProtection from '@/pages/DataProtection'
import Contact from '@/pages/Contact'
import Company from '@/pages/Company'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <SiteContentProvider>
      <ScrollManager />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/technology" element={<Technology />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/data-protection" element={<DataProtection />} />
          <Route path="/company" element={<Company />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      </SiteContentProvider>
    </BrowserRouter>
  )
}
