import React from 'react'
import Signup from './pages/Signup'
import { BrowserRouter } from 'react-router-dom'

const App = () => {
  return (
    <div>
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    </div>
  )
}

export default App