import { ReactNode } from 'react'
import {
  Box,
  Flex,
  Heading,
  HStack,
  IconButton,
  useColorModeValue,
  useDisclosure,
  VStack,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  useBreakpointValue,
} from '@chakra-ui/react'
import { HamburgerIcon } from '@chakra-ui/icons'
import { Link } from 'react-router-dom'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const isMobile = useBreakpointValue({ base: true, md: false })

  const NavItems = () => (
    <>
      <Link to="/">
        <Box 
          px={4} 
          py={2} 
          rounded="md" 
          _hover={{ bg: 'blue.50' }}
          color="blue.600"
          fontWeight="medium"
        >
          Home
        </Box>
      </Link>
    </>
  )

  return (
    <Box>
      {/* Header */}
      <Box
        bg={bg}
        px={6}
        py={4}
        borderBottom="1px"
        borderColor={borderColor}
        position="sticky"
        top={0}
        zIndex={10}
        shadow="sm"
      >
        <Flex align="center" justify="space-between">
          <Link to="/">
            <Heading size="lg" color="blue.600">
              TBI-Prop
            </Heading>
          </Link>

          {isMobile ? (
            <IconButton
              aria-label="Open navigation"
              icon={<HamburgerIcon />}
              variant="ghost"
              onClick={onOpen}
            />
          ) : (
            <HStack spacing={8}>
              <NavItems />
            </HStack>
          )}
        </Flex>
      </Box>

      {/* Mobile Navigation Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Navigation</DrawerHeader>
          <DrawerBody>
            <VStack align="start" spacing={4}>
              <NavItems />
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <Box>{children}</Box>
    </Box>
  )
}

export default Layout