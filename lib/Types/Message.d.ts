/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
export { proto as WAProto };
export const AssociationType: typeof proto.MessageAssociation.AssociationType;
export const ButtonHeaderType: typeof proto.Message.ButtonsMessage.HeaderType;
export const ButtonType: typeof proto.Message.ButtonsMessage.Button.Type;
export const CarouselCardType: typeof proto.Message.InteractiveMessage.CarouselMessage.CarouselCardType;
export const ListType: typeof proto.Message.ListMessage.ListType;
export const StatusFont: typeof proto.Message.ExtendedTextMessage.FontType;
export const StatusNotificationType: Readonly<Record<string, number>>;
export const ProtocolType: typeof proto.Message.ProtocolMessage.Type;
export const WAMessageStubType: typeof proto.WebMessageInfo.StubType;
export const WAMessageStatus: typeof proto.WebMessageInfo.Status;
export const WAMessageAddressingMode: any;
import { proto } from '../../WAProto/index.js';
