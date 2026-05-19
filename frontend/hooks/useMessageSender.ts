/**
 * useMessageSender Hook
 * React hook for sending WhatsApp messages with loading and error state management
 * Provides a unified interface for all message sending operations
 */

'use client'

import { useState, useCallback } from 'react'
import * as messageService from './messageService'

export interface SendingState {
  isLoading: boolean
  error: string | null
  success: boolean
}

export interface UseMessageSenderReturn extends SendingState {
  sendText: (to: string, text: string, previewUrl?: boolean) => Promise<void>
  sendImage: (to: string, mediaId: string | null, mediaUrl: string | null, caption?: string) => Promise<void>
  sendVideo: (to: string, mediaId: string | null, mediaUrl: string | null, caption?: string) => Promise<void>
  sendAudio: (to: string, mediaId: string | null, mediaUrl: string | null) => Promise<void>
  sendDocument: (to: string, mediaId: string | null, mediaUrl: string | null, filename?: string, caption?: string) => Promise<void>
  sendLocation: (to: string, latitude: number | string, longitude: number | string, name?: string, address?: string) => Promise<void>
  sendContacts: (to: string, contacts: any[]) => Promise<void>
  sendSticker: (to: string, mediaId: string | null, mediaUrl: string | null) => Promise<void>
  sendReaction: (to: string, messageId: string, emoji: string) => Promise<void>
  sendLocationRequest: (to: string, text: string) => Promise<void>
  sendAddressMessage: (to: string, text: string, countryCode: string, values?: any, savedAddresses?: any[], validationErrors?: any) => Promise<void>
  sendButtonMessage: (to: string, text: string, buttons: any[]) => Promise<void>
  sendListMessage: (to: string, text: string, sections: any[], buttonText?: string) => Promise<void>
  sendTemplateMessage: (to: string, templateName: string, language?: string, bodyParameters?: any[]) => Promise<void>
  uploadMedia: (file: File, type: 'image' | 'video' | 'audio' | 'document' | 'sticker') => Promise<string> // Returns mediaId
  uploadMediaFromUrl: (url: string, type: 'image' | 'video' | 'audio' | 'document' | 'sticker') => Promise<string> // Returns mediaId
  clearError: () => void
  clearSuccess: () => void
}

export function useMessageSender(): UseMessageSenderReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const clearError = useCallback(() => setError(null), [])
  const clearSuccess = useCallback(() => setSuccess(false), [])

  const executeAction = useCallback(async (action: () => Promise<any>) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await action()
      setSuccess(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const sendText = useCallback(
    (to: string, text: string, previewUrl?: boolean) =>
      executeAction(() => messageService.sendTextMessage(to, text, previewUrl)),
    [executeAction]
  )

  const sendImage = useCallback(
    (to: string, mediaId: string | null, mediaUrl: string | null, caption?: string) =>
      executeAction(() => messageService.sendImageMessage(to, mediaId, mediaUrl, caption)),
    [executeAction]
  )

  const sendVideo = useCallback(
    (to: string, mediaId: string | null, mediaUrl: string | null, caption?: string) =>
      executeAction(() => messageService.sendVideoMessage(to, mediaId, mediaUrl, caption)),
    [executeAction]
  )

  const sendAudio = useCallback(
    (to: string, mediaId: string | null, mediaUrl: string | null) =>
      executeAction(() => messageService.sendAudioMessage(to, mediaId, mediaUrl)),
    [executeAction]
  )

  const sendDocument = useCallback(
    (to: string, mediaId: string | null, mediaUrl: string | null, filename?: string, caption?: string) =>
      executeAction(() => messageService.sendDocumentMessage(to, mediaId, mediaUrl, filename, caption)),
    [executeAction]
  )

  const sendLocation = useCallback(
    (to: string, latitude: number | string, longitude: number | string, name?: string, address?: string) =>
      executeAction(() => messageService.sendLocationMessage(to, latitude, longitude, name, address)),
    [executeAction]
  )

  const sendContacts = useCallback(
    (to: string, contacts: any[]) => executeAction(() => messageService.sendContactsMessage(to, contacts)),
    [executeAction]
  )

  const sendSticker = useCallback(
    (to: string, mediaId: string | null, mediaUrl: string | null) =>
      executeAction(() => messageService.sendStickerMessage(to, mediaId, mediaUrl)),
    [executeAction]
  )

  const sendReaction = useCallback(
    (to: string, messageId: string, emoji: string) =>
      executeAction(() => messageService.sendReactionMessage(to, messageId, emoji)),
    [executeAction]
  )

  const sendLocationRequest = useCallback(
    (to: string, text: string) => executeAction(() => messageService.sendLocationRequest(to, text)),
    [executeAction]
  )

  const sendAddressMessage = useCallback(
    (to: string, text: string, countryCode: string, values?: any, savedAddresses?: any[], validationErrors?: any) =>
      executeAction(() => messageService.sendAddressMessage(to, text, countryCode, values, savedAddresses, validationErrors)),
    [executeAction]
  )

  const sendButtonMessage = useCallback(
    (to: string, text: string, buttons: any[]) => executeAction(() => messageService.sendButtonMessage(to, text, buttons)),
    [executeAction]
  )

  const sendListMessage = useCallback(
    (to: string, text: string, sections: any[], buttonText?: string) =>
      executeAction(() => messageService.sendListMessage(to, text, sections, buttonText)),
    [executeAction]
  )

  const sendTemplateMessage = useCallback(
    (to: string, templateName: string, language?: string, bodyParameters?: any[]) =>
      executeAction(() => messageService.sendTemplateMessage(to, templateName, language, bodyParameters)),
    [executeAction]
  )

  const uploadMedia = useCallback(
    async (file: File, type: 'image' | 'video' | 'audio' | 'document' | 'sticker'): Promise<string> => {
      let mediaId = ''
      await executeAction(async () => {
        const response = await messageService.uploadMedia(file, type)
        mediaId = response.mediaId
      })
      return mediaId
    },
    [executeAction]
  )

  const uploadMediaFromUrl = useCallback(
    async (url: string, type: 'image' | 'video' | 'audio' | 'document' | 'sticker'): Promise<string> => {
      let mediaId = ''
      await executeAction(async () => {
        const response = await messageService.uploadMediaFromUrl(url, type)
        mediaId = response.mediaId
      })
      return mediaId
    },
    [executeAction]
  )

  return {
    isLoading,
    error,
    success,
    sendText,
    sendImage,
    sendVideo,
    sendAudio,
    sendDocument,
    sendLocation,
    sendContacts,
    sendSticker,
    sendReaction,
    sendLocationRequest,
    sendAddressMessage,
    sendButtonMessage,
    sendListMessage,
    sendTemplateMessage,
    uploadMedia,
    uploadMediaFromUrl,
    clearError,
    clearSuccess,
  }
}
