import Navbar from './components/Navbar'
import Hero from './components/Hero'

export default function App() {
  return <>
    <a className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-[#150500]" href="#main">Skip to content</a>
    <Navbar />
    <main id="main"><Hero /></main>
  </>
}
