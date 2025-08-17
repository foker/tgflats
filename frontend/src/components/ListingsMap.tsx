import MapWithClustering from './MapWithClustering'
import { Listing } from '../types'

interface ListingsMapProps {
  listings: Listing[]
  isLoading: boolean
}

const ListingsMap = ({ listings, isLoading }: ListingsMapProps) => {
  return <MapWithClustering listings={listings} isLoading={isLoading} />
}

export default ListingsMap