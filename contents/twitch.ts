import { Parser } from "m3u8-parser"
import type { PlasmoContentScript } from "plasmo"

import CircularBuffer from "~common/cb"
import getAccessToken from "~common/original"

// global variables
var buffer = new CircularBuffer(45)
var previousUrl = ""

console.log("twitch.ts")

export const config: PlasmoContentScript = {
  matches: ["https://*.twitch.tv/*"],
  run_at: "document_end"
}

// detect url changes

// main function
const main = async () => {
  var pathname: string
  var channelName: string
  var vodID: string
  while (true) {
    pathname = window.location.pathname.substring(1)
    previousUrl = window.location.href

    pathname.startsWith("videos/")
      ? (vodID = (vodID = pathname
          .replace("videos/", "")
          .replace(/\//g, "")).startsWith("v")
          ? vodID.substring(1)
          : vodID)
      : (channelName = pathname.replace(/\//g, ""))

    if (channelName) {
      const accessToken = await getAccessToken(channelName)
      const querys = {
        sig: accessToken.data.streamPlaybackAccessToken.signature,
        token: accessToken.data.streamPlaybackAccessToken.value
      }
      const query = new URLSearchParams(querys).toString()
      const url = `https://usher.ttvnw.net/api/channel/hls/${channelName}.m3u8?${query}`

      const resp = await fetch(url)
      const text = await resp.text()
      var parser = new Parser()
      parser.push(text)
      parser.end()
      const manifest = parser.manifest
      const bestQuality = manifest.playlists[0]
      const bestQualityUrl = bestQuality.uri

      while (true) {
        if (previousUrl !== window.location.href) {
          buffer = new CircularBuffer(45)
          break
        }
        const m3u8resp = await fetch(bestQualityUrl)
        const m3u8text = await m3u8resp.text()
        runBuffer(m3u8text)
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
}

const runBuffer = (m3u8text: string) => {
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

main()
