// WhatsApp Message Types & Statuses
export type MessageType = 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'document' 
  | 'contacts' 
  | 'location' 
  | 'interactive' 
  | 'button' 
  | 'order'
  | 'reaction'
  | 'sticker'
  | 'system'
  | 'edit'
  | 'template'
  | 'unsupported'

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'pending'

export type MessageDirection = 'inbound' | 'outbound'

// Media Asset
export interface MediaAsset {
  id?: string
  mime_type?: string
  sha256_hash?: string
  url?: string
  caption?: string
  filename?: string
}

// Text Message
export interface TextMessage {
  body: string
  preview_url?: boolean
}

// Media Message (Image, Video, Audio, Document)
export interface MediaMessage {
  media: MediaAsset
}

// Audio Message
export interface AudioMessage {
  audio: MediaAsset & {
    is_voice_recording?: boolean
  }
}

// Location Message
export interface LocationMessage {
  location: {
    latitude: number
    longitude: number
    name?: string
    address?: string
    url?: string
  }
}

// Contact
export interface Contact {
  phones?: Array<{
    phone: string
    type?: 'CELL' | 'MAIN' | 'IPHONE' | 'HOME' | 'WORK'
  }>
  emails?: Array<{
    email: string
    type?: 'PERSONAL' | 'WORK'
  }>
  name: {
    formatted_name: string
    first_name?: string
    last_name?: string
    middle_name?: string
    name_prefix?: string
    name_suffix?: string
  }
  org?: {
    company?: string
    department?: string
    title?: string
  }
  addresses?: Array<{
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
    country_code?: string
    type?: 'HOME' | 'WORK'
  }>
  urls?: Array<{
    url: string
    type?: 'PERSONAL' | 'WORK' | 'COMPANY' | 'FACEBOOK' | 'INSTAGRAM'
  }>
}

// Contacts Message
export interface ContactsMessage {
  contacts: Contact[]
}

// Interactive Message Response
export interface InteractiveMessage {
  interactive: {
    type: 'button_reply' | 'list_reply'
    button_reply?: {
      id: string
      title: string
    }
    list_reply?: {
      id: string
      title: string
      description?: string
    }
  }
}

// Button Message Response
export interface ButtonMessage {
  button: {
    payload: string
    text: string
  }
}

// Order Message
export interface OrderMessage {
  order: {
    catalog_id: string
    product_items: Array<{
      product_retailer_id: string
      quantity: number
      item_price: number
      currency: string
    }>
    text?: string
  }
}

// Reaction Message
export interface ReactionMessage {
  reaction: {
    message_id: string
    emoji?: string // Omitted if reaction removed
  }
}

// System Message
export interface SystemMessage {
  system: {
    type: 'user_changed_number'
    body: string
    wa_id: string
  }
}

// Edit Message
export interface EditMessage {
  edit: {
    message_id: string
    text?: string
    media?: MediaAsset
  }
}

// Error in Message
export interface MessageError {
  code: number
  title: string
  message: string
  error_data?: {
    details: string
  }
  href?: string
}

// Referral (from ads)
export interface Referral {
  source?: 'ad' | 'product_catalog' | 'message_business_button'
  headline?: string
  body?: string
  media_type?: 'image' | 'video'
  image_url?: string
  video_url?: string
  video_thumbnail?: string
  url?: string
  ctwa_clid?: string
}

// Context (for replies)
export interface MessageContext {
  from?: string
  id?: string
  referred_product_id?: string
}

// Main Message Type
export interface WhatsAppMessage {
  id: string
  from: string
  timestamp: string
  type: MessageType
  text?: string
  image?: MediaAsset
  video?: MediaAsset
  audio?: MediaAsset
  document?: MediaAsset
  contacts?: Contact[]
  location?: {
    latitude: number
    longitude: number
    name?: string
    address?: string
    url?: string
  }
  interactive?: InteractiveMessage['interactive']
  button?: ButtonMessage['button']
  order?: OrderMessage['order']
  reaction?: ReactionMessage['reaction']
  system?: SystemMessage['system']
  edit?: EditMessage['edit']
  context?: MessageContext
  referral?: Referral
  errors?: MessageError[]
}

// Status Update
export interface WhatsAppStatus {
  id: string
  status: MessageStatus
  timestamp: string
  recipient_id: string
  conversation?: {
    id?: string
    origin?: {
      type: string
    }
  }
  pricing?: {
    billable: boolean
    pricing_model: string
  }
  errors?: MessageError[]
}

// Webhook Entry
export interface WhatsAppWebhookEntry {
  id: string
  changes: Array<{
    value: {
      messaging_product: string
      metadata: {
        display_phone_number: string
        phone_number_id: string
      }
      contacts?: Array<{
        profile: {
          name: string
        }
        wa_id: string
        identity_key_hash?: string
      }>
      messages?: WhatsAppMessage[]
      statuses?: WhatsAppStatus[]
      errors?: MessageError[]
    }
    field: string
  }>
}

// Webhook Payload
export interface WhatsAppWebhookPayload {
  object: string
  entry: WhatsAppWebhookEntry[]
}
