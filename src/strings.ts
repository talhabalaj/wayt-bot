interface MessageStrings {
  songInQueue: (title: string) => string;
  songFailed: () => string;
}

interface PersonalizedMessageString {
  [key: string]: MessageStrings;
}

export const getMessages = (receipent?: string): MessageStrings => {
  /*
  Code removed for privary reasons
   */

  return messages;
};

const messages: MessageStrings = {
  songInQueue: (title: string) =>
    `${title}.....Interesting choice!\n\nI heard you, I'll try to send the song as soon as possible, please note that I'm still in beta. So I might just ignore you like you don't exist. :) `,
  songFailed: () =>
    `Oh my god, i m soo sorrrrryyyyyyy!\n mien nahi send karna apko ap gande ho! just kiddin traffic zyada hai. koshish karo chota gana download karo.`,
};
