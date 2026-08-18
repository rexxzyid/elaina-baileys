/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { proto } from '../../WAProto/index.js';
// export the WAMessage Prototypes
export { proto as WAProto };

export const AssociationType = proto.MessageAssociation.AssociationType;
export const ButtonHeaderType = proto.Message.ButtonsMessage.HeaderType;
export const ButtonType = proto.Message.ButtonsMessage.Button.Type;
export const CarouselCardType = proto.Message.InteractiveMessage.CarouselMessage.CarouselCardType;
export const ListType = proto.Message.ListMessage.ListType;
export const ProtocolType = proto.Message.ProtocolMessage.Type;
export const WAMessageStubType = proto.WebMessageInfo.StubType;
export const WAMessageStatus = proto.WebMessageInfo.Status;
export var WAMessageAddressingMode;
(function (WAMessageAddressingMode) {
    WAMessageAddressingMode["PN"] = "pn";
    WAMessageAddressingMode["LID"] = "lid";
})(WAMessageAddressingMode || (WAMessageAddressingMode = {}));
