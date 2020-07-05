export interface ITwilioRequest {
  SmsMessageSid: string;
  NumMedia: string;
  SmsSid: string;
  SmsStatus: string;
  Body: string;
  To: string;
  NumSegments: string;
  MessageSid: string;
  AccountSid: string;
  From: string;
  ApiVersion: string;
  MediaContentType0: string;
  MediaUrl0: string;
}

export interface ITwilioStatus {
  EventType?: string;
  ErrorCode?: string;
  SmsSid: string;
  SmsStatus: string;
  MessageStatus: string;
  ChannelToAddress: string;
  To: string;
  ChannelPrefix: string;
  MessageSid: string;
  AccountSid: string;
  ErrorMessage?: string;
  From: string;
  ApiVersion: string;
  ChannelInstallSid: string;
}
