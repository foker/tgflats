import { useState } from 'react'
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  HStack,
  Text,
  Icon,
  IconButton,
} from '@chakra-ui/react'
import { ChevronDownIcon, LinkIcon } from '@chakra-ui/icons'
import { FaWhatsapp, FaTelegram, FaFacebook, FaTwitter, FaShare } from 'react-icons/fa'

interface ShareButtonProps {
  url: string
  title?: string
  description?: string
  variant?: 'button' | 'icon'
}

interface ShareOption {
  name: string
  icon: any
  color: string
  action: () => void
}

const ShareButton = ({ 
  url, 
  title = 'Check out this property', 
  description = '',
  variant = 'button'
}: ShareButtonProps) => {
  const [isSharing, setIsSharing] = useState(false)
  const toast = useToast()

  const fullUrl = window.location.origin + url
  const encodedUrl = encodeURIComponent(fullUrl)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      toast({
        title: 'Link copied!',
        description: 'Property link has been copied to clipboard',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const shareViaWebAPI = async () => {
    if (navigator.share) {
      try {
        setIsSharing(true)
        await navigator.share({
          title,
          text: description,
          url: fullUrl,
        })
      } catch (error) {
        // User cancelled sharing or error occurred
        console.log('Web Share API error:', error)
      } finally {
        setIsSharing(false)
      }
    } else {
      // Fallback to copy to clipboard
      copyToClipboard()
    }
  }

  const shareOptions: ShareOption[] = [
    {
      name: 'Copy Link',
      icon: LinkIcon,
      color: 'gray.600',
      action: copyToClipboard,
    },
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      color: 'green.500',
      action: () => {
        const text = `${title}${description ? ' - ' + description : ''}\n${fullUrl}`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
      },
    },
    {
      name: 'Telegram',
      icon: FaTelegram,
      color: 'blue.500',
      action: () => {
        const text = `${title}${description ? ' - ' + description : ''}`
        window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(text)}`, '_blank')
      },
    },
    {
      name: 'Facebook',
      icon: FaFacebook,
      color: 'blue.600',
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank')
      },
    },
    {
      name: 'Twitter',
      icon: FaTwitter,
      color: 'blue.400',
      action: () => {
        const text = `${title}${description ? ' - ' + description : ''}`
        window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(text)}`, '_blank')
      },
    },
  ]

  // Check if Web Share API is available for native sharing
  const hasWebShareAPI = typeof navigator !== 'undefined' && navigator.share

  if (variant === 'icon') {
    return (
      <Menu>
        <MenuButton
          as={IconButton}
          icon={<Icon as={FaShare} />}
          variant="outline"
          colorScheme="blue"
          aria-label="Share property"
          size="sm"
        />
        <MenuList>
          {hasWebShareAPI && (
            <MenuItem
              icon={<Icon as={FaShare} color="blue.500" />}
              onClick={shareViaWebAPI}
              isDisabled={isSharing}
            >
              Share...
            </MenuItem>
          )}
          {shareOptions.map((option) => (
            <MenuItem
              key={option.name}
              icon={<Icon as={option.icon} color={option.color} />}
              onClick={option.action}
            >
              {option.name}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    )
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        colorScheme="blue"
        variant="outline"
        size="sm"
        isLoading={isSharing}
        loadingText="Sharing..."
      >
        <HStack spacing={2}>
          <Icon as={FaShare} />
          <Text>Share</Text>
        </HStack>
      </MenuButton>
      <MenuList>
        {hasWebShareAPI && (
          <MenuItem
            icon={<Icon as={FaShare} color="blue.500" />}
            onClick={shareViaWebAPI}
            isDisabled={isSharing}
          >
            Share...
          </MenuItem>
        )}
        {shareOptions.map((option) => (
          <MenuItem
            key={option.name}
            icon={<Icon as={option.icon} color={option.color} />}
            onClick={option.action}
          >
            {option.name}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  )
}

export default ShareButton