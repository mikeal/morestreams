var streams = require('./main')
  , assert = require('assert')
  , stream = require('stream')
  ;

var source = new stream.Stream()
  , dest = new stream.Stream()
  , buffered = new streams.BufferedStream()
  ;

// Set up the source stream
// It should emit 100 data events
// It needs to emit end eventually
// so we can check the results
source.readable = true
source.pause = function () {
  throw new Error("Pause should not be called")
}
source.pipe(buffered)
var i = 0;

// emit half now, these should be buffered
while (i < 50) {
  source.emit("data", 'before');
  i++;
}

// 50 data chunks buffered so far
assert.ok(buffered.bufferSize() === 50);

// Set up the destination stream
// It should eventually receive 100 writes
i = 0;
dest.writable = true
dest.write = function(chunk) {
  this.emit('data', chunk);
  i++;
}
dest.end = function() { this.emit('end'); }

// The first data events should be from the
// previously buffered ones.
dest.on('data', function(chunk) {
    console.error(i, chunk);
    if( i < 50 )
        assert.equal('before', chunk);
    else
        assert.equal('after', chunk);
});

// Check the results on end
dest.on('end', function() {
    assert.ok(i === 100);
    assert.ok(buffered.bufferSize() === 0);
});

setTimeout( function() {
    // Now open the pipe and stream to the destination
    // make sure end is called
    buffered.pipe(dest, {end: true});

    // emit the other half after some async event
    while (i < 100) {
        source.emit("data", "after");
    }

    // end so we can check the results
    source.emit('end');
}, 1000);