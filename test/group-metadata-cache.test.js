import assert from 'node:assert/strict';
import { describeUnusableGroupMetadata, isUsableGroupMetadata } from '../lib/Utils/group-metadata-cache.js';

const participants = [{ id: '628000@s.whatsapp.net' }];

/**
 * The group send reads addressingMode off the metadata and, when it is absent,
 * used to fall back to "lid" — a guess. Guessing wrong tells the server one
 * addressing mode while the sender key was made under the other identity, and
 * the group stops being able to read anything the bot says. A cache that omits
 * the field must send us back to the server instead.
 */
{
    assert.equal(isUsableGroupMetadata({ participants, addressingMode: 'lid' }), true);
    assert.equal(isUsableGroupMetadata({ participants, addressingMode: 'pn' }), true);

    assert.equal(isUsableGroupMetadata({ participants }), false, 'participants alone are not enough');
    assert.equal(describeUnusableGroupMetadata({ participants }), 'no addressingMode');
}

/** Anything else the cache might hand back is refused rather than half-trusted. */
{
    const cases = [
        [undefined, 'nothing cached'],
        [null, 'nothing cached'],
        ['lid', 'nothing cached'],
        [{}, 'no participants'],
        [{ participants: 'x', addressingMode: 'lid' }, 'no participants'],
        [{ participants, addressingMode: null }, 'no addressingMode'],
        [{ participants, addressingMode: 'LID' }, 'addressingMode "LID" is not pn or lid'],
        [{ participants, addressingMode: '' }, 'addressingMode "" is not pn or lid']
    ];
    for (const [metadata, reason] of cases) {
        assert.equal(isUsableGroupMetadata(metadata), false, JSON.stringify(metadata));
        assert.equal(describeUnusableGroupMetadata(metadata), reason, JSON.stringify(metadata));
    }
}

/** An empty group is still usable metadata — empty is a fact, missing is not. */
{
    assert.equal(isUsableGroupMetadata({ participants: [], addressingMode: 'pn' }), true);
}

console.log('group metadata cache tests passed');
