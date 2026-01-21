
import './App.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { Provider } from 'react-redux'
import { store } from './service/store'
import { ToastContainer } from 'react-toastify'
import { useEffect } from 'react'

function App() {

  return (
    <>
    <Provider store={store}>

      <RouterProvider router={router} />
      <ToastContainer/>
    </Provider>
    </>
  )
}

export default App
