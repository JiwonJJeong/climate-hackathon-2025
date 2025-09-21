import { useState } from 'react'
import TextInput from "./components/texti.jsx"
import './App.css'
import Header from "./components/header.jsx"
import Onboarding from "./components/onboarding.jsx"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PersonalInput from "./components/dashboard/home.jsx"
import Resources from "./components/dashboard/resources.jsx"
import Information from "./components/dashboard/info.jsx"
import IndividualsPage from "./components/dashboard/individuals.jsx"
import LandingPage from "./components/landing.jsx"
import Visualization from "./components/visualization.jsx"
import { CssBaseline } from '@mui/material';


function App() {
  console.log("hello")

  return (
    <>
    <CssBaseline/>
    <Router>
      <Header title="My App" />
      <Routes>
        <Route path='/' element={<LandingPage/>}/>
        <Route path="/personal" element={<PersonalInput title='This is dashboard home'/>} />
        <Route path="/personal/resources" element={<Resources title='This is resources'/>} />
        <Route path="/personal/learn-more" element={<Information title='This is info'/>} />
        <Route path="/individuals" element={<IndividualsPage/>} />
        <Route path="/insurance" element={<Onboarding/>} />
        <Route path='/datavis' element={<Visualization/>} />
      </Routes>
    </Router>
    </>
  )
}

export default App
