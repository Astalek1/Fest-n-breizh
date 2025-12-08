import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import '../src/App.scss'
import Home from './pages/Home/Home.jsx'
import Header from './components/Header/Header.jsx'

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  )
}

export default App
