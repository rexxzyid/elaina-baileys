import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';

/**
 * worker-bootstrap.js runs as a worker_threads entry point, never as an import
 * on the main thread, so a module-scope mistake in it stays invisible until a
 * call is placed. It shipped once with a bare `require`, which threw
 * "require is not defined in ES module scope" the first time a worker started.
 * Booting it for real is the only check that covers that.
 */
const bootWorker = () => new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../lib/Voip/worker-bootstrap.js', import.meta.url), {
        workerData: { storageDir: '/tmp/elaina-voip-test', resourcesPath: '/nonexistent' },
        stdout: true,
        stderr: true
    });
    const timer = setTimeout(() => {
        worker.terminate();
        reject(new Error('worker never reported worker_ready'));
    }, 15000);
    worker.on('message', message => {
        if (message?.type === 'worker_ready') {
            clearTimeout(timer);
            worker.terminate();
            resolve(true);
        }
    });
    worker.on('error', err => {
        clearTimeout(timer);
        worker.terminate();
        reject(err);
    });
});

assert.equal(await bootWorker(), true, 'the worker boots and announces itself');

console.log('voip worker boot tests passed');
