import { Parser } from "m3u8-parser"
import type { PlasmoContentScript } from "plasmo"

import getAccessToken from "../common/original"

console.log("twitch.ts")

export const config: PlasmoContentScript = {
  matches: ["https://*.twitch.tv/*"],
  run_at: "document_end"
}

// detect url changes
var previousUrl = ""
var observer = new MutationObserver(async function (mutations) {
  if (location.href !== previousUrl) {
    previousUrl = location.href
    console.log(`URL changed to ${location.href}`)
    chrome.runtime.sendMessage({ urlChange: true })
    main(previousUrl)
  }
})
const mutationConfig = { subtree: true, childList: true }
observer.observe(document, mutationConfig)

// main function
const main = async (previousUrl: string) => {
  var pathname = window.location.pathname.substring(1)
  var channelName: string
  var vodID: string

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
    await loop2s(bestQualityUrl, previousUrl)
  }
}

// function that loops every 2 seconds
const loop2s = async (uri: string, previousUrl: string) => {
  while (true) {
    if (previousUrl !== window.location.href) {
      break
    }
    const m3u8resp = await fetch(uri)
    const m3u8text = await m3u8resp.text()
    chrome.runtime.sendMessage({ m3u8text: m3u8text })
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
}
