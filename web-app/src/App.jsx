import { useState } from 'react'
import TextInput from "./components/texti.jsx"
import './App.css'
import Header from "./components/header.jsx"
import PageLayout from "./components/inputwrapper.jsx"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from "./components/landing-page/landing.jsx"
import { CssBaseline } from '@mui/material';
import PageWrapper from "./components/pagewrapper.jsx"


function App() {
  console.log("hello")

  return (
    <>
    <CssBaseline/>
    <Router>
      <Header title="My App" />
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route
    path="/insurance"
    element={
        <PageLayout />
    }
  />
</Routes>

    </Router>
    </>
  )
}

export default App
