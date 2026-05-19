import React from 'react'
import Image from 'next/image'
import {
  MdCheckCircle,
  MdError,
  MdSchedule,
  MdDownload,
  MdLocationOn,
  MdPerson,
  MdEdit,
  MdReply,
  MdShoppingCart,
} from 'react-icons/md'

interface Message {
  id: string
  text: string
  sender: string
  wa_id?: string
  timestamp: number | string
  type: string
  media_url?: string | null
  status?: string | null
  metadata?: string
  direction?: string
}

interface MessageRendererProps {
  message: Message
  onRetry?: (msg: Message) => any
}

export default function MessageRenderer({ message, onRetry }: MessageRendererProps) {
  const parseMetadata = (metadataStr?: string) => {
    if (!metadataStr) return null
    try {
      return JSON.parse(metadataStr)
    } catch {
      return null
    }
  }

  const metadata = parseMetadata(message.metadata)
  const isOutbound = message.direction === 'outbound'

  // Status icon
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <MdCheckCircle className="inline text-blue-500 mr-1" />
      case 'delivered':
        return <MdCheckCircle className="inline text-gray-500 mr-1" />
      case 'read':
        return <MdCheckCircle className="inline text-blue-600 mr-1" />
      case 'failed':
        return <MdError className="inline text-red-500 mr-1" />
      default:
        return <MdSchedule className="inline text-yellow-500 mr-1" />
    }
  }

  // Format timestamp
  const formatTime = (ts: number | string) => {
    const timestamp = typeof ts === 'string' ? parseInt(ts) * 1000 : ts
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Render message based on type
  const renderContent = () => {
    const bgColor = isOutbound ? 'bg-blue-100' : 'bg-gray-100'
    const textColor = isOutbound ? 'text-blue-900' : 'text-gray-900'

    switch (message.type) {
      case 'text':
      case 'template':
        return (
          <div className={`${bgColor} ${textColor} rounded-lg p-3 max-w-xs break-words`}>
            <p>{message.text}</p>
            {metadata?.referral && (
              <div className="text-xs mt-2 border-t pt-2 opacity-75">
                <p className="font-semibold">{metadata.referral.headline}</p>
                <p>{metadata.referral.body}</p>
              </div>
            )}
          </div>
        )

      case 'image':
        return (
          <div className={`${bgColor} rounded-lg p-3 max-w-xs`}>
            {message.media_url && (
              <Image
                src={message.media_url}
                alt="Shared image"
                width={300}
                height={300}
                className="rounded-md mb-2"
              />
            )}
            {message.text && <p className={`${textColor} text-sm`}>{message.text}</p>}
          </div>
        )

      case 'video':
        return (
          <div className={`${bgColor} rounded-lg p-3 max-w-xs`}>
            {message.media_url && (
              <video width={300} height={300} controls className="rounded-md mb-2">
                <source src={message.media_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
            {message.text && <p className={`${textColor} text-sm`}>{message.text}</p>}
          </div>
        )

      case 'audio':
        return (
          <div className={`${bgColor} rounded-lg p-3 max-w-xs`}>
            {message.media_url && (
              <audio controls className="w-full mb-2">
                <source src={message.media_url} type="audio/mpeg" />
                Your browser does not support the audio tag.
              </audio>
            )}
            {metadata?.media?.is_voice_recording && (
              <p className="text-xs opacity-75">🎤 Voice message</p>
            )}
          </div>
        )

      case 'document':
        return (
          <div className={`${bgColor} rounded-lg p-3 max-w-xs`}>
            <div className="flex items-center gap-2">
              <MdDownload className="text-xl" />
              <div>
                <p className={`${textColor} font-semibold text-sm`}>
                  {metadata?.media?.filename || 'Document'}
                </p>
                {message.text && <p className="text-xs opacity-75">{message.text}</p>}
              </div>
            </div>
            {message.media_url && (
              <a
                href={message.media_url}
                download
                className="text-xs text-blue-600 mt-2 block hover:underline"
              >
                Download
              </a>
            )}
          </div>
        )

      case 'location':
        return (
          <div className={`${bgColor} rounded-lg p-3 max-w-xs`}>
            <div className="flex items-start gap-2">
              <MdLocationOn className="text-xl text-red-600 mt-1" />
              <div>
                {metadata?.location?.name && (
                  <p className={`${textColor} font-semibold`}>{metadata.location.name}</p>
                )}
                {metadata?.location?.address && (
                  <p className="text-sm opacity-75">{metadata.location.address}</p>
                )}
                <p className="text-xs opacity-75">
                  {metadata?.location?.latitude}, {metadata?.location?.longitude}
                </p>
                {metadata?.location?.url && (
                  <a
                    href={metadata.location.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View on map
                  </a>
                )}
              </div>
            </div>
          </div>
        )

      case 'contacts':
        return (
          <div className={`${bgColor} rounded-lg p-3 max-w-xs`}>
            {metadata?.contacts?.map((contact: any, idx: number) => (
              <div key={idx} className="mb-2 pb-2 border-b last:border-b-0">
                <div className="flex items-start gap-2">
                  <MdPerson className="text-lg mt-1" />
                  <div>
                    <p className={`${textColor} font-semibold`}>
                      {contact.name.formatted_name}
                    </p>
                    {contact.phones?.map((p: any, i: number) => (
                      <p key={i} className="text-sm opacity-75">
                        {p.type}: {p.phone}
                      </p>
                    ))}
                    {contact.emails?.map((e: any, i: number) => (
                      <p key={i} className="text-sm opacity-75">
                        {e.type}: {e.email}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'interactive':
      case 'button':
        const isButton = message.type === 'button'
        const interactionId = metadata?.interaction_id || metadata?.button_payload
        const interactionTitle = metadata?.interaction_type
          ? `Selected: ${isButton ? metadata.button_payload : metadata.interaction_id}`
          : message.text

        return (
          <div className={`${bgColor} rounded-lg p-3 max-w-xs`}>
            <div className="flex items-center gap-2">
              <MdReply className="text-lg" />
              <p className={`${textColor}`}>{interactionTitle}</p>
            </div>
          </div>
        )

      case 'order':
        return (
          <div className={`${bgColor} rounded-lg p-3 max-w-xs`}>
            <div className="flex items-start gap-2">
              <MdShoppingCart className="text-lg text-green-600 mt-1" />
              <div>
                <p className={`${textColor} font-semibold mb-2`}>Order</p>
                {metadata?.order?.products?.map((product: any, idx: number) => (
                  <div key={idx} className="text-sm opacity-75 mb-1">
                    <p>
                      {product.quantity}x Product {product.product_retailer_id}
                    </p>
                    <p>
                      {product.currency} {product.item_price}
                    </p>
                  </div>
                ))}
                {metadata?.order?.text && <p className="text-xs mt-2">{metadata.order.text}</p>}
              </div>
            </div>
          </div>
        )

      case 'reaction':
        return (
          <div className="text-xs">
            {metadata?.reaction?.emoji ? (
              <span className="text-lg">{metadata.reaction.emoji}</span>
            ) : (
              <span className="opacity-75">Reaction removed</span>
            )}
          </div>
        )

      case 'system':
        return (
          <div className="bg-yellow-50 rounded-lg p-3 max-w-xs text-center italic text-sm">
            <p>{message.text}</p>
            {metadata?.system?.type === 'user_changed_number' && (
              <p className="text-xs opacity-75">Phone number updated</p>
            )}
          </div>
        )

      case 'edit':
        return (
          <div className={`${bgColor} rounded-lg p-3 max-w-xs border-l-4 border-blue-500`}>
            <div className="flex items-center gap-2 mb-2">
              <MdEdit className="text-sm" />
              <span className="text-xs font-semibold opacity-75">Edited</span>
            </div>
            <p className={`${textColor}`}>{message.text}</p>
            {metadata?.edit?.original_message_id && (
              <p className="text-xs opacity-50 mt-2">
                Original message: {metadata.edit.original_message_id}
              </p>
            )}
          </div>
        )

      default:
        return (
          <div className={`${bgColor} ${textColor} rounded-lg p-3 max-w-xs`}>
            <p className="italic">[{message.type}] {message.text}</p>
          </div>
        )
    }
  }

  return (
    <div className={`flex gap-2 mb-4 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div className="flex flex-col max-w-md">
        {!isOutbound && <p className="text-xs font-semibold mb-1 text-gray-600">{message.sender}</p>}

        <div className="flex items-end gap-2">
          {renderContent()}
          {isOutbound && <div className="text-sm text-gray-500">{getStatusIcon()}</div>}
        </div>

        <div className="text-xs text-gray-500 mt-1 px-2">
          {formatTime(message.timestamp || Date.now())}
        </div>

        {message.status === 'failed' && onRetry && (
          <button
            onClick={() => Promise.resolve(onRetry(message))}
            className="text-xs text-blue-600 hover:underline mt-1"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}
