import { Routes, Route } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ListingDetailPage from './pages/ListingDetailPage'

function App() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />
        </Routes>
      </Layout>
    </Box>
  )
}

export default App
