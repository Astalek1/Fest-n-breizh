import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import './App.scss'

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/About" element={<About />} />
        <Route path="/Editions/:editionId" element={<Editions />} />
        <Route path="/Gallery/photos" element={<GalleryPhoto />} />
        <Route path="/Gallery/affiches" element={<GalleryPoster />} />
        <Route path="/Video" element={<Video />} />
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
