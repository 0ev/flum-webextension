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

export default CircularBuffer
