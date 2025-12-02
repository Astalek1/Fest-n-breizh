import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import '../src/App.scss'
import Home from './pages/Home/Home.jsx'

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/About" element={<About />} />
        <Route path="/Editions/:editionId" element={<Editions />} />
        <Route path="/Gallery/photos" element={<GalleryPhoto />} />
        <Route path="/Gallery/affiches" element={<GalleryPoster />} />
        <Route path="/Videos" element={<Videos />} />
        <Route path="/Links" element={<Links />} />
        <Route path="/Partners" element={<Partners />} />
        <Route path="/Contact" element={<Contact />} />
        <Route path="/Login" element={<Login />} />
        <Route path="*" element={<Error />} />
      </Routes>
      <Footer />
    </Router>
  )
}

export default App
