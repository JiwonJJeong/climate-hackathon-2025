import { useState } from 'react'
import TextInput from "./components/texti.jsx"
import './App.css'
import Header from "./components/header.jsx"
import Onboarding from "./components/onboarding.jsx"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardHome from "./components/dashboard/home.jsx"
import Resources from "./components/dashboard/resources.jsx"
import Information from "./components/dashboard/info.jsx"


function App() {
  console.log("hello")

  return (
    <>
    <Router>
      <Header title="My App" />
      <Routes>
        <Route path="/dashboard" element={<DashboardHome title='This is dashboard home'/>} />
        <Route path="/dashboard/resources" element={<Resources title='This is resources'/>} />
        <Route path="/dashboard/learn-more" element={<Information title='This is info'/>} />
        <Route path="/onboarding" element={<Onboarding title='This is info'/>} />
      </Routes>
    </Router>
    </>
  )
}

export default App
