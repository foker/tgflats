import { useState } from 'react'
import { Box, Image, IconButton, Modal, ModalOverlay, ModalContent, ModalCloseButton, useDisclosure } from '@chakra-ui/react'
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '@chakra-ui/icons'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Zoom } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/zoom'

interface ImageGalleryProps {
  images: string[]
  title?: string
  height?: string | number
}

const ImageGallery = ({ images, title = 'Property Images', height = '400px' }: ImageGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  // Placeholder image if no images provided
  const placeholderImage = 'https://via.placeholder.com/800x600/e2e8f0/718096?text=No+Image+Available'
  const displayImages = images.length > 0 ? images : [placeholderImage]

  const handleSlideChange = (swiper: SwiperType) => {
    setActiveIndex(swiper.activeIndex)
  }

  const goToPrevious = () => {
    if (swiperInstance) {
      swiperInstance.slidePrev()
    }
  }

  const goToNext = () => {
    if (swiperInstance) {
      swiperInstance.slideNext()
    }
  }

  const openZoomModal = () => {
    onOpen()
  }

  return (
    <>
      <Box position="relative" height={height} bg="gray.100" rounded="lg" overflow="hidden">
        <Swiper
          modules={[Navigation, Pagination, Zoom]}
          spaceBetween={0}
          slidesPerView={1}
          navigation={{
            prevEl: '.swiper-button-prev-custom',
            nextEl: '.swiper-button-next-custom',
          }}
          pagination={{
            clickable: true,
            bulletClass: 'swiper-pagination-bullet-custom',
            bulletActiveClass: 'swiper-pagination-bullet-active-custom',
          }}
          zoom={{ maxRatio: 2 }}
          onSwiper={setSwiperInstance}
          onSlideChange={handleSlideChange}
          style={{ height: '100%' }}
        >
          {displayImages.map((image, index) => (
            <SwiperSlide key={index}>
              <Box height="100%" position="relative">
                <Image
                  src={image}
                  alt={`${title} - Image ${index + 1}`}
                  width="100%"
                  height="100%"
                  objectFit="cover"
                  cursor="pointer"
                  onClick={openZoomModal}
                  fallbackSrc={placeholderImage}
                />
                
                {/* Zoom icon overlay */}
                <IconButton
                  icon={<SearchIcon />}
                  position="absolute"
                  top={4}
                  right={4}
                  size="sm"
                  colorScheme="blackAlpha"
                  variant="solid"
                  aria-label="Zoom image"
                  onClick={openZoomModal}
                  opacity={0.8}
                  _hover={{ opacity: 1 }}
                />
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom navigation buttons */}
        {displayImages.length > 1 && (
          <>
            <IconButton
              icon={<ChevronLeftIcon />}
              className="swiper-button-prev-custom"
              position="absolute"
              left={4}
              top="50%"
              transform="translateY(-50%)"
              zIndex={10}
              size="lg"
              colorScheme="blackAlpha"
              variant="solid"
              aria-label="Previous image"
              onClick={goToPrevious}
              opacity={0.8}
              _hover={{ opacity: 1 }}
            />
            
            <IconButton
              icon={<ChevronRightIcon />}
              className="swiper-button-next-custom"
              position="absolute"
              right={4}
              top="50%"
              transform="translateY(-50%)"
              zIndex={10}
              size="lg"
              colorScheme="blackAlpha"
              variant="solid"
              aria-label="Next image"
              onClick={goToNext}
              opacity={0.8}
              _hover={{ opacity: 1 }}
            />
          </>
        )}

        {/* Image counter */}
        {displayImages.length > 1 && (
          <Box
            position="absolute"
            bottom={4}
            left={4}
            bg="blackAlpha.700"
            color="white"
            px={3}
            py={1}
            rounded="md"
            fontSize="sm"
            zIndex={10}
          >
            {activeIndex + 1} / {displayImages.length}
          </Box>
        )}
      </Box>

      {/* Zoom Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="full" isCentered>
        <ModalOverlay bg="blackAlpha.900" />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalCloseButton color="white" size="lg" zIndex={10} />
          <Box height="100vh" display="flex" alignItems="center" justifyContent="center" p={4}>
            <Image
              src={displayImages[activeIndex]}
              alt={`${title} - Image ${activeIndex + 1}`}
              maxWidth="100%"
              maxHeight="100%"
              objectFit="contain"
              fallbackSrc={placeholderImage}
            />
          </Box>
        </ModalContent>
      </Modal>

      <style>
        {`
          .swiper-pagination-bullet-custom {
            background: rgba(255, 255, 255, 0.5);
            width: 12px;
            height: 12px;
            margin: 0 4px;
            border-radius: 50%;
            transition: all 0.3s ease;
          }
          
          .swiper-pagination-bullet-active-custom {
            background: white;
            transform: scale(1.2);
          }
          
          .swiper-pagination {
            bottom: 16px !important;
          }
        `}
      </style>
    </>
  )
}

export default ImageGallery