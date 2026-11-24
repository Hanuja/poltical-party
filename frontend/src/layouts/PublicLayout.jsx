import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import BackToTop from '../components/BackToTop'
import PublicVoicesFloatingButton from '../components/PublicVoicesFloatingButton'
import { useReveal } from '../hooks/useReveal'

export default function PublicLayout() {
  const { pathname } = useLocation()
  useReveal([pathname])

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <div className="site">
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
      <PublicVoicesFloatingButton />
      <BackToTop />
    </div>
  )
}
