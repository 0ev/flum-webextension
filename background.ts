import { Parser } from "m3u8-parser"

export {}

class CircularBuffer {
  size: number
  buffer: Array<any>
  head: number
  tail: number
  count: number

  constructor(size) {
    this.size = size
    this.buffer = new Array(size)
    this.head = 0
    this.tail = 0
    this.count = 0
  }

  push(item) {
    this.buffer[this.head] = item
    this.head = (this.head + 1) % this.size
    if (this.count < this.size) {
      this.count++
    } else {
      this.tail = (this.tail + 1) % this.size
    }
  }

  pop() {
    if (this.count === 0) {
      return undefined
    }
    const item = this.buffer[this.tail]
    this.tail = (this.tail + 1) % this.size
    this.count--
    return item
  }

  peek() {
    if (this.count === 0) {
      return undefined
    }
    return this.buffer[this.tail]
  }

  get length() {
    return this.count
  }
}

var buffer = new CircularBuffer(45)

// receive messages from the content script of uri
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.urlChange) {
    console.log("url change")
    buffer = new CircularBuffer(45)
  }
  if (request.m3u8text) {
    runBuffer(request.m3u8text)
  }
})

// circular buffer

const runBuffer = (m3u8text) => {
  var parser = new Parser()
  parser.push(m3u8text)
  parser.end()
  const manifest = parser.manifest
  const segments = manifest.segments

  // push the segments to the buffer if their timestamp is later than the last segment in the buffer
  const lastSegment = buffer.peek()
  if (lastSegment) {
    const lastTime = lastSegment.dateTimeObject.getTime()
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const segmentTime = segment.dateTimeObject.getTime()
      if (segmentTime > lastTime) {
        buffer.push(segment)
      }
    }
  } else {
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      buffer.push(segment)
    }
  }

  console.log(buffer.peek())
}
