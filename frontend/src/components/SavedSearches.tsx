import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Badge,
  IconButton,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Divider,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon, StarIcon } from '@chakra-ui/icons'
import { ListingFilters } from '../types'

interface SavedSearch {
  id: string
  name: string
  filters: ListingFilters
  createdAt: string
  lastUsed?: string
}

interface SavedSearchesProps {
  currentFilters: ListingFilters
  onLoadSearch: (filters: ListingFilters) => void
}

const SavedSearches = ({ currentFilters, onLoadSearch }: SavedSearchesProps) => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [searchName, setSearchName] = useState('')
  const [searchToDelete, setSearchToDelete] = useState<string | null>(null)
  
  const { isOpen: isSaveOpen, onOpen: onSaveOpen, onClose: onSaveClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const toast = useToast()

  // Load saved searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tbi-prop-saved-searches')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSavedSearches(Array.isArray(parsed) ? parsed : [])
      } catch (error) {
        console.error('Failed to parse saved searches:', error)
      }
    }
  }, [])

  // Save to localStorage whenever savedSearches changes
  useEffect(() => {
    localStorage.setItem('tbi-prop-saved-searches', JSON.stringify(savedSearches))
  }, [savedSearches])

  const hasActiveFilters = () => {
    return Object.keys(currentFilters).some(key => {
      const value = currentFilters[key as keyof ListingFilters]
      return value !== undefined && value !== null && value !== ''
    })
  }

  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for your search',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!hasActiveFilters()) {
      toast({
        title: 'No filters to save',
        description: 'Please apply some filters before saving',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName.trim(),
      filters: { ...currentFilters },
      createdAt: new Date().toISOString(),
    }

    setSavedSearches(prev => [newSearch, ...prev])
    setSearchName('')
    onSaveClose()
    
    toast({
      title: 'Search saved!',
      description: `"${newSearch.name}" has been saved to your searches`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleLoadSearch = (search: SavedSearch) => {
    // Update last used timestamp
    setSavedSearches(prev => 
      prev.map(s => 
        s.id === search.id 
          ? { ...s, lastUsed: new Date().toISOString() }
          : s
      )
    )
    
    onLoadSearch(search.filters)
    
    toast({
      title: 'Search loaded',
      description: `Applied filters from "${search.name}"`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    })
  }

  const handleDeleteSearch = (searchId: string) => {
    setSearchToDelete(searchId)
    onDeleteOpen()
  }

  const confirmDeleteSearch = () => {
    if (searchToDelete) {
      setSavedSearches(prev => prev.filter(s => s.id !== searchToDelete))
      setSearchToDelete(null)
      onDeleteClose()
      
      toast({
        title: 'Search deleted',
        description: 'The saved search has been removed',
        status: 'info',
        duration: 2000,
        isClosable: true,
      })
    }
  }

  const formatFiltersPreview = (filters: ListingFilters): string => {
    const parts: string[] = []
    
    if (filters.q) parts.push(`"${filters.q}"`)
    if (filters.district) parts.push(filters.district)
    if (filters.priceMin || filters.priceMax) {
      const min = filters.priceMin || 0
      const max = filters.priceMax || '∞'
      parts.push(`${min}-${max} GEL`)
    }
    if (filters.rooms) parts.push(`${filters.rooms} bed`)
    if (filters.areaMin || filters.areaMax) {
      const min = filters.areaMin || 0
      const max = filters.areaMax || '∞'
      parts.push(`${min}-${max}m²`)
    }
    if (filters.petFriendly) parts.push('Pet-friendly')
    if (filters.furnished) parts.push('Furnished')
    
    return parts.length > 0 ? parts.join(' • ') : 'No filters'
  }

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Text fontWeight="semibold" fontSize="sm">
            Saved Searches ({savedSearches.length})
          </Text>
          {hasActiveFilters() && (
            <Tooltip label="Save current search">
              <IconButton
                size="xs"
                icon={<AddIcon />}
                onClick={onSaveOpen}
                colorScheme="blue"
                variant="ghost"
                aria-label="Save current search"
              />
            </Tooltip>
          )}
        </HStack>

        {/* Saved Searches List */}
        {savedSearches.length > 0 ? (
          <Accordion allowToggle size="sm">
            <AccordionItem border="none">
              <AccordionButton px={0} py={2}>
                <Box flex="1" textAlign="left">
                  <Text fontSize="xs" color="gray.600">
                    View saved searches
                  </Text>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel px={0} pb={2}>
                <VStack spacing={2} align="stretch">
                  {savedSearches.map((search) => (
                    <Box
                      key={search.id}
                      p={3}
                      border="1px"
                      borderColor="gray.200"
                      borderRadius="md"
                      bg="gray.50"
                      _hover={{ bg: 'gray.100' }}
                    >
                      <HStack justify="space-between" mb={1}>
                        <Text fontSize="sm" fontWeight="medium">
                          {search.name}
                        </Text>
                        <HStack spacing={1}>
                          <Tooltip label="Load this search">
                            <IconButton
                              size="xs"
                              icon={<StarIcon />}
                              onClick={() => handleLoadSearch(search)}
                              colorScheme="blue"
                              variant="ghost"
                              aria-label="Load search"
                            />
                          </Tooltip>
                          <Tooltip label="Delete this search">
                            <IconButton
                              size="xs"
                              icon={<DeleteIcon />}
                              onClick={() => handleDeleteSearch(search.id)}
                              colorScheme="red"
                              variant="ghost"
                              aria-label="Delete search"
                            />
                          </Tooltip>
                        </HStack>
                      </HStack>
                      
                      <Text fontSize="xs" color="gray.600" mb={2}>
                        {formatFiltersPreview(search.filters)}
                      </Text>
                      
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="gray.500">
                          Created {new Date(search.createdAt).toLocaleDateString()}
                        </Text>
                        {search.lastUsed && (
                          <Text fontSize="xs" color="gray.500">
                            Used {new Date(search.lastUsed).toLocaleDateString()}
                          </Text>
                        )}
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        ) : (
          <Text fontSize="xs" color="gray.500" textAlign="center" py={4}>
            No saved searches yet.
            {hasActiveFilters() && " Save your current search to get started!"}
          </Text>
        )}
      </VStack>

      {/* Save Search Modal */}
      <Modal isOpen={isSaveOpen} onClose={onSaveClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Save Search</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Search Name</FormLabel>
                <Input
                  placeholder="e.g., 2-bed apartments in Vake"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveSearch()}
                />
              </FormControl>
              
              <Box w="full">
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Current filters:
                </Text>
                <Text fontSize="sm" p={2} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200">
                  {formatFiltersPreview(currentFilters)}
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSaveClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveSearch}>
              Save Search
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={undefined}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Saved Search
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this saved search? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDeleteSearch} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}

export default SavedSearches