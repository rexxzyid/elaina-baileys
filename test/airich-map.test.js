import assert from 'node:assert/strict';
import { AIRich } from '../lib/MessageBuilder/index.js';
import { proto } from '../WAProto/index.js';

const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async () => ({ key: { id: 'x' } }) };
const places = [
    { latitude: -6.2088, longitude: 106.8456, title: 'Warung Sederhana', body: 'Rumah makan padang' },
    { latitude: -6.215, longitude: 106.85, title: 'Bakso Pak Kumis', body: 'Bakso urat' }
];

const richResponse = async rich => (await rich.build('120363@g.us')).message.botForwardedMessage.message.richResponseMessage;
const unified = response => JSON.parse(Buffer.from(response.unifiedResponse.data, 'base64').toString());

/**
 * The client reads a map out of the protobuf submessage, not out of the JSON
 * unified response — AIRichResponseSubMessageType.AI_RICH_RESPONSE_MAP is 7 and
 * carries mapMetadata. A section alone renders nothing, so addMap emits both.
 */
{
    const rich = new AIRich(sock);
    rich.addMap(places);
    const response = await richResponse(rich);

    const [submessage] = response.submessages;
    assert.equal(submessage.messageType, 7);
    assert.equal(submessage.mapMetadata.annotations.length, 2);
    assert.deepEqual(
        submessage.mapMetadata.annotations.map(annotation => annotation.annotationNumber),
        [1, 2],
        'annotations are numbered from one, the client keys its pins on it'
    );
    assert.equal(submessage.mapMetadata.annotations[0].title, 'Warung Sederhana');
    assert.equal(submessage.mapMetadata.annotations[0].body, 'Rumah makan padang');
    assert.equal(submessage.mapMetadata.showInfoList, true);

    const [section] = unified(response).sections;
    assert.equal(section.view_model.primitive.__typename, 'GenAIMapPrimitive');
    assert.equal(section.view_model.primitive.items.length, 2);
}

/** The centre defaults to the middle of the places, and the deltas frame them. */
{
    const rich = new AIRich(sock);
    rich.addMap(places);
    const { mapMetadata } = (await richResponse(rich)).submessages[0];
    assert.ok(Math.abs(mapMetadata.centerLatitude - -6.2119) < 1e-9);
    assert.ok(Math.abs(mapMetadata.centerLongitude - 106.8478) < 1e-9);
    assert.equal(mapMetadata.latitudeDelta, AIRich.MAP_DELTA);
    assert.equal(mapMetadata.longitudeDelta, AIRich.MAP_DELTA);
}

/** An explicit centre wins over the average. */
{
    const rich = new AIRich(sock);
    rich.addMap(places, { center: { latitude: 0, longitude: 0 }, latitudeDelta: 1, longitudeDelta: 2 });
    const { mapMetadata } = (await richResponse(rich)).submessages[0];
    assert.equal(mapMetadata.centerLatitude, 0);
    assert.equal(mapMetadata.centerLongitude, 0);
    assert.equal(mapMetadata.latitudeDelta, 1);
    assert.equal(mapMetadata.longitudeDelta, 2);
}

/** A place without coordinates is refused rather than sent as a pin at 0,0. */
{
    const rich = new AIRich(sock);
    assert.throws(() => rich.addMap([]), TypeError);
    assert.throws(() => rich.addMap([{ title: 'Warung' }]), TypeError);
    assert.throws(() => rich.addMap([{ latitude: -6.2, longitude: 'x' }]), TypeError);
}

/** mapMetadata survives the real encoder, which is where a wrong field would die. */
{
    const rich = new AIRich(sock);
    rich.addText('*Dekat kamu*');
    rich.addMap(places, { staticMapUrl: 'https://example.com/map.png', motivation: 'tiga terdekat' });
    const built = await rich.build('120363@g.us');
    const decoded = proto.Message.decode(proto.Message.encode(built.message).finish());
    const submessages = decoded.botForwardedMessage.message.richResponseMessage.submessages;

    assert.equal(submessages.length, 2);
    assert.equal(submessages[0].messageType, 2, 'the text submessage stays first');
    assert.equal(submessages[1].messageType, 7);
    assert.equal(submessages[1].mapMetadata.annotations[1].title, 'Bakso Pak Kumis');
}

console.log('airich map tests passed');
