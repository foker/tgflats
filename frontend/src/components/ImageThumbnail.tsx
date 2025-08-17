import { Box, Image, Text, Icon, Badge } from '@chakra-ui/react'
import { FaImage } from 'react-icons/fa'

interface ImageThumbnailProps {
  images?: string[]
  title?: string
  height?: string | number
  showCounter?: boolean
  fallbackMessage?: string
}

const ImageThumbnail = ({ 
  images = [], 
  title = 'Property', 
  height = '200px',
  showCounter = true,
  fallbackMessage = 'No image available'
}: ImageThumbnailProps) => {
  const hasImages = images.length > 0
  const primaryImage = hasImages ? images[0] : null
  const imageCount = images.length

  const placeholderImage = 'https://via.placeholder.com/400x300/e2e8f0/718096?text=No+Image+Available'

  if (!hasImages) {
    return (
      <Box
        height={height}
        bg="gray.100"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        position="relative"
        rounded="md"
        overflow="hidden"
      >
        <Icon as={FaImage} boxSize={8} color="gray.400" mb={2} />
        <Text fontSize="sm" color="gray.500" textAlign="center" px={4}>
          {fallbackMessage}
        </Text>
      </Box>
    )
  }

  return (
    <Box position="relative" height={height} rounded="md" overflow="hidden">
      <Image
        src={primaryImage}
        alt={`${title} - Main image`}
        width="100%"
        height="100%"
        objectFit="cover"
        fallbackSrc={placeholderImage}
      />
      
      {/* Image counter badge */}
      {showCounter && imageCount > 1 && (
        <Badge
          position="absolute"
          bottom={3}
          right={3}
          bg="blackAlpha.700"
          color="white"
          variant="solid"
          rounded="md"
          fontSize="xs"
          px={2}
          py={1}
        >
          <Icon as={FaImage} boxSize={3} mr={1} />
          {imageCount}
        </Badge>
      )}
    </Box>
  )
}

export default ImageThumbnail